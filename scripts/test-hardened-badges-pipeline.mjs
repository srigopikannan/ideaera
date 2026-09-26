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
  throw new Error("DATABASE_URL is required.");
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function runTestSuite() {
  console.log("==================================================");
  console.log(" IDEAERA HARDENED BADGE & ACHIEVEMENT PIPELINE TEST");
  console.log("==================================================");

  await client.connect();

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, testName, detail = "") {
    testsTotal++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName} ${detail ? "(" + detail + ")" : ""}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${detail ? "(" + detail + ")" : ""}`);
      throw new Error(`Test failed: ${testName} - ${detail}`);
    }
  }

  // Setup dedicated isolated test users
  const testEmailA = `test_user_a_${Date.now()}@ideaera-audit.io`;
  const testEmailB = `test_user_b_${Date.now()}@ideaera-audit.io`;

  let userAId, userBId;
  const createdIdeaIds = [];
  const createdProjectIds = [];
  const createdTaskIds = [];

  try {
    // 0. Create test users in auth.users and public.profiles
    console.log("\n--- SETUP: Creating isolated test profiles ---");
    const { rows: authARows } = await client.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $1,
        'dummy_encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Innovator A"}', now(), now()
      ) RETURNING id;
    `, [testEmailA]);
    userAId = authARows[0].id;

    await client.query(`
      INSERT INTO public.profiles (id, username, full_name)
      VALUES ($1, $2, 'Hardened Test Innovator A')
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    `, [userAId, `test_harden_a_${Date.now().toString().slice(-6)}`]);

    const { rows: authBRows } = await client.query(`
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $1,
        'dummy_encrypted_password', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test Innovator B"}', now(), now()
      ) RETURNING id;
    `, [testEmailB]);
    userBId = authBRows[0].id;

    await client.query(`
      INSERT INTO public.profiles (id, username, full_name)
      VALUES ($1, $2, 'Hardened Test Innovator B')
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
    `, [userBId, `test_harden_b_${Date.now().toString().slice(-6)}`]);

    console.log(`Created Test User A: ${userAId}`);
    console.log(`Created Test User B: ${userBId}`);

    // TEST 1: Anti-Gaming & Low-Effort Filters
    console.log("\n--- TEST 1: Anti-Gaming & Low-Effort Rejection ---");
    // 1.1 Insert low-effort idea (title "Hi", short problem/solution/description)
    const { rows: lowEffortIdea } = await client.query(`
      INSERT INTO public.ideas (creator_id, title, description, problem, solution, category, stage)
      VALUES ($1, 'Hi', 'Too short', 'none', 'none', 'General', 'Idea')
      RETURNING id;
    `, [userAId]);
    createdIdeaIds.push(lowEffortIdea[0].id);

    // 1.2 Insert empty project (no description, no repo, no skills)
    const { rows: lowEffortProj } = await client.query(`
      INSERT INTO public.projects (owner_id, name, description, status)
      VALUES ($1, 'X', 'Short', 'draft')
      RETURNING id;
    `, [userAId]);
    createdProjectIds.push(lowEffortProj[0].id);

    // 1.3 Join a project team without completing any tasks
    await client.query(`
      INSERT INTO public.project_members (project_id, user_id, role)
      VALUES ($1, $2, 'Contributor');
    `, [lowEffortProj[0].id, userAId]);

    // Evaluate user A badges
    const { rows: eval1 } = await client.query(`
      SELECT public.evaluate_and_sync_user_badges($1) as res;
    `, [userAId]);
    const res1 = eval1[0].res;

    assert(res1.metrics.ideas_count === 0, "Low-effort idea rejected", `Count: ${res1.metrics.ideas_count}`);
    assert(res1.metrics.projects_count === 0, "Low-effort project rejected", `Count: ${res1.metrics.projects_count}`);
    assert(res1.metrics.team_contributions_count === 0, "Idling on project team rejected without completed tasks", `Count: ${res1.metrics.team_contributions_count}`);
    assert(res1.newly_awarded.length === 0, "No badges awarded for low-effort or gaming activity");

    // TEST 2: Genuine Bronze Qualification
    console.log("\n--- TEST 2: Genuine Bronze Qualification ---");
    // Create a real, substantive developed idea (title >= 5 chars, description >= 50 chars, problem & solution defined)
    const { rows: realIdea1 } = await client.query(`
      INSERT INTO public.ideas (
        creator_id, title, description, problem, solution, category, stage, validation_status
      ) VALUES (
        $1,
        'Decentralized Quantum Storage Mesh',
        'A comprehensive resilient distributed storage architecture utilizing verified content addressable hashes and automated peer redundancy protocols.',
        'Current distributed storage protocols suffer from severe data loss during asymmetric peer partition events.',
        'Implement quantum-resistant erasure coding across geographically distributed independent autonomous validation nodes.',
        'AI & Machine Learning',
        'Idea',
        'validated'
      ) RETURNING id;
    `, [userAId]);
    createdIdeaIds.push(realIdea1[0].id);

    // Because of the database trigger trg_ideas_badge_sync, evaluate_and_sync_user_badges was invoked automatically!
    // Check user_badges table directly
    const { rows: ubAfterIdea } = await client.query(`
      SELECT ub.*, b.slug, b.name, b.tier
      FROM public.user_badges ub
      JOIN public.badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1;
    `, [userAId]);

    const slugsAfterIdea = ubAfterIdea.map(r => r.slug);
    assert(slugsAfterIdea.includes("idea-spark"), "Idea Spark badge automatically awarded via trigger", "Found in user_badges");
    assert(slugsAfterIdea.includes("active-innovator"), "Active Innovator (Bronze composite) automatically awarded", "Found in user_badges");

    // Verify audit logs table
    const { rows: auditLogsIdea } = await client.query(`
      SELECT * FROM public.badge_audit_logs
      WHERE user_id = $1 AND action = 'awarded';
    `, [userAId]);
    assert(auditLogsIdea.length >= 2, "Badge award logged to public.badge_audit_logs", `Found ${auditLogsIdea.length} logs`);
    assert(auditLogsIdea[0].reason.includes("Criteria satisfied"), "Audit log reason records criteria evidence");

    // Verify notifications table
    const { rows: notifIdea } = await client.query(`
      SELECT * FROM public.notifications
      WHERE user_id = $1 AND type = 'badge_earned';
    `, [userAId]);
    assert(notifIdea.length >= 2, "badge_earned notification automatically sent", `Count: ${notifIdea.length}`);

    // TEST 3: Progressive Silver Qualification
    console.log("\n--- TEST 3: Progressive Silver Qualification ---");
    // Add 2 more developed ideas (total 3)
    const { rows: realIdea2 } = await client.query(`
      INSERT INTO public.ideas (creator_id, title, description, problem, solution, category, stage)
      VALUES ($1, 'Autonomous Drone Delivery Grid', 'Full technical specification for urban micro-fulfillment logistics using adaptive route optimization.', 'Urban traffic congestion delays vital medical sample transit times.', 'Automated aerial transport corridor coordination networks.', 'Robotics', 'Idea')
      RETURNING id;
    `, [userAId]);
    createdIdeaIds.push(realIdea2[0].id);

    const { rows: realIdea3 } = await client.query(`
      INSERT INTO public.ideas (creator_id, title, description, problem, solution, category, stage)
      VALUES ($1, 'Zero-Knowledge Credential Engine', 'Cryptographic privacy-preserving identity verification protocol for enterprise compliance.', 'Identity fraud and data breaches leak sensitive personally identifiable information.', 'ZK-SNARK proof verification for selective attribute disclosures.', 'Security', 'Idea')
      RETURNING id;
    `, [userAId]);
    createdIdeaIds.push(realIdea3[0].id);

    // Create 1 real software project
    const { rows: realProj1 } = await client.query(`
      INSERT INTO public.projects (
        owner_id, name, description, repository_url, deployment_url, required_skills, status
      ) VALUES (
        $1,
        'QuantumMesh Core Engine',
        'Production implementation of the decentralized distributed quantum storage mesh node protocol in Rust and TypeScript.',
        'https://github.com/ideaera/quantummesh-core',
        'https://quantummesh.dev',
        ARRAY['Rust', 'TypeScript', 'Distributed Systems'],
        'Active'
      ) RETURNING id;
    `, [userAId]);
    createdProjectIds.push(realProj1[0].id);

    // Create 1 completed task assigned to userA
    const { rows: task1 } = await client.query(`
      INSERT INTO public.tasks (project_id, title, description, assigned_to, status, completed_at)
      VALUES ($1, 'Implement Reed-Solomon Erasure Coding', 'Architected and deployed high-performance coding benchmark', $2, 'Completed', now())
      RETURNING id;
    `, [realProj1[0].id, userAId]);
    createdTaskIds.push(task1[0].id);

    // Check user_badges after additions
    const { rows: ubSilver } = await client.query(`
      SELECT b.slug, b.tier
      FROM public.user_badges ub
      JOIN public.badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1;
    `, [userAId]);
    const silverSlugs = ubSilver.map(r => r.slug);

    assert(silverSlugs.includes("prolific-ideator"), "Prolific Ideator (Silver) awarded for 3 developed ideas");
    assert(silverSlugs.includes("venture-builder"), "Venture Builder (Bronze) awarded for software project");
    assert(silverSlugs.includes("high-performer"), "High Performer (Silver composite) awarded for 2+ ideas, 1 project, and completed task");

    // TEST 4: Elite Gold (Top Performer) Qualification
    console.log("\n--- TEST 4: Elite Gold (Top Performer) Qualification ---");
    // Add 2 more developed ideas (total 5)
    for (let i = 4; i <= 5; i++) {
      const { rows: extraIdea } = await client.query(`
        INSERT INTO public.ideas (creator_id, title, description, problem, solution, category, stage)
        VALUES ($1, 'Advanced Neural Architecture ${i}', 'Extensive scientific methodology and empirical validation documentation for deep continuous learning models.', 'Model drift degrades edge performance over prolonged disconnected deployment cycles.', 'Self-calibrating neural weight adaptation via local gradient feedback loops.', 'AI', 'Idea')
        RETURNING id;
      `, [userAId]);
      createdIdeaIds.push(extraIdea[0].id);
    }

    // Add second project that is completed (status = 'Completed')
    const { rows: realProj2 } = await client.query(`
      INSERT INTO public.projects (
        owner_id, name, description, repository_url, deployment_url, required_skills, status
      ) VALUES (
        $1,
        'Mesh Observability Suite',
        'End-to-end tracing and real-time visualization dashboard for distributed mesh peer consensus status and throughput.',
        'https://github.com/ideaera/mesh-observability',
        'https://mesh-monitor.ideaera.io',
        ARRAY['Next.js', 'Go', 'Prometheus'],
        'Completed'
      ) RETURNING id;
    `, [userAId]);
    createdProjectIds.push(realProj2[0].id);

    // Complete 2 more tasks (total 3 completed tasks)
    for (let j = 2; j <= 3; j++) {
      const { rows: extraTask } = await client.query(`
        INSERT INTO public.tasks (project_id, title, description, assigned_to, status, completed_at)
        VALUES ($1, 'Critical System Optimization Task ${j}', 'Refactored consensus serialization pipeline for 10x throughput', $2, 'Completed', now())
        RETURNING id;
      `, [realProj1[0].id, userAId]);
      createdTaskIds.push(extraTask[0].id);
    }

    // Create 1 competitive hackathon sprint and register userA
    const { rows: hackathon } = await client.query(`
      INSERT INTO public.hackathons (title, description, start_date, end_date, organizer_id, location, prize_pool)
      VALUES ('Global Distributed Systems Hackathon', 'Competitive sprint for high throughput resilient distributed applications', now(), now() + interval '3 days', $1, 'Virtual / Online', '$10,000')
      RETURNING id;
    `, [userBId]);

    await client.query(`
      INSERT INTO public.hackathon_registrations (hackathon_id, user_id)
      VALUES ($1, $2);
    `, [hackathon[0].id, userAId]);

    // Check user_badges for Gold Top Performer
    const { rows: ubGold } = await client.query(`
      SELECT b.slug, b.name, b.tier
      FROM public.user_badges ub
      JOIN public.badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1 AND b.tier = 'gold';
    `, [userAId]);

    assert(ubGold.length === 1 && ubGold[0].slug === "top-performer", "Top Performer (Gold) earned through genuine elite multi-pillar execution", ubGold[0]?.name);

    // TEST 5: Automatic Revocation & Tier Demotion on Activity Deletion
    console.log("\n--- TEST 5: Automatic Revocation & Tier Demotion on Activity Deletion ---");
    // Delete the completed project (realProj2)
    // This causes completed_projects_count to drop from 1 to 0!
    // The database trigger trg_projects_badge_sync should immediately fire and revoke 'top-performer'!
    console.log("  -> Deleting completed project to drop below Gold criteria...");
    await client.query(`DELETE FROM public.projects WHERE id = $1;`, [realProj2[0].id]);

    // Check user_badges table: top-performer MUST BE GONE!
    const { rows: ubAfterProjDelete } = await client.query(`
      SELECT b.slug, b.tier
      FROM public.user_badges ub
      JOIN public.badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1 AND b.slug = 'top-performer';
    `, [userAId]);
    assert(ubAfterProjDelete.length === 0, "Top Performer badge AUTOMATICALLY REVOKED upon project deletion", "No longer in user_badges");

    // Check audit logs for the revocation entry
    const { rows: auditRevoked } = await client.query(`
      SELECT al.*, b.slug
      FROM public.badge_audit_logs al
      JOIN public.badges b ON b.id = al.badge_id
      WHERE al.user_id = $1 AND al.action = 'revoked' AND b.slug = 'top-performer'
      ORDER BY al.created_at DESC
      LIMIT 1;
    `, [userAId]);
    assert(auditRevoked.length === 1, "Revocation recorded in public.badge_audit_logs with snapshot", auditRevoked[0]?.reason);

    // Check notifications for badge_revoked notification
    const { rows: notifRevoked } = await client.query(`
      SELECT * FROM public.notifications
      WHERE user_id = $1 AND type = 'badge_revoked' AND entity_id = $2;
    `, [userAId, auditRevoked[0].badge_id]);
    assert(notifRevoked.length === 1, "badge_revoked notification created for user", notifRevoked[0]?.message);

    // Delete ideas so ideas count drops from 5 to 0
    console.log("  -> Deleting all ideas to test cascaded tier demotion to none...");
    await client.query(`DELETE FROM public.ideas WHERE creator_id = $1;`, [userAId]);

    const { rows: ubAfterIdeaDelete } = await client.query(`
      SELECT b.slug
      FROM public.user_badges ub
      JOIN public.badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1;
    `, [userAId]);
    const remainingSlugs = ubAfterIdeaDelete.map(r => r.slug);
    assert(!remainingSlugs.includes("idea-spark"), "Idea Spark revoked after ideas deleted");
    assert(!remainingSlugs.includes("prolific-ideator"), "Prolific Ideator revoked after ideas deleted");
    assert(!remainingSlugs.includes("high-performer"), "High Performer revoked when idea count dropped below 2");

    // TEST 6: User Isolation Verification
    console.log("\n--- TEST 6: User Isolation Verification ---");
    // Verify user B has not received any badges from user A's actions
    const { rows: ubUserB } = await client.query(`
      SELECT * FROM public.user_badges WHERE user_id = $1;
    `, [userBId]);
    assert(ubUserB.length === 0, "User B remains strictly isolated with 0 badges", `Count: ${ubUserB.length}`);

    // TEST 7: Security & RLS Enforcement
    console.log("\n--- TEST 7: Security & RLS Enforcement ---");
    // Verify RLS is enabled on user_badges, badges, and badge_audit_logs
    const { rows: rlsCheck } = await client.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname IN ('badges', 'user_badges', 'badge_audit_logs');
    `);
    for (const r of rlsCheck) {
      assert(r.relrowsecurity === true, `RLS enabled on table ${r.relname}`);
    }

    // Verify unique constraint on user_badges prevents duplicates
    const { rows: uqConstraint } = await client.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'public.user_badges'::regclass AND (conname = 'uq_user_badge' OR conname = 'user_badges_user_id_badge_id_key');
    `);
    assert(uqConstraint.length >= 1, "Unique constraint enforces zero duplicate awards on user_badges");

    console.log("\n==================================================");
    console.log(` ALL TESTS PASSED! (${testsPassed}/${testsTotal})`);
    console.log("==================================================");

  } finally {
    // Cleanup test artifacts
    console.log("\n--- CLEANUP: Removing test artifacts ---");
    if (userAId && userBId) {
      await client.query("DELETE FROM public.hackathon_registrations WHERE user_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.hackathons WHERE organizer_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.connections WHERE requester_id IN ($1, $2) OR receiver_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.tasks WHERE assigned_to IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.project_members WHERE user_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.projects WHERE owner_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.ideas WHERE creator_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.badge_audit_logs WHERE user_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.notifications WHERE user_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.user_badges WHERE user_id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM public.profiles WHERE id IN ($1, $2);", [userAId, userBId]);
      await client.query("DELETE FROM auth.users WHERE id IN ($1, $2);", [userAId, userBId]);
      console.log("Cleaned up test users and dependent records.");
    }
    await client.end();
  }
}

runTestSuite().catch((err) => {
  console.error("Pipeline test error:", err);
  process.exit(1);
});
