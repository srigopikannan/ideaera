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

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();

console.log("Applying profile columns migration...");

await client.query(`
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT false;

  UPDATE public.profiles
  SET 
    city = split_part(location, ',', 1),
    state = trim(split_part(location, ',', 2)),
    country = COALESCE(nullif(trim(split_part(location, ',', 3)), ''), 'India')
  WHERE location IS NOT NULL AND city IS NULL;
`);

const res = await client.query('SELECT id, full_name, city, state, country, location FROM profiles');
console.log('Updated profiles:', res.rows);

console.log("Profile columns migrated successfully.");
await client.end();
