import pg from "pg";

let dbUrl = "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres";
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function inspect() {
  await client.connect();
  const res = await client.query(`
    SELECT pg_get_functiondef(oid) as def
    FROM pg_proc
    WHERE proname = 'handle_notification_sync'
  `);
  console.log("handle_notification_sync def:\n", res.rows[0]?.def);
  await client.end();
}
inspect().catch(console.error);
