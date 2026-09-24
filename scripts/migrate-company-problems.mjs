import pg from "pg";

let connectionString = (
  process.env.DATABASE_URL ||
  "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres"
).split("?")[0];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  await client.connect();
  console.log("Connected to PostgreSQL for company-problems migration.");

  try {
    await client.query("BEGIN;");

    // 1. Extend companies table
    console.log("Extending companies table...");
    await client.query(`
      ALTER TABLE public.companies
      ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS tech_stack TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS verified_domain TEXT,
      ADD COLUMN IF NOT EXISTS challenges_count INT DEFAULT 0;
    `);

    // Ensure website_url or website are synchronized
    await client.query(`
      UPDATE public.companies
      SET website_url = COALESCE(website_url, 'https://supabase.com'),
          tech_stack = CASE 
            WHEN tech_stack IS NULL OR array_length(tech_stack, 1) IS NULL THEN ARRAY['PostgreSQL', 'TypeScript', 'Go', 'Elixir', 'Docker']
            ELSE tech_stack
          END,
          verification_status = 'verified',
          is_verified = true,
          verified_at = now()
      WHERE slug = 'supabase';
    `);

    // 2. Create company_problems table
    console.log("Creating company_problems table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.company_problems (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        summary TEXT NOT NULL,
        description TEXT NOT NULL,
        problem_type TEXT NOT NULL DEFAULT 'real_world_problem',
        source_type TEXT NOT NULL DEFAULT 'community',
        source_url TEXT,
        source_title TEXT,
        source_published_at TIMESTAMPTZ,
        required_skills TEXT[] DEFAULT '{}',
        industry TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'Intermediate',
        status TEXT NOT NULL DEFAULT 'open',
        created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        verified_at TIMESTAMPTZ,
        verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        last_reviewed_at TIMESTAMPTZ DEFAULT now(),
        views_count INT DEFAULT 0,
        solutions_count INT DEFAULT 0,
        saves_count INT DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_company_problems_company_id ON public.company_problems(company_id);
      CREATE INDEX IF NOT EXISTS idx_company_problems_slug ON public.company_problems(slug);
      CREATE INDEX IF NOT EXISTS idx_company_problems_status ON public.company_problems(status);
      CREATE INDEX IF NOT EXISTS idx_company_problems_source_type ON public.company_problems(source_type);
      CREATE INDEX IF NOT EXISTS idx_company_problems_industry ON public.company_problems(industry);
      CREATE INDEX IF NOT EXISTS idx_company_problems_created_at ON public.company_problems(created_at DESC);
    `);

    // 3. Extend ideas table with problem_id, company_id, etc.
    console.log("Extending ideas table...");
    await client.query(`
      ALTER TABLE public.ideas
      ADD COLUMN IF NOT EXISTS problem_id UUID REFERENCES public.company_problems(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS skills_needed TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS collaboration_info TEXT,
      ADD COLUMN IF NOT EXISTS goals TEXT,
      ADD COLUMN IF NOT EXISTS display_id TEXT,
      ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

      CREATE INDEX IF NOT EXISTS idx_ideas_problem_id ON public.ideas(problem_id);
      CREATE INDEX IF NOT EXISTS idx_ideas_company_id ON public.ideas(company_id);
    `);

    // Backfill display_id for existing ideas if missing
    await client.query(`
      UPDATE public.ideas
      SET display_id = 'IDEA-' || UPPER(SUBSTRING(id::text, 1, 8))
      WHERE display_id IS NULL;
    `);

    // 4. Create problem_saves table
    console.log("Creating problem_saves table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.problem_saves (
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        problem_id UUID NOT NULL REFERENCES public.company_problems(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, problem_id)
      );
      CREATE INDEX IF NOT EXISTS idx_problem_saves_user ON public.problem_saves(user_id);
      CREATE INDEX IF NOT EXISTS idx_problem_saves_problem ON public.problem_saves(problem_id);
    `);

    // 5. Create problem_reports table
    console.log("Creating problem_reports table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.problem_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        problem_id UUID NOT NULL REFERENCES public.company_problems(id) ON DELETE CASCADE,
        reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ,
        reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        resolution_notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON public.problem_reports(status);
      CREATE INDEX IF NOT EXISTS idx_problem_reports_problem ON public.problem_reports(problem_id);
    `);

    // 6. Create company_verifications table
    console.log("Creating company_verifications table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.company_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        work_email TEXT NOT NULL,
        role_title TEXT NOT NULL,
        verification_document_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ,
        reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        review_notes TEXT
      );
    `);

    await client.query("COMMIT;");
    console.log("Schema migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Migration failed, rolled back:", err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);
