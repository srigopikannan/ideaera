import pg from "pg";
import fs from "fs";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(".env")) {
  const m = fs.readFileSync(".env", "utf8").match(/DATABASE_URL=["']?([^"'\r\n]+)/);
  if (m) dbUrl = m[1];
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function testRlsAsUser() {
  await client.connect();

  const userA = "d1aabec0-3b89-4c1d-a33d-a6573224f5c2";
  const userB = "6a149eed-c243-48f3-b61c-7c2575567979";

  console.log("=== SIMULATING AUTHENTICATED USER A IN POSTGRES WITH RLS ===");
  // Set role to authenticated and auth.uid() to userA
  await client.query("BEGIN;");
  await client.query("SET LOCAL ROLE authenticated;");
  await client.query(`SET LOCAL "request.jwt.claim.sub" = '${userA}';`);

  // Test 1: User A creates connection to User B
  console.log("Test 1: User A inserts connection to User B...");
  try {
    const connRes = await client.query(`
      INSERT INTO public.connections (requester_id, receiver_id, status, connection_type)
      VALUES ('${userA}', '${userB}', 'pending', 'private')
      RETURNING *;
    `);
    console.log("Connection inserted successfully:", connRes.rows[0]);
    const connId = connRes.rows[0].id;

    console.log("Test 2: User A inserts notification for User B (WITHOUT RETURNING)...");
    const notifRes = await client.query(`
      INSERT INTO public.notifications (recipient_id, actor_id, connection_id, type, title, message)
      VALUES ('${userB}', '${userA}', '${connId}', 'connection_request', 'Connection Request', 'Sri Gopi Kannan sent you a connection request.');
    `);
    console.log("Notification inserted successfully without RETURNING!");

    // Test 3: Can User A see this notification? (Should be NO, because recipient is User B)
    const aSee = await client.query(`SELECT * FROM public.notifications WHERE connection_id = '${connId}';`);
    console.log("User A can see notification? (Expect 0):", aSee.rows.length);

    // Test 4: Can User B see this notification? (Should be YES, because recipient is User B)
    await client.query(`SET LOCAL "request.jwt.claim.sub" = '${userB}';`);
    const bSee = await client.query(`SELECT * FROM public.notifications WHERE connection_id = '${connId}';`);
    console.log("User B can see notification? (Expect 1):", bSee.rows.length, bSee.rows[0]);

    // Test 5: Can User C see this notification? (Should be NO)
    const userC = "f3fd9eb7-3525-4a9e-9054-10ec0bb70050";
    await client.query(`SET LOCAL "request.jwt.claim.sub" = '${userC}';`);
    const cSee = await client.query(`SELECT * FROM public.notifications WHERE connection_id = '${connId}';`);
    console.log("User C can see notification? (Expect 0):", cSee.rows.length);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await client.query("ROLLBACK;");
    await client.end();
  }
}

testRlsAsUser();
