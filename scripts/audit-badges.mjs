import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "",
  ssl: { rejectUnauthorized: false },
});

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'project_role'
    ORDER BY e.enumsortorder;
  `);
  console.log("project_role enum values:", res.rows.map(r => r.enumlabel));

  // Also check if there's a user with 0 ideas and 0 projects
  const zeroUsers = await client.query(`
    SELECT p.id, p.full_name
    FROM public.profiles p
    LEFT JOIN public.ideas i ON p.id = i.creator_id
    LEFT JOIN public.projects pr ON p.id = pr.owner_id
    WHERE i.id IS NULL AND pr.id IS NULL
    LIMIT 5;
  `);
  console.log("Zero activity users:", zeroUsers.rows);

  await client.end();
}
check().catch(console.error);
