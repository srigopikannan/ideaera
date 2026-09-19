import pg from "pg";
const { Client } = pg;

import { BATCH_1 } from "./data/batch1.mjs";
import { BATCH_2 } from "./data/batch2.mjs";
import { BATCH_3 } from "./data/batch3.mjs";
import { BATCH_4 } from "./data/batch4.mjs";
import fs from "fs";

let connectionString = process.env.DATABASE_URL;
if (!connectionString && fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const m = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) connectionString = m[1];
}
if (!connectionString && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  const m = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) connectionString = m[1];
}

export function normalizeName(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function runSeed() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL for Master Colleges Seeding...");

    const allBatches = [...BATCH_1, ...BATCH_2, ...BATCH_3, ...BATCH_4];
    console.log(`Raw batch entries count: ${allBatches.length}`);

    // Deduplicate on lowercase official name
    const seenNames = new Set();
    const uniqueColleges = [];
    for (const item of allBatches) {
      const key = item.name.trim().toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueColleges.push(item);
      }
    }

    console.log(`Unique verified institutions to insert/update: ${uniqueColleges.length}`);

    let inserted = 0;
    let updated = 0;

    for (const c of uniqueColleges) {
      const norm = normalizeName(c.name);

      const query = `
        INSERT INTO public.colleges (
          name,
          normalized_name,
          city,
          district,
          state,
          state_id,
          country,
          country_id,
          university,
          institution_type,
          is_verified,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, now())
        ON CONFLICT (name) DO UPDATE SET
          normalized_name = EXCLUDED.normalized_name,
          city = EXCLUDED.city,
          district = EXCLUDED.district,
          state = EXCLUDED.state,
          state_id = EXCLUDED.state_id,
          university = EXCLUDED.university,
          institution_type = EXCLUDED.institution_type,
          updated_at = now()
        RETURNING (xmax = 0) AS was_inserted;
      `;

      const values = [
        c.name.trim(),
        norm,
        c.city.trim(),
        c.district.trim(),
        "Tamil Nadu",
        "IN-TN",
        "India",
        "IN",
        c.university || null,
        c.institution_type || null
      ];

      const res = await client.query(query, values);
      if (res.rows[0]?.was_inserted) {
        inserted++;
      } else {
        updated++;
      }
    }

    console.log(`\n=== Seeding Finished ===`);
    console.log(`Newly Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);

    // Verification queries
    const countRes = await client.query(`
      SELECT count(*) as total, count(DISTINCT district) as district_count 
      FROM public.colleges 
      WHERE state_id = 'IN-TN';
    `);
    console.log("\nDatabase Stats for Tamil Nadu:");
    console.log(`Total colleges: ${countRes.rows[0].total}`);
    console.log(`Districts covered: ${countRes.rows[0].district_count}`);

    const sampleRes = await client.query(`
      SELECT id, name, city, district, institution_type 
      FROM public.colleges 
      WHERE state_id = 'IN-TN' 
      ORDER BY name 
      LIMIT 10;
    `);
    console.log("\nSample 10 colleges alphabetical:");
    console.table(sampleRes.rows);

  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
