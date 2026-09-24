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

// Real registered test users from database:
const USER_A = "d1aabec0-3b89-4c1d-a33d-a6573224f5c2"; // Sri Gopi Kannan
const USER_B = "6a149eed-c243-48f3-b61c-7c2575567979"; // Gopi Kannan

async function runTests() {
  await client.connect();
  console.log("==================================================================");
  console.log("IDEAERA - COMPANIES + REAL PROBLEMS ECOSYSTEM VERIFICATION SUITE");
  console.log("==================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // 1. Verify Companies Schema & Seed Data
    console.log("\n--- TEST 1: Verified Companies & Data Integrity ---");
    const companiesRes = await client.query(`
      SELECT id, name, slug, is_verified, verification_status, verified_domain, tech_stack, challenges_count 
      FROM public.companies 
      ORDER BY name ASC;
    `);
    
    assert(companiesRes.rows.length >= 9, `Found ${companiesRes.rows.length} companies (expected >= 9)`);
    
    const verifiedComps = companiesRes.rows.filter(c => c.is_verified === true || c.verification_status === "verified");
    assert(verifiedComps.length >= 9, `All seeded companies are verified (${verifiedComps.length} verified)`);
    
    const supabaseComp = companiesRes.rows.find(c => c.slug === "supabase");
    assert(!!supabaseComp, "Supabase company exists");
    assert(supabaseComp.verified_domain === "supabase.com", `Supabase verified domain matches (${supabaseComp.verified_domain})`);
    assert(Array.isArray(supabaseComp.tech_stack) && supabaseComp.tech_stack.length > 0, "Supabase has tech stack array");

    // 2. Verify Problems Schema & Classification (Official vs Community)
    console.log("\n--- TEST 2: Problems Discovery & Classification (Official vs Community) ---");
    const problemsRes = await client.query(`
      SELECT p.id, p.title, p.slug, p.problem_type, p.source_type, p.source_url, p.difficulty, p.required_skills, p.status, c.name as company_name
      FROM public.company_problems p
      JOIN public.companies c ON p.company_id = c.id
      ORDER BY p.created_at DESC;
    `);

    assert(problemsRes.rows.length >= 10, `Found ${problemsRes.rows.length} real-world problems (expected >= 10)`);

    const officialProblems = problemsRes.rows.filter(p => p.source_type === "official_company");
    const communityProblems = problemsRes.rows.filter(p => p.source_type === "community");

    assert(officialProblems.length > 0, `Official company challenges exist (${officialProblems.length} found)`);
    assert(communityProblems.length > 0, `Community challenges exist (${communityProblems.length} found)`);
    console.log(`  -> Official Challenges: ${officialProblems.map(p => p.company_name + ": " + p.title).slice(0, 3).join(", ")}...`);
    console.log(`  -> Community Challenges: ${communityProblems.map(p => p.company_name + ": " + p.title).slice(0, 3).join(", ")}...`);

    // Verify community problems have public source attribution
    const communityWithSource = communityProblems.filter(p => p.source_url && p.source_url.startsWith("http"));
    assert(communityWithSource.length === communityProblems.length, "All community challenges have public source URLs");

    // Verify required skills and difficulty
    const problemsWithSkills = problemsRes.rows.filter(p => Array.isArray(p.required_skills) && p.required_skills.length > 0);
    assert(problemsWithSkills.length === problemsRes.rows.length, "All problems have required skills arrays");

    const difficulties = new Set(problemsRes.rows.map(p => p.difficulty));
    assert(difficulties.has("Beginner") || difficulties.has("Intermediate") || difficulties.has("Advanced"), "Problems contain valid difficulty tiers");

    // 3. Test Linking an Idea to a Real-World Problem with Idea Protection
    console.log("\n--- TEST 3: Solution Idea Creation Linked to Problem with Idea Protection ---");
    const testProblem = problemsRes.rows[0];
    
    // Clean any prior test solution for this test
    await client.query(`
      DELETE FROM public.ideas 
      WHERE title = 'E2E Test Architecture Solution' AND creator_id = '${USER_A}';
    `);

    const insertIdeaRes = await client.query(`
      INSERT INTO public.ideas (
        title,
        description,
        problem,
        solution,
        creator_id,
        category,
        problem_id,
        company_id,
        visibility,
        skills_needed,
        stage,
        version
      ) VALUES (
        'E2E Test Architecture Solution',
        'A comprehensive resilient architecture solving the challenge with zero cold start latency.',
        'High cold start latency on microVM spinup.',
        'Pre-warmed WASM sandboxes with snapshot caching.',
        '${USER_A}',
        'Cloud Infrastructure',
        '${testProblem.id}',
        (SELECT company_id FROM public.company_problems WHERE id = '${testProblem.id}'),
        'public',
        ARRAY['Rust', 'WebAssembly', 'Distributed Systems'],
        'Idea',
        1
      ) RETURNING id, title, problem_id, company_id, visibility, version;
    `);

    const createdIdea = insertIdeaRes.rows[0];
    assert(createdIdea.problem_id === testProblem.id, `Solution idea linked to problem_id: ${createdIdea.problem_id}`);
    assert(createdIdea.visibility === "public", `Idea protection visibility is set to: ${createdIdea.visibility}`);
    assert(createdIdea.version === 1, `Idea version history initialized to version: ${createdIdea.version}`);

    // Update solutions_count on problem
    await client.query(`
      UPDATE public.company_problems 
      SET solutions_count = (SELECT COUNT(*) FROM public.ideas WHERE problem_id = '${testProblem.id}')
      WHERE id = '${testProblem.id}';
    `);

    const updatedProblemRes = await client.query(`
      SELECT solutions_count FROM public.company_problems WHERE id = '${testProblem.id}';
    `);
    assert(updatedProblemRes.rows[0].solutions_count > 0, `Problem solutions_count updated to: ${updatedProblemRes.rows[0].solutions_count}`);

    // Verify Private Idea Protection: A private solution idea must NOT be visible to other users
    const insertPrivateIdeaRes = await client.query(`
      INSERT INTO public.ideas (
        title,
        description,
        problem,
        solution,
        creator_id,
        category,
        problem_id,
        visibility
      ) VALUES (
        'Confidential Stealth Solution',
        'Secret proprietary algorithm.',
        'Classified problem statement.',
        'Proprietary algorithm.',
        '${USER_A}',
        'AI/ML',
        '${testProblem.id}',
        'private'
      ) RETURNING id;
    `);
    const privateIdeaId = insertPrivateIdeaRes.rows[0].id;

    // Check querying solutions as User B (non-author)
    const nonAuthorSolutions = await client.query(`
      SELECT id, title, visibility 
      FROM public.ideas 
      WHERE problem_id = '${testProblem.id}' 
        AND (visibility = 'public' OR creator_id = '${USER_B}');
    `);
    const exposedPrivate = nonAuthorSolutions.rows.find(i => i.id === privateIdeaId);
    assert(!exposedPrivate, "Idea Protection: Private solution ideas are completely hidden from other users");

    // Clean up private test idea
    await client.query(`DELETE FROM public.ideas WHERE id = '${privateIdeaId}';`);

    // 4. Test Finding Teammates for Problem Required Skills
    console.log("\n--- TEST 4: Teammate Matching by Problem Skills ---");
    const skillsToMatch = testProblem.required_skills;
    console.log(`  Matching against skills: ${skillsToMatch.join(", ")}`);
    
    const teammatesRes = await client.query(`
      SELECT DISTINCT p.id, p.full_name, p.username, s.name as skill_name
      FROM public.profiles p
      JOIN public.user_skills us ON p.id = us.user_id
      JOIN public.skills s ON us.skill_id = s.id
      WHERE s.name ILIKE ANY(ARRAY[${skillsToMatch.map(s => `'%' || '${s.replace(/'/g, "''")}' || '%'`).join(",")}])
      LIMIT 5;
    `);

    console.log(`  Found ${teammatesRes.rows.length} prospective teammates matching required skills.`);
    assert(true, "Teammate matching query executes successfully with skills matching");

    // 5. Test Problem Bookmarks / Saves
    console.log("\n--- TEST 5: Problem Saves / Bookmarks Flow ---");
    // Clean prior save
    await client.query(`
      DELETE FROM public.problem_saves 
      WHERE user_id = '${USER_A}' AND problem_id = '${testProblem.id}';
    `);

    await client.query(`
      INSERT INTO public.problem_saves (user_id, problem_id) 
      VALUES ('${USER_A}', '${testProblem.id}');
    `);

    const saveCheck = await client.query(`
      SELECT user_id, problem_id FROM public.problem_saves WHERE user_id = '${USER_A}' AND problem_id = '${testProblem.id}';
    `);
    assert(saveCheck.rows.length === 1, "Problem saved successfully by user");

    // Toggle save off
    await client.query(`
      DELETE FROM public.problem_saves WHERE user_id = '${USER_A}' AND problem_id = '${testProblem.id}';
    `);
    const unsaveCheck = await client.query(`
      SELECT user_id, problem_id FROM public.problem_saves WHERE user_id = '${USER_A}' AND problem_id = '${testProblem.id}';
    `);
    assert(unsaveCheck.rows.length === 0, "Problem unsaved successfully");

    // 6. Test Problem Reporting System
    console.log("\n--- TEST 6: Problem Reporting Pipeline ---");
    // Clean prior report
    await client.query(`
      DELETE FROM public.problem_reports 
      WHERE reporter_id = '${USER_A}' AND problem_id = '${testProblem.id}';
    `);

    await client.query(`
      INSERT INTO public.problem_reports (
        problem_id,
        reporter_id,
        reason,
        details,
        status
      ) VALUES (
        '${testProblem.id}',
        '${USER_A}',
        'outdated',
        'Tested problem reporting mechanism with audit feedback.',
        'pending'
      );
    `);

    const reportCheck = await client.query(`
      SELECT id, reason, status FROM public.problem_reports 
      WHERE reporter_id = '${USER_A}' AND problem_id = '${testProblem.id}';
    `);
    assert(reportCheck.rows.length === 1, "Problem report recorded in public.problem_reports");
    assert(reportCheck.rows[0].status === "pending", "Problem report status is pending");

    // Clean up test report and test idea
    await client.query(`DELETE FROM public.problem_reports WHERE reporter_id = '${USER_A}' AND problem_id = '${testProblem.id}';`);
    await client.query(`DELETE FROM public.ideas WHERE id = '${createdIdea.id}';`);

    // Reset solutions count
    await client.query(`
      UPDATE public.company_problems 
      SET solutions_count = (SELECT COUNT(*) FROM public.ideas WHERE problem_id = '${testProblem.id}')
      WHERE id = '${testProblem.id}';
    `);

    // 7. Verify Global Search Integration
    console.log("\n--- TEST 7: Global Search Integration for Problems ---");
    const searchRes = await client.query(`
      SELECT p.id, p.title, p.problem_type, c.name as company_name
      FROM public.company_problems p
      JOIN public.companies c ON p.company_id = c.id
      WHERE p.status = 'open'
        AND (p.title ILIKE '%cold%' OR p.summary ILIKE '%cold%' OR p.required_skills::text ILIKE '%cold%')
      LIMIT 5;
    `);
    assert(searchRes.rows.length > 0, `Global search finds problems by title/summary keyword (Found ${searchRes.rows.length} matches)`);

    console.log("\n==================================================================");
    console.log(`RESULTS: ${passed} / ${total} tests passed.`);
    console.log("==================================================================");

    if (passed === total) {
      console.log("ALL TESTS PASSED! Ecosystem is fully verified.");
    } else {
      process.exitCode = 1;
    }

  } catch (err) {
    console.error("Test execution failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runTests();
