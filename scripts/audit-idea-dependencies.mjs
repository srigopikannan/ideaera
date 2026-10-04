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

async function run() {
  await client.connect();
  console.log("=== AUDITING FOREIGN KEYS ON public.ideas ===");

  // Find all foreign key constraints referencing public.ideas(id)
  const fks = await client.query(`
    SELECT
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON rc.unique_constraint_name = ccu.constraint_name
    WHERE ccu.table_name = 'ideas' AND ccu.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `);

  console.log(`Found ${fks.rows.length} foreign key constraints referencing public.ideas:`);
  for (const r of fks.rows) {
    console.log(`- ${r.table_name}.${r.column_name} (FK: ${r.constraint_name}) -> ON DELETE ${r.delete_rule}`);
  }

  // Also check all tables with an idea_id column in public schema
  console.log("\n=== ALL TABLES WITH idea_id COLUMN ===");
  const cols = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name IN ('idea_id', 'source_idea_id', 'target_idea_id')
    ORDER BY table_name;
  `);
  for (const c of cols.rows) {
    console.log(`- ${c.table_name}.${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`);
  }

  const fnDef = await client.query(`
    SELECT pg_get_functiondef('public.evaluate_and_sync_user_badges(uuid)'::regprocedure) AS def;
  `);
  console.log("\n=== FUNCTION DEF evaluate_and_sync_user_badges (first 1000 chars) ===");
  console.log(fnDef.rows[0].def.slice(0, 1000));

  const ideaCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ideas'
    ORDER BY ordinal_position;
  `);
  for (const c of ideaCols.rows) {
    console.log(`- ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable}, default: ${c.column_default})`);
  }

  console.log("\n=== RLS POLICIES ON public.ideas ===");
  const pols = await client.query(`
    SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE tablename = 'ideas';
  `);
  for (const p of pols.rows) {
    console.log(`- ${p.policyname} | ${p.cmd} | qual: ${p.qual} | with_check: ${p.with_check}`);
  }


  const allTables = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
  `);
  console.log(allTables.rows.map(r => r.table_name));

  // Check any tables with name containing 'report', 'moderation', 'copy', 'similar', 'dispute'
  console.log("\n=== RELEVANT REPORT/MODERATION TABLES ===");
  const repTables = allTables.rows.filter(r => /report|moderat|similar|copy|dispute|flag|audit/i.test(r.table_name));
  console.log(repTables.map(r => r.table_name));

  // For any of these tables, inspect columns
  for (const t of repTables) {
    const colRes = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1;
    `, [t.table_name]);
    console.log(`\nTable ${t.table_name}:`, colRes.rows.map(c => c.column_name).join(', '));
  }


  await client.end();
}

run().catch(console.error);
