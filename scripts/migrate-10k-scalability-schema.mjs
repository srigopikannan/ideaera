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
  throw new Error("DATABASE_URL environment variable is required. Please set it in .env or .env.local.");
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function migrate() {
  await client.connect();
  console.log("==================================================================");
  console.log("   IDEAERA - 10K SCALABILITY DATABASE MIGRATION");
  console.log("==================================================================");

  try {
    // ------------------------------------------------------------------
    // 1. CREATE MISSING TABLES: idea_likes & idea_comments
    // ------------------------------------------------------------------
    console.log("1. Creating public.idea_likes table with unique constraints...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.idea_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_idea_likes_user_idea UNIQUE (idea_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_idea_likes_idea_id ON public.idea_likes(idea_id);
      CREATE INDEX IF NOT EXISTS idx_idea_likes_user_id ON public.idea_likes(user_id);
    `);

    console.log("2. Creating public.idea_comments table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.idea_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_idea_comments_idea_id ON public.idea_comments(idea_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_idea_comments_user_id ON public.idea_comments(user_id);
    `);

    // ------------------------------------------------------------------
    // 2. SYNC TRIGGER FOR ideas.likes_count (prevent race conditions)
    // ------------------------------------------------------------------
    console.log("3. Creating atomic likes_count trigger on idea_likes...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.sync_idea_likes_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          UPDATE public.ideas
          SET likes_count = (SELECT count(*) FROM public.idea_likes WHERE idea_id = NEW.idea_id)
          WHERE id = NEW.idea_id;
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE public.ideas
          SET likes_count = (SELECT count(*) FROM public.idea_likes WHERE idea_id = OLD.idea_id)
          WHERE id = OLD.idea_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_sync_idea_likes_count ON public.idea_likes;
      CREATE TRIGGER trg_sync_idea_likes_count
        AFTER INSERT OR DELETE ON public.idea_likes
        FOR EACH ROW EXECUTE FUNCTION public.sync_idea_likes_count();
    `);

    // ------------------------------------------------------------------
    // 3. BOOKMARKS UNIQUE CONSTRAINTS (prevent race-condition duplicate bookmarks)
    // ------------------------------------------------------------------
    console.log("4. Adding unique constraints on bookmarks and idea_bookmarks...");
    await client.query(`
      -- Clean up any duplicates first if any exist
      DELETE FROM public.bookmarks a USING public.bookmarks b
      WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.target_user_id = b.target_user_id;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_bookmarks_user_target'
        ) THEN
          ALTER TABLE public.bookmarks ADD CONSTRAINT uq_bookmarks_user_target UNIQUE (user_id, target_user_id);
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_target_user_id ON public.bookmarks(target_user_id);

      -- Clean up idea_bookmarks duplicates if any exist
      DELETE FROM public.idea_bookmarks a USING public.idea_bookmarks b
      WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.idea_id = b.idea_id;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_idea_bookmarks_user_idea'
        ) THEN
          ALTER TABLE public.idea_bookmarks ADD CONSTRAINT uq_idea_bookmarks_user_idea UNIQUE (user_id, idea_id);
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS idx_idea_bookmarks_user_id ON public.idea_bookmarks(user_id);
      CREATE INDEX IF NOT EXISTS idx_idea_bookmarks_idea_id ON public.idea_bookmarks(idea_id);
    `);

    // ------------------------------------------------------------------
    // 4. ADD HIGH-IMPACT SCALABILITY INDEXES FOR 10K LOAD
    // ------------------------------------------------------------------
    console.log("5. Adding high-performance foreign-key and compound indexes...");
    await client.query(`
      -- User skills & interests (critical for 10K search and candidate discovery)
      CREATE INDEX IF NOT EXISTS idx_user_skills_skill_user ON public.user_skills(skill_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_user_skills_user_skill ON public.user_skills(user_id, skill_id);
      CREATE INDEX IF NOT EXISTS idx_user_interests_interest_user ON public.user_interests(interest_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_user_interests_user_interest ON public.user_interests(user_id, interest_id);

      -- Project collaboration tables
      CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON public.project_members(project_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_project_files_project_created ON public.project_files(project_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_project_discussions_project_created ON public.project_discussions(project_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_project_activity_project_created ON public.project_activity(project_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_status_created ON public.projects(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_projects_needs_help_created ON public.projects(needs_help, created_at DESC);

      -- Ideas visibility, category, and sorting
      CREATE INDEX IF NOT EXISTS idx_ideas_visibility_created ON public.ideas(visibility, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ideas_category_created ON public.ideas(category, created_at DESC);

      -- Profiles location, availability, and name searching
      CREATE INDEX IF NOT EXISTS idx_profiles_city_state ON public.profiles(city, state);
      CREATE INDEX IF NOT EXISTS idx_profiles_lower_name ON public.profiles(lower(full_name));
      CREATE INDEX IF NOT EXISTS idx_profiles_lower_username ON public.profiles(lower(username));

      -- Messaging pagination and unread status
      CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_unread_lookup ON public.messages(receiver_id, is_read, read_at);

      -- Notifications pagination and unread counts
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_unread_fast ON public.notifications(recipient_id, read, is_read);

      -- Tasks project and assignee
      CREATE INDEX IF NOT EXISTS idx_tasks_project_due ON public.tasks(project_id, due_date);
    `);

    // ------------------------------------------------------------------
    // 5. ROW LEVEL SECURITY (RLS) FOR IDEAS, PROFILES, LIKES, BOOKMARKS
    // ------------------------------------------------------------------
    console.log("6. Configuring secure, high-performance RLS policies...");
    await client.query(`
      -- 1. IDEAS TABLE RLS
      ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Ideas viewable by visibility permissions" ON public.ideas;
      CREATE POLICY "Ideas viewable by visibility permissions" ON public.ideas
        FOR SELECT USING (
          visibility = 'public'
          OR (visibility = 'community' AND auth.role() = 'authenticated')
          OR (auth.uid() = creator_id)
          OR (auth.role() = 'service_role')
        );

      DROP POLICY IF EXISTS "Authenticated creators can insert ideas" ON public.ideas;
      CREATE POLICY "Authenticated creators can insert ideas" ON public.ideas
        FOR INSERT WITH CHECK (
          (auth.uid() = creator_id) OR (auth.role() = 'service_role')
        );

      DROP POLICY IF EXISTS "Creators can update their own ideas" ON public.ideas;
      CREATE POLICY "Creators can update their own ideas" ON public.ideas
        FOR UPDATE USING (
          (auth.uid() = creator_id) OR (auth.role() = 'service_role')
        );

      DROP POLICY IF EXISTS "Creators can delete their own ideas" ON public.ideas;
      CREATE POLICY "Creators can delete their own ideas" ON public.ideas
        FOR DELETE USING (
          (auth.uid() = creator_id) OR (auth.role() = 'service_role')
        );

      -- 2. IDEA_LIKES RLS
      ALTER TABLE public.idea_likes ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Idea likes viewable by everyone" ON public.idea_likes;
      CREATE POLICY "Idea likes viewable by everyone" ON public.idea_likes
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Users can manage their own idea likes" ON public.idea_likes;
      CREATE POLICY "Users can manage their own idea likes" ON public.idea_likes
        FOR ALL USING (
          (auth.uid() = user_id) OR (auth.role() = 'service_role')
        );

      -- 3. IDEA_COMMENTS RLS
      ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Idea comments viewable by everyone" ON public.idea_comments;
      CREATE POLICY "Idea comments viewable by everyone" ON public.idea_comments
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Users can insert their own comments" ON public.idea_comments;
      CREATE POLICY "Users can insert their own comments" ON public.idea_comments
        FOR INSERT WITH CHECK (
          (auth.uid() = user_id) OR (auth.role() = 'service_role')
        );

      -- 4. PROFILES RLS
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
      CREATE POLICY "Profiles viewable by everyone" ON public.profiles
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      CREATE POLICY "Users can update their own profile" ON public.profiles
        FOR UPDATE USING (
          (auth.uid() = id) OR (auth.role() = 'service_role')
        );

      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      CREATE POLICY "Users can insert their own profile" ON public.profiles
        FOR INSERT WITH CHECK (
          (auth.uid() = id) OR (auth.role() = 'service_role')
        );

      -- 5. BOOKMARKS & IDEA_BOOKMARKS RLS
      ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.bookmarks;
      CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
        FOR ALL USING (
          (auth.uid() = user_id) OR (auth.role() = 'service_role')
        );

      ALTER TABLE public.idea_bookmarks ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can manage their own idea bookmarks" ON public.idea_bookmarks;
      CREATE POLICY "Users can manage their own idea bookmarks" ON public.idea_bookmarks
        FOR ALL USING (
          (auth.uid() = user_id) OR (auth.role() = 'service_role')
        );

      -- 6. USER_SKILLS & USER_INTERESTS RLS
      ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "User skills viewable by everyone" ON public.user_skills;
      CREATE POLICY "User skills viewable by everyone" ON public.user_skills
        FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can manage their own skills" ON public.user_skills;
      CREATE POLICY "Users can manage their own skills" ON public.user_skills
        FOR ALL USING (
          (auth.uid() = user_id) OR (auth.role() = 'service_role')
        );

      ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "User interests viewable by everyone" ON public.user_interests;
      CREATE POLICY "User interests viewable by everyone" ON public.user_interests
        FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can manage their own interests" ON public.user_interests;
      CREATE POLICY "Users can manage their own interests" ON public.user_interests
        FOR ALL USING (
          (auth.uid() = user_id) OR (auth.role() = 'service_role')
        );

      -- 7. PROJECTS & MEMBERS RLS
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Projects viewable by everyone" ON public.projects;
      CREATE POLICY "Projects viewable by everyone" ON public.projects
        FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Project owners can manage projects" ON public.projects;
      CREATE POLICY "Project owners can manage projects" ON public.projects
        FOR ALL USING (
          (auth.uid() = owner_id) OR (auth.role() = 'service_role')
        );

      ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Project members viewable by everyone" ON public.project_members;
      CREATE POLICY "Project members viewable by everyone" ON public.project_members
        FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Project members can insert/leave" ON public.project_members;
      CREATE POLICY "Project members can insert/leave" ON public.project_members
        FOR ALL USING (
          (auth.uid() = user_id) OR (auth.role() = 'service_role')
        );

      -- 8. TASKS & MILESTONES RLS
      ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Tasks viewable by everyone" ON public.tasks;
      CREATE POLICY "Tasks viewable by everyone" ON public.tasks
        FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Authenticated users can update tasks" ON public.tasks;
      CREATE POLICY "Authenticated users can update tasks" ON public.tasks
        FOR ALL USING (
          (auth.role() = 'authenticated') OR (auth.role() = 'service_role')
        );

      ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Milestones viewable by everyone" ON public.milestones;
      CREATE POLICY "Milestones viewable by everyone" ON public.milestones
        FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Authenticated users can update milestones" ON public.milestones;
      CREATE POLICY "Authenticated users can update milestones" ON public.milestones
        FOR ALL USING (
          (auth.role() = 'authenticated') OR (auth.role() = 'service_role')
        );
    `);

    // ------------------------------------------------------------------
    // 6. FAST PAGINATED DATABASE SEARCH RPC FOR 10,000 PROFILES
    // ------------------------------------------------------------------
    console.log("7. Creating high-performance search_profiles_10k RPC function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.search_profiles_10k(
        p_query TEXT DEFAULT NULL,
        p_skill TEXT DEFAULT NULL,
        p_college TEXT DEFAULT NULL,
        p_city TEXT DEFAULT NULL,
        p_state TEXT DEFAULT NULL,
        p_availability TEXT DEFAULT NULL,
        p_limit INT DEFAULT 24,
        p_offset INT DEFAULT 0,
        p_exclude_user_id UUID DEFAULT NULL
      )
      RETURNS TABLE (
        id UUID,
        username TEXT,
        full_name TEXT,
        headline TEXT,
        bio TEXT,
        avatar_url TEXT,
        location TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        show_location BOOLEAN,
        college_id UUID,
        college TEXT,
        college_city TEXT,
        college_state TEXT,
        availability TEXT,
        availability_hours TEXT,
        github_url TEXT,
        linkedin_url TEXT,
        portfolio_url TEXT,
        skills TEXT[],
        created_at TIMESTAMP,
        total_count BIGINT
      )
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_total BIGINT;
      BEGIN
        -- Fast count of matching rows
        SELECT COUNT(DISTINCT p.id) INTO v_total
        FROM public.profiles p
        LEFT JOIN public.colleges c ON p.college_id = c.id
        LEFT JOIN public.user_skills us ON us.user_id = p.id
        LEFT JOIN public.skills s ON us.skill_id = s.id
        WHERE (p_exclude_user_id IS NULL OR p.id <> p_exclude_user_id)
          AND (p_query IS NULL OR (
            p.full_name ILIKE ('%' || p_query || '%') OR
            p.username ILIKE ('%' || p_query || '%') OR
            p.headline ILIKE ('%' || p_query || '%') OR
            p.bio ILIKE ('%' || p_query || '%') OR
            p.location ILIKE ('%' || p_query || '%')
          ))
          AND (p_skill IS NULL OR p_skill = 'All' OR s.name ILIKE ('%' || p_skill || '%'))
          AND (p_college IS NULL OR p_college = 'All' OR (
            p.college ILIKE ('%' || p_college || '%') OR
            c.name ILIKE ('%' || p_college || '%')
          ))
          AND (p_city IS NULL OR p_city = 'All' OR (
            p.city ILIKE ('%' || p_city || '%') OR
            p.location ILIKE ('%' || p_city || '%')
          ))
          AND (p_state IS NULL OR p_state = 'All' OR (
            p.state ILIKE ('%' || p_state || '%') OR
            p.location ILIKE ('%' || p_state || '%')
          ))
          AND (p_availability IS NULL OR p_availability = 'All' OR (
            p.availability ILIKE ('%' || p_availability || '%')
          ));

        RETURN QUERY
        SELECT
          p.id,
          p.username,
          p.full_name,
          p.headline,
          p.bio,
          p.avatar_url,
          p.location,
          p.city,
          p.state,
          p.country,
          coalesce(p.show_location, true) AS show_location,
          p.college_id,
          coalesce(p.college, c.name) AS college,
          c.city AS college_city,
          c.state AS college_state,
          coalesce(p.availability, 'Available') AS availability,
          p.availability_hours,
          p.github_url,
          p.linkedin_url,
          p.portfolio_url,
          coalesce(
            (
              SELECT array_agg(DISTINCT sub_s.name)
              FROM public.user_skills sub_us
              JOIN public.skills sub_s ON sub_us.skill_id = sub_s.id
              WHERE sub_us.user_id = p.id
            ),
            ARRAY[]::TEXT[]
          ) AS skills,
          p.created_at,
          v_total AS total_count
        FROM public.profiles p
        LEFT JOIN public.colleges c ON p.college_id = c.id
        WHERE (p_exclude_user_id IS NULL OR p.id <> p_exclude_user_id)
          AND (p_query IS NULL OR (
            p.full_name ILIKE ('%' || p_query || '%') OR
            p.username ILIKE ('%' || p_query || '%') OR
            p.headline ILIKE ('%' || p_query || '%') OR
            p.bio ILIKE ('%' || p_query || '%') OR
            p.location ILIKE ('%' || p_query || '%')
          ))
          AND (p_skill IS NULL OR p_skill = 'All' OR EXISTS (
            SELECT 1 FROM public.user_skills sub_us2
            JOIN public.skills sub_s2 ON sub_us2.skill_id = sub_s2.id
            WHERE sub_us2.user_id = p.id AND sub_s2.name ILIKE ('%' || p_skill || '%')
          ))
          AND (p_college IS NULL OR p_college = 'All' OR (
            p.college ILIKE ('%' || p_college || '%') OR
            c.name ILIKE ('%' || p_college || '%')
          ))
          AND (p_city IS NULL OR p_city = 'All' OR (
            p.city ILIKE ('%' || p_city || '%') OR
            p.location ILIKE ('%' || p_city || '%')
          ))
          AND (p_state IS NULL OR p_state = 'All' OR (
            p.state ILIKE ('%' || p_state || '%') OR
            p.location ILIKE ('%' || p_state || '%')
          ))
          AND (p_availability IS NULL OR p_availability = 'All' OR (
            p.availability ILIKE ('%' || p_availability || '%')
          ))
        ORDER BY
          (CASE WHEN p.availability IS NOT NULL AND p.availability <> 'Not currently available' THEN 1 ELSE 0 END) DESC,
          p.created_at DESC
        LIMIT p_limit
        OFFSET p_offset;
      END;
      $$;
    `);

    // ------------------------------------------------------------------
    // 7. FAST UNREAD NOTIFICATION COUNT RPC
    // ------------------------------------------------------------------
    console.log("8. Creating get_unread_notification_count RPC function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
      RETURNS BIGINT
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $$
        SELECT COUNT(*)
        FROM public.notifications
        WHERE (recipient_id = p_user_id OR user_id = p_user_id)
          AND (read IS NOT TRUE AND is_read IS NOT TRUE);
      $$;
    `);

    console.log("==================================================================");
    console.log("   10K SCALABILITY MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("==================================================================");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
