import pg from "pg";
import fs from "fs";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const m = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) dbUrl = m[1];
}
if (!dbUrl && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  const m = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) dbUrl = m[1];
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function clean() {
  await client.connect();

  // Delete all stale mock/unverified rows that still have 1970 epoch
  const delRes = await client.query(`
    DELETE FROM public.hackathons
    WHERE start_date <= '1970-01-02 00:00:00' OR end_date <= '1970-01-02 00:00:00';
  `);
  console.log(`Deleted ${delRes.rowCount} stale 1970-epoch records from database.`);

  const countRes = await client.query(`
    SELECT count(*) as total,
           count(start_date) as with_start_date,
           count(end_date) as with_end_date,
           count(registration_deadline) as with_deadline
    FROM public.hackathons;
  `);
  console.log("Current hackathons in database:", countRes.rows[0]);

  await client.end();
}

clean().catch(console.error);
