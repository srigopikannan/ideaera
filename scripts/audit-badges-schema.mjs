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

async function audit() {
  await client.connect();
  console.log("=== AUDIT BADGES & ACHIEVEMENTS SCHEMA ===");

  // 1. Check tables matching *badge* or *achieve*
  const { rows: tables } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND (table_name ILIKE '%badge%' OR table_name ILIKE '%achieve%' OR table_name ILIKE '%certif%')
    ORDER BY table_name;
  `);
  console.log("Matching tables in public schema:", tables.map(t => t.table_name));

  // 2. Describe achievements table if present
  for (const t of tables) {
    const { rows: cols } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t.table_name]);
    console.log(`\nColumns for table [${t.table_name}]:`);
    console.table(cols);

    const { rows: sample } = await client.query(`SELECT * FROM public."${t.table_name}" LIMIT 3;`);
    console.log(`Sample rows from [${t.table_name}]:`, sample);
  }

  // 3. Inspect remaining tables
  console.log("\n--- More Activity Tables Inspection ---");
  const moreTables = ['hackathon_teams', 'tasks', 'milestones', 'bookmarks', 'profiles'];
  for (const at of moreTables) {
    const { rows: countRes } = await client.query(`SELECT count(*) FROM public."${at}";`);
    const { rows: cols } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [at]);
    console.log(`Table [${at}] (count = ${countRes[0].count}): columns =`, cols.map(c => c.column_name).join(", "));
  }

  // 4. Inspect existing RLS policies
  console.log("\n--- Existing RLS Policies ---");
  const { rows: rls } = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('achievements', 'profiles', 'ideas', 'projects', 'badges', 'user_badges')
    ORDER BY tablename, policyname;
  `);
  console.table(rls);

  await client.end();
}

audit().catch(console.error);
