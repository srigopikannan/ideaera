import pg from "pg";

const connectionString = "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres";

async function audit() {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("=== NOTIFICATIONS TABLE SCHEMA ===");
  const notifCols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notifications' 
    ORDER BY ordinal_position;
  `);
  console.table(notifCols.rows);

  console.log("\n=== CONNECTIONS TABLE SCHEMA ===");
  const connCols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'connections' 
    ORDER BY ordinal_position;
  `);
  console.table(connCols.rows);

  console.log("\n=== NOTIFICATIONS SAMPLE DATA ===");
  const notifSample = await client.query(`SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 5;`);
  console.log(JSON.stringify(notifSample.rows, null, 2));

  console.log("\n=== CONNECTIONS SAMPLE DATA ===");
  const connSample = await client.query(`SELECT * FROM public.connections ORDER BY created_at DESC LIMIT 5;`);
  console.log(JSON.stringify(connSample.rows, null, 2));

  console.log("\n=== NOTIFICATIONS CONSTRAINTS & INDEXES ===");
  const constraints = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' AND conrelid = 'public.notifications'::regclass;
  `);
  console.table(constraints.rows);

  console.log("\n=== NOTIFICATIONS RLS POLICIES ===");
  const notifPolicies = await client.query(`
    SELECT policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'notifications';
  `);
  console.table(notifPolicies.rows);

  console.log("\n=== CONNECTIONS RLS POLICIES ===");
  const connPolicies = await client.query(`
    SELECT policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'connections';
  `);
  console.table(connPolicies.rows);

  await client.end();
}

audit().catch(console.error);
