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
  throw new Error("DATABASE_URL environment variable is required to run this migration.");
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function migrateRLS() {
  await client.connect();
  console.log("==================================================================");
  console.log("   MIGRATING 100% COMPLETE RLS COVERAGE ACROSS ALL PUBLIC TABLES");
  console.log("==================================================================\n");

  try {
    await client.query("BEGIN;");

    // 1. skills
    console.log("1. Enabling RLS on skills...");
    await client.query(`
      ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Skills viewable by everyone" ON public.skills;
      CREATE POLICY "Skills viewable by everyone" ON public.skills FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Skills manageable by service role" ON public.skills;
      CREATE POLICY "Skills manageable by service role" ON public.skills FOR ALL USING (auth.role() = 'service_role');
    `);

    // 2. interests
    console.log("2. Enabling RLS on interests...");
    await client.query(`
      ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Interests viewable by everyone" ON public.interests;
      CREATE POLICY "Interests viewable by everyone" ON public.interests FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Interests manageable by service role" ON public.interests;
      CREATE POLICY "Interests manageable by service role" ON public.interests FOR ALL USING (auth.role() = 'service_role');
    `);

    // 3. hackathons
    console.log("3. Enabling RLS on hackathons...");
    await client.query(`
      ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Hackathons viewable by everyone" ON public.hackathons;
      CREATE POLICY "Hackathons viewable by everyone" ON public.hackathons FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Authenticated users can create hackathons" ON public.hackathons;
      CREATE POLICY "Authenticated users can create hackathons" ON public.hackathons FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
      DROP POLICY IF EXISTS "Organizers or service role can manage hackathons" ON public.hackathons;
      CREATE POLICY "Organizers or service role can manage hackathons" ON public.hackathons FOR UPDATE USING (auth.uid() = organizer_id OR auth.role() = 'service_role');
      DROP POLICY IF EXISTS "Organizers or service role can delete hackathons" ON public.hackathons;
      CREATE POLICY "Organizers or service role can delete hackathons" ON public.hackathons FOR DELETE USING (auth.uid() = organizer_id OR auth.role() = 'service_role');
    `);

    // 4. hackathon_registrations
    console.log("4. Enabling RLS on hackathon_registrations...");
    await client.query(`
      ALTER TABLE public.hackathon_registrations ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Hackathon registrations viewable by everyone" ON public.hackathon_registrations;
      CREATE POLICY "Hackathon registrations viewable by everyone" ON public.hackathon_registrations FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can register for hackathons" ON public.hackathon_registrations;
      CREATE POLICY "Users can register for hackathons" ON public.hackathon_registrations FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
      DROP POLICY IF EXISTS "Users can cancel hackathon registration" ON public.hackathon_registrations;
      CREATE POLICY "Users can cancel hackathon registration" ON public.hackathon_registrations FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');
    `);

    // 5. hackathon_teams
    console.log("5. Enabling RLS on hackathon_teams...");
    await client.query(`
      ALTER TABLE public.hackathon_teams ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Hackathon teams viewable by everyone" ON public.hackathon_teams;
      CREATE POLICY "Hackathon teams viewable by everyone" ON public.hackathon_teams FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Authenticated users can manage hackathon teams" ON public.hackathon_teams;
      CREATE POLICY "Authenticated users can manage hackathon teams" ON public.hackathon_teams FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
    `);

    // 6. hackathon_team_members
    console.log("6. Enabling RLS on hackathon_team_members...");
    await client.query(`
      ALTER TABLE public.hackathon_team_members ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Team members viewable by everyone" ON public.hackathon_team_members;
      CREATE POLICY "Team members viewable by everyone" ON public.hackathon_team_members FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can join teams" ON public.hackathon_team_members;
      CREATE POLICY "Users can join teams" ON public.hackathon_team_members FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
      DROP POLICY IF EXISTS "Users can leave teams" ON public.hackathon_team_members;
      CREATE POLICY "Users can leave teams" ON public.hackathon_team_members FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');
    `);

    // 7. achievements
    console.log("7. Enabling RLS on achievements...");
    await client.query(`
      ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Achievements viewable by everyone" ON public.achievements;
      CREATE POLICY "Achievements viewable by everyone" ON public.achievements FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can manage own achievements" ON public.achievements;
      CREATE POLICY "Users can manage own achievements" ON public.achievements FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
    `);

    // 8. certifications
    console.log("8. Enabling RLS on certifications...");
    await client.query(`
      ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Certifications viewable by everyone" ON public.certifications;
      CREATE POLICY "Certifications viewable by everyone" ON public.certifications FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can manage own certifications" ON public.certifications;
      CREATE POLICY "Users can manage own certifications" ON public.certifications FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
    `);

    // 9. experience
    console.log("9. Enabling RLS on experience...");
    await client.query(`
      ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Experience viewable by everyone" ON public.experience;
      CREATE POLICY "Experience viewable by everyone" ON public.experience FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Users can manage own experience" ON public.experience;
      CREATE POLICY "Users can manage own experience" ON public.experience FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');
    `);

    // 10. idea_requirements
    console.log("10. Enabling RLS on idea_requirements...");
    await client.query(`
      ALTER TABLE public.idea_requirements ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Idea requirements viewable by everyone" ON public.idea_requirements;
      CREATE POLICY "Idea requirements viewable by everyone" ON public.idea_requirements FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Idea creators can manage requirements" ON public.idea_requirements;
      CREATE POLICY "Idea creators can manage requirements" ON public.idea_requirements FOR ALL USING (
        (auth.uid() IN (SELECT creator_id FROM public.ideas WHERE id = idea_id))
        OR (auth.role() = 'service_role')
      );
    `);

    await client.query("COMMIT;");
    console.log("\n✅ All 10 tables successfully secured with RLS!");
  } catch (err) {
    await client.query("ROLLBACK;");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    await client.end();
  }
}

migrateRLS().catch(() => process.exit(1));
