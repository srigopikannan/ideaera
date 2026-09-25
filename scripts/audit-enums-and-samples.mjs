import pg from "pg";

let dbUrl = "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres";
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function audit() {
  await client.connect();

  console.log("--- Enums in DB ---");
  const enums = await client.query(`
    SELECT t.typname, e.enumlabel 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    ORDER BY t.typname, e.enumsortorder;
  `);
  console.log(enums.rows);

  console.log("\n--- Profiles Availability Sample ---");
  const profSample = await client.query("SELECT id, username, availability FROM profiles LIMIT 5");
  console.log(profSample.rows);

  console.log("\n--- Projects Sample ---");
  const projSample = await client.query("SELECT * FROM projects LIMIT 2");
  console.log(projSample.rows);

  console.log("\n--- Tasks Sample ---");
  const taskSample = await client.query("SELECT * FROM tasks LIMIT 2");
  console.log(taskSample.rows);

  await client.end();
}

audit().catch(console.error);
