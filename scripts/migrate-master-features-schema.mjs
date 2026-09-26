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
  console.log("=== MIGRATING DATABASE SCHEMA FOR 6 MASTER FEATURES ===");

  try {
    // 1. Projects Table Extensions (Project Rescue & Skill Gap Finder)
    console.log("1. Adding rescue and skill columns to public.projects...");
    await client.query(`
      ALTER TABLE public.projects 
        ADD COLUMN IF NOT EXISTS needs_help BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS help_category TEXT,
        ADD COLUMN IF NOT EXISTS help_description TEXT,
        ADD COLUMN IF NOT EXISTS help_requested_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}'::text[];
    `);

    // 2. Ideas Table Extensions (Idea Validation)
    console.log("2. Adding validation columns to public.ideas...");
    await client.query(`
      ALTER TABLE public.ideas
        ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'not_validated',
        ADD COLUMN IF NOT EXISTS validation_target_users TEXT,
        ADD COLUMN IF NOT EXISTS validation_why_it_matters TEXT,
        ADD COLUMN IF NOT EXISTS validation_alternatives TEXT,
        ADD COLUMN IF NOT EXISTS validation_expected_benefits TEXT,
        ADD COLUMN IF NOT EXISTS validation_questions JSONB DEFAULT '[]'::jsonb;
    `);

    // 3. Profiles Table Extensions (Team Availability)
    console.log("3. Standardizing availability on public.profiles...");
    await client.query(`
      ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS availability_hours TEXT;

      -- If availability contains college name from legacy data, move it to college if empty, and default availability
      UPDATE public.profiles
      SET college = availability
      WHERE college IS NULL 
        AND availability IS NOT NULL 
        AND availability NOT IN ('Available', 'Available evenings', 'Available weekends', 'Limited availability', 'Not currently available');

      UPDATE public.profiles
      SET availability = 'Available'
      WHERE availability IS NULL 
         OR availability NOT IN ('Available', 'Available evenings', 'Available weekends', 'Limited availability', 'Not currently available');
    `);

    // 4. Create Idea Validation Feedback Table
    console.log("4. Creating public.idea_validation_feedback table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.idea_validation_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        vote TEXT NOT NULL CHECK (vote IN ('valid', 'needs_work', 'impractical')),
        feedback TEXT NOT NULL,
        answers JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_idea_validation_user UNIQUE (idea_id, user_id)
      );
    `);

    // 5. Create Project Rescue Invitations Table
    console.log("5. Creating public.project_rescue_invitations table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.project_rescue_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT uq_rescue_invitation UNIQUE (project_id, receiver_id)
      );
    `);

    // 6. Create Project Workspace Files & Resources Table
    console.log("6. Creating public.project_files table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.project_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        file_type TEXT NOT NULL DEFAULT 'link',
        uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 7. Create Project Workspace Discussion Table
    console.log("7. Creating public.project_discussions table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.project_discussions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 8. Create Project Workspace Activity Log Table
    console.log("8. Creating public.project_activity table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.project_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // 9. Add Unique Constraint on project_members
    console.log("9. Adding unique constraint on public.project_members...");
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_project_member'
        ) THEN
          ALTER TABLE public.project_members ADD CONSTRAINT uq_project_member UNIQUE (project_id, user_id);
        END IF;
      END $$;
    `);

    // 10. Performance Indexes
    console.log("10. Creating performance indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_needs_help ON public.projects(needs_help) WHERE needs_help = true;
      CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_idea_validation_feedback_idea ON public.idea_validation_feedback(idea_id);
      CREATE INDEX IF NOT EXISTS idx_project_discussions_project ON public.project_discussions(project_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_project_activity_project ON public.project_activity(project_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_profiles_availability ON public.profiles(availability);
    `);

    // 11. Row Level Security & Policies
    console.log("11. Configuring RLS on new tables...");
    await client.query(`
      ALTER TABLE public.idea_validation_feedback ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_rescue_invitations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_discussions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Validation feedback viewable by everyone" ON public.idea_validation_feedback;
      CREATE POLICY "Validation feedback viewable by everyone" ON public.idea_validation_feedback FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Rescue invitations viewable by participants" ON public.project_rescue_invitations;
      CREATE POLICY "Rescue invitations viewable by participants" ON public.project_rescue_invitations FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Project files viewable by everyone" ON public.project_files;
      CREATE POLICY "Project files viewable by everyone" ON public.project_files FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Project discussions viewable by everyone" ON public.project_discussions;
      CREATE POLICY "Project discussions viewable by everyone" ON public.project_discussions FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Project activity viewable by everyone" ON public.project_activity;
      CREATE POLICY "Project activity viewable by everyone" ON public.project_activity FOR SELECT USING (true);
    `);

    // 12. Update handle_notification_sync trigger function for new types
    console.log("12. Updating handle_notification_sync for new features...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_notification_sync()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        IF NEW.recipient_id IS NULL AND NEW.user_id IS NOT NULL THEN
          NEW.recipient_id := NEW.user_id;
        END IF;
        IF NEW.user_id IS NULL AND NEW.recipient_id IS NOT NULL THEN
          NEW.user_id := NEW.recipient_id;
        END IF;

        IF NEW.read IS NULL AND NEW.is_read IS NOT NULL THEN
          NEW.read := NEW.is_read;
        END IF;
        IF NEW.is_read IS NULL AND NEW.read IS NOT NULL THEN
          NEW.is_read := NEW.read;
        END IF;
        IF NEW.read IS NULL AND NEW.is_read IS NULL THEN
          NEW.read := false;
          NEW.is_read := false;
        END IF;

        -- Only sync connection_id if notification type is connection or follow related
        IF (NEW.type LIKE 'connection_%' OR NEW.type LIKE 'follow_%') THEN
          IF NEW.connection_id IS NULL AND NEW.entity_id IS NOT NULL THEN
            NEW.connection_id := NEW.entity_id;
          END IF;
          IF NEW.entity_id IS NULL AND NEW.connection_id IS NOT NULL THEN
            NEW.entity_id := NEW.connection_id;
          END IF;
          IF NEW.related_id IS NULL AND NEW.connection_id IS NOT NULL THEN
            NEW.related_id := NEW.connection_id::text;
          END IF;
        ELSE
          NEW.connection_id := NULL;
          IF NEW.related_id IS NULL AND NEW.entity_id IS NOT NULL THEN
            NEW.related_id := NEW.entity_id::text;
          END IF;
        END IF;

        IF NEW.title IS NULL THEN
          IF NEW.type = 'connection_request' THEN
            NEW.title := 'Connection Request';
          ELSIF NEW.type = 'connection_accepted' THEN
            NEW.title := 'Connection Accepted';
          ELSIF NEW.type = 'message' THEN
            NEW.title := 'New Message';
          ELSIF NEW.type = 'badge_earned' THEN
            NEW.title := '🏆 Badge Earned!';
          ELSIF NEW.type = 'project_rescue_invite' THEN
            NEW.title := '🚨 Project Rescue Request';
          ELSIF NEW.type = 'task_assigned' THEN
            NEW.title := '📋 New Task Assigned';
          ELSIF NEW.type = 'task_completed' THEN
            NEW.title := '✅ Task Completed';
          ELSIF NEW.type = 'validation_feedback' THEN
            NEW.title := '📊 Idea Validation Feedback';
          ELSIF NEW.type = 'project_invite' THEN
            NEW.title := '🤝 Project Team Invitation';
          ELSE
            NEW.title := 'Notification';
          END IF;
        END IF;

        RETURN NEW;
      END;
      $function$;
    `);

    console.log("\n=== MASTER FEATURES SCHEMA MIGRATION COMPLETE ===");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);
