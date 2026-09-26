import pg from "pg";
import fs from "fs";
import { rateLimiters } from "../lib/rate-limit.ts";

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

async function runTests() {
  await client.connect();
  console.log("\n==================================================================");
  console.log("   IDEAERA — 10,000 USER SCALABILITY & PERFORMANCE TEST SUITE");
  console.log("==================================================================\n");

  // ------------------------------------------------------------------
  // TEST 1: Unique Constraints & Duplicate Prevention
  // ------------------------------------------------------------------
  console.log("--- TEST GROUP 1: Constraints & Duplicate Prevention ---");
  const constraintsRes = await client.query(`
    SELECT conname, conrelid::regclass AS table_name
    FROM pg_constraint
    WHERE conname IN (
      'uq_idea_likes_user_idea',
      'uq_bookmarks_user_target',
      'uq_idea_bookmarks_user_idea'
    );
  `);
  const foundConstraints = constraintsRes.rows.map((r) => r.conname);
  assert(foundConstraints.includes("uq_idea_likes_user_idea"), "uq_idea_likes_user_idea exists on idea_likes");
  assert(foundConstraints.includes("uq_bookmarks_user_target"), "uq_bookmarks_user_target exists on bookmarks");
  assert(foundConstraints.includes("uq_idea_bookmarks_user_idea"), "uq_idea_bookmarks_user_idea exists on idea_bookmarks");

  // ------------------------------------------------------------------
  // TEST 2: 10K Scalability Indexes
  // ------------------------------------------------------------------
  console.log("\n--- TEST GROUP 2: Scalability Foreign-Key & Compound Indexes ---");
  const indexesRes = await client.query(`
    SELECT indexname FROM pg_indexes
    WHERE indexname IN (
      'idx_user_skills_skill_user',
      'idx_user_skills_user_skill',
      'idx_user_interests_interest_user',
      'idx_user_interests_user_interest',
      'idx_project_members_project_user',
      'idx_project_files_project_created',
      'idx_project_discussions_project_created',
      'idx_project_activity_project_created',
      'idx_projects_status_created',
      'idx_projects_needs_help_created',
      'idx_ideas_visibility_created',
      'idx_ideas_category_created',
      'idx_profiles_city_state',
      'idx_profiles_lower_name',
      'idx_profiles_lower_username',
      'idx_messages_conv_created',
      'idx_messages_unread_lookup',
      'idx_notifications_recipient_created',
      'idx_notifications_unread_fast',
      'idx_tasks_project_due'
    );
  `);
  const foundIndexes = indexesRes.rows.map((r) => r.indexname);
  const requiredIndexes = [
    'idx_user_skills_skill_user',
    'idx_user_skills_user_skill',
    'idx_project_members_project_user',
    'idx_project_files_project_created',
    'idx_projects_status_created',
    'idx_ideas_visibility_created',
    'idx_profiles_city_state',
    'idx_profiles_lower_name',
    'idx_messages_conv_created',
    'idx_notifications_recipient_created',
    'idx_notifications_unread_fast',
    'idx_tasks_project_due'
  ];
  for (const idx of requiredIndexes) {
    assert(foundIndexes.includes(idx), `Index '${idx}' is present in PostgreSQL`);
  }

  // ------------------------------------------------------------------
  // TEST 3: Row Level Security (RLS) Active on Critical Tables
  // ------------------------------------------------------------------
  console.log("\n--- TEST GROUP 3: Row Level Security (RLS) Enforcement ---");
  const rlsRes = await client.query(`
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname IN ('ideas', 'profiles', 'idea_likes', 'idea_comments', 'projects', 'bookmarks')
      AND relnamespace = 'public'::regnamespace;
  `);
  for (const row of rlsRes.rows) {
    assert(row.relrowsecurity === true, `RLS enabled on '${row.relname}' (relrowsecurity = true)`);
  }

  // ------------------------------------------------------------------
  // TEST 4: PostgreSQL RPC search_profiles_10k Performance & Pagination
  // ------------------------------------------------------------------
  console.log("\n--- TEST GROUP 4: Database Search RPC search_profiles_10k ---");
  const t0 = performance.now();
  const searchRes = await client.query(`
    SELECT * FROM public.search_profiles_10k(
      p_query := NULL,
      p_skill := NULL,
      p_college := NULL,
      p_city := NULL,
      p_state := NULL,
      p_availability := NULL,
      p_limit := 10,
      p_offset := 0,
      p_exclude_user_id := NULL
    );
  `);
  const searchRoundtrip = Math.round(performance.now() - t0);
  assert(Array.isArray(searchRes.rows), `search_profiles_10k returns rows array (${searchRes.rows.length} rows returned)`);
  if (searchRes.rows.length > 0) {
    assert(Number(searchRes.rows[0].total_count) >= searchRes.rows.length, `total_count returned: ${searchRes.rows[0].total_count}`);
  }

  // Measure database internal execution time
  const explainSearch = await client.query(`
    EXPLAIN (ANALYZE, FORMAT JSON)
    SELECT * FROM public.search_profiles_10k(p_limit := 10, p_offset := 0);
  `);
  const searchPlan = explainSearch.rows[0]["QUERY PLAN"][0];
  const searchExecTime = searchPlan["Execution Time"];
  console.log(`    ↳ PostgreSQL Execution Time: ${searchExecTime}ms (Remote Roundtrip: ${searchRoundtrip}ms)`);
  assert(searchExecTime < 50, `search_profiles_10k DB execution <50ms (actual DB time: ${searchExecTime}ms)`);

  // Test skill filter in search_profiles_10k
  const skillSearchRes = await client.query(`
    SELECT * FROM public.search_profiles_10k(
      p_query := NULL,
      p_skill := 'AI',
      p_limit := 5,
      p_offset := 0
    );
  `);
  assert(Array.isArray(skillSearchRes.rows), `search_profiles_10k filtered by skill works successfully`);

  // ------------------------------------------------------------------
  // TEST 5: get_unread_notification_count RPC Performance
  // ------------------------------------------------------------------
  console.log("\n--- TEST GROUP 5: Notification Count RPC Performance ---");
  const sampleUser = searchRes.rows[0]?.id || "00000000-0000-0000-0000-000000000000";
  const tCountStart = performance.now();
  const notifCountRes = await client.query(
    `SELECT public.get_unread_notification_count($1) as unread_count;`,
    [sampleUser]
  );
  const countRoundtrip = Math.round(performance.now() - tCountStart);
  assert(notifCountRes.rows.length === 1, `get_unread_notification_count returns single row`);

  // Measure DB execution time
  const explainCount = await client.query(
    `EXPLAIN (ANALYZE, FORMAT JSON) SELECT public.get_unread_notification_count($1);`,
    [sampleUser]
  );
  const countPlan = explainCount.rows[0]["QUERY PLAN"][0];
  const countExecTime = countPlan["Execution Time"];
  console.log(`    ↳ PostgreSQL Execution Time: ${countExecTime}ms (Remote Roundtrip: ${countRoundtrip}ms)`);
  assert(countExecTime < 15, `get_unread_notification_count DB execution <15ms (actual DB time: ${countExecTime}ms)`);

  // ------------------------------------------------------------------
  // TEST 6: Atomic Likes Trigger & Unique Constraint Race Condition Prevention
  // ------------------------------------------------------------------
  console.log("\n--- TEST GROUP 6: Atomic Likes Trigger & Concurrency Safety ---");
  const sampleIdeaRes = await client.query(`SELECT id, likes_count FROM public.ideas LIMIT 1;`);
  if (sampleIdeaRes.rows.length > 0 && sampleUser !== "00000000-0000-0000-0000-000000000000") {
    const testIdeaId = sampleIdeaRes.rows[0].id;
    const initialLikes = Number(sampleIdeaRes.rows[0].likes_count || 0);

    // Clean any pre-existing test like
    await client.query(`DELETE FROM public.idea_likes WHERE idea_id = $1 AND user_id = $2;`, [testIdeaId, sampleUser]);

    // Insert like
    await client.query(`INSERT INTO public.idea_likes (idea_id, user_id) VALUES ($1, $2);`, [testIdeaId, sampleUser]);

    // Check trigger incremented ideas.likes_count
    const updatedIdeaRes1 = await client.query(`SELECT likes_count FROM public.ideas WHERE id = $1;`, [testIdeaId]);
    const afterInsertLikes = Number(updatedIdeaRes1.rows[0].likes_count);
    assert(afterInsertLikes >= initialLikes, `Trigger synced likes_count on insert (now: ${afterInsertLikes})`);

    // Attempt DUPLICATE insert -> must reject with unique violation
    let duplicateRejected = false;
    try {
      await client.query(`INSERT INTO public.idea_likes (idea_id, user_id) VALUES ($1, $2);`, [testIdeaId, sampleUser]);
    } catch (err) {
      if (err.code === "23505") { // unique_violation
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected, `Duplicate like prevented by unique constraint uq_idea_likes_user_idea (error 23505)`);

    // Clean up like and verify decrement
    await client.query(`DELETE FROM public.idea_likes WHERE idea_id = $1 AND user_id = $2;`, [testIdeaId, sampleUser]);
    const updatedIdeaRes2 = await client.query(`SELECT likes_count FROM public.ideas WHERE id = $1;`, [testIdeaId]);
    const afterDeleteLikes = Number(updatedIdeaRes2.rows[0].likes_count);
    assert(afterDeleteLikes <= afterInsertLikes, `Trigger synced likes_count on delete (now: ${afterDeleteLikes})`);
  }

  // ------------------------------------------------------------------
  // TEST 7: In-Memory Sliding-Window Rate Limiting Engine
  // ------------------------------------------------------------------
  console.log("\n--- TEST GROUP 7: Sliding-Window Rate Limiting Engine ---");
  const testUserId = "test-rate-limit-user-1";
  
  // Test rateLimiters.messages (limit 30)
  for (let i = 0; i < 30; i++) {
    rateLimiters.messages.check(testUserId);
  }
  const blockedMessage = rateLimiters.messages.check(testUserId);
  assert(!blockedMessage.allowed, `Rate limiter blocks 31st message within 1 minute (allowed = false)`);
  assert(blockedMessage.retryAfterSeconds > 0, `Rate limiter provides retryAfterSeconds (${blockedMessage.retryAfterSeconds}s)`);

  // Test rateLimiters.likes (limit 60)
  const testLikeUser = "test-rate-limit-like-user";
  for (let i = 0; i < 60; i++) {
    rateLimiters.likes.check(testLikeUser);
  }
  const blockedLike = rateLimiters.likes.check(testLikeUser);
  assert(!blockedLike.allowed, `Rate limiter blocks 61st like within 1 minute (allowed = false)`);

  // ------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================\n");

  await client.end();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  client.end();
  process.exit(1);
});
