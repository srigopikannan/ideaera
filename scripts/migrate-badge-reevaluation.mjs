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
  dbUrl = "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres";
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function migrate() {
  await client.connect();
  console.log("=== MIGRATING BADGE VALIDITY & AUTOMATIC RE-EVALUATION ===");

  try {
    // 1. Create public.badge_audit_logs table
    console.log("1. Creating public.badge_audit_logs table...");
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

    // 2. Ensure badge catalog contains Team Player and Active Innovator
    console.log("2. Upserting Team Player and Active Innovator badges...");
    const extraBadges = [
      {
        name: "Team Player",
        slug: "team-player",
        description: "Active contributor as a verified member of a collaborative project team.",
        icon: "Users2",
        color: "cyan",
        tier: "bronze",
        category: "team_player",
        criteria_type: "team_contributions",
        criteria_value: 1,
        criteria_description: "Join and contribute to at least 1 project team",
        why_it_matters: "True innovation thrives through cross-functional collaboration and committed team execution."
      },
      {
        name: "Active Innovator",
        slug: "active-innovator",
        description: "Initiated active innovation by publishing at least 1 validated idea or software project.",
        icon: "Sparkle",
        color: "emerald",
        tier: "bronze",
        category: "top_performer",
        criteria_type: "composite",
        criteria_value: 1,
        criteria_description: "Publish at least 1 validated idea or project",
        why_it_matters: "Honors builders taking the first decisive leap from concept to real-world deployment."
      }
    ];

    for (const b of extraBadges) {
      await client.query(`
        INSERT INTO public.badges (
          name, slug, description, icon, color, tier, category, criteria_type, criteria_value, criteria_description, why_it_matters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
          updated_at = now();
      `, [
        b.name, b.slug, b.description, b.icon, b.color, b.tier, b.category, b.criteria_type, b.criteria_value, b.criteria_description, b.why_it_matters
      ]);
      console.log(` - Upserted badge [${b.tier.toUpperCase()}] ${b.name}`);
    }

    // 3. Create public.evaluate_and_sync_user_badges function
    console.log("3. Creating evaluate_and_sync_user_badges function with revocation and audit logging...");
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
        -- 1. Real activity metrics calculation
        SELECT COUNT(*) INTO v_ideas_count
        FROM public.ideas
        WHERE creator_id = target_user_id
          AND title IS NOT NULL
          AND length(trim(title)) > 0;

        SELECT COUNT(*) INTO v_projects_count
        FROM public.projects
        WHERE owner_id = target_user_id
          AND name IS NOT NULL
          AND length(trim(name)) > 0;

        SELECT COUNT(*) INTO v_connections_count
        FROM public.connections
        WHERE status = 'accepted'
          AND (requester_id = target_user_id OR receiver_id = target_user_id);

        SELECT (
          (SELECT COUNT(DISTINCT hackathon_id) FROM public.hackathon_registrations WHERE user_id = target_user_id) +
          (SELECT COUNT(*) FROM public.hackathons WHERE organizer_id = target_user_id)
        ) INTO v_hackathons_count;

        SELECT COUNT(DISTINCT project_id) INTO v_team_contributions_count
        FROM public.project_members
        WHERE user_id = target_user_id;

        SELECT COUNT(*) INTO v_completed_tasks_count
        FROM public.tasks
        WHERE assigned_to = target_user_id
          AND status = 'Completed';

        v_evidence := jsonb_build_object(
          'evaluated_at', now(),
          'ideas_count', v_ideas_count,
          'projects_count', v_projects_count,
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
            v_reason := 'Ideas count: ' || v_ideas_count || ' / ' || v_badge.criteria_value;
          ELSIF v_badge.criteria_type = 'projects_created' THEN
            v_is_eligible := (v_projects_count >= v_badge.criteria_value);
            v_reason := 'Projects count: ' || v_projects_count || ' / ' || v_badge.criteria_value;
          ELSIF v_badge.criteria_type = 'connections_count' THEN
            v_is_eligible := (v_connections_count >= v_badge.criteria_value);
            v_reason := 'Connections count: ' || v_connections_count || ' / ' || v_badge.criteria_value;
          ELSIF v_badge.criteria_type = 'hackathons_count' THEN
            v_is_eligible := (v_hackathons_count >= v_badge.criteria_value);
            v_reason := 'Hackathons count: ' || v_hackathons_count || ' / ' || v_badge.criteria_value;
          ELSIF v_badge.criteria_type = 'team_contributions' THEN
            v_is_eligible := (v_team_contributions_count >= v_badge.criteria_value);
            v_reason := 'Team memberships: ' || v_team_contributions_count || ' / ' || v_badge.criteria_value;
          ELSIF v_badge.criteria_type = 'composite' THEN
            IF v_badge.slug = 'high-performer' THEN
              v_is_eligible := (v_ideas_count >= 2 AND v_projects_count >= 1);
              v_reason := 'Requires 2 ideas and 1 project (current: ' || v_ideas_count || ' ideas, ' || v_projects_count || ' projects)';
            ELSIF v_badge.slug = 'top-performer' THEN
              v_is_eligible := (v_ideas_count >= 3 AND v_projects_count >= 1 AND v_connections_count >= 2);
              v_reason := 'Requires 3 ideas, 1 project, and 2 connections (current: ' || v_ideas_count || ' ideas, ' || v_projects_count || ' projects, ' || v_connections_count || ' connections)';
            ELSIF v_badge.slug = 'active-innovator' THEN
              v_is_eligible := (v_ideas_count >= 1 OR v_projects_count >= 1);
              v_reason := 'Requires at least 1 idea or 1 project (current: ' || v_ideas_count || ' ideas, ' || v_projects_count || ' projects)';
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

      -- Forward evaluate_and_award_user_badges to evaluate_and_sync_user_badges for backward compatibility
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

    console.log("=== MIGRATION COMPLETE! ===");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
