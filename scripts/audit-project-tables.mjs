import pg from "pg";

let dbUrl = process.env.DATABASE_URL || "";
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function inspect() {
  await client.connect();

  console.log("--- RLS Status on Project Tables ---");
  const { rows: rlsStatus } = await client.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('projects', 'tasks', 'milestones', 'project_members', 'ideas', 'profiles')
  `);
  console.table(rlsStatus);

  console.log("--- RLS Policies on Project Tables ---");
  const { rows: rls } = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('projects', 'tasks', 'milestones', 'project_members', 'ideas', 'profiles')
    ORDER BY tablename, policyname;
  `);
  console.table(rls);

  console.log("\n--- Constraints on Project Tables ---");
  const { rows: fks } = await client.query(`
    SELECT conrelid::regclass as relname, conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid IN ('projects'::regclass, 'tasks'::regclass, 'milestones'::regclass, 'project_members'::regclass)
    ORDER BY conrelid, conname;
  `);
  console.table(fks);

  await client.end();
}

inspect().catch(console.error);
