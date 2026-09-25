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
  console.log("=== AUDIT FOR 6 MASTER FEATURES ===");

  const { rows: tables } = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("All Public Tables:", tables.map(t => t.table_name));

  const tablesToInspect = [
    'profiles', 'ideas', 'projects', 'tasks', 'milestones', 
    'project_members', 'project_skills', 'team_members', 'project_files'
  ];

  for (const t of tablesToInspect) {
    const { rows: exists } = await client.query(`
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1
    `, [t]);
    if (exists.length > 0) {
      const { rows: cols } = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t]);
      console.log(`\nTable [${t}] columns:`);
      console.table(cols);
    } else {
      console.log(`\nTable [${t}]: DOES NOT EXIST`);
    }
  }

  await client.end();
}

audit().catch(console.error);
