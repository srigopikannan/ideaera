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

async function run() {
  await client.connect();
  console.log("==================================================================");
  console.log("   BADGE VALIDITY & AUTOMATIC RE-EVALUATION PIPELINE TEST");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 0. Locate a clean test user profile with zero initial ideas/projects
    const zeroUsers = await client.query(`
      SELECT p.id, p.full_name
      FROM public.profiles p
      LEFT JOIN public.ideas i ON p.id = i.creator_id
      LEFT JOIN public.projects pr ON p.id = pr.owner_id
      WHERE i.id IS NULL AND pr.id IS NULL
      LIMIT 1;
    `);
    assert(zeroUsers.rows.length > 0, "Found zero-activity user profile in database");
    const testUserId = zeroUsers.rows[0].id;
    console.log(`  Using test user: ${zeroUsers.rows[0].full_name} (${testUserId})`);

    // Clean up any stray test data
    await client.query("DELETE FROM public.user_badges WHERE user_id = $1", [testUserId]);
    await client.query("DELETE FROM public.badge_audit_logs WHERE user_id = $1", [testUserId]);
    await client.query("DELETE FROM public.notifications WHERE user_id = $1 OR recipient_id = $1", [testUserId]);
    await client.query("DELETE FROM public.connections WHERE requester_id = $1 OR receiver_id = $1", [testUserId]);
    await client.query("DELETE FROM public.project_members WHERE user_id = $1", [testUserId]);

    console.log("\n--- TEST 1: IDEA CREATION & DELETION RE-EVALUATION ---");
    // Initial evaluation with 0 ideas
    const { rows: evalInit } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const initRes = evalInit[0].evaluate_and_sync_user_badges;
    assert(initRes.success === true, "Initial evaluation executed successfully");
    assert(initRes.metrics.ideas_count === 0, "User starts with 0 ideas");

    // Insert 1 qualifying substantive idea
    const { rows: idea1 } = await client.query(`
      INSERT INTO public.ideas (title, problem, solution, description, category, creator_id, validation_status)
      VALUES (
        'Test Autoeval Idea 1',
        'Problem statement for the automated evaluation test requires at least 20 chars.',
        'Solution statement for the automated evaluation test requires at least 20 chars.',
        'A comprehensive resilient architecture description exceeding fifty characters for anti-gaming verification.',
        'AI & Machine Learning',
        $1,
        'validated'
      )
      RETURNING id
    `, [testUserId]);
    assert(idea1.length > 0, "Created qualifying idea 1");

    // Re-evaluate: "idea-spark" and "active-innovator" should be awarded
    const { rows: evalAfterIdea } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const resAfterIdea = evalAfterIdea[0].evaluate_and_sync_user_badges;
    const awardedSlugs = (resAfterIdea.newly_awarded || []).map(b => b.slug);
    assert(awardedSlugs.includes("idea-spark"), "Idea Spark badge automatically awarded on qualifying idea");
    assert(awardedSlugs.includes("active-innovator"), "Active Innovator badge automatically awarded");

    // Verify in user_badges table
    const { rows: ub1 } = await client.query(
      "SELECT b.slug FROM public.user_badges ub JOIN public.badges b ON ub.badge_id = b.id WHERE ub.user_id = $1",
      [testUserId]
    );
    const heldSlugs1 = ub1.map(r => r.slug);
    assert(heldSlugs1.includes("idea-spark"), "user_badges records Idea Spark");
    assert(heldSlugs1.includes("active-innovator"), "user_badges records Active Innovator");

    // Verify audit logs
    const { rows: audit1 } = await client.query(
      "SELECT action, reason FROM public.badge_audit_logs WHERE user_id = $1 ORDER BY created_at ASC",
      [testUserId]
    );
    assert(audit1.some(a => a.action === "awarded"), "Audit trail recorded award action");

    // NOW DELETE THE IDEA: automatic re-evaluation must revoke the badge!
    await client.query("DELETE FROM public.ideas WHERE id = $1", [idea1[0].id]);
    console.log("  -> Idea deleted. Re-evaluating badges...");

    const { rows: evalAfterDelete } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const resAfterDelete = evalAfterDelete[0].evaluate_and_sync_user_badges;
    const revokedSlugs = (resAfterDelete.revoked || []).map(b => b.slug);
    assert(revokedSlugs.includes("idea-spark"), "Idea Spark badge revoked automatically upon idea deletion");
    assert(revokedSlugs.includes("active-innovator"), "Active Innovator badge revoked automatically upon idea deletion");

    // Check user_badges: badges must be removed
    const { rows: ub2 } = await client.query(
      "SELECT b.slug FROM public.user_badges ub JOIN public.badges b ON ub.badge_id = b.id WHERE ub.user_id = $1",
      [testUserId]
    );
    assert(!ub2.some(r => r.slug === "idea-spark"), "user_badges NO LONGER contains Idea Spark");
    assert(!ub2.some(r => r.slug === "active-innovator"), "user_badges NO LONGER contains Active Innovator");

    // Check audit trail for revocation
    const { rows: auditRevoke } = await client.query(
      "SELECT action, reason FROM public.badge_audit_logs WHERE user_id = $1 AND action = 'revoked'",
      [testUserId]
    );
    assert(auditRevoke.length >= 2, "Audit log recorded revocation reason and metrics snapshot");


    console.log("\n--- TEST 2: PROJECT CREATION & DELETION RE-EVALUATION ---");
    // Create qualifying substantive project with repo and specs
    const { rows: proj1 } = await client.query(`
      INSERT INTO public.projects (name, description, owner_id, status, repository_url, required_skills)
      VALUES (
        'Test Autoeval Project 1',
        'A comprehensive production software system engineered with complete automated test coverage and specs.',
        $1,
        'in_development',
        'https://github.com/ideaera/test-autoeval-proj',
        ARRAY['TypeScript', 'PostgreSQL']
      )
      RETURNING id
    `, [testUserId]);

    const { rows: evalProj } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const projAwarded = (evalProj[0].evaluate_and_sync_user_badges.newly_awarded || []).map(b => b.slug);
    assert(projAwarded.includes("venture-builder"), "Venture Builder badge awarded on project creation");
    assert(projAwarded.includes("active-innovator"), "Active Innovator badge awarded on project creation");

    // Delete project
    await client.query("DELETE FROM public.projects WHERE id = $1", [proj1[0].id]);
    console.log("  -> Project deleted. Re-evaluating badges...");

    const { rows: evalProjDelete } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const projRevoked = (evalProjDelete[0].evaluate_and_sync_user_badges.revoked || []).map(b => b.slug);
    assert(projRevoked.includes("venture-builder"), "Venture Builder badge revoked upon project deletion");
    assert(projRevoked.includes("active-innovator"), "Active Innovator badge revoked upon project deletion");


    console.log("\n--- TEST 3: TEAM PLAYER MEMBERSHIP & REMOVAL ---");
    // Create dummy project under another user to test membership
    const otherUser = await client.query("SELECT id FROM public.profiles WHERE id != $1 LIMIT 1", [testUserId]);
    const otherUserId = otherUser.rows[0].id;

    const { rows: teamProj } = await client.query(`
      INSERT INTO public.projects (name, description, owner_id, status, repository_url, required_skills)
      VALUES (
        'Test Autoeval Team Project',
        'A multi-collaborator platform requiring active task execution and team contributions.',
        $1,
        'in_development',
        'https://github.com/ideaera/team-collab',
        ARRAY['React']
      )
      RETURNING id
    `, [otherUserId]);

    // Add user as project member with enum 'Contributor'
    await client.query(`
      INSERT INTO public.project_members (project_id, user_id, role)
      VALUES ($1, $2, 'Contributor')
    `, [teamProj[0].id, testUserId]);

    // To be a meaningful team contributor, user must complete an assigned task on that project!
    const { rows: taskRow } = await client.query(`
      INSERT INTO public.tasks (project_id, title, description, assigned_to, status, completed_at)
      VALUES ($1, 'Team Milestone Task', 'Assigned and completed task for team execution', $2, 'Completed', now())
      RETURNING id;
    `, [teamProj[0].id, testUserId]);

    const { rows: evalTeam } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const teamAwarded = (evalTeam[0].evaluate_and_sync_user_badges.newly_awarded || []).map(b => b.slug);
    assert(teamAwarded.includes("team-player"), "Team Player badge awarded on joining project team with completed task");

    // Remove task and membership
    await client.query("DELETE FROM public.tasks WHERE id = $1", [taskRow[0].id]);
    await client.query("DELETE FROM public.project_members WHERE project_id = $1 AND user_id = $2", [teamProj[0].id, testUserId]);
    console.log("  -> Team membership removed. Re-evaluating badges...");

    const { rows: evalTeamLeave } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const teamRevoked = (evalTeamLeave[0].evaluate_and_sync_user_badges.revoked || []).map(b => b.slug);
    assert(teamRevoked.includes("team-player"), "Team Player badge revoked on leaving project team");

    await client.query("DELETE FROM public.projects WHERE id = $1", [teamProj[0].id]);


    console.log("\n--- TEST 4: MULTI-TIER DEMOTION (TOP PERFORMER -> HIGH PERFORMER -> ACTIVE INNOVATOR) ---");
    // Connect with 2 users from real profiles
    const peers = await client.query("SELECT id FROM public.profiles WHERE id != $1 LIMIT 2", [testUserId]);
    assert(peers.rows.length >= 2, "Found 2 peer profiles for connection testing");
    const peer1 = peers.rows[0].id;
    const peer2 = peers.rows[1].id;
    await client.query(`
      INSERT INTO public.connections (requester_id, receiver_id, status)
      VALUES ($1, $2, 'accepted'), ($1, $3, 'accepted')
      ON CONFLICT DO NOTHING
    `, [testUserId, peer1, peer2]);

    // Create 2 software projects (1 in development, 1 completed)
    const { rows: goldProj1 } = await client.query(`
      INSERT INTO public.projects (name, description, owner_id, status, repository_url, required_skills)
      VALUES (
        'Test Autoeval Gold Project 1',
        'Substantive project description exceeding 50 characters for gold tier qualification verification.',
        $1,
        'in_development',
        'https://github.com/ideaera/gold-proj-1',
        ARRAY['TypeScript']
      )
      RETURNING id
    `, [testUserId]);

    const { rows: goldProj2 } = await client.query(`
      INSERT INTO public.projects (name, description, owner_id, status, repository_url, required_skills)
      VALUES (
        'Test Autoeval Gold Project 2',
        'Second substantive project description exceeding 50 characters, marked launched/completed.',
        $1,
        'Completed',
        'https://github.com/ideaera/gold-proj-2',
        ARRAY['TypeScript', 'Rust']
      )
      RETURNING id
    `, [testUserId]);

    // Create 3 completed tasks for user
    const { rows: goldTasks } = await client.query(`
      INSERT INTO public.tasks (project_id, title, description, assigned_to, status, completed_at)
      VALUES 
        ($1, 'Gold Task 1', 'Task 1 description', $2, 'Completed', now()),
        ($1, 'Gold Task 2', 'Task 2 description', $2, 'Completed', now()),
        ($1, 'Gold Task 3', 'Task 3 description', $2, 'Completed', now())
      RETURNING id;
    `, [goldProj1[0].id, testUserId]);

    // Create hackathon registration
    const { rows: goldHack } = await client.query(`
      INSERT INTO public.hackathons (title, description, start_date, end_date, organizer_id, location, prize_pool)
      VALUES ('Gold Sprint Hackathon', 'High intensity sprint for verified gold achievers', now(), now() + interval '3 days', $1, 'Virtual', '$5,000')
      RETURNING id;
    `, [otherUserId]);
    await client.query(`
      INSERT INTO public.hackathon_registrations (hackathon_id, user_id)
      VALUES ($1, $2);
    `, [goldHack[0].id, testUserId]);

    // Create 5 substantive ideas
    const { rows: goldIdeas } = await client.query(`
      INSERT INTO public.ideas (title, problem, solution, description, category, creator_id, validation_status)
      VALUES 
        ('Gold Idea 1', 'Problem statement for gold idea 1 requiring at least 20 chars', 'Solution statement for gold idea 1 requiring at least 20 chars', 'Substantive description exceeding 50 chars for gold tier 1', 'AI & Machine Learning', $1, 'validated'),
        ('Gold Idea 2', 'Problem statement for gold idea 2 requiring at least 20 chars', 'Solution statement for gold idea 2 requiring at least 20 chars', 'Substantive description exceeding 50 chars for gold tier 2', 'AI & Machine Learning', $1, 'validated'),
        ('Gold Idea 3', 'Problem statement for gold idea 3 requiring at least 20 chars', 'Solution statement for gold idea 3 requiring at least 20 chars', 'Substantive description exceeding 50 chars for gold tier 3', 'AI & Machine Learning', $1, 'validated'),
        ('Gold Idea 4', 'Problem statement for gold idea 4 requiring at least 20 chars', 'Solution statement for gold idea 4 requiring at least 20 chars', 'Substantive description exceeding 50 chars for gold tier 4', 'AI & Machine Learning', $1, 'validated'),
        ('Gold Idea 5', 'Problem statement for gold idea 5 requiring at least 20 chars', 'Solution statement for gold idea 5 requiring at least 20 chars', 'Substantive description exceeding 50 chars for gold tier 5', 'AI & Machine Learning', $1, 'validated')
      RETURNING id
    `, [testUserId]);
    assert(goldIdeas.length === 5, "Created 5 ideas for Gold tier eligibility");

    // Evaluate: user meets all gold requirements -> Top Performer (Gold), High Performer (Silver), Active Innovator (Bronze)
    const { rows: evalGold } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const goldAwarded = (evalGold[0].evaluate_and_sync_user_badges.newly_awarded || []).map(b => b.slug);
    assert(goldAwarded.includes("top-performer"), "🏆 Top Performer (Gold) awarded with 5 ideas, 2 proj, 3 tasks, 1 hackathon");
    assert(goldAwarded.includes("high-performer"), "🥈 High Performer (Silver) awarded");
    assert(goldAwarded.includes("active-innovator"), "🥉 Active Innovator (Bronze) awarded");

    // STEP A: Delete completed project (now has 1 project, 0 completed projects)
    console.log("  -> User deletes completed project. Re-evaluating...");
    await client.query("DELETE FROM public.projects WHERE id = $1", [goldProj2[0].id]);

    const { rows: evalStepA } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const stepARevoked = (evalStepA[0].evaluate_and_sync_user_badges.revoked || []).map(b => b.slug);
    const stepACurrent = (evalStepA[0].evaluate_and_sync_user_badges.currently_valid || []).map(b => b.slug);

    assert(stepARevoked.includes("top-performer"), "🏆 Top Performer is REVOKED because completed projects dropped to 0");
    assert(stepACurrent.includes("high-performer"), "🥈 User retains High Performer (still meets 2+ ideas, 1 proj, 1 task)");
    assert(stepACurrent.includes("active-innovator"), "🥉 User retains Active Innovator (still meets >= 1 idea/proj)");

    // STEP B: Delete 4 ideas (remaining: 1 idea, 1 project)
    console.log("  -> User deletes 4 ideas (remaining: 1 idea, 1 project). Re-evaluating...");
    await client.query("DELETE FROM public.ideas WHERE id IN ($1, $2, $3, $4)", [goldIdeas[1].id, goldIdeas[2].id, goldIdeas[3].id, goldIdeas[4].id]);

    const { rows: evalStepB } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const stepBRevoked = (evalStepB[0].evaluate_and_sync_user_badges.revoked || []).map(b => b.slug);
    const stepBCurrent = (evalStepB[0].evaluate_and_sync_user_badges.currently_valid || []).map(b => b.slug);

    assert(stepBRevoked.includes("high-performer"), "🥈 High Performer is REVOKED because ideas dropped to 1");
    assert(stepBCurrent.includes("active-innovator"), "🥉 User still retains Active Innovator");

    // STEP C: Delete last idea and project (now has 0 ideas, 0 projects)
    console.log("  -> User deletes last idea and project (remaining: 0 ideas, 0 projects). Re-evaluating...");
    await client.query("DELETE FROM public.ideas WHERE id = $1", [goldIdeas[0].id]);
    await client.query("DELETE FROM public.tasks WHERE project_id = $1", [goldProj1[0].id]);
    await client.query("DELETE FROM public.projects WHERE id = $1", [goldProj1[0].id]);
    await client.query("DELETE FROM public.hackathon_registrations WHERE user_id = $1", [testUserId]);
    await client.query("DELETE FROM public.hackathons WHERE id = $1", [goldHack[0].id]);

    const { rows: evalStepC } = await client.query("SELECT public.evaluate_and_sync_user_badges($1)", [testUserId]);
    const stepCRevoked = (evalStepC[0].evaluate_and_sync_user_badges.revoked || []).map(b => b.slug);
    assert(stepCRevoked.includes("active-innovator"), "🥉 Active Innovator is REVOKED because all ideas and projects are gone");

    // Clean up temporary connections
    await client.query("DELETE FROM public.connections WHERE requester_id = $1 AND receiver_id IN ($2, $3)", [testUserId, peer1, peer2]);

    console.log("\n--- TEST 5: AUDIT TRAIL INTEGRITY ---");
    const { rows: allAudit } = await client.query(`
      SELECT b.name, bal.action, bal.reason, bal.created_at
      FROM public.badge_audit_logs bal
      JOIN public.badges b ON bal.badge_id = b.id
      WHERE bal.user_id = $1
      ORDER BY bal.created_at ASC
    `, [testUserId]);

    assert(allAudit.length >= 8, `Recorded comprehensive audit trail (${allAudit.length} total award/revoke events)`);
    console.log(`  Sample audit entries:`);
    allAudit.slice(0, 4).forEach(e => console.log(`   - [${e.action.toUpperCase()}] ${e.name}: ${e.reason}`));

    // Clean up
    await client.query("DELETE FROM public.badge_audit_logs WHERE user_id = $1", [testUserId]);
    await client.query("DELETE FROM public.user_badges WHERE user_id = $1", [testUserId]);
    await client.query("DELETE FROM public.notifications WHERE user_id = $1 OR recipient_id = $1", [testUserId]);

    console.log("\n==================================================================");
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution exception:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
