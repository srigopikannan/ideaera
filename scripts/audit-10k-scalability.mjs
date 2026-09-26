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
  console.log("=================================================");
  console.log("   IDEAERA - 10K SCALABILITY DATABASE AUDIT");
  console.log("=================================================");

  // 1. Tables and row counts and RLS
  console.log("\n--- 1. TABLES & ESTIMATED ROW COUNTS & RLS ---");
  const tables = await client.query(`
    SELECT c.relname as table_name, c.reltuples::bigint as row_count, c.relrowsecurity as rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);
  for (const t of tables.rows) {
    console.log(`  ${t.table_name.padEnd(30)} : ~${t.row_count} rows | RLS: ${t.rls_enabled}`);
  }

  // 2. Existing indexes
  console.log("\n--- 2. EXISTING INDEXES ---");
  const indexes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);
  console.log(`Total public indexes: ${indexes.rows.length}`);
  const indexMap = {};
  for (const idx of indexes.rows) {
    if (!indexMap[idx.tablename]) indexMap[idx.tablename] = [];
    indexMap[idx.tablename].push(idx.indexname);
  }
  for (const [tbl, list] of Object.entries(indexMap)) {
    console.log(`  ${tbl.padEnd(28)} : ${list.join(', ')}`);
  }

  // 3. Foreign keys without indexes
  console.log("\n--- 3. FOREIGN KEYS AUDIT ---");
  const fks = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);
  console.log(`Total Foreign Keys: ${fks.rows.length}`);
  for (const fk of fks.rows) {
    console.log(`  ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  }

  // 4. RLS policies
  console.log("\n--- 4. RLS POLICIES AUDIT ---");
  const rls = await client.query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  console.log(`Total RLS policies: ${rls.rows.length}`);
  for (const p of rls.rows) {
    console.log(`  ${p.tablename.padEnd(25)} [${p.cmd}] "${p.policyname}": USING (${p.qual})`);
  }

  // 5. Unique constraints (especially likes, connections, bookmarks)
  console.log("\n--- 5. UNIQUE CONSTRAINTS (Preventing duplicates & races) ---");
  const uniqueConstraints = await client.query(`
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
  `);
  for (const uc of uniqueConstraints.rows) {
    console.log(`  ${uc.table_name} [${uc.constraint_name}]: ${uc.column_name}`);
  }

  await client.end();
}

audit().catch(console.error);
