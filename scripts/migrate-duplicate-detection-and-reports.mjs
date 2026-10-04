import pg from "pg";
import fs from "fs";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(".env")) {
  const m = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) dbUrl = m[1];
}
if (!dbUrl && fs.existsSync(".env.local")) {
  const m = fs.readFileSync(".env.local", "utf8").match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) dbUrl = m[1];
}
if (!dbUrl) {
  throw new Error("DATABASE_URL is required.");
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function runMigration() {
  await client.connect();
  console.log("=== STARTING DUPLICATE DETECTION & REPORT SYSTEM MIGRATION ===");

  await client.query("BEGIN;");

  try {
    // 1. Enable pg_trgm extension
    console.log("1. Enabling pg_trgm extension...");
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    // 2. Add role column to public.profiles if not exists
    console.log("2. Adding role to public.profiles...");
    await client.query(`
      ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
        ) THEN
          ALTER TABLE public.profiles
          ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'moderator'));
        END IF;
      END $$;
    `);

    // Assign initial admin roles to active platform admin profiles
    await client.query(`
      UPDATE public.profiles
      SET role = 'admin'
      WHERE username IN ('srigopikannan', 'srigopikannan11', 'aadavk21')
         OR id = 'd1aabec0-3b89-4c1d-a33d-a6573224f5c2';
    `);

    // Helper function is_admin
    await client.query(`
      CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT coalesce((
          SELECT (role IN ('admin', 'moderator'))
          FROM public.profiles
          WHERE id = p_user_id
        ), false);
      $$;
    `);

    // 3. Add duplicate detection & moderation columns to public.ideas
    console.log("3. Adding moderation & duplicate tracking columns to public.ideas...");
    await client.query(`
      ALTER TABLE public.ideas
      ADD COLUMN IF NOT EXISTS duplicate_warning_acknowledged BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS moderation_note TEXT DEFAULT NULL;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ideas_moderation_status_check'
        ) THEN
          ALTER TABLE public.ideas
          ADD CONSTRAINT ideas_moderation_status_check CHECK (moderation_status IN ('active', 'flagged', 'under_review', 'restricted'));
        END IF;
      END $$;
    `);

    // 4. Create idea_reports table
    console.log("4. Creating public.idea_reports table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.idea_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
        reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        original_idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
        reason TEXT NOT NULL CHECK (reason IN ('possible_copying', 'copyright_ip', 'misleading_ownership', 'other')),
        description TEXT NOT NULL,
        evidence_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
        resolution TEXT CHECK (resolution IN ('no_action', 'violation_confirmed', 'content_restricted', 'dismissed', 'other')),
        resolution_note TEXT,
        reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 5. Create performance and anti-abuse indexes
    console.log("5. Creating indexes for idea_reports and similarity search...");
    await client.query(`
      -- Anti-abuse partial unique index: prevent spamming active reports for same idea
      CREATE UNIQUE INDEX IF NOT EXISTS uq_idea_reports_active
      ON public.idea_reports (idea_id, reporter_id)
      WHERE status IN ('pending', 'under_review');

      CREATE INDEX IF NOT EXISTS idx_idea_reports_status_created ON public.idea_reports (status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_idea_reports_idea_id ON public.idea_reports (idea_id);
      CREATE INDEX IF NOT EXISTS idx_idea_reports_reporter_id ON public.idea_reports (reporter_id);
      CREATE INDEX IF NOT EXISTS idx_idea_reports_original_idea ON public.idea_reports (original_idea_id) WHERE original_idea_id IS NOT NULL;

      -- Trigram similarity search indexes on ideas table
      CREATE INDEX IF NOT EXISTS idx_ideas_trgm_title ON public.ideas USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_ideas_trgm_content ON public.ideas USING gin (
        (coalesce(problem, '') || ' ' || coalesce(solution, '') || ' ' || coalesce(description, '')) gin_trgm_ops
      );
    `);

    // 6. Create detect_duplicate_ideas stored procedure
    console.log("6. Creating public.detect_duplicate_ideas function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.detect_duplicate_ideas(
        p_title TEXT,
        p_problem TEXT DEFAULT NULL,
        p_solution TEXT DEFAULT NULL,
        p_description TEXT DEFAULT NULL,
        p_category TEXT DEFAULT NULL,
        p_exclude_idea_id UUID DEFAULT NULL,
        p_viewer_id UUID DEFAULT NULL,
        p_threshold NUMERIC DEFAULT 0.35,
        p_limit INT DEFAULT 5
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_results JSONB := '[]'::jsonb;
      BEGIN
        IF p_title IS NULL OR length(trim(p_title)) < 3 THEN
          RETURN '[]'::jsonb;
        END IF;

        WITH candidate_pool AS (
          SELECT
            i.id,
            coalesce(i.display_id, 'IDEA-' || upper(substring(i.id::text, 1, 8))) AS display_id,
            i.title,
            i.problem,
            i.solution,
            i.description,
            i.category,
            i.visibility,
            i.created_at,
            i.creator_id,
            p.full_name AS creator_name,
            p.username AS creator_username,
            p.avatar_url AS creator_avatar,
            -- Component similarities using trigram algorithm
            similarity(lower(trim(i.title)), lower(trim(p_title))) AS title_sim,
            CASE
              WHEN p_problem IS NOT NULL AND length(trim(p_problem)) > 5 AND i.problem IS NOT NULL
              THEN similarity(lower(trim(i.problem)), lower(trim(p_problem)))
              ELSE 0.0
            END AS prob_sim,
            CASE
              WHEN p_solution IS NOT NULL AND length(trim(p_solution)) > 5 AND i.solution IS NOT NULL
              THEN similarity(lower(trim(i.solution)), lower(trim(p_solution)))
              ELSE 0.0
            END AS sol_sim,
            CASE
              WHEN p_description IS NOT NULL AND length(trim(p_description)) > 5 AND i.description IS NOT NULL
              THEN similarity(lower(trim(i.description)), lower(trim(p_description)))
              ELSE 0.0
            END AS desc_sim,
            CASE
              WHEN p_category IS NOT NULL AND i.category IS NOT NULL AND lower(trim(i.category)) = lower(trim(p_category))
              THEN 0.05
              ELSE 0.0
            END AS category_bonus
          FROM public.ideas i
          JOIN public.profiles p ON p.id = i.creator_id
          WHERE
            -- Exclude soft-deleted or archived ideas
            i.deleted_at IS NULL
            AND coalesce(i.status, 'active') <> 'archived'
            -- Exclude self when editing
            AND (p_exclude_idea_id IS NULL OR i.id <> p_exclude_idea_id)
            -- STRICT PRIVACY ENFORCEMENT:
            -- Public ideas are viewable by anyone
            -- Community ideas viewable by authenticated users
            -- Private / selected ideas viewable ONLY by creator
            AND (
              i.visibility = 'public'
              OR (i.visibility = 'community' AND p_viewer_id IS NOT NULL)
              OR (i.creator_id = p_viewer_id)
            )
            -- Pre-filter candidates with index support
            AND (
              similarity(lower(trim(i.title)), lower(trim(p_title))) >= 0.20
              OR (p_problem IS NOT NULL AND similarity(coalesce(i.problem, ''), p_problem) >= 0.20)
              OR (p_solution IS NOT NULL AND similarity(coalesce(i.solution, ''), p_solution) >= 0.20)
              OR (p_description IS NOT NULL AND similarity(coalesce(i.description, ''), p_description) >= 0.20)
            )
        ),
        scored AS (
          SELECT
            c.*,
            -- Weighted composite calculation:
            -- Title: 35%, Problem: 30%, Solution: 35% (or Title 45% + Description 55% when problem/solution missing)
            LEAST(1.0, ROUND((
              CASE
                WHEN c.prob_sim > 0 AND c.sol_sim > 0 THEN
                  (c.title_sim * 0.35) + (c.prob_sim * 0.30) + (c.sol_sim * 0.35) + c.category_bonus
                ELSE
                  (c.title_sim * 0.45) + (c.desc_sim * 0.50) + c.category_bonus
              END
            )::numeric, 4)) AS total_score
          FROM candidate_pool c
        )
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', s.id,
          'display_id', s.display_id,
          'title', s.title,
          'category', s.category,
          'visibility', s.visibility,
          'created_at', s.created_at,
          'creator', jsonb_build_object(
            'id', s.creator_id,
            'full_name', s.creator_name,
            'username', s.creator_username,
            'avatar_url', s.creator_avatar
          ),
          'similarity_score', s.total_score,
          'similarity_percentage', ROUND(s.total_score * 100),
          'similarity_level', CASE
            WHEN s.total_score >= 0.65 THEN 'high'
            WHEN s.total_score >= 0.35 THEN 'medium'
            ELSE 'low'
          END,
          'preview', substring(coalesce(s.problem, s.description, s.solution, '') from 1 for 150)
        ) ORDER BY s.total_score DESC), '[]'::jsonb)
        INTO v_results
        FROM (
          SELECT * FROM scored
          WHERE total_score >= p_threshold
          ORDER BY total_score DESC
          LIMIT p_limit
        ) s;

        RETURN v_results;
      END;
      $$;
    `);

    // 7. Enable RLS on idea_reports
    console.log("7. Setting up RLS on public.idea_reports...");
    await client.query(`
      ALTER TABLE public.idea_reports ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Reporters and Admins can view reports" ON public.idea_reports;
      CREATE POLICY "Reporters and Admins can view reports" ON public.idea_reports
      FOR SELECT USING (
        auth.uid() = reporter_id
        OR public.is_admin(auth.uid())
        OR auth.role() = 'service_role'
      );

      DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.idea_reports;
      CREATE POLICY "Authenticated users can create reports" ON public.idea_reports
      FOR INSERT WITH CHECK (
        auth.uid() = reporter_id
        OR auth.role() = 'service_role'
      );

      DROP POLICY IF EXISTS "Admins can update reports" ON public.idea_reports;
      CREATE POLICY "Admins can update reports" ON public.idea_reports
      FOR UPDATE USING (
        public.is_admin(auth.uid())
        OR auth.role() = 'service_role'
      );

      DROP POLICY IF EXISTS "Admins can delete reports" ON public.idea_reports;
      CREATE POLICY "Admins can delete reports" ON public.idea_reports
      FOR DELETE USING (
        public.is_admin(auth.uid())
        OR auth.role() = 'service_role'
      );
    `);

    await client.query("COMMIT;");
    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    await client.end();
  }
}

runMigration().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
