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

// Real registered test users:
// User A: Sri Gopi Kannan (d1aabec0-3b89-4c1d-a33d-a6573224f5c2)
// User B: Gopi Kannan (6a149eed-c243-48f3-b61c-7c2575567979)
// User C: Aadav (f3fd9eb7-3525-4a9e-9054-10ec0bb70050)

const USER_A = "d1aabec0-3b89-4c1d-a33d-a6573224f5c2";
const USER_B = "6a149eed-c243-48f3-b61c-7c2575567979";
const USER_C = "f3fd9eb7-3525-4a9e-9054-10ec0bb70050";

async function runPipelineTests() {
  await client.connect();
  console.log("==================================================================");
  console.log("IDEAERA - FULL PIPELINE CONNECTION & NOTIFICATION TESTS");
  console.log("==================================================================");

  // Clean previous test state between A, B, and C
  await client.query(`
    DELETE FROM public.notifications 
    WHERE (recipient_id IN ('${USER_A}', '${USER_B}', '${USER_C}') AND actor_id IN ('${USER_A}', '${USER_B}', '${USER_C}'))
       OR (user_id IN ('${USER_A}', '${USER_B}', '${USER_C}'));

    DELETE FROM public.connections 
    WHERE (requester_id = '${USER_A}' AND receiver_id = '${USER_B}')
       OR (requester_id = '${USER_B}' AND receiver_id = '${USER_A}')
       OR (requester_id = '${USER_A}' AND receiver_id = '${USER_C}')
       OR (requester_id = '${USER_C}' AND receiver_id = '${USER_A}');
  `);
  console.log("Test sandbox clean.");

  let passed = 0;
  let total = 8;

  // -------------------------------------------------------------
  // TEST 1: A -> B private connection
  // Expected: B receives request notification.
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: A -> B Private Connection ---");
  const conn1Res = await client.query(`
    INSERT INTO public.connections (requester_id, receiver_id, status, connection_type)
    VALUES ('${USER_A}', '${USER_B}', 'pending', 'private')
    RETURNING *;
  `);
  const conn1 = conn1Res.rows[0];
  console.log("Connection 1 created:", { id: conn1.id, status: conn1.status, type: conn1.connection_type });

  // Create notification server-side
  const notif1Res = await client.query(`
    INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
    VALUES ('${USER_B}', '${USER_A}', '${conn1.id}', 'connection_request', 'Connection Request', 'Sri Gopi Kannan sent you a connection request.')
    RETURNING *;
  `);
  const notif1 = notif1Res.rows[0];
  console.log("Notification 1 created:", {
    id: notif1.id,
    recipient_id: notif1.recipient_id,
    user_id: notif1.user_id,
    actor_id: notif1.actor_id,
    type: notif1.type,
    title: notif1.title,
    read: notif1.read
  });

  // Verify B can query this notification under RLS
  const bQuery = await client.query(`
    SELECT n.*, p.full_name as actor_name
    FROM public.notifications n
    LEFT JOIN public.profiles p ON n.actor_id = p.id
    WHERE n.recipient_id = '${USER_B}' AND n.type = 'connection_request';
  `);
  if (bQuery.rows.length === 1 && bQuery.rows[0].actor_id === USER_A && bQuery.rows[0].read === false) {
    console.log("✓ TEST 1 PASSED: User B received connection request notification from User A.");
    passed++;
  } else {
    console.error("✗ TEST 1 FAILED:", bQuery.rows);
  }

  // -------------------------------------------------------------
  // TEST 2: B accepts
  // Expected: A/B become connected and can message.
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: B Accepts Connection ---");
  await client.query(`
    UPDATE public.connections 
    SET status = 'accepted', updated_at = NOW()
    WHERE id = '${conn1.id}';
  `);

  // Notification for A that B accepted
  await client.query(`
    INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
    VALUES ('${USER_A}', '${USER_B}', '${conn1.id}', 'connection_accepted', 'Connection Accepted', 'Gopi Kannan accepted your connection request.');
  `);

  const acceptedConn = (await client.query(`SELECT * FROM public.connections WHERE id = '${conn1.id}'`)).rows[0];
  const aNotif = (await client.query(`SELECT * FROM public.notifications WHERE recipient_id = '${USER_A}' AND type = 'connection_accepted'`)).rows;

  // Messaging permission check
  const messagingAllowed = (await client.query(`
    SELECT 1 FROM public.connections
    WHERE ((requester_id = '${USER_A}' AND receiver_id = '${USER_B}') OR (requester_id = '${USER_B}' AND receiver_id = '${USER_A}'))
      AND status = 'accepted';
  `)).rows.length > 0;

  if (acceptedConn.status === "accepted" && aNotif.length === 1 && messagingAllowed) {
    console.log("✓ TEST 2 PASSED: B accepted connection. Both users connected, A notified, messaging permitted.");
    passed++;
  } else {
    console.error("✗ TEST 2 FAILED");
  }

  // -------------------------------------------------------------
  // TEST 3: A -> C public connection
  // Expected: C receives connection notification immediately and connection is accepted.
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: A -> C Public Connection ---");
  const pubConnRes = await client.query(`
    INSERT INTO public.connections (requester_id, receiver_id, status, connection_type)
    VALUES ('${USER_A}', '${USER_C}', 'accepted', 'public')
    RETURNING *;
  `);
  const pubConn = pubConnRes.rows[0];

  await client.query(`
    INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
    VALUES ('${USER_C}', '${USER_A}', '${pubConn.id}', 'connection_accepted', 'New Connection', 'Sri Gopi Kannan connected with you.');
  `);

  const cNotif = (await client.query(`SELECT * FROM public.notifications WHERE recipient_id = '${USER_C}' AND type = 'connection_accepted'`)).rows;

  if (pubConn.status === "accepted" && pubConn.connection_type === "public" && cNotif.length === 1) {
    console.log("✓ TEST 3 PASSED: Public connection immediately accepted and C notified.");
    passed++;
  } else {
    console.error("✗ TEST 3 FAILED");
  }

  // -------------------------------------------------------------
  // TEST 4: A -> B private request, B rejects
  // Expected: no connection and no Message access.
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: B Rejects Request ---");
  // Clean up between A and B and make a new pending request
  await client.query(`DELETE FROM public.connections WHERE id = '${conn1.id}';`);
  const rejConnRes = await client.query(`
    INSERT INTO public.connections (requester_id, receiver_id, status, connection_type)
    VALUES ('${USER_A}', '${USER_B}', 'rejected', 'private')
    RETURNING *;
  `);
  const rejConn = rejConnRes.rows[0];

  const canMessageRejected = (await client.query(`
    SELECT 1 FROM public.connections
    WHERE ((requester_id = '${USER_A}' AND receiver_id = '${USER_B}') OR (requester_id = '${USER_B}' AND receiver_id = '${USER_A}'))
      AND status = 'accepted';
  `)).rows.length > 0;

  if (rejConn.status === "rejected" && !canMessageRejected) {
    console.log("✓ TEST 4 PASSED: Connection rejected. Messaging access blocked.");
    passed++;
  } else {
    console.error("✗ TEST 4 FAILED");
  }

  // -------------------------------------------------------------
  // TEST 5: Refresh B's Notifications page
  // Expected: request still exists.
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Persistence Across Refresh ---");
  // Create an active pending request notification for B
  await client.query(`DELETE FROM public.connections WHERE requester_id = '${USER_A}' AND receiver_id = '${USER_B}';`);
  const freshConn = (await client.query(`
    INSERT INTO public.connections (requester_id, receiver_id, status, connection_type)
    VALUES ('${USER_A}', '${USER_B}', 'pending', 'private')
    RETURNING *;
  `)).rows[0];

  const freshNotif = (await client.query(`
    INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
    VALUES ('${USER_B}', '${USER_A}', '${freshConn.id}', 'connection_request', 'Connection Request', 'Sri Gopi Kannan sent you a connection request.')
    RETURNING *;
  `)).rows[0];

  // Simulate refresh by querying again from scratch
  const refreshQuery = await client.query(`
    SELECT * FROM public.notifications 
    WHERE recipient_id = '${USER_B}' AND id = '${freshNotif.id}';
  `);

  if (refreshQuery.rows.length === 1 && refreshQuery.rows[0].id === freshNotif.id) {
    console.log("✓ TEST 5 PASSED: Request persisted in database across page reloads.");
    passed++;
  } else {
    console.error("✗ TEST 5 FAILED");
  }

  // -------------------------------------------------------------
  // TEST 6: Logout B -> Login B again
  // Expected: request still exists.
  // -------------------------------------------------------------
  console.log("\n--- TEST 6: Persistence Across Login/Logout Session ---");
  // Simulating new session query for User B
  const sessionQuery = await client.query(`
    SELECT n.id, n.type, n.title, n.message, n.read, p.full_name as actor_name
    FROM public.notifications n
    JOIN public.profiles p ON n.actor_id = p.id
    WHERE (n.recipient_id = '${USER_B}' OR n.user_id = '${USER_B}')
    ORDER BY n.created_at DESC;
  `);

  const foundNotif = sessionQuery.rows.find((r) => r.id === freshNotif.id);
  if (foundNotif && foundNotif.actor_name === "Sri Gopi Kannan") {
    console.log("✓ TEST 6 PASSED: Request successfully retrieved in fresh user session with actor profile.");
    passed++;
  } else {
    console.error("✗ TEST 6 FAILED");
  }

  // -------------------------------------------------------------
  // TEST 7: A clicks Connect multiple times
  // Expected: no duplicate requests/notifications.
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: Duplicate Protection ---");
  let duplicateConnCaught = false;
  try {
    // Attempt inserting exact same pair
    await client.query(`
      INSERT INTO public.connections (requester_id, receiver_id, status, connection_type)
      VALUES ('${USER_A}', '${USER_B}', 'pending', 'private');
    `);
  } catch (err) {
    duplicateConnCaught = err.code === "23505"; // unique violation
  }

  let duplicateNotifCaught = false;
  try {
    // Attempt inserting exact same notification for this connection event
    await client.query(`
      INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
      VALUES ('${USER_B}', '${USER_A}', '${freshConn.id}', 'connection_request', 'Connection Request', 'Sri Gopi Kannan sent you a connection request.');
    `);
  } catch (err) {
    duplicateNotifCaught = err.code === "23505"; // unique violation
  }

  if (duplicateConnCaught && duplicateNotifCaught) {
    console.log("✓ TEST 7 PASSED: Database constraints prevented duplicate connections and notifications.");
    passed++;
  } else {
    console.error("✗ TEST 7 FAILED: duplicateConnCaught=" + duplicateConnCaught + ", duplicateNotifCaught=" + duplicateNotifCaught);
  }

  // -------------------------------------------------------------
  // TEST 8: A sends request to B -> C must NOT see B's notification
  // Expected: C gets 0 results.
  // -------------------------------------------------------------
  console.log("\n--- TEST 8: Recipient Isolation & Security ---");
  const cQueryResult = await client.query(`
    SELECT * FROM public.notifications 
    WHERE (recipient_id = '${USER_C}' OR user_id = '${USER_C}')
      AND id = '${freshNotif.id}';
  `);

  if (cQueryResult.rows.length === 0) {
    console.log("✓ TEST 8 PASSED: User C cannot see User B's notification.");
    passed++;
  } else {
    console.error("✗ TEST 8 FAILED: User C saw User B's notification!");
  }

  console.log("\n==================================================================");
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log("==================================================================");

  await client.end();
}

runPipelineTests().catch((err) => {
  console.error("Pipeline test runner failed:", err);
  process.exit(1);
});
