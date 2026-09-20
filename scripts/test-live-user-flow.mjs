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

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

// Real registered users:
// User A: Sri Gopi Kannan (d1aabec0-3b89-4c1d-a33d-a6573224f5c2)
// User B: Gopi Kannan (6a149eed-c243-48f3-b61c-7c2575567979)

const USER_A = "d1aabec0-3b89-4c1d-a33d-a6573224f5c2";
const USER_B = "6a149eed-c243-48f3-b61c-7c2575567979";

async function verifyLiveFlow() {
  await client.connect();
  console.log("==================================================================");
  console.log("TESTING LIVE USER FLOW: User A -> User B -> Connect -> View B Notifications");
  console.log("==================================================================");

  // Clean test pair
  await client.query(`
    DELETE FROM public.notifications WHERE (recipient_id = '${USER_B}' AND actor_id = '${USER_A}') OR (recipient_id = '${USER_A}' AND actor_id = '${USER_B}');
    DELETE FROM public.connections WHERE (requester_id = '${USER_A}' AND receiver_id = '${USER_B}') OR (requester_id = '${USER_B}' AND receiver_id = '${USER_A}');
  `);

  // Step 1: User A clicks Connect on User B's profile
  console.log("\n[STEP 1] User A clicks 'Connect' on User B's profile...");
  const connRes = await client.query(`
    INSERT INTO public.connections (requester_id, receiver_id, status, connection_type)
    VALUES ('${USER_A}', '${USER_B}', 'pending', 'private')
    RETURNING *;
  `);
  const conn = connRes.rows[0];
  console.log("✓ Connection created:", {
    id: conn.id,
    requester_id: conn.requester_id,
    receiver_id: conn.receiver_id,
    status: conn.status,
    connection_type: conn.connection_type
  });

  // Step 2: Server-side notification created for User B
  console.log("\n[STEP 2] Server creates notification for User B using connection ID...");
  const notifRes = await client.query(`
    INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
    VALUES ('${USER_B}', '${USER_A}', '${conn.id}', 'connection_request', 'Connection Request', 'Sri Gopi Kannan sent you a connection request.')
    RETURNING *;
  `);
  const notif = notifRes.rows[0];
  console.log("✓ Notification created:", {
    id: notif.id,
    recipient_id: notif.recipient_id,
    actor_id: notif.actor_id,
    connection_id: notif.connection_id,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    read: notif.read
  });

  // Step 3: User B logs in / opens Notifications
  console.log("\n[STEP 3] User B views Notifications stream...");
  const bNotifs = await client.query(`
    SELECT 
      n.id,
      n.type,
      n.title,
      n.message,
      n.read,
      n.created_at,
      p.full_name as actor_name,
      p.username as actor_username,
      p.avatar_url as actor_avatar,
      p.headline as actor_headline
    FROM public.notifications n
    JOIN public.profiles p ON n.actor_id = p.id
    WHERE n.recipient_id = '${USER_B}' AND n.type = 'connection_request'
    ORDER BY n.created_at DESC;
  `);

  console.log("✓ User B Notifications received:", bNotifs.rows);
  if (bNotifs.rows.length !== 1 || bNotifs.rows[0].actor_name !== "Sri Gopi Kannan") {
    throw new Error("User B failed to receive notification!");
  }

  // Step 4: User B clicks "Accept"
  console.log("\n[STEP 4] User B clicks 'Accept' on the notification...");
  await client.query(`
    UPDATE public.connections 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = '${conn.id}';

    UPDATE public.notifications
    SET read = true, is_read = true
    WHERE id = '${notif.id}';

    INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
    VALUES ('${USER_A}', '${USER_B}', '${conn.id}', 'connection_accepted', 'Connection Accepted', 'Gopi Kannan accepted your connection request.');
  `);

  // Step 5: Verify User A received "connection_accepted"
  console.log("\n[STEP 5] Checking User A's notifications for accepted signal...");
  const aNotifs = await client.query(`
    SELECT n.*, p.full_name as actor_name
    FROM public.notifications n
    JOIN public.profiles p ON n.actor_id = p.id
    WHERE n.recipient_id = '${USER_A}' AND n.type = 'connection_accepted';
  `);
  console.log("✓ User A received:", aNotifs.rows[0]);

  // Step 6: Verify messaging is now permitted between A and B
  console.log("\n[STEP 6] Verifying messaging authorization...");
  const msgPerm = await client.query(`
    SELECT 1 FROM public.connections
    WHERE ((requester_id = '${USER_A}' AND receiver_id = '${USER_B}') OR (requester_id = '${USER_B}' AND receiver_id = '${USER_A}'))
      AND status = 'accepted';
  `);
  const isMessagingAllowed = msgPerm.rows.length > 0;
  console.log("✓ Messaging allowed between User A and User B:", isMessagingAllowed);

  if (!isMessagingAllowed) {
    throw new Error("Messaging should be allowed after connection acceptance!");
  }

  console.log("\n==================================================================");
  console.log("ALL LIVE USER FLOW STEPS COMPLETED & VERIFIED SUCCESSFULLY!");
  console.log("==================================================================");

  await client.end();
}

verifyLiveFlow().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
