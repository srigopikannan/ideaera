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

async function test() {
  await client.connect();

  console.log("--- Testing Zero Activity User ---");
  const res1 = await client.query("SELECT public.evaluate_and_award_user_badges($1)", ["d1aabec0-3b89-4c1d-a33d-a6573224f5c2"]);
  console.log("Zero activity result:", res1.rows[0].evaluate_and_award_user_badges);

  console.log("\n--- Testing 1-Idea User ---");
  const res2 = await client.query("SELECT public.evaluate_and_award_user_badges($1)", ["f3fd9eb7-3525-4a9e-9054-10ec0bb70050"]);
  console.log("1-Idea user result:", res2.rows[0].evaluate_and_award_user_badges);

  console.log("\n--- Testing Idempotency (Repeat) ---");
  const res3 = await client.query("SELECT public.evaluate_and_award_user_badges($1)", ["f3fd9eb7-3525-4a9e-9054-10ec0bb70050"]);
  console.log("Repeat result:", res3.rows[0].evaluate_and_award_user_badges);

  const userBadges = await client.query("SELECT * FROM public.user_badges");
  console.log("\nUser badges table rows:", userBadges.rows);

  const notifs = await client.query("SELECT id, user_id, type, title, message FROM public.notifications WHERE type = 'badge_earned'");
  console.log("\nBadge earned notifications:", notifs.rows);

  await client.end();
}

test().catch(console.error);
