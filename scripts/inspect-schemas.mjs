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

async function inspect() {
  await client.connect();
  const tables = ['ideas', 'profiles', 'connections', 'messages', 'notifications', 'user_skills', 'projects', 'tasks', 'idea_likes', 'idea_comments', 'idea_bookmarks', 'bookmarks'];
  for (const t of tables) {
    const cols = await client.query(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t]);
    if (cols.rows.length === 0) {
      console.log(`\n=== TABLE: ${t} (DOES NOT EXIST) ===`);
    } else {
      console.log(`\n=== TABLE: ${t} (${cols.rows.length} columns) ===`);
    }
  }
  await client.end();
}

inspect().catch(console.error);
