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

async function run() {
  await client.connect();
  console.log("=== FIXING NOTIFICATION TRIGGER AND DEPLOYING BADGE FUNCTIONS ===");

  try {
    // Fix handle_notification_sync trigger function
    console.log("1. Updating handle_notification_sync function...");
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
          -- For non-connection notifications (badge_earned, etc.), ensure connection_id is null
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
          ELSIF NEW.type = 'idea_like' THEN
            NEW.title := 'Concept Endorsement';
          ELSIF NEW.type = 'idea_comment' THEN
            NEW.title := 'New Critique Note';
          ELSIF NEW.type = 'badge_earned' THEN
            NEW.title := '🏆 Badge Earned!';
          ELSE
            NEW.title := 'System Signal';
          END IF;
        END IF;

        RETURN NEW;
      END;
      $function$;
    `);

    // 2. Evaluate & award user badges
    console.log("2. Creating evaluate_and_award_user_badges function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.evaluate_and_award_user_badges(target_user_id UUID)
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
        v_badge RECORD;
        v_is_eligible BOOLEAN;
        v_newly_awarded JSONB := '[]'::jsonb;
        v_evidence JSONB;
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

        SELECT COUNT(*) INTO v_hackathons_count
        FROM public.hackathons
        WHERE organizer_id = target_user_id;

        -- 2. Loop over active badges that user does not have yet
        FOR v_badge IN
          SELECT b.*
          FROM public.badges b
          WHERE b.is_active = true
            AND NOT EXISTS (
              SELECT 1 FROM public.user_badges ub
              WHERE ub.user_id = target_user_id AND ub.badge_id = b.id
            )
          ORDER BY 
            CASE b.tier WHEN 'bronze' THEN 1 WHEN 'silver' THEN 2 WHEN 'gold' THEN 3 ELSE 4 END,
            b.criteria_value ASC
        LOOP
          v_is_eligible := false;
          v_evidence := jsonb_build_object(
            'evaluated_at', now(),
            'ideas_count', v_ideas_count,
            'projects_count', v_projects_count,
            'connections_count', v_connections_count,
            'hackathons_count', v_hackathons_count
          );

          IF v_badge.criteria_type = 'ideas_created' THEN
            v_is_eligible := (v_ideas_count >= v_badge.criteria_value);
          ELSIF v_badge.criteria_type = 'projects_created' THEN
            v_is_eligible := (v_projects_count >= v_badge.criteria_value);
          ELSIF v_badge.criteria_type = 'connections_count' THEN
            v_is_eligible := (v_connections_count >= v_badge.criteria_value);
          ELSIF v_badge.criteria_type = 'hackathons_count' THEN
            v_is_eligible := (v_hackathons_count >= v_badge.criteria_value);
          ELSIF v_badge.criteria_type = 'composite' THEN
            IF v_badge.slug = 'high-performer' THEN
              v_is_eligible := (v_ideas_count >= 2 AND v_projects_count >= 1);
            ELSIF v_badge.slug = 'top-performer' THEN
              v_is_eligible := (v_ideas_count >= 3 AND v_projects_count >= 1 AND v_connections_count >= 2);
            ELSE
              v_is_eligible := ((v_ideas_count + v_projects_count + v_connections_count) >= v_badge.criteria_value);
            END IF;
          END IF;

          IF v_is_eligible THEN
            -- Insert award
            INSERT INTO public.user_badges (user_id, badge_id, awarded_at, awarded_by, evidence)
            VALUES (target_user_id, v_badge.id, now(), 'system', v_evidence)
            ON CONFLICT (user_id, badge_id) DO NOTHING;

            -- Create notification
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
          END IF;
        END LOOP;

        RETURN jsonb_build_object(
          'success', true,
          'metrics', jsonb_build_object(
            'ideas_count', v_ideas_count,
            'projects_count', v_projects_count,
            'connections_count', v_connections_count,
            'hackathons_count', v_hackathons_count
          ),
          'newly_awarded', v_newly_awarded
        );
      END;
      $$;
    `);

    // 3. Admin award badge function
    console.log("3. Creating admin_award_badge function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.admin_award_badge(
        p_admin_user_id UUID,
        p_target_user_id UUID,
        p_badge_id UUID,
        p_reason TEXT DEFAULT 'Manual recognition by administrator'
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_badge RECORD;
        v_user_badge_id UUID;
      BEGIN
        SELECT * INTO v_badge FROM public.badges WHERE id = p_badge_id;
        IF NOT FOUND THEN
          RETURN jsonb_build_object('success', false, 'error', 'Badge not found');
        END IF;

        INSERT INTO public.user_badges (
          user_id, badge_id, awarded_at, awarded_by, evidence
        ) VALUES (
          p_target_user_id,
          p_badge_id,
          now(),
          'admin:' || p_admin_user_id::text,
          jsonb_build_object('reason', p_reason, 'admin_id', p_admin_user_id)
        )
        ON CONFLICT (user_id, badge_id) DO UPDATE SET
          awarded_at = now(),
          awarded_by = 'admin:' || p_admin_user_id::text,
          evidence = jsonb_build_object('reason', p_reason, 'admin_id', p_admin_user_id)
        RETURNING id INTO v_user_badge_id;

        INSERT INTO public.notifications (
          user_id, recipient_id, type, title, message, entity_id, related_id, read, is_read, data, created_at, updated_at
        ) VALUES (
          p_target_user_id,
          p_target_user_id,
          'badge_earned',
          '🏆 Badge Awarded by Admin!',
          'An administrator has awarded you the ' || upper(v_badge.tier) || ' badge: "' || v_badge.name || '"! ' || coalesce(p_reason, ''),
          v_badge.id,
          v_badge.slug,
          false,
          false,
          jsonb_build_object('badge_id', v_badge.id, 'badge_slug', v_badge.slug, 'tier', v_badge.tier, 'admin_awarded', true),
          now(),
          now()
        );

        RETURN jsonb_build_object('success', true, 'user_badge_id', v_user_badge_id);
      END;
      $$;
    `);

    // 4. Admin revoke badge function
    console.log("4. Creating admin_revoke_badge function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.admin_revoke_badge(
        p_admin_user_id UUID,
        p_target_user_id UUID,
        p_badge_id UUID,
        p_reason TEXT DEFAULT 'Revoked by administrator'
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        DELETE FROM public.user_badges
        WHERE user_id = p_target_user_id AND badge_id = p_badge_id;

        RETURN jsonb_build_object('success', true);
      END;
      $$;
    `);

    console.log("Functions and triggers updated successfully!");
  } catch (err) {
    console.error("Error creating functions:", err);
  } finally {
    await client.end();
  }
}

run();
