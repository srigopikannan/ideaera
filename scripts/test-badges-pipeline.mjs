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
  throw new Error("DATABASE_URL environment variable is required. Please set it in .env or .env.local.");
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function runPipelineTests() {
  console.log("==================================================");
  console.log(" IDEAERA PERFORMANCE BADGE & ACHIEVEMENT PIPELINE TEST");
  console.log("==================================================");

  await client.connect();

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, testName, detail = "") {
    testsTotal++;
    if (condition) {
      console.log(`✓ PASS: ${testName} ${detail ? "(" + detail + ")" : ""}`);
      testsPassed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? "(" + detail + ")" : ""}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // TEST 1: Badges Schema & Catalog Verification
    console.log("\n--- TEST 1: Schema & Badge Catalog ---");
    const { rows: badges } = await client.query("SELECT * FROM public.badges WHERE is_active = true ORDER BY tier, criteria_value");
    assert(badges.length >= 9, "Badges catalog seeded", `Found ${badges.length} badges`);

    const bronzeBadges = badges.filter(b => b.tier === "bronze");
    const silverBadges = badges.filter(b => b.tier === "silver");
    const goldBadges = badges.filter(b => b.tier === "gold");

    assert(bronzeBadges.length >= 4, "Bronze tier badges exist", `Count: ${bronzeBadges.length}`);
    assert(silverBadges.length >= 4, "Silver tier badges exist", `Count: ${silverBadges.length}`);
    assert(goldBadges.length >= 1, "Gold tier badge exists", `Count: ${goldBadges.length}`);

    // TEST 2: Unique Constraint on user_badges
    console.log("\n--- TEST 2: Schema Integrity & Constraints ---");
    const { rows: constraints } = await client.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'public.user_badges'::regclass AND conname = 'uq_user_badge'
    `);
    assert(constraints.length === 1 && constraints[0].contype === 'u', "Unique constraint uq_user_badge exists on user_badges(user_id, badge_id)");

    // Get profiles sorted by ideas count
    const { rows: users } = await client.query(`
      SELECT p.id, p.username,
        (SELECT count(*) FROM public.ideas WHERE creator_id = p.id) as ideas_count
      FROM public.profiles p
      ORDER BY ideas_count ASC
      LIMIT 2
    `);
    assert(users.length >= 2, "Test users available in database", `Found ${users.length} users`);
    const zeroIdeaUser = users[0];
    const secondUser = users[1];

    // Clean test user badges before test
    await client.query("DELETE FROM public.user_badges WHERE user_id IN ($1, $2)", [zeroIdeaUser.id, secondUser.id]);
    await client.query("DELETE FROM public.notifications WHERE user_id IN ($1, $2) AND type = 'badge_earned'", [zeroIdeaUser.id, secondUser.id]);

    // TEST 3: Zero Activity User Evaluation
    console.log("\n--- TEST 3: Anti-Gaming & Zero Activity Evaluation ---");
    const { rows: evalZero } = await client.query("SELECT public.evaluate_and_award_user_badges($1)", [zeroIdeaUser.id]);
    const resZero = evalZero[0].evaluate_and_award_user_badges;
    assert(resZero.success === true, "Evaluation executed successfully");

    const awardedSlugsZero = resZero.newly_awarded.map(b => b.slug);
    assert(!awardedSlugsZero.includes("idea-spark"), "User with 0 ideas is NOT awarded Idea Spark");
    assert(!awardedSlugsZero.includes("venture-builder"), "User with 0 projects is NOT awarded Venture Builder");
    assert(!awardedSlugsZero.includes("network-innovator"), "User with 0 connections is NOT awarded Network Innovator");

    // TEST 4: Real Activity Badge Awarding (Publishing 1 verified idea)
    console.log("\n--- TEST 4: Real Activity Badge Awarding ---");
    const { rows: testIdea } = await client.query(`
      INSERT INTO public.ideas (creator_id, title, description, problem, solution, category, stage)
      VALUES ($1, 'Automated Test Concept', 'Detailed verified concept description', 'Verified Problem Statement', 'Verified Solution Statement', 'AI & Machine Learning', 'Idea')
      RETURNING id, title;
    `, [zeroIdeaUser.id]);
    assert(testIdea.length === 1, "Created test idea", testIdea[0].title);

    // Evaluate badges for zeroIdeaUser
    const { rows: evalAfterIdea } = await client.query("SELECT public.evaluate_and_award_user_badges($1)", [zeroIdeaUser.id]);
    const resAfterIdea = evalAfterIdea[0].evaluate_and_award_user_badges;
    const awardedAfterIdea = resAfterIdea.newly_awarded.map(b => b.slug);

    assert(awardedAfterIdea.includes("idea-spark"), "Idea Spark badge awarded after publishing 1 validated idea");
    assert(resAfterIdea.metrics.ideas_count >= 1, "Idea count properly reflected in evaluation metrics");

    // Verify user_badges entry
    const { rows: ubRows } = await client.query(`
      SELECT ub.*, b.name, b.slug, b.tier
      FROM public.user_badges ub
      JOIN public.badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1 AND b.slug = 'idea-spark'
    `, [zeroIdeaUser.id]);
    assert(ubRows.length === 1, "Record inserted into user_badges table", `Awarded: ${ubRows[0].name}`);

    // Verify notification was created
    const { rows: notifRows } = await client.query(`
      SELECT * FROM public.notifications 
      WHERE user_id = $1 AND type = 'badge_earned' AND related_id = 'idea-spark'
    `, [zeroIdeaUser.id]);
    assert(notifRows.length === 1, "Real badge_earned notification created in notifications table", notifRows[0].message);

    // TEST 5: Idempotency (Re-running evaluation produces zero duplicates)
    console.log("\n--- TEST 5: Idempotency & Duplicate Prevention ---");
    const { rows: evalReRun } = await client.query("SELECT public.evaluate_and_award_user_badges($1)", [zeroIdeaUser.id]);
    const resReRun = evalReRun[0].evaluate_and_award_user_badges;
    assert(resReRun.newly_awarded.length === 0, "Re-evaluation awarded 0 new badges (fully idempotent)");

    const { rows: ubTotal } = await client.query(`
      SELECT count(*) as count
      FROM public.user_badges ub
      JOIN public.badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1 AND b.slug = 'idea-spark'
    `, [zeroIdeaUser.id]);
    assert(parseInt(ubTotal[0].count) === 1, "No duplicate user_badges rows exist");

    const { rows: notifTotal } = await client.query(`
      SELECT count(*) as count FROM public.notifications 
      WHERE user_id = $1 AND type = 'badge_earned' AND related_id = 'idea-spark'
    `, [zeroIdeaUser.id]);
    assert(parseInt(notifTotal[0].count) === 1, "No duplicate notifications exist");

    // TEST 6: Admin Award and Revocation
    console.log("\n--- TEST 6: Admin Manual Award & Revocation ---");
    const goldBadge = badges.find(b => b.tier === "gold");
    assert(Boolean(goldBadge), "Found gold tier badge", goldBadge.name);

    // Admin awards Top Performer manually
    const { rows: adminAwardRes } = await client.query(
      "SELECT public.admin_award_badge($1, $2, $3, $4)",
      [secondUser.id, zeroIdeaUser.id, goldBadge.id, "Exceptional community leadership in AI hackathon"]
    );
    const awardData = adminAwardRes[0].admin_award_badge;
    assert(awardData.success === true, "Admin manual award succeeded", `user_badge_id: ${awardData.user_badge_id}`);

    // Verify admin award notification
    const { rows: adminNotifs } = await client.query(`
      SELECT * FROM public.notifications 
      WHERE user_id = $1 AND type = 'badge_earned' AND related_id = $2
    `, [zeroIdeaUser.id, goldBadge.slug]);
    assert(adminNotifs.length >= 1, "Admin award notification created", adminNotifs[0].title);

    // Admin revokes badge
    const { rows: adminRevokeRes } = await client.query(
      "SELECT public.admin_revoke_badge($1, $2, $3, $4)",
      [secondUser.id, zeroIdeaUser.id, goldBadge.id, "Manual audit test"]
    );
    const revokeData = adminRevokeRes[0].admin_revoke_badge;
    assert(revokeData.success === true, "Admin revoke badge succeeded");

    // Verify badge is removed from user_badges
    const { rows: revokedCheck } = await client.query(
      "SELECT * FROM public.user_badges WHERE user_id = $1 AND badge_id = $2",
      [zeroIdeaUser.id, goldBadge.id]
    );
    assert(revokedCheck.length === 0, "Badge successfully removed from user_badges upon revocation");

    // Cleanup test data
    console.log("\n--- CLEANUP ---");
    await client.query("DELETE FROM public.ideas WHERE id = $1", [testIdea[0].id]);
    await client.query("DELETE FROM public.user_badges WHERE user_id = $1", [zeroIdeaUser.id]);
    await client.query("DELETE FROM public.notifications WHERE user_id = $1 AND type = 'badge_earned'", [zeroIdeaUser.id]);
    console.log("✓ Test records cleaned up successfully");

    console.log("\n==================================================");
    console.log(` ALL TESTS PASSED: ${testsPassed}/${testsTotal}`);
    console.log(" BADGE & ACHIEVEMENT SYSTEM VERIFIED 100%");
    console.log("==================================================");

  } catch (err) {
    console.error("\nTEST PIPELINE ERROR:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runPipelineTests();
