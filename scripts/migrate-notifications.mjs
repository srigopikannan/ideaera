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

async function migrate() {
  await client.connect();
  console.log("=== NOTIFICATIONS MIGRATION START ===");

  try {
    // 1. Add missing columns to public.notifications if not present
    console.log("1. Adding columns if missing to public.notifications...");
    await client.query(`
      ALTER TABLE public.notifications
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
        ADD COLUMN IF NOT EXISTS idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
    `);

    // 2. Add performance indexes
    console.log("2. Adding performance indexes on notifications...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
        ON public.notifications (recipient_id, is_read, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_connection_id 
        ON public.notifications (connection_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_idea_id 
        ON public.notifications (idea_id);
    `);

    // 3. Migrate existing stale connection notifications:
    // Any notification where type = 'connection_request' but the connection is already accepted
    console.log("3. Migrating stale 'connection_request' notifications where connection is already accepted...");
    const acceptRes = await client.query(`
      UPDATE public.notifications n
      SET 
        type = 'connection_accepted',
        title = 'Connected',
        message = COALESCE(
          (SELECT p.full_name || ' is now connected with you.' FROM public.profiles p WHERE p.id = n.actor_id),
          'Connection request accepted.'
        ),
        read = true,
        is_read = true,
        updated_at = now()
      FROM public.connections c
      WHERE n.connection_id = c.id
        AND n.type = 'connection_request'
        AND c.status = 'accepted';
    `);
    console.log(`Updated ${acceptRes.rowCount} stale accepted connection notifications.`);

    // Any notification where type = 'connection_request' but the connection is rejected
    console.log("4. Migrating stale 'connection_request' notifications where connection is rejected...");
    const rejectRes = await client.query(`
      UPDATE public.notifications n
      SET 
        type = 'connection_rejected',
        title = 'Connection Rejected',
        message = 'Connection request rejected.',
        read = true,
        is_read = true,
        updated_at = now()
      FROM public.connections c
      WHERE n.connection_id = c.id
        AND n.type = 'connection_request'
        AND c.status = 'rejected';
    `);
    console.log(`Updated ${rejectRes.rowCount} stale rejected connection notifications.`);

    // 5. Verify notifications count and sample
    const notifs = await client.query(`
      SELECT n.id, n.type, n.title, n.message, n.is_read, c.status as connection_status
      FROM public.notifications n
      LEFT JOIN public.connections c ON n.connection_id = c.id
      ORDER BY n.created_at DESC;
    `);
    console.log("\n=== UPDATED NOTIFICATIONS IN DATABASE ===");
    console.table(notifs.rows);

    console.log("\nMigration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);
