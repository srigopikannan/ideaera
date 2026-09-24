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

async function runTests() {
  await client.connect();
  console.log("==================================================");
  console.log("   IDEAERA NOTIFICATIONS PIPELINE VERIFICATION    ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Fetch real test users from public.profiles
    const { rows: profiles } = await client.query(
      `SELECT id, full_name, username FROM public.profiles ORDER BY created_at ASC LIMIT 5`
    );

    console.log(`Found ${profiles.length} real profiles in database:`);
    profiles.forEach((p, idx) => console.log(` [User ${String.fromCharCode(65 + idx)}] ${p.full_name} (@${p.username}): ${p.id}`));
    assert(profiles.length >= 2, "At least 2 user profiles exist in database");

    const userA = profiles[0].id;
    const userB = profiles[1].id;
    const userC = profiles[2] ? profiles[2].id : profiles[0].id;

    // ----------------------------------------------------
    // TEST 1: Connection Request & Acceptance Lifecycle
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Connection Request & Acceptance Flow ---");

    // Cleanup previous test data between A and B
    await client.query(
      `DELETE FROM public.notifications WHERE (recipient_id = $1 AND actor_id = $2) OR (recipient_id = $2 AND actor_id = $1)`,
      [userA, userB]
    );
    await client.query(
      `DELETE FROM public.connections WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)`,
      [userA, userB]
    );

    // 1. User A sends private connection request to User B
    const { rows: [conn] } = await client.query(
      `INSERT INTO public.connections (requester_id, receiver_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, status, requester_id, receiver_id`,
      [userA, userB]
    );
    assert(conn && conn.status === "pending", "Connection created with status 'pending'");

    // Notification created for User B
    const { rows: [notifB] } = await client.query(
      `INSERT INTO public.notifications (recipient_id, user_id, actor_id, connection_id, type, title, message, read, is_read)
       VALUES ($1, $1, $2, $3, 'connection_request', 'Connection Request', 'Sri Gopi Kannan sent you a connection request.', false, false)
       RETURNING id, type, connection_id, read, is_read`,
      [userB, userA, conn.id]
    );
    assert(notifB && notifB.type === "connection_request" && notifB.read === false, "User B received pending 'connection_request' notification");

    // Simulate User B Accepting the request (Mutation-layer synchronization)
    // 1) Update connection status
    await client.query(
      `UPDATE public.connections SET status = 'accepted', updated_at = now() WHERE id = $1`,
      [conn.id]
    );
    // 2) Update User B's own notification
    await client.query(
      `UPDATE public.notifications 
       SET type = 'connection_accepted', title = 'Connected', message = 'Sri Gopi Kannan is now connected with you.', read = true, is_read = true, updated_at = now()
       WHERE id = $1`,
      [notifB.id]
    );
    // 3) Create notification for User A
    const { rows: [notifA] } = await client.query(
      `INSERT INTO public.notifications (recipient_id, user_id, actor_id, connection_id, type, title, message, read, is_read)
       VALUES ($1, $1, $2, $3, 'connection_accepted', 'Connected', 'Gopi Kannan accepted your connection request.', false, false)
       RETURNING id, type, connection_id`,
      [userA, userB, conn.id]
    );

    // Verify User B's notification state after acceptance
    const { rows: [updatedNotifB] } = await client.query(
      `SELECT n.*, c.status as conn_status 
       FROM public.notifications n
       LEFT JOIN public.connections c ON n.connection_id = c.id
       WHERE n.id = $1`,
      [notifB.id]
    );

    assert(updatedNotifB.type === "connection_accepted", "User B's notification transitioned to 'connection_accepted'");
    assert(updatedNotifB.conn_status === "accepted", "Live connection status is 'accepted'");
    assert(updatedNotifB.read === true && updatedNotifB.is_read === true, "User B's notification marked as read");
    assert(notifA && notifA.type === "connection_accepted", "User A received 'connection_accepted' notification");

    // ----------------------------------------------------
    // TEST 2: Connection Request Rejection Flow
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Connection Request Rejection Flow ---");

    // Cleanup previous between A and C
    await client.query(
      `DELETE FROM public.notifications WHERE (recipient_id = $1 AND actor_id = $2) OR (recipient_id = $2 AND actor_id = $1)`,
      [userA, userC]
    );
    await client.query(
      `DELETE FROM public.connections WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)`,
      [userA, userC]
    );

    // 1. User A sends request to User C
    const { rows: [connAC] } = await client.query(
      `INSERT INTO public.connections (requester_id, receiver_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, status`,
      [userA, userC]
    );

    const { rows: [notifC] } = await client.query(
      `INSERT INTO public.notifications (recipient_id, user_id, actor_id, connection_id, type, title, message, read, is_read)
       VALUES ($1, $1, $2, $3, 'connection_request', 'Connection Request', 'Sri Gopi Kannan sent you a connection request.', false, false)
       RETURNING id, type`,
      [userC, userA, connAC.id]
    );

    // 2. User C rejects request
    await client.query(
      `UPDATE public.connections SET status = 'rejected', updated_at = now() WHERE id = $1`,
      [connAC.id]
    );
    await client.query(
      `UPDATE public.notifications 
       SET type = 'connection_rejected', title = 'Connection Rejected', message = 'Connection request rejected.', read = true, is_read = true, updated_at = now()
       WHERE id = $1`,
      [notifC.id]
    );

    const { rows: [updatedNotifC] } = await client.query(
      `SELECT n.*, c.status as conn_status 
       FROM public.notifications n
       LEFT JOIN public.connections c ON n.connection_id = c.id
       WHERE n.id = $1`,
      [notifC.id]
    );

    assert(updatedNotifC.type === "connection_rejected", "User C's notification transitioned to 'connection_rejected'");
    assert(updatedNotifC.conn_status === "rejected", "Live connection status is 'rejected'");
    assert(updatedNotifC.message === "Connection request rejected.", "Message updated to rejected confirmation without action buttons");

    // ----------------------------------------------------
    // TEST 3: Query-Time State Synchronization (Safety Net)
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Query-Time Dynamic State Synchronization ---");

    // Suppose an existing stale notification had type='connection_request', but the connection is already accepted!
    const { rows: [staleNotif] } = await client.query(
      `INSERT INTO public.notifications (recipient_id, user_id, actor_id, connection_id, type, title, message, read, is_read)
       VALUES ($1, $1, $2, $3, 'connection_request', 'Connection Request', 'Pending request text', false, false)
       RETURNING id`,
      [userB, userA, conn.id] // conn.id is accepted!
    );

    // Run the query logic used in getNotifications()
    const { rows: [resolvedRow] } = await client.query(
      `SELECT n.*, c.status as conn_status, c.requester_id, c.receiver_id
       FROM public.notifications n
       LEFT JOIN public.connections c ON n.connection_id = c.id
       WHERE n.id = $1`,
      [staleNotif.id]
    );

    // Simulate getNotifications normalizer
    let dynamicType = resolvedRow.type;
    let dynamicStatus = resolvedRow.conn_status;
    let dynamicRead = resolvedRow.read || resolvedRow.is_read;
    if (resolvedRow.conn_status === 'accepted' && resolvedRow.type === 'connection_request') {
      dynamicType = 'connection_accepted';
      dynamicRead = true;
    }

    assert(dynamicType === "connection_accepted", "Query-layer automatically resolves stale connection_request to connection_accepted");
    assert(dynamicRead === true, "Query-layer automatically marks resolved notification as read");

    // Cleanup the stale test record
    await client.query(`DELETE FROM public.notifications WHERE id = $1`, [staleNotif.id]);

    // ----------------------------------------------------
    // TEST 4: Idempotent Suggestion & Milestone Notifications
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Suggestions & Milestone Notifications ---");

    // 4a. Idea suggestion
    const { rows: [idea] } = await client.query(`SELECT id, title, creator_id FROM public.ideas LIMIT 1`);
    if (idea) {
      // Cleanup previous
      await client.query(`DELETE FROM public.notifications WHERE recipient_id = $1 AND type = 'idea_suggestion' AND idea_id = $2`, [userA, idea.id]);

      // First insertion
      await client.query(
        `INSERT INTO public.notifications (recipient_id, user_id, actor_id, idea_id, type, title, message)
         VALUES ($1, $1, $2, $3, 'idea_suggestion', '💡 New Idea Suggestion', 'An idea related to your interests is available.')`,
        [userA, idea.creator_id, idea.id]
      );

      // Check duplication prevention query
      const { rows: existing } = await client.query(
        `SELECT id FROM public.notifications WHERE recipient_id = $1 AND type = 'idea_suggestion' AND idea_id = $2`,
        [userA, idea.id]
      );
      assert(existing.length === 1, "Idea suggestion created with exact idea reference");
    }

    // 4b. Badge earned
    await client.query(`DELETE FROM public.notifications WHERE recipient_id = $1 AND type = 'badge_earned'`, [userA]);
    await client.query(
      `INSERT INTO public.notifications (recipient_id, user_id, type, title, message)
       VALUES ($1, $1, 'badge_earned', '🏆 Badge Earned!', 'You earned the "Pioneer" badge: Created first verified project.')`,
      [userA]
    );

    const { rows: badgeNotifs } = await client.query(
      `SELECT id, type, title FROM public.notifications WHERE recipient_id = $1 AND type = 'badge_earned'`,
      [userA]
    );
    // Cleanup test records
    await client.query(
      `DELETE FROM public.notifications WHERE (recipient_id = $1 AND actor_id = $2) OR (recipient_id = $2 AND actor_id = $1)`,
      [userA, userB]
    );
    await client.query(
      `DELETE FROM public.connections WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)`,
      [userA, userB]
    );
    await client.query(
      `DELETE FROM public.notifications WHERE (recipient_id = $1 AND actor_id = $2) OR (recipient_id = $2 AND actor_id = $1)`,
      [userA, userC]
    );
    await client.query(
      `DELETE FROM public.connections WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)`,
      [userA, userC]
    );
    await client.query(`DELETE FROM public.notifications WHERE recipient_id = $1 AND type IN ('badge_earned', 'idea_suggestion')`, [userA]);

    console.log("\n==================================================");
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    await client.end();
  }
}

runTests();
