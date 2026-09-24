import pg from "pg";

let connectionString = process.env.DATABASE_URL || "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres";
connectionString = connectionString.split("?")[0];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL successfully.");

  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log("Tables in public schema:", tablesRes.rows.map(r => r.table_name));

  // Inspect companies columns
  const compCols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'companies'
    ORDER BY ordinal_position;
  `);
  console.log("\nCompanies table columns:");
  console.table(compCols.rows);

  // Existing companies data count and sample
  const compData = await client.query(`SELECT id, name, slug, industry, location, website_url FROM public.companies;`);
  console.log("\nExisting companies count:", compData.rows.length);
  console.table(compData.rows);

  // Inspect ideas columns
  const ideaCols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ideas'
    ORDER BY ordinal_position;
  `);
  console.log("\nIdeas table columns:");
  console.table(ideaCols.rows);

  // Any problem/challenge tables?
  const problemTables = tablesRes.rows.filter(r => r.table_name.includes('problem') || r.table_name.includes('challenge'));
  console.log("\nExisting problem/challenge tables:", problemTables);

  await client.end();
}

run().catch(console.error);
