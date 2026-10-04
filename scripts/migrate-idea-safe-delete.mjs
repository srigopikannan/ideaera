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
  console.log("=== STARTING IDEA SAFE DELETION & ARCHIVAL MIGRATION ===");

  await client.query("BEGIN;");

  try {
    // 1. Add deleted_at, deleted_by, and status columns to public.ideas if they don't exist
    console.log("1. Adding deleted_at, deleted_by, status columns to public.ideas...");
    await client.query(`
      ALTER TABLE public.ideas
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    `);

    // Add constraint if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ideas_status_check'
        ) THEN
          ALTER TABLE public.ideas
          ADD CONSTRAINT ideas_status_check CHECK (status IN ('active', 'archived', 'deleted'));
        END IF;
      END $$;
    `);

    // 2. Add performance indexes for soft-deleted / archived filtering
    console.log("2. Creating performance indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ideas_deleted_at_status ON public.ideas (deleted_at, status);
      CREATE INDEX IF NOT EXISTS idx_ideas_creator_status ON public.ideas (creator_id, status);
      CREATE INDEX IF NOT EXISTS idx_projects_idea_id ON public.projects (idea_id) WHERE idea_id IS NOT NULL;
    `);

    // 3. Database function to check dependencies of an idea
    console.log("3. Creating public.check_idea_dependencies function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.check_idea_dependencies(target_idea_id UUID)
      RETURNS JSONB
      LANGUAGE plpgsql
      STABLE
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_projects JSONB;
        v_count INT := 0;
      BEGIN
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'owner_id', p.owner_id,
          'status', p.status
        )), '[]'::jsonb), COUNT(*)
        INTO v_projects, v_count
        FROM public.projects p
        WHERE p.idea_id = target_idea_id;

        RETURN jsonb_build_object(
          'has_dependencies', (v_count > 0),
          'dependency_count', v_count,
          'projects', v_projects
        );
      END;
      $$;
    `);

    // 4. Database transactional function to safely delete or archive an idea
    console.log("4. Creating public.delete_or_archive_idea function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.delete_or_archive_idea(
        p_idea_id UUID,
        p_user_id UUID,
        p_action TEXT DEFAULT 'delete'
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_idea RECORD;
        v_dep JSONB;
        v_projects JSONB;
        v_count INT := 0;
      BEGIN
        -- 1. Check if idea exists
        SELECT * INTO v_idea
        FROM public.ideas
        WHERE id = p_idea_id;

        IF NOT FOUND THEN
          RETURN jsonb_build_object(
            'success', false,
            'code', 'NOT_FOUND',
            'message', 'Idea not found.'
          );
        END IF;

        -- 2. Verify authorization
        IF v_idea.creator_id <> p_user_id THEN
          RETURN jsonb_build_object(
            'success', false,
            'code', 'UNAUTHORIZED',
            'message', 'You do not have permission to delete or archive this idea.'
          );
        END IF;

        -- 3. Check dependencies
        v_dep := public.check_idea_dependencies(p_idea_id);
        v_count := (v_dep->>'dependency_count')::int;
        v_projects := v_dep->'projects';

        -- ACTION: DELETE
        IF p_action = 'delete' THEN
          IF v_count > 0 THEN
            RETURN jsonb_build_object(
              'success', false,
              'code', 'IDEA_HAS_DEPENDENCIES',
              'message', 'This idea is linked to active project(s) and cannot be permanently deleted. You can archive it instead.',
              'dependencies', jsonb_build_object('projects', v_projects)
            );
          END IF;

          -- No dependencies -> safe permanent delete (cascade dependents)
          DELETE FROM public.idea_comments WHERE idea_id = p_idea_id;
          DELETE FROM public.idea_likes WHERE idea_id = p_idea_id;
          DELETE FROM public.idea_bookmarks WHERE idea_id = p_idea_id;
          DELETE FROM public.idea_requirements WHERE idea_id = p_idea_id;
          DELETE FROM public.idea_validation_feedback WHERE idea_id = p_idea_id;
          DELETE FROM public.notifications WHERE idea_id = p_idea_id;
          DELETE FROM public.ideas WHERE id = p_idea_id;

          -- Re-evaluate user badges
          PERFORM public.evaluate_and_sync_user_badges(p_user_id);

          RETURN jsonb_build_object(
            'success', true,
            'action', 'deleted',
            'message', 'Idea permanently deleted successfully.'
          );

        -- ACTION: ARCHIVE
        ELSIF p_action = 'archive' THEN
          UPDATE public.ideas
          SET status = 'archived',
              deleted_at = now(),
              deleted_by = p_user_id,
              updated_at = now()
          WHERE id = p_idea_id;

          -- Re-evaluate user badges
          PERFORM public.evaluate_and_sync_user_badges(p_user_id);

          RETURN jsonb_build_object(
            'success', true,
            'action', 'archived',
            'message', 'Idea archived successfully. Project continuity preserved.'
          );
        ELSE
          RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_ACTION',
            'message', 'Invalid action specified. Must be delete or archive.'
          );
        END IF;
      END;
      $$;
    `);

    // 5. Update evaluate_and_sync_user_badges to ignore archived/deleted ideas
    console.log("5. Updating evaluate_and_sync_user_badges with deleted_at IS NULL AND status = 'active' filter...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.evaluate_and_sync_user_badges(target_user_id uuid)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $function$
      DECLARE
        v_ideas_count INT := 0;
        v_projects_count INT := 0;
        v_completed_projects_count INT := 0;
        v_connections_count INT := 0;
        v_hackathons_count INT := 0;
        v_team_contributions_count INT := 0;
        v_completed_tasks_count INT := 0;
        v_badge RECORD;
        v_is_eligible BOOLEAN;
        v_has_badge BOOLEAN;
        v_newly_awarded JSONB := '[]'::jsonb;
        v_revoked JSONB := '[]'::jsonb;
        v_currently_valid JSONB := '[]'::jsonb;
        v_evidence JSONB;
        v_reason TEXT;
      BEGIN
        IF target_user_id IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'target_user_id is null');
        END IF;

        -- 1. Anti-farming / Meaningful activity calculation:
        -- Developed ideas must have title >= 5 chars, and substantive description >= 50 OR defined problem & solution >= 20 chars each OR validated
        -- MUST NOT be archived or soft-deleted
        SELECT COUNT(*) INTO v_ideas_count
        FROM public.ideas
        WHERE creator_id = target_user_id
          AND deleted_at IS NULL
          AND coalesce(status, 'active') = 'active'
          AND title IS NOT NULL
          AND length(trim(title)) >= 5
          AND (
            length(trim(coalesce(description, ''))) >= 50
            OR (length(trim(coalesce(problem, ''))) >= 20 AND length(trim(coalesce(solution, ''))) >= 20)
            OR validation_status IN ('testing', 'validated')
          );

        -- Software projects must have name >= 3 chars, description >= 50 chars, and technical artifacts
        SELECT COUNT(*) INTO v_projects_count
        FROM public.projects
        WHERE owner_id = target_user_id
          AND name IS NOT NULL
          AND length(trim(name)) >= 3
          AND length(trim(coalesce(description, ''))) >= 50
          AND (
            (repository_url IS NOT NULL AND length(trim(repository_url)) > 0)
            OR (deployment_url IS NOT NULL AND length(trim(deployment_url)) > 0)
            OR (required_skills IS NOT NULL AND array_length(required_skills, 1) > 0)
          );

        -- Completed software projects
        SELECT COUNT(*) INTO v_completed_projects_count
        FROM public.projects
        WHERE owner_id = target_user_id
          AND name IS NOT NULL
          AND length(trim(name)) >= 3
          AND length(trim(coalesce(description, ''))) >= 50
          AND (
            status ILIKE '%complete%'
            OR status = 'Done'
            OR status = 'Launched'
          );

        -- Mutually accepted connections
        SELECT COUNT(*) INTO v_connections_count
        FROM public.connections
        WHERE status = 'accepted'
          AND (requester_id = target_user_id OR receiver_id = target_user_id);

        -- Hackathons registered or organized
        SELECT (
          (SELECT COUNT(DISTINCT hackathon_id) FROM public.hackathon_registrations WHERE user_id = target_user_id) +
          (SELECT COUNT(*) FROM public.hackathons WHERE organizer_id = target_user_id)
        ) INTO v_hackathons_count;

        -- Meaningful team contributions: Member of project AND completed at least 1 task on that project
        SELECT COUNT(DISTINCT pm.project_id) INTO v_team_contributions_count
        FROM public.project_members pm
        JOIN public.tasks t ON t.project_id = pm.project_id AND t.assigned_to = target_user_id
        WHERE pm.user_id = target_user_id
          AND (t.status = 'Completed' OR t.completed_at IS NOT NULL);

        -- Total completed tasks
        SELECT COUNT(*) INTO v_completed_tasks_count
        FROM public.tasks
        WHERE assigned_to = target_user_id
          AND (status = 'Completed' OR completed_at IS NOT NULL);

        v_evidence := jsonb_build_object(
          'evaluated_at', now(),
          'ideas_count', v_ideas_count,
          'projects_count', v_projects_count,
          'completed_projects_count', v_completed_projects_count,
          'connections_count', v_connections_count,
          'hackathons_count', v_hackathons_count,
          'team_contributions_count', v_team_contributions_count,
          'completed_tasks_count', v_completed_tasks_count
        );

        -- 2. Loop over ALL active badges
        FOR v_badge IN
          SELECT b.*
          FROM public.badges b
          WHERE b.is_active = true
          ORDER BY 
            CASE b.tier WHEN 'gold' THEN 1 WHEN 'silver' THEN 2 WHEN 'bronze' THEN 3 ELSE 4 END,
            b.criteria_value ASC
        LOOP
          v_is_eligible := false;
          v_reason := '';

          -- Evaluate criteria strictly
          CASE v_badge.criteria_type
            WHEN 'ideas_created' THEN
              v_is_eligible := (v_ideas_count >= v_badge.criteria_value);
              v_reason := 'Ideas: ' || v_ideas_count || '/' || v_badge.criteria_value;

            WHEN 'projects_created' THEN
              v_is_eligible := (v_projects_count >= v_badge.criteria_value);
              v_reason := 'Projects: ' || v_projects_count || '/' || v_badge.criteria_value;

            WHEN 'completed_projects' THEN
              v_is_eligible := (v_completed_projects_count >= v_badge.criteria_value);
              v_reason := 'Completed Projects: ' || v_completed_projects_count || '/' || v_badge.criteria_value;

            WHEN 'connections_count' THEN
              v_is_eligible := (v_connections_count >= v_badge.criteria_value);
              v_reason := 'Connections: ' || v_connections_count || '/' || v_badge.criteria_value;

            WHEN 'hackathons_count' THEN
              v_is_eligible := (v_hackathons_count >= v_badge.criteria_value);
              v_reason := 'Hackathons: ' || v_hackathons_count || '/' || v_badge.criteria_value;

            WHEN 'team_contributions' THEN
              v_is_eligible := (v_team_contributions_count >= v_badge.criteria_value);
              v_reason := 'Team Contributions: ' || v_team_contributions_count || '/' || v_badge.criteria_value;

            WHEN 'completed_tasks' THEN
              v_is_eligible := (v_completed_tasks_count >= v_badge.criteria_value);
              v_reason := 'Completed Tasks: ' || v_completed_tasks_count || '/' || v_badge.criteria_value;

            WHEN 'composite' THEN
              IF v_badge.slug = 'high-performer' THEN
                -- Silver: 2 developed ideas, 1 project, 1 completed task
                v_is_eligible := (v_ideas_count >= 2 AND v_projects_count >= 1 AND v_completed_tasks_count >= 1);
                v_reason := 'High Performer composite: ideas=' || v_ideas_count || '/2, projects=' || v_projects_count || '/1, tasks=' || v_completed_tasks_count || '/1';
              ELSIF v_badge.slug = 'top-innovator' THEN
                -- Gold: 5 developed ideas, 2 projects, 1 completed project, 3 tasks, 2 connections
                v_is_eligible := (
                  v_ideas_count >= 5 AND
                  v_projects_count >= 2 AND
                  v_completed_projects_count >= 1 AND
                  v_completed_tasks_count >= 3 AND
                  v_connections_count >= 2
                );
                v_reason := 'Top Innovator composite: ideas=' || v_ideas_count || '/5, projects=' || v_projects_count || '/2, completed_projects=' || v_completed_projects_count || '/1, tasks=' || v_completed_tasks_count || '/3, connections=' || v_connections_count || '/2';
              ELSE
                v_is_eligible := false;
                v_reason := 'Unknown composite badge criteria';
              END IF;

            WHEN 'any_activity' THEN
              v_is_eligible := (v_ideas_count >= 1 OR v_projects_count >= 1);
              v_reason := 'Any activity: ideas=' || v_ideas_count || ', projects=' || v_projects_count;

            ELSE
              v_is_eligible := false;
              v_reason := 'Unsupported criteria type: ' || v_badge.criteria_type;
          END CASE;

          -- Check if user currently holds this badge
          SELECT EXISTS (
            SELECT 1 FROM public.user_badges
            WHERE user_id = target_user_id AND badge_id = v_badge.id
          ) INTO v_has_badge;

          -- CASE 1: Eligible and DOES NOT have it -> AWARD BADGE
          IF v_is_eligible AND NOT v_has_badge THEN
            INSERT INTO public.user_badges (user_id, badge_id, awarded_at, evidence)
            VALUES (target_user_id, v_badge.id, now(), v_evidence)
            ON CONFLICT (user_id, badge_id) DO NOTHING;

            -- Log to audit table
            INSERT INTO public.badge_audit_logs (user_id, badge_id, action, reason, metrics_snapshot)
            VALUES (target_user_id, v_badge.id, 'awarded', 'Criteria satisfied: ' || v_reason, v_evidence);

            -- Send badge_earned notification
            INSERT INTO public.notifications (
              user_id,
              recipient_id,
              type,
              title,
              message,
              entity_id,
              related_id,
              read,
              is_read,
              data,
              created_at,
              updated_at
            ) VALUES (
              target_user_id,
              target_user_id,
              'badge_earned',
              '🏆 Badge Earned!',
              'Congratulations! You unlocked the ' || upper(v_badge.tier) || ' badge: "' || v_badge.name || '"! ' || v_badge.criteria_description || '.',
              v_badge.id,
              v_badge.slug,
              false,
              false,
              jsonb_build_object(
                'badge_id', v_badge.id,
                'badge_slug', v_badge.slug,
                'badge_name', v_badge.name,
                'tier', v_badge.tier,
                'icon', v_badge.icon,
                'color', v_badge.color
              ),
              now(),
              now()
            );

            v_newly_awarded := v_newly_awarded || jsonb_build_object(
              'badge_id', v_badge.id,
              'name', v_badge.name,
              'slug', v_badge.slug,
              'tier', v_badge.tier
            );

          -- CASE 2: NOT Eligible, but user currently holds it -> REVOKE BADGE
          ELSIF NOT v_is_eligible AND v_has_badge THEN
            DELETE FROM public.user_badges
            WHERE user_id = target_user_id AND badge_id = v_badge.id;

            -- Log to audit table
            INSERT INTO public.badge_audit_logs (user_id, badge_id, action, reason, metrics_snapshot)
            VALUES (target_user_id, v_badge.id, 'revoked', 'Criteria no longer satisfied: ' || v_reason, v_evidence);

            -- Clear any outdated badge_earned notification for this badge
            DELETE FROM public.notifications
            WHERE (recipient_id = target_user_id OR user_id = target_user_id)
              AND type = 'badge_earned'
              AND (entity_id = v_badge.id OR data->>'badge_id' = v_badge.id::text);

            -- Send badge_revoked notification
            INSERT INTO public.notifications (
              user_id,
              recipient_id,
              type,
              title,
              message,
              entity_id,
              related_id,
              read,
              is_read,
              data,
              created_at,
              updated_at
            ) VALUES (
              target_user_id,
              target_user_id,
              'badge_revoked',
              '⚠️ Badge Revoked',
              'Your ' || upper(v_badge.tier) || ' badge "' || v_badge.name || '" was revoked because qualifying activity was deleted or modified: ' || v_reason,
              v_badge.id,
              v_badge.slug,
              false,
              false,
              jsonb_build_object(
                'badge_id', v_badge.id,
                'badge_slug', v_badge.slug,
                'badge_name', v_badge.name,
                'tier', v_badge.tier
              ),
              now(),
              now()
            );

            v_revoked := v_revoked || jsonb_build_object(
              'badge_id', v_badge.id,
              'name', v_badge.name,
              'slug', v_badge.slug,
              'tier', v_badge.tier
            );

          -- CASE 3: Eligible and currently has it -> RETAIN
          ELSIF v_is_eligible AND v_has_badge THEN
            v_currently_valid := v_currently_valid || jsonb_build_object(
              'badge_id', v_badge.id,
              'name', v_badge.name,
              'slug', v_badge.slug,
              'tier', v_badge.tier
            );
          END IF;
        END LOOP;

        RETURN jsonb_build_object(
          'success', true,
          'user_id', target_user_id,
          'metrics', v_evidence,
          'awarded', v_newly_awarded,
          'revoked', v_revoked,
          'valid_badges', v_currently_valid
        );
      END;
      $function$;
    `);

    // 6. Update RLS policies on public.ideas
    console.log("6. Updating RLS policy on public.ideas...");
    await client.query(`
      DROP POLICY IF EXISTS "Ideas viewable by visibility permissions" ON public.ideas;
      CREATE POLICY "Ideas viewable by visibility permissions" ON public.ideas
      FOR SELECT USING (
        -- If active/unarchived: normal visibility rules
        (
          (deleted_at IS NULL AND coalesce(status, 'active') <> 'archived')
          AND (
            visibility = 'public'
            OR (visibility = 'community' AND auth.role() = 'authenticated')
          )
        )
        -- Creator can always view their own idea (including archived)
        OR (auth.uid() = creator_id)
        -- Project members/owners connected to this idea can always view it
        OR (
          EXISTS (
            SELECT 1 FROM public.projects p
            LEFT JOIN public.project_members pm ON p.id = pm.project_id
            WHERE p.idea_id = ideas.id
              AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
          )
        )
        -- Service role has full access
        OR (auth.role() = 'service_role')
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
