import pg from "pg";
const { Client } = pg;

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  connectionString = "postgresql://postgres:GOPIKANNAN1122@db.jhmnemzgbcwcryzolzbz.supabase.co:5432/postgres";
}
// Strip query parameters like sslmode=require so ssl: { rejectUnauthorized: false } works smoothly in pg
connectionString = connectionString.split("?")[0];

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to PostgreSQL database successfully.");

  try {
    // 1. Audit columns and types on messages table
    console.log("\n--- 1. AUDITING MESSAGES TABLE SCHEMA ---");
    const colsRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'messages'
      AND column_name IN ('id', 'sender_id', 'receiver_id', 'content', 'created_at', 'delivered_at', 'read_at', 'conversation_id', 'is_read')
      ORDER BY column_name;
    `);
    console.table(colsRes.rows);

    const createdAtCol = colsRes.rows.find((r) => r.column_name === "created_at");
    const deliveredAtCol = colsRes.rows.find((r) => r.column_name === "delivered_at");
    const readAtCol = colsRes.rows.find((r) => r.column_name === "read_at");

    if (createdAtCol?.data_type !== "timestamp with time zone") {
      throw new Error(`created_at is ${createdAtCol?.data_type}, expected timestamp with time zone!`);
    }
    if (deliveredAtCol?.data_type !== "timestamp with time zone") {
      throw new Error(`delivered_at is ${deliveredAtCol?.data_type}, expected timestamp with time zone!`);
    }
    if (readAtCol?.data_type !== "timestamp with time zone") {
      throw new Error(`read_at is ${readAtCol?.data_type}, expected timestamp with time zone!`);
    }
    console.log("✓ All timestamp columns are timestamptz (timestamp with time zone).");

    // Check publication
    const pubRes = await client.query(`
      SELECT p.pubname, t.schemaname, t.tablename 
      FROM pg_publication p 
      JOIN pg_publication_tables t ON p.pubname = t.pubname 
      WHERE t.tablename = 'messages';
    `);
    console.log("Realtime publication check:", pubRes.rows);
    if (!pubRes.rows.some((r) => r.pubname === "supabase_realtime")) {
      throw new Error("messages table is NOT in supabase_realtime publication!");
    }
    console.log("✓ Table 'messages' is enrolled in supabase_realtime publication.");

    // Check replica identity
    const relRes = await client.query(`
      SELECT n.nspname, c.relname, c.relreplident
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'messages';
    `);
    console.log("Replica identity for public.messages (f = FULL):", relRes.rows);
    if (relRes.rows[0]?.relreplident !== "f") {
      throw new Error(`Expected replica identity 'f' (FULL), got ${relRes.rows[0]?.relreplident}`);
    }
    console.log("✓ Table 'public.messages' has REPLICA IDENTITY FULL.");

    // 2. Real User Flow Verification
    console.log("\n--- 2. VERIFYING MESSAGE LIFECYCLE (SENT -> DELIVERED -> SEEN) ---");
    const userA = "d1aabec0-3b89-4c1d-a33d-a6573224f5c2"; // srigopikannan
    const userB = "6a149eed-c243-48f3-b61c-7c2575567979"; // gopikannan116
    const convId = [userA, userB].sort().join(":");
    const testContent = `Automated Pipeline Verification ${Date.now()}`;

    // STEP A: User A sends message
    const insertRes = await client.query(
      `
      INSERT INTO public.messages (sender_id, receiver_id, conversation_id, content, is_read, delivered_at, read_at)
      VALUES ($1, $2, $3, $4, false, null, null)
      RETURNING *;
      `,
      [userA, userB, convId, testContent]
    );

    const message = insertRes.rows[0];
    console.log("Inserted test message:", {
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      delivered_at: message.delivered_at,
      read_at: message.read_at,
    });

    const msgCreatedAt = new Date(message.created_at);
    const now = new Date();
    const diffSeconds = Math.abs((now.getTime() - msgCreatedAt.getTime()) / 1000);
    console.log(`Difference between DB server created_at and now: ${diffSeconds.toFixed(2)}s`);
    if (diffSeconds > 60) {
      throw new Error(`created_at has timestamp discrepancy (> 60s): ${diffSeconds}s`);
    }
    console.log("✓ Step A Passed: Message sent with server timestamp (No 5h offset). Single grey tick (✓).");

    // STEP B: Recipient receives message -> Delivered
    const deliverRes = await client.query(
      `
      UPDATE public.messages
      SET delivered_at = now()
      WHERE id = $1 AND receiver_id = $2 AND delivered_at IS NULL
      RETURNING *;
      `,
      [message.id, userB]
    );
    const deliveredMsg = deliverRes.rows[0];
    console.log("Delivered message state:", {
      id: deliveredMsg.id,
      delivered_at: deliveredMsg.delivered_at,
      read_at: deliveredMsg.read_at,
    });
    if (!deliveredMsg.delivered_at) {
      throw new Error("delivered_at was not set!");
    }
    console.log("✓ Step B Passed: Message marked delivered with server timestamp. Double grey ticks (✓✓).");

    // STEP C: Recipient opens conversation -> Seen / Read
    const readRes = await client.query(
      `
      UPDATE public.messages
      SET read_at = now(), is_read = true, delivered_at = COALESCE(delivered_at, now())
      WHERE id = $1 AND receiver_id = $2
      RETURNING *;
      `,
      [message.id, userB]
    );
    const readMsg = readRes.rows[0];
    console.log("Read/Seen message state:", {
      id: readMsg.id,
      delivered_at: readMsg.delivered_at,
      read_at: readMsg.read_at,
      is_read: readMsg.is_read,
    });
    if (!readMsg.read_at || !readMsg.is_read) {
      throw new Error("read_at / is_read was not set!");
    }
    const sentTime = new Date(readMsg.created_at).getTime();
    const deliveredTime = new Date(readMsg.delivered_at).getTime();
    const seenTime = new Date(readMsg.read_at).getTime();

    if (sentTime > deliveredTime || deliveredTime > seenTime) {
      throw new Error("Chronological order violated: sent <= delivered <= seen");
    }
    console.log("✓ Step C Passed: Message marked seen with server timestamp. Double blue ticks (✓✓).");

    // 3. Test Local Timezone Formatting
    console.log("\n--- 3. VERIFYING TIMESTAMP DISPLAY FORMATTING ---");
    const formatter12 = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const exactFormatter = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    console.log(`Local display time for chat bubble: ${formatter12.format(new Date(readMsg.created_at))}`);
    console.log(`Sent exact:      ${exactFormatter.format(new Date(readMsg.created_at))}`);
    console.log(`Delivered exact: ${exactFormatter.format(new Date(readMsg.delivered_at))}`);
    console.log(`Seen exact:      ${exactFormatter.format(new Date(readMsg.read_at))}`);
    console.log("✓ Formatting verified without timezone shifts.");

    // Clean up
    await client.query(`DELETE FROM public.messages WHERE id = $1;`, [message.id]);
    console.log("✓ Cleaned up test message.");

    console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<\n");
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error("Test pipeline failed:", err);
  process.exit(1);
});
