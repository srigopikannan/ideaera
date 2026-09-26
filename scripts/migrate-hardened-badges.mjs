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

async function migrate() {
  await client.connect();
  console.log("=== MIGRATING HARDENED BADGE SYSTEM ===");

  try {
    // 1. Audit logs table & indexes
    console.log("1. Ensuring public.badge_audit_logs table and indexes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.badge_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
        action TEXT NOT NULL CHECK (action IN ('awarded', 'revoked')),
        reason TEXT NOT NULL,
        metrics_snapshot JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_badge_audit_logs_user_id ON public.badge_audit_logs(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_badge_audit_logs_badge_id ON public.badge_audit_logs(badge_id);

      ALTER TABLE public.badge_audit_logs ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Badge audit logs are viewable by user" ON public.badge_audit_logs;
      CREATE POLICY "Badge audit logs are viewable by user" ON public.badge_audit_logs
        FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
    `);

    // 2. Ensure RLS on badges and user_badges
    console.log("2. Verifying RLS on badges and user_badges...");
    await client.query(`
      ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.badges;
      CREATE POLICY "Badges are viewable by everyone" ON public.badges
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
      CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
        FOR SELECT USING (true);
    `);

    // 3. Upsert hardened badges catalog
    console.log("3. Upserting hardened badge catalog...");
    const hardenedBadges = [
      // Bronze: Active Innovator tier
      {
        name: "Active Innovator",
        slug: "active-innovator",
        description: "Initiated active innovation by publishing at least 1 validated idea or software project.",
        icon: "Sparkles",
        color: "emerald",
        tier: "bronze",
        category: "top_performer",
        criteria_type: "composite",
        criteria_value: 1,
        criteria_description: "Publish at least 1 developed idea or software project",
        why_it_matters: "Honors builders taking the first decisive leap from concept to real-world deployment."
      },
      {
        name: "Idea Spark",
        slug: "idea-spark",
        description: "Articulated and published a comprehensive idea with clear problem and solution analysis.",
        icon: "Lightbulb",
        color: "amber",
        tier: "bronze",
        category: "idea_creator",
        criteria_type: "ideas_created",
        criteria_value: 1,
        criteria_description: "Publish 1 developed idea with clear problem & solution scope",
        why_it_matters: "A well-formulated problem and solution is the foundational bedrock of every groundbreaking innovation."
      },
      {
        name: "Venture Builder",
        slug: "venture-builder",
        description: "Engineered and launched an active software project with defined technical specifications.",
        icon: "FolderGit2",
        color: "blue",
        tier: "bronze",
        category: "project_builder",
        criteria_type: "projects_created",
        criteria_value: 1,
        criteria_description: "Build and publish 1 real software project with repository or deployment links",
        why_it_matters: "Building tangible software demonstrates engineering commitment and real-world execution capability."
      },
      {
        name: "Team Player",
        slug: "team-player",
        description: "Active contributor as a verified member who completed project tasks on a team.",
        icon: "Users",
        color: "cyan",
        tier: "bronze",
        category: "team_player",
        criteria_type: "team_contributions",
        criteria_value: 1,
        criteria_description: "Collaborate on a project team and complete at least 1 assigned task",
        why_it_matters: "True innovation thrives through cross-functional collaboration and committed team execution."
      },
      {
        name: "Hackathon Contender",
        slug: "hackathon-contender",
        description: "Competed in high-intensity building sprints by registering for or organizing verified hackathons.",
        icon: "Trophy",
        color: "violet",
        tier: "bronze",
        category: "hackathon_achiever",
        criteria_type: "hackathons_count",
        criteria_value: 1,
        criteria_description: "Participate in or organize at least 1 competitive hackathon sprint",
        why_it_matters: "Hackathons test rapid problem-solving, resilience, and rapid delivery under intense pressure."
      },
      {
        name: "Network Innovator",
        slug: "network-innovator",
        description: "Established verified, mutually accepted connections with fellow peer innovators.",
        icon: "UserCheck",
        color: "indigo",
        tier: "bronze",
        category: "collaborator",
        criteria_type: "connections_count",
        criteria_value: 1,
        criteria_description: "Establish 1 mutually accepted connection with a fellow innovator",
        why_it_matters: "High-value networks unlock collaborative intelligence, mentorship, and co-founder synergies."
      },

      // Silver: High Performer tier
      {
        name: "High Performer",
        slug: "high-performer",
        description: "Demonstrated consistent, cross-functional execution across ideation, development, and team contributions.",
        icon: "Zap",
        color: "purple",
        tier: "silver",
        category: "top_performer",
        criteria_type: "composite",
        criteria_value: 4,
        criteria_description: "Publish 2 developed ideas, 1 software project, and complete at least 1 project task",
        why_it_matters: "Exemplifies consistent execution across ideation, technical development, and collaborative delivery."
      },
      {
        name: "Prolific Ideator",
        slug: "prolific-ideator",
        description: "Authored multiple comprehensive, structured ideas across different technology domains.",
        icon: "Rocket",
        color: "rose",
        tier: "silver",
        category: "idea_creator",
        criteria_type: "ideas_created",
        criteria_value: 3,
        criteria_description: "Publish 3 comprehensive, developed ideas with problem & solution analysis",
        why_it_matters: "Demonstrates sustained creative output and disciplined strategic problem framing."
      },
      {
        name: "Ship Architect",
        slug: "ship-architect",
        description: "Engineered and maintains multiple active software projects with source repositories or deployments.",
        icon: "Award",
        color: "sky",
        tier: "silver",
        category: "project_builder",
        criteria_type: "projects_created",
        criteria_value: 2,
        criteria_description: "Build and publish 2 software projects with code repositories or deployments",
        why_it_matters: "Reflects an elite builder capable of shipping repeated software systems from scratch."
      },
      {
        name: "Synergy Catalyst",
        slug: "synergy-catalyst",
        description: "Cultivated a verified collaborative network of 3+ mutual innovator connections.",
        icon: "Users",
        color: "teal",
        tier: "silver",
        category: "collaborator",
        criteria_type: "connections_count",
        criteria_value: 3,
        criteria_description: "Establish 3 verified, mutually accepted connections across the network",
        why_it_matters: "Catalyzes team formation and ecosystem growth through sustained peer engagement."
      },

      // Gold: Top Performer tier
      {
        name: "Top Performer",
        slug: "top-performer",
        description: "IdeaEra's premier recognition for exceptional innovators excelling in ideation, project completion, and team execution.",
        icon: "Award",
        color: "amber",
        tier: "gold",
        category: "top_performer",
        criteria_type: "composite",
        criteria_value: 10,
        criteria_description: "Elite Tier: 5 developed ideas, 2 software projects (1+ completed), 3 completed tasks, and hackathon or community engagement",
        why_it_matters: "Reserved for the highest tier of builders whose verified contributions stand out across all disciplines."
      }
    ];

    for (const b of hardenedBadges) {
      await client.query(`
        INSERT INTO public.badges (
          name, slug, description, icon, color, tier, category, criteria_type, criteria_value, criteria_description, why_it_matters, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          tier = EXCLUDED.tier,
          category = EXCLUDED.category,
          criteria_type = EXCLUDED.criteria_type,
          criteria_value = EXCLUDED.criteria_value,
          criteria_description = EXCLUDED.criteria_description,
          why_it_matters = EXCLUDED.why_it_matters,
          is_active = true,
          updated_at = now();
      `, [
        b.name, b.slug, b.description, b.icon, b.color, b.tier, b.category, b.criteria_type, b.criteria_value, b.criteria_description, b.why_it_matters
      ]);
      console.log(` - Upserted [${b.tier.toUpperCase()}] ${b.name}`);
    }

    // 4. Create or replace evaluate_and_sync_user_badges
    console.log("4. Creating hardened evaluate_and_sync_user_badges function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.evaluate_and_sync_user_badges(target_user_id UUID)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
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
        SELECT COUNT(*) INTO v_ideas_count
        FROM public.ideas
        WHERE creator_id = target_user_id
          AND title IS NOT NULL
          AND length(trim(title)) >= 5
          AND (
            length(trim(coalesce(description, ''))) >= 50
            OR (length(trim(coalesce(problem, ''))) >= 20 AND length(trim(coalesce(solution, ''))) >= 20)
            OR validation_status IN ('testing', 'validated')
          );

        -- Software projects must have name >= 3 chars, description >= 50 chars, and technical artifacts (repo, demo, or required skills)
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
            b.criteria_value DESC
        LOOP
          v_is_eligible := false;
          v_reason := '';

          -- Evaluate criteria
          IF v_badge.criteria_type = 'ideas_created' THEN
            v_is_eligible := (v_ideas_count >= v_badge.criteria_value);
            v_reason := 'Developed ideas: ' || v_ideas_count || ' / ' || v_badge.criteria_value;

          ELSIF v_badge.criteria_type = 'projects_created' THEN
            v_is_eligible := (v_projects_count >= v_badge.criteria_value);
            v_reason := 'Software projects: ' || v_projects_count || ' / ' || v_badge.criteria_value;

          ELSIF v_badge.criteria_type = 'connections_count' THEN
            v_is_eligible := (v_connections_count >= v_badge.criteria_value);
            v_reason := 'Mutually accepted connections: ' || v_connections_count || ' / ' || v_badge.criteria_value;

          ELSIF v_badge.criteria_type = 'hackathons_count' THEN
            v_is_eligible := (v_hackathons_count >= v_badge.criteria_value);
            v_reason := 'Hackathons registered/organized: ' || v_hackathons_count || ' / ' || v_badge.criteria_value;

          ELSIF v_badge.criteria_type = 'team_contributions' THEN
            v_is_eligible := (v_team_contributions_count >= v_badge.criteria_value);
            v_reason := 'Verified team contributions with completed tasks: ' || v_team_contributions_count || ' / ' || v_badge.criteria_value;

          ELSIF v_badge.criteria_type = 'composite' THEN
            IF v_badge.slug = 'active-innovator' THEN
              v_is_eligible := (v_ideas_count >= 1 OR v_projects_count >= 1);
              v_reason := 'Requires at least 1 developed idea or software project (current: ' || v_ideas_count || ' ideas, ' || v_projects_count || ' projects)';

            ELSIF v_badge.slug = 'high-performer' THEN
              v_is_eligible := (v_ideas_count >= 2 AND v_projects_count >= 1 AND v_completed_tasks_count >= 1);
              v_reason := 'Requires 2 developed ideas, 1 software project, and 1 completed task (current: ' || v_ideas_count || ' ideas, ' || v_projects_count || ' projects, ' || v_completed_tasks_count || ' completed tasks)';

            ELSIF v_badge.slug = 'top-performer' THEN
              v_is_eligible := (
                v_ideas_count >= 5 AND
                v_projects_count >= 2 AND
                v_completed_projects_count >= 1 AND
                v_completed_tasks_count >= 3 AND
                (v_hackathons_count >= 1 OR v_connections_count >= 3)
              );
              v_reason := 'Elite criteria: 5 developed ideas, 2 projects (1+ completed), 3 completed tasks, and hackathons/connections (current: ' ||
                v_ideas_count || ' ideas, ' || v_projects_count || ' projects, ' || v_completed_projects_count || ' completed projects, ' ||
                v_completed_tasks_count || ' tasks, ' || v_hackathons_count || ' hackathons, ' || v_connections_count || ' connections)';

            ELSE
              v_is_eligible := ((v_ideas_count + v_projects_count + v_connections_count) >= v_badge.criteria_value);
              v_reason := 'Total activity: ' || (v_ideas_count + v_projects_count + v_connections_count) || ' / ' || v_badge.criteria_value;
            END IF;
          END IF;

          -- Check if user currently holds this badge
          SELECT EXISTS (
            SELECT 1 FROM public.user_badges ub
            WHERE ub.user_id = target_user_id AND ub.badge_id = v_badge.id
          ) INTO v_has_badge;

          -- CASE 1: Eligible, but not awarded yet -> AWARD BADGE
          IF v_is_eligible AND NOT v_has_badge THEN
            INSERT INTO public.user_badges (user_id, badge_id, awarded_at, awarded_by, evidence)
            VALUES (target_user_id, v_badge.id, now(), 'system', v_evidence)
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
                'tier', v_badge.tier,
                'revoked', true
              ),
              now(),
              now()
            );

            v_revoked := v_revoked || jsonb_build_object(
              'badge_id', v_badge.id,
              'name', v_badge.name,
              'slug', v_badge.slug,
              'tier', v_badge.tier,
              'reason', v_reason
            );

          -- CASE 3: Eligible and already held -> MAINTAINED
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
          'metrics', jsonb_build_object(
            'ideas_count', v_ideas_count,
            'projects_count', v_projects_count,
            'completed_projects_count', v_completed_projects_count,
            'connections_count', v_connections_count,
            'hackathons_count', v_hackathons_count,
            'team_contributions_count', v_team_contributions_count,
            'completed_tasks_count', v_completed_tasks_count
          ),
          'newly_awarded', v_newly_awarded,
          'revoked', v_revoked,
          'currently_valid', v_currently_valid
        );
      END;
      $$;

      -- Forward backward-compatible evaluate_and_award_user_badges
      CREATE OR REPLACE FUNCTION public.evaluate_and_award_user_badges(target_user_id UUID)
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        RETURN public.evaluate_and_sync_user_badges(target_user_id);
      END;
      $$;
    `);

    // 5. Create automatic database triggers for instant re-evaluation upon DELETE / UPDATE
    console.log("5. Installing database triggers for automatic badge re-evaluation...");

    // 5.1 Ideas trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.trg_auto_sync_badges_ideas()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.creator_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.creator_id);
          END IF;
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.creator_id IS NOT NULL AND OLD.creator_id <> NEW.creator_id THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.creator_id);
          END IF;
          IF NEW.creator_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.creator_id);
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          IF NEW.creator_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.creator_id);
          END IF;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_ideas_badge_sync ON public.ideas;
      CREATE TRIGGER trg_ideas_badge_sync
        AFTER INSERT OR UPDATE OR DELETE ON public.ideas
        FOR EACH ROW EXECUTE FUNCTION public.trg_auto_sync_badges_ideas();
    `);

    // 5.2 Projects trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.trg_auto_sync_badges_projects()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.owner_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.owner_id);
          END IF;
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.owner_id IS NOT NULL AND OLD.owner_id <> NEW.owner_id THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.owner_id);
          END IF;
          IF NEW.owner_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.owner_id);
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          IF NEW.owner_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.owner_id);
          END IF;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_projects_badge_sync ON public.projects;
      CREATE TRIGGER trg_projects_badge_sync
        AFTER INSERT OR UPDATE OR DELETE ON public.projects
        FOR EACH ROW EXECUTE FUNCTION public.trg_auto_sync_badges_projects();
    `);

    // 5.3 Project members trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.trg_auto_sync_badges_project_members()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.user_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.user_id);
          END IF;
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.user_id IS NOT NULL AND OLD.user_id <> NEW.user_id THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.user_id);
          END IF;
          IF NEW.user_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.user_id);
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          IF NEW.user_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.user_id);
          END IF;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_project_members_badge_sync ON public.project_members;
      CREATE TRIGGER trg_project_members_badge_sync
        AFTER INSERT OR UPDATE OR DELETE ON public.project_members
        FOR EACH ROW EXECUTE FUNCTION public.trg_auto_sync_badges_project_members();
    `);

    // 5.4 Tasks trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.trg_auto_sync_badges_tasks()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.assigned_to IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.assigned_to);
          END IF;
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to <> NEW.assigned_to THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.assigned_to);
          END IF;
          IF NEW.assigned_to IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.assigned_to);
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          IF NEW.assigned_to IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.assigned_to);
          END IF;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_tasks_badge_sync ON public.tasks;
      CREATE TRIGGER trg_tasks_badge_sync
        AFTER INSERT OR UPDATE OR DELETE ON public.tasks
        FOR EACH ROW EXECUTE FUNCTION public.trg_auto_sync_badges_tasks();
    `);

    // 5.5 Hackathon registrations trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.trg_auto_sync_badges_hackathon_regs()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.user_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.user_id);
          END IF;
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.user_id IS NOT NULL AND OLD.user_id <> NEW.user_id THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.user_id);
          END IF;
          IF NEW.user_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.user_id);
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          IF NEW.user_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.user_id);
          END IF;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_hackathon_regs_badge_sync ON public.hackathon_registrations;
      CREATE TRIGGER trg_hackathon_regs_badge_sync
        AFTER INSERT OR UPDATE OR DELETE ON public.hackathon_registrations
        FOR EACH ROW EXECUTE FUNCTION public.trg_auto_sync_badges_hackathon_regs();
    `);

    // 5.6 Connections trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.trg_auto_sync_badges_connections()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          IF OLD.requester_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.requester_id);
          END IF;
          IF OLD.receiver_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.receiver_id);
          END IF;
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.requester_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.requester_id);
          END IF;
          IF OLD.receiver_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(OLD.receiver_id);
          END IF;
          IF NEW.requester_id IS NOT NULL AND NEW.requester_id <> OLD.requester_id THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.requester_id);
          END IF;
          IF NEW.receiver_id IS NOT NULL AND NEW.receiver_id <> OLD.receiver_id THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.receiver_id);
          END IF;
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          IF NEW.requester_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.requester_id);
          END IF;
          IF NEW.receiver_id IS NOT NULL THEN
            PERFORM public.evaluate_and_sync_user_badges(NEW.receiver_id);
          END IF;
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_connections_badge_sync ON public.connections;
      CREATE TRIGGER trg_connections_badge_sync
        AFTER INSERT OR UPDATE OR DELETE ON public.connections
        FOR EACH ROW EXECUTE FUNCTION public.trg_auto_sync_badges_connections();
    `);

    console.log("=== MIGRATION COMPLETE! ALL TRIGGERS ACTIVE! ===");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
