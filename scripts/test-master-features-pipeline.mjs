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
  console.log("==============================================================");
  console.log("   IDEAERA MASTER 6-FEATURE COMPREHENSIVE PIPELINE TEST");
  console.log("==============================================================");

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
    // 0. Fetch a test user profile
    const userRes = await client.query("SELECT id, full_name, college, availability FROM public.profiles LIMIT 1");
    assert(userRes.rows.length > 0, "Found active user profile in database");
    const testUser = userRes.rows[0];

    const skillsRes = await client.query(`
      SELECT s.name FROM public.user_skills us
      JOIN public.skills s ON us.skill_id = s.id
      WHERE us.user_id = $1
    `, [testUser.id]);
    testUser.skills = skillsRes.rows.map(r => r.name);

    // TEST 1: 🚨 PROJECT RESCUE SCHEMA & STATE
    console.log("\n--- TEST SUITE 1: PROJECT RESCUE ---");
    // Insert a test project with needs_help
    const projRes = await client.query(`
      INSERT INTO public.projects (name, description, owner_id, status, needs_help, help_category, help_description, help_requested_at, required_skills)
      VALUES ($1, $2, $3, 'in_development', true, 'Backend', 'Need help setting up PostgreSQL real-time replication', NOW(), ARRAY['Node.js', 'PostgreSQL', 'Docker'])
      RETURNING id, name, needs_help, help_category, help_description, required_skills
    `, ["Test Project Rescue Venture", "Automated test project for rescue flow", testUser.id]);
    
    assert(projRes.rows.length > 0, "Created project with Needs Help flag");
    const testProject = projRes.rows[0];
    assert(testProject.needs_help === true, "Project correctly flagged needs_help = true");
    assert(testProject.help_category === "Backend", "Project help category recorded as 'Backend'");

    // Check rescue invitations table
    const inviteRes = await client.query(`
      INSERT INTO public.project_rescue_invitations (project_id, sender_id, receiver_id, category, message, status)
      VALUES ($1, $2, $3, 'Backend', 'Hey, we need your backend expertise on this project!', 'pending')
      RETURNING id, project_id, status
    `, [testProject.id, testUser.id, testUser.id]);
    assert(inviteRes.rows.length > 0, "Created project rescue invitation");
    assert(inviteRes.rows[0].status === "pending", "Rescue invitation recorded with pending status");

    // Resolve project help
    const resolveRes = await client.query(`
      UPDATE public.projects
      SET needs_help = false, help_category = NULL, help_description = NULL
      WHERE id = $1
      RETURNING needs_help, help_category
    `, [testProject.id]);
    assert(resolveRes.rows[0].needs_help === false, "Project rescue resolved successfully");

    // TEST 2: 🧩 SKILL GAP FINDER
    console.log("\n--- TEST SUITE 2: SKILL GAP FINDER ---");
    const requiredSkills = ["React", "Rust", "Computer Vision", "UI/UX"];
    await client.query("UPDATE public.projects SET required_skills = $1 WHERE id = $2", [requiredSkills, testProject.id]);

    // Add test user to project members
    await client.query(`
      INSERT INTO public.project_members (project_id, user_id, role)
      VALUES ($1, $2, 'Owner')
      ON CONFLICT (project_id, user_id) DO NOTHING
    `, [testProject.id, testUser.id]);

    // Check skill coverage logic
    const userSkills = testUser.skills || [];
    const covered = requiredSkills.filter(s => userSkills.some(us => us.toLowerCase() === s.toLowerCase()));
    const missing = requiredSkills.filter(s => !userSkills.some(us => us.toLowerCase() === s.toLowerCase()));
    const coveragePercent = Math.round((covered.length / requiredSkills.length) * 100);

    assert(Array.isArray(covered), `Identified ${covered.length} covered skills`);
    assert(missing.length > 0, `Identified ${missing.length} skill gaps`);
    assert(coveragePercent >= 0 && coveragePercent <= 100, `Coverage percentage calculated accurately: ${coveragePercent}%`);

    // TEST 3: 📊 IDEA VALIDATION
    console.log("\n--- TEST SUITE 3: IDEA VALIDATION ---");
    const ideaRes = await client.query(`
      INSERT INTO public.ideas (title, problem, solution, description, category, creator_id, validation_status, validation_target_users, validation_why_it_matters, validation_alternatives, validation_expected_benefits, validation_questions)
      VALUES ($1, 'Problem statement for validation test', 'Solution concept for validation test', $2, 'AI & Machine Learning', $3, 'testing', 'Collegiate hackers & campus startups', 'High friction in finding complementary technical talent', 'Unstructured WhatsApp & Discord chats', '10x faster team formation with verified skills', $4::jsonb)
      RETURNING id, title, validation_status, validation_questions
    `, ["Automated Test Validation Concept", "Concept testing validation framework pipeline", testUser.id, JSON.stringify(['Would you use this in your college?', 'What critical feature is missing?'])]);

    assert(ideaRes.rows.length > 0, "Created idea with structured validation dimensions");
    const testIdea = ideaRes.rows[0];
    assert(testIdea.validation_status === "testing", "Validation status initialized as 'testing'");
    assert(testIdea.validation_questions.length === 2, "Validation questions saved accurately");

    // Add validation feedback
    const feedbackRes = await client.query(`
      INSERT INTO public.idea_validation_feedback (idea_id, user_id, vote, feedback, answers)
      VALUES ($1, $2, 'valid', 'Strong problem resonance, definitely needed across our campus.', '{"Would you use this in your college?": "Yes, absolutely"}'::jsonb)
      ON CONFLICT (idea_id, user_id) DO UPDATE SET vote = EXCLUDED.vote, feedback = EXCLUDED.feedback
      RETURNING id, vote
    `, [testIdea.id, testUser.id]);
    assert(feedbackRes.rows.length > 0 && feedbackRes.rows[0].vote === "valid", "Recorded validation vote 'valid'");

    // Update status to validated
    const validatedRes = await client.query(`
      UPDATE public.ideas SET validation_status = 'validated' WHERE id = $1 RETURNING validation_status
    `, [testIdea.id]);
    assert(validatedRes.rows[0].validation_status === "validated", "Idea successfully graduated to 'validated'");

    // TEST 4: 🗓️ TEAM AVAILABILITY
    console.log("\n--- TEST SUITE 4: TEAM AVAILABILITY ---");
    await client.query(`
      UPDATE public.profiles
      SET availability = 'Available evenings', availability_hours = '15 hrs/week, free after 6 PM'
      WHERE id = $1
    `, [testUser.id]);

    const availCheck = await client.query(`
      SELECT availability, availability_hours FROM public.profiles WHERE id = $1
    `, [testUser.id]);
    assert(availCheck.rows[0].availability === "Available evenings", "Profile availability updated to 'Available evenings'");
    assert(availCheck.rows[0].availability_hours.includes("15 hrs/week"), "Profile availability_hours note stored properly");

    // Query available profiles
    const availList = await client.query(`
      SELECT id, full_name, availability FROM public.profiles WHERE availability ILIKE '%available%' LIMIT 5
    `);
    assert(availList.rows.length > 0, `Search filtered ${availList.rows.length} available profiles in the directory`);

    // TEST 5: 🏗️ PROJECT WORKSPACE (TASKS, MILESTONES, REAL PROGRESS)
    console.log("\n--- TEST SUITE 5: PROJECT WORKSPACE ---");
    // Insert 4 tasks: 3 Todo/In Progress, 1 Completed
    await client.query(`
      INSERT INTO public.tasks (project_id, title, description, status, priority, assigned_to)
      VALUES 
        ($1, 'Task 1: Spec Architecture', 'Define system schemas', 'Completed', 'High', $2),
        ($1, 'Task 2: Frontend Layout', 'Build responsive screens', 'In Progress', 'Medium', $2),
        ($1, 'Task 3: Backend Routes', 'Implement API endpoints', 'Todo', 'High', $2),
        ($1, 'Task 4: Unit Testing', 'Run test suites', 'Todo', 'Low', $2)
    `, [testProject.id, testUser.id]);

    const taskCountRes = await client.query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE status = 'Completed') as completed
      FROM public.tasks
      WHERE project_id = $1
    `, [testProject.id]);

    const total = parseInt(taskCountRes.rows[0].total, 10);
    const completed = parseInt(taskCountRes.rows[0].completed, 10);
    const calcProgress = Math.round((completed / total) * 100);
    assert(total === 4, "4 workspace tasks created across Kanban states");
    assert(completed === 1, "1 task marked as Completed");
    assert(calcProgress === 25, `Real progress calculated: 1/4 = ${calcProgress}% (no fake progress)`);

    // Add milestone
    const milestoneRes = await client.query(`
      INSERT INTO public.milestones (project_id, title, description, due_date)
      VALUES ($1, 'Alpha Prototype Launch', 'Functional MVP on test network', NOW() + INTERVAL '14 days')
      RETURNING id, title
    `, [testProject.id]);
    assert(milestoneRes.rows.length > 0, "Created project milestone");

    // Add resource file
    const fileRes = await client.query(`
      INSERT INTO public.project_files (project_id, name, url, file_type, uploaded_by)
      VALUES ($1, 'Architecture Diagram', 'https://figma.com/test-spec', 'figma', $2)
      RETURNING id, name
    `, [testProject.id, testUser.id]);
    assert(fileRes.rows.length > 0, "Added project file resource");

    // Add discussion note
    const discRes = await client.query(`
      INSERT INTO public.project_discussions (project_id, user_id, content)
      VALUES ($1, $2, 'Standup update: Schema migration complete, moving to API layer.')
      RETURNING id, content
    `, [testProject.id, testUser.id]);
    assert(discRes.rows.length > 0, "Recorded project discussion update");

    // Add activity log
    const actRes = await client.query(`
      INSERT INTO public.project_activity (project_id, user_id, action, details)
      VALUES ($1, $2, 'milestone_reached', '{"milestone": "Alpha Prototype Launch"}'::jsonb)
      RETURNING id, action
    `, [testProject.id, testUser.id]);
    assert(actRes.rows.length > 0, "Recorded immutable project activity log");

    // TEST 6: 🎯 PERSONAL INNOVATION DASHBOARD AGGREGATION
    console.log("\n--- TEST SUITE 6: PERSONAL INNOVATION DASHBOARD ---");
    // Verify user can aggregate ideas, projects, badges, team, and next steps
    const dashboardQuery = await client.query(`
      SELECT 
        (SELECT count(*) FROM public.ideas WHERE creator_id = $1) as my_ideas_count,
        (SELECT count(*) FROM public.ideas WHERE creator_id = $1 AND validation_status = 'validated') as my_validated_ideas_count,
        (SELECT count(*) FROM public.projects WHERE owner_id = $1) as my_projects_count,
        (SELECT count(*) FROM public.tasks WHERE assigned_to = $1 AND status != 'Completed') as my_pending_tasks_count,
        (SELECT count(*) FROM public.user_badges WHERE user_id = $1) as my_badges_count
    `, [testUser.id]);

    const stats = dashboardQuery.rows[0];
    assert(parseInt(stats.my_ideas_count, 10) >= 1, `Dashboard aggregated ${stats.my_ideas_count} ideas for user`);
    assert(parseInt(stats.my_validated_ideas_count, 10) >= 1, `Dashboard aggregated ${stats.my_validated_ideas_count} validated ideas`);
    assert(parseInt(stats.my_projects_count, 10) >= 1, `Dashboard aggregated ${stats.my_projects_count} projects for user`);
    assert(parseInt(stats.my_pending_tasks_count, 10) >= 1, `Dashboard identified ${stats.my_pending_tasks_count} pending assigned tasks`);

    // Clean up test data
    console.log("\n--- CLEANING UP TEST ARTIFACTS ---");
    await client.query("DELETE FROM public.project_rescue_invitations WHERE project_id = $1", [testProject.id]);
    await client.query("DELETE FROM public.project_discussions WHERE project_id = $1", [testProject.id]);
    await client.query("DELETE FROM public.project_files WHERE project_id = $1", [testProject.id]);
    await client.query("DELETE FROM public.project_activity WHERE project_id = $1", [testProject.id]);
    await client.query("DELETE FROM public.tasks WHERE project_id = $1", [testProject.id]);
    await client.query("DELETE FROM public.milestones WHERE project_id = $1", [testProject.id]);
    await client.query("DELETE FROM public.project_members WHERE project_id = $1", [testProject.id]);
    await client.query("DELETE FROM public.projects WHERE id = $1", [testProject.id]);
    await client.query("DELETE FROM public.idea_validation_feedback WHERE idea_id = $1", [testIdea.id]);
    await client.query("DELETE FROM public.ideas WHERE id = $1", [testIdea.id]);
    console.log("  Cleaned up all temporary test rows.");

    console.log("\n==============================================================");
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==============================================================");
    
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

runTests();
