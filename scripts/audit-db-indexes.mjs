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

async function auditIndexes() {
  await client.connect();
  console.log("=== SUPABASE DATABASE INDEX AUDIT ===");

  const { rows } = await client.query(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  console.log(`Found ${rows.length} indexes in public schema:`);
  const byTable = {};
  rows.forEach(r => {
    if (!byTable[r.tablename]) byTable[r.tablename] = [];
    byTable[r.tablename].push(r.indexname);
  });

  for (const [table, idxs] of Object.entries(byTable)) {
    console.log(`\nTable [${table}]:`);
    idxs.forEach(i => console.log(`  - ${i}`));
  }

  await client.end();
}

auditIndexes().catch(console.error);
