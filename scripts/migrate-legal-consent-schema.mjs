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
  console.log("=== MIGRATING USER CONSENTS SCHEMA & RPC FUNCTIONS ===");

  try {
    // 1. Create public.user_consents table
    console.log("1. Creating public.user_consents table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        privacy_policy_version TEXT NOT NULL,
        terms_version TEXT NOT NULL,
        cookie_policy_version TEXT NOT NULL DEFAULT '1.0',
        consent_type TEXT NOT NULL DEFAULT 'signup' CHECK (consent_type IN ('signup', 'policy_update', 're_consent')),
        accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb
      );

      CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id, accepted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_consents_versions ON public.user_consents(privacy_policy_version, terms_version);

      ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can view their own consent records" ON public.user_consents;
      CREATE POLICY "Users can view their own consent records" ON public.user_consents
        FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
    `);

    // 2. Create record_user_consent RPC function
    console.log("2. Creating record_user_consent RPC function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.record_user_consent(
        p_privacy_version TEXT,
        p_terms_version TEXT,
        p_cookie_version TEXT DEFAULT '1.0',
        p_consent_type TEXT DEFAULT 'signup',
        p_user_agent TEXT DEFAULT NULL,
        p_target_user_id UUID DEFAULT NULL
      )
      RETURNS JSONB
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      DECLARE
        v_user_id UUID;
        v_consent_id UUID;
        v_accepted_at TIMESTAMPTZ := now();
      BEGIN
        v_user_id := coalesce(p_target_user_id, auth.uid());
        IF v_user_id IS NULL THEN
          RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
        END IF;

        INSERT INTO public.user_consents (
          user_id,
          privacy_policy_version,
          terms_version,
          cookie_policy_version,
          consent_type,
          accepted_at,
          created_at,
          user_agent
        ) VALUES (
          v_user_id,
          p_privacy_version,
          p_terms_version,
          p_cookie_version,
          p_consent_type,
          v_accepted_at,
          v_accepted_at,
          p_user_agent
        )
        RETURNING id INTO v_consent_id;

        RETURN jsonb_build_object(
          'success', true,
          'consent_id', v_consent_id,
          'user_id', v_user_id,
          'accepted_at', v_accepted_at,
          'privacy_version', p_privacy_version,
          'terms_version', p_terms_version
        );
      END;
      $$;
    `);

    // 3. Create has_accepted_current_policies RPC function
    console.log("3. Creating has_accepted_current_policies RPC function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION public.has_accepted_current_policies(
        p_user_id UUID,
        p_required_privacy_version TEXT,
        p_required_terms_version TEXT
      )
      RETURNS BOOLEAN
      LANGUAGE sql
      SECURITY DEFINER
      STABLE
      SET search_path = public
      AS $$
        SELECT EXISTS (
          SELECT 1 FROM public.user_consents
          WHERE user_id = p_user_id
            AND privacy_policy_version = p_required_privacy_version
            AND terms_version = p_required_terms_version
        );
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
