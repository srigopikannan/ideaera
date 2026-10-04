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

async function runTests() {
  await client.connect();
  console.log("==================================================");
  console.log("   IDEA SAFE DELETION & ARCHIVAL TEST PIPELINE   ");
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
    // 0. Setup test users
    const profilesRes = await client.query(`SELECT id FROM public.profiles LIMIT 2;`);
    if (profilesRes.rows.length < 2) {
      throw new Error("At least two profiles required for testing.");
    }
    const userA = profilesRes.rows[0].id;
    const userB = profilesRes.rows[1].id;
    console.log(`Test User A: ${userA}`);
    console.log(`Test User B: ${userB}`);

    // TEST 1: Delete an idea with NO dependent project -> SUCCESS
    console.log("\n--- TEST 1: Delete an idea with NO dependent project ---");
    const test1IdeaRes = await client.query(`
      INSERT INTO public.ideas (creator_id, title, problem, solution, description, category, stage, visibility)
      VALUES ($1, 'Test Idea 1 Standalone', 'A problem statement that is well defined and needs a solution.', 'A comprehensive solution that addresses all user needs.', 'This is a test idea with no dependent projects for deletion audit.', 'AI & Machine Learning', 'Idea', 'public')
      RETURNING id;
    `, [userA]);
    const test1IdeaId = test1IdeaRes.rows[0].id;

    // Add dependent child records (comment, like, bookmark)
    await client.query(`INSERT INTO public.idea_comments (idea_id, user_id, content) VALUES ($1, $2, 'Great idea test comment');`, [test1IdeaId, userA]);
    await client.query(`INSERT INTO public.idea_likes (idea_id, user_id) VALUES ($1, $2);`, [test1IdeaId, userA]);
    await client.query(`INSERT INTO public.idea_bookmarks (idea_id, user_id) VALUES ($1, $2);`, [test1IdeaId, userA]);

    // Check dependencies
    const dep1Res = await client.query(`SELECT public.check_idea_dependencies($1::uuid) AS dep;`, [test1IdeaId]);
    assert(dep1Res.rows[0].dep.has_dependencies === false, "check_idea_dependencies correctly returns has_dependencies=false");

    // Perform deletion
    const del1Res = await client.query(`SELECT public.delete_or_archive_idea($1::uuid, $2::uuid, 'delete') AS res;`, [test1IdeaId, userA]);
    assert(del1Res.rows[0].res.success === true, "delete_or_archive_idea successfully deletes unlinked idea");
    assert(del1Res.rows[0].res.action === "deleted", "Action returned is 'deleted'");

    // Verify row is gone from ideas, comments, likes, bookmarks
    const checkIdeaGone = await client.query(`SELECT COUNT(*) FROM public.ideas WHERE id = $1;`, [test1IdeaId]);
    assert(parseInt(checkIdeaGone.rows[0].count) === 0, "Idea permanently deleted from public.ideas");
    const checkCommentsGone = await client.query(`SELECT COUNT(*) FROM public.idea_comments WHERE idea_id = $1;`, [test1IdeaId]);
    assert(parseInt(checkCommentsGone.rows[0].count) === 0, "Cascaded comments deleted");
    const checkLikesGone = await client.query(`SELECT COUNT(*) FROM public.idea_likes WHERE idea_id = $1;`, [test1IdeaId]);
    assert(parseInt(checkLikesGone.rows[0].count) === 0, "Cascaded likes deleted");
    const checkBookmarksGone = await client.query(`SELECT COUNT(*) FROM public.idea_bookmarks WHERE idea_id = $1;`, [test1IdeaId]);
    assert(parseInt(checkBookmarksGone.rows[0].count) === 0, "Cascaded bookmarks deleted");


    // TEST 2: Delete an idea WITH dependent project -> BLOCKED safely with IDEA_HAS_DEPENDENCIES
    console.log("\n--- TEST 2: Delete an idea WITH dependent project ---");
    const test2IdeaRes = await client.query(`
      INSERT INTO public.ideas (creator_id, title, problem, solution, description, category, stage, visibility)
      VALUES ($1, 'Test Idea 2 With Project', 'A problem statement that is clear and measurable for alpha team.', 'An engineering architecture that provides complete solution.', 'This idea has a linked project that must not be deleted.', 'Web Development', 'Idea', 'public')
      RETURNING id;
    `, [userA]);
    const test2IdeaId = test2IdeaRes.rows[0].id;

    const test2ProjRes = await client.query(`
      INSERT INTO public.projects (owner_id, name, description, idea_id, status)
      VALUES ($1, 'Test Project Alpha', 'A project that references test idea 2 to test referential integrity protection.', $2, 'in_development')
      RETURNING id, name;
    `, [userA, test2IdeaId]);
    const test2ProjId = test2ProjRes.rows[0].id;
    const test2ProjName = test2ProjRes.rows[0].name;

    // Check dependencies
    const dep2Res = await client.query(`SELECT public.check_idea_dependencies($1::uuid) AS dep;`, [test2IdeaId]);
    assert(dep2Res.rows[0].dep.has_dependencies === true, "check_idea_dependencies correctly reports has_dependencies=true");
    assert(dep2Res.rows[0].dep.dependency_count === 1, "Dependency count is 1");
    assert(dep2Res.rows[0].dep.projects[0].id === test2ProjId, "Linked project ID correctly identified in dependencies");
    assert(dep2Res.rows[0].dep.projects[0].name === test2ProjName, "Linked project Name correctly identified in dependencies");

    // Attempt permanent deletion
    const del2Res = await client.query(`SELECT public.delete_or_archive_idea($1::uuid, $2::uuid, 'delete') AS res;`, [test2IdeaId, userA]);
    assert(del2Res.rows[0].res.success === false, "Permanent deletion blocked when dependencies exist");
    assert(del2Res.rows[0].res.code === "IDEA_HAS_DEPENDENCIES", "Structured error code 'IDEA_HAS_DEPENDENCIES' returned");
    assert(del2Res.rows[0].res.dependencies.projects.length === 1, "Structured error contains array of dependent projects");

    // Verify project and idea are BOTH untouched and intact
    const checkProjIntact = await client.query(`SELECT id, idea_id FROM public.projects WHERE id = $1;`, [test2ProjId]);
    assert(checkProjIntact.rows.length === 1 && checkProjIntact.rows[0].idea_id === test2IdeaId, "Project remains completely intact with idea_id preserved");
    const checkIdeaIntact = await client.query(`SELECT id, deleted_at, status FROM public.ideas WHERE id = $1;`, [test2IdeaId]);
    assert(checkIdeaIntact.rows.length === 1 && checkIdeaIntact.rows[0].deleted_at === null, "Idea remains intact in ideas table");


    // TEST 3: Archive an idea WITH dependent project -> SUCCESS
    console.log("\n--- TEST 3: Archive an idea WITH dependent project ---");
    const archRes = await client.query(`SELECT public.delete_or_archive_idea($1::uuid, $2::uuid, 'archive') AS res;`, [test2IdeaId, userA]);
    assert(archRes.rows[0].res.success === true, "delete_or_archive_idea successfully archives idea");
    assert(archRes.rows[0].res.action === "archived", "Action returned is 'archived'");

    const checkArchivedIdea = await client.query(`SELECT status, deleted_at, deleted_by FROM public.ideas WHERE id = $1;`, [test2IdeaId]);
    assert(checkArchivedIdea.rows[0].status === "archived", "Idea status set to 'archived'");
    assert(checkArchivedIdea.rows[0].deleted_at !== null, "deleted_at timestamp recorded");
    assert(checkArchivedIdea.rows[0].deleted_by === userA, "deleted_by user recorded");

    // Verify project STILL retains intact reference to the archived idea
    const checkProjAfterArchive = await client.query(`SELECT id, idea_id FROM public.projects WHERE id = $1;`, [test2ProjId]);
    assert(checkProjAfterArchive.rows[0].idea_id === test2IdeaId, "Project continuity preserved: project.idea_id still points to idea");


    // TEST 4: Unauthorized user cannot delete or archive another user's idea
    console.log("\n--- TEST 4: Unauthorized user cannot delete/archive another user's idea ---");
    const unauthDelRes = await client.query(`SELECT public.delete_or_archive_idea($1::uuid, $2::uuid, 'delete') AS res;`, [test2IdeaId, userB]);
    assert(unauthDelRes.rows[0].res.success === false, "Unauthorized delete rejected");
    assert(unauthDelRes.rows[0].res.code === "UNAUTHORIZED", "Returns UNAUTHORIZED code");

    const unauthArchRes = await client.query(`SELECT public.delete_or_archive_idea($1::uuid, $2::uuid, 'archive') AS res;`, [test2IdeaId, userB]);
    assert(unauthArchRes.rows[0].res.success === false, "Unauthorized archive rejected");
    assert(unauthArchRes.rows[0].res.code === "UNAUTHORIZED", "Returns UNAUTHORIZED code");


    // TEST 5: Archived ideas do NOT appear in public discovery / feeds
    console.log("\n--- TEST 5: Archived ideas hidden from public discovery ---");
    const publicDiscoveryRes = await client.query(`
      SELECT id, title
      FROM public.ideas
      WHERE deleted_at IS NULL
        AND coalesce(status, 'active') <> 'archived'
        AND id = $1;
    `, [test2IdeaId]);
    assert(publicDiscoveryRes.rows.length === 0, "Archived idea excluded from public discovery queries");


    // TEST 6: Active project continues to function normally
    console.log("\n--- TEST 6: Project functions normally after idea archived ---");
    const projQueryRes = await client.query(`
      SELECT p.id, p.name, p.status, p.idea_id, i.title AS idea_title, i.status AS idea_status
      FROM public.projects p
      LEFT JOIN public.ideas i ON p.idea_id = i.id
      WHERE p.id = $1;
    `, [test2ProjId]);
    assert(projQueryRes.rows.length === 1, "Project query succeeds");
    assert(projQueryRes.rows[0].idea_title === "Test Idea 2 With Project", "Project can still join and read original idea details");
    assert(projQueryRes.rows[0].idea_status === "archived", "Joined idea status is archived");


    // TEST 7: Badge re-evaluation ignores archived ideas
    console.log("\n--- TEST 7: Badge re-evaluation ignores archived ideas ---");
    const badgeEvalRes = await client.query(`
      SELECT public.evaluate_and_sync_user_badges($1::uuid) AS eval;
    `, [userA]);
    assert(badgeEvalRes.rows[0].eval.success === true, "evaluate_and_sync_user_badges succeeds");
    const metrics = badgeEvalRes.rows[0].eval.metrics;
    console.log(`User A metrics: ideas_count=${metrics.ideas_count}, projects_count=${metrics.projects_count}`);
    // Check that ideas_count only counted active unarchived ideas
    const actualActiveIdeas = await client.query(`
      SELECT COUNT(*)
      FROM public.ideas
      WHERE creator_id = $1
        AND deleted_at IS NULL
        AND coalesce(status, 'active') = 'active'
        AND title IS NOT NULL
        AND length(trim(title)) >= 5
        AND (
          length(trim(coalesce(description, ''))) >= 50
          OR (length(trim(coalesce(problem, ''))) >= 20 AND length(trim(coalesce(solution, ''))) >= 20)
          OR validation_status IN ('testing', 'validated')
        );
    `, [userA]);
    assert(metrics.ideas_count === parseInt(actualActiveIdeas.rows[0].count), "Badge evaluation ideas_count strictly matches active unarchived count");


    // TEST 8: Real production reproduction case verification ("jarvis" -> "e9490542-985f-4c1e-b350-1756569530ae")
    console.log("\n--- TEST 8: Real production reproduction case verification ---");
    const prodIdeaId = "e9490542-985f-4c1e-b350-1756569530ae";
    const prodIdea = await client.query(`SELECT id, creator_id, title FROM public.ideas WHERE id = $1;`, [prodIdeaId]);
    if (prodIdea.rows.length > 0) {
      const prodCreatorId = prodIdea.rows[0].creator_id;
      const prodDep = await client.query(`SELECT public.check_idea_dependencies($1::uuid) AS dep;`, [prodIdeaId]);
      assert(prodDep.rows[0].dep.has_dependencies === true, "Production idea dependency check identifies connected project 'jarvis'");

      const prodDelAttempt = await client.query(`
        SELECT public.delete_or_archive_idea($1::uuid, $2::uuid, 'delete') AS res;
      `, [prodIdeaId, prodCreatorId]);
      assert(prodDelAttempt.rows[0].res.success === false, "Production deletion safely blocked with zero FK errors");
      assert(prodDelAttempt.rows[0].res.code === "IDEA_HAS_DEPENDENCIES", "Returns structured code IDEA_HAS_DEPENDENCIES");

      // Verify jarvis project is intact
      const jarvisCheck = await client.query(`SELECT id, name, idea_id FROM public.projects WHERE idea_id = $1;`, [prodIdeaId]);
      assert(jarvisCheck.rows.length > 0, "Project 'jarvis' remains 100% intact with no data loss");
    } else {
      console.log("[SKIP] Production idea e9490542-985f-4c1e-b350-1756569530ae not found in DB.");
    }


    // CLEANUP
    console.log("\n--- CLEANUP ---");
    await client.query(`DELETE FROM public.projects WHERE id = $1;`, [test2ProjId]);
    // Now that project is deleted, test2Idea has no dependencies and can be permanently deleted!
    const cleanDel = await client.query(`SELECT public.delete_or_archive_idea($1::uuid, $2::uuid, 'delete') AS res;`, [test2IdeaId, userA]);
    assert(cleanDel.rows[0].res.success === true, "Idea can now be permanently deleted after project is unlinked/deleted");
    console.log("Cleanup completed.");

  } catch (err) {
    console.error("Test pipeline encountered unexpected error:", err);
    failed++;
  } finally {
    await client.end();
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
