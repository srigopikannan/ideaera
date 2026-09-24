import pg from "pg";

let connectionString = (process.env.DATABASE_URL || "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres").split("?")[0];

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();

  const tables = ['bookmarks', 'idea_bookmarks', 'company_projects', 'company_applications', 'ideas'];
  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1 
      ORDER BY ordinal_position;
    `, [t]);
    console.log(`\n=== Table: ${t} ===`);
    console.table(res.rows);
  }

  // Also check RLS on companies and ideas
  const rlsRes = await client.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('companies', 'ideas', 'company_projects');
  `);
  console.log("\nRLS status:", rlsRes.rows);

  await client.end();
}

run().catch(console.error);
