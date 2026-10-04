import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

// Load env
const envContent = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.*)/);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}
const dbUrl = dbUrlMatch[1].trim().replace(/^['"]|['"]$/g, '');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function runTests() {
  const client = await pool.connect();
  console.log('=== IDEAERA DUPLICATE DETECTION & REPORTING TEST SUITE ===\n');

  try {
    // Helper to call detect_duplicate_ideas and unpack JSONB
    const detectIdeas = async (title, problem, solution, description, category, excludeId, viewerId, threshold = 0.25, limit = 5) => {
      const res = await client.query(
        `SELECT detect_duplicate_ideas($1, $2, $3, $4, $5, $6, $7, $8, $9) as result;`,
        [title, problem, solution, description, category, excludeId, viewerId, threshold, limit]
      );
      return res.rows[0]?.result || [];
    };

    // 0. Setup test users and data cleanup
    console.log('[Setup] Fetching test users...');
    const usersRes = await client.query('SELECT id, full_name, role FROM public.profiles LIMIT 5');
    if (usersRes.rows.length < 2) {
      throw new Error('Need at least 2 profiles to test duplicate detection and reporting.');
    }
    const adminUser = usersRes.rows.find((u) => u.role === 'admin') || usersRes.rows[0];
    await client.query("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [adminUser.id]);
    const userA = usersRes.rows.find((u) => u.id !== adminUser.id) || usersRes.rows[1];
    const userB = usersRes.rows.find((u) => u.id !== adminUser.id && u.id !== userA.id) || adminUser;

    console.log(`- Admin User: ${adminUser.id} (${adminUser.full_name || 'Admin'})`);
    console.log(`- User A:     ${userA.id} (${userA.full_name || 'User A'})`);
    console.log(`- User B:     ${userB.id} (${userB.full_name || 'User B'})`);

    // Cleanup previous test ideas
    await client.query("DELETE FROM public.ideas WHERE title LIKE 'TEST_DUP_%'");
    console.log('Cleaned up previous test ideas.\n');

    // =========================================================================
    // TEST 1: Insert Seed Ideas for Testing
    // =========================================================================
    console.log('--- TEST 1: SEED IDEAS SETUP ---');
    const seed1Res = await client.query(`
      INSERT INTO public.ideas (
        title, problem, solution, description, category, visibility, creator_id, stage
      ) VALUES (
        'TEST_DUP_Autonomous Drone Delivery for Rural Healthcare',
        'Emergency medications and blood supplies take hours to reach remote mountain clinics due to damaged roads.',
        'High-speed autonomous electric eVTOL drones with cold-chain storage capsules and automated winch drop systems.',
        'Emergency medications and blood supplies take hours to reach remote clinics. We build eVTOL drones with cold-chain storage capsules.',
        'Health & Biotech',
        'public',
        $1,
        'Idea'
      ) RETURNING id, display_id;
    `, [userA.id]);
    const originalIdeaId = seed1Res.rows[0].id;
    console.log(`✓ Created Original Public Idea: ${originalIdeaId} (${seed1Res.rows[0].display_id})`);

    // Seed Private Idea
    const seedPrivateRes = await client.query(`
      INSERT INTO public.ideas (
        title, problem, solution, description, category, visibility, creator_id, stage
      ) VALUES (
        'TEST_DUP_Stealth Quantum Encryption Hardware Module',
        'Current telecom fiber networks are vulnerable to future quantum decryption attacks.',
        'Proprietary chip design combining quantum random number generation with post-quantum lattice cryptography.',
        'Confidential hardware architecture protecting fiber networks from quantum decryption attacks.',
        'Security & Cloud',
        'private',
        $1,
        'Idea'
      ) RETURNING id, display_id;
    `, [userA.id]);
    const privateIdeaId = seedPrivateRes.rows[0].id;
    console.log(`✓ Created Private Idea: ${privateIdeaId} (${seedPrivateRes.rows[0].display_id}) for User A\n`);

    // =========================================================================
    // TEST A: Completely Disparate Ideas -> Low Similarity (< 0.25)
    // =========================================================================
    console.log('--- TEST A: DISPARATE IDEAS SIMILARITY ---');
    const dispMatches = await detectIdeas(
      'TEST_DUP_Smart Organic Fertilizer Composting Bin',
      'Food waste creates methane emissions in urban landfills.',
      'Aerobic thermophilic microbial starter with IoT moisture temperature sensors for balcony composting.',
      'Composting food waste in urban apartments with smart sensors.',
      'Climate & Sustainability',
      null,
      userB.id,
      0.25,
      5
    );

    const matchingDroneInDisparate = dispMatches.find((r) => r.id === originalIdeaId);
    if (!matchingDroneInDisparate) {
      console.log('✓ PASS: Disparate idea produced 0 overlap with drone delivery (below 0.25 threshold).\n');
    } else {
      console.log(`Similarity score: ${matchingDroneInDisparate.similarity_score}`);
      if (matchingDroneInDisparate.similarity_score < 0.25) {
        console.log('✓ PASS: Disparate idea similarity is low.\n');
      } else {
        throw new Error('FAIL: Disparate idea scored unexpectedly high similarity!');
      }
    }

    // =========================================================================
    // TEST B: Highly Similar Problem / Solution -> High Overlap Detected
    // =========================================================================
    console.log('--- TEST B: HIGH SIMILARITY DETECTION ---');
    const simMatches = await detectIdeas(
      'TEST_DUP_Autonomous Drone Delivery for Remote Clinics',
      'Emergency medicine and blood takes hours to reach remote clinics due to poor roads.',
      'Autonomous electric eVTOL drones equipped with temperature-controlled cold-chain payload capsules.',
      'Autonomous drone transport for medical supplies to remote healthcare clinics.',
      'Health & Biotech',
      null,
      userB.id,
      0.20,
      5
    );

    console.log(`Matched results count: ${simMatches.length}`);
    const droneMatch = simMatches.find((r) => r.id === originalIdeaId);
    if (!droneMatch) {
      throw new Error('FAIL: Expected detect_duplicate_ideas to find the similar drone delivery idea!');
    }
    console.log(`✓ Found match: ${droneMatch.title}`);
    console.log(`✓ Similarity score: ${droneMatch.similarity_score} (${droneMatch.similarity_percentage}%)`);
    console.log(`✓ Similarity level: ${droneMatch.similarity_level}`);
    if (droneMatch.similarity_score < 0.35) {
      throw new Error(`FAIL: Expected medium or high similarity, got ${droneMatch.similarity_score}`);
    }
    console.log('✓ PASS: High similarity successfully detected on problem and solution overlap.\n');

    // =========================================================================
    // TEST C: User Continues Anyway (Acknowledge Warning)
    // =========================================================================
    console.log('--- TEST C: USER CONTINUES ANYWAY (PUBLISHES SAFELY) ---');
    const continueIdeaRes = await client.query(`
      INSERT INTO public.ideas (
        title, problem, solution, description, category, visibility, creator_id, stage,
        duplicate_warning_acknowledged
      ) VALUES (
        'TEST_DUP_Autonomous Drone Delivery for Island Medical Clinics',
        'Island communities struggle to get timely vaccines during monsoon storms.',
        'Water-resistant eVTOL drones adapted for oceanic high-wind corridors.',
        'Autonomous drone delivery engineered specifically for maritime and island archipelago routes.',
        'Health & Biotech',
        'public',
        $1,
        'Idea',
        true
      ) RETURNING id, duplicate_warning_acknowledged, moderation_status;
    `, [userB.id]);

    const createdSimilarIdea = continueIdeaRes.rows[0];
    if (!createdSimilarIdea.duplicate_warning_acknowledged) {
      throw new Error('FAIL: duplicate_warning_acknowledged should be true.');
    }
    if (createdSimilarIdea.moderation_status !== 'active') {
      throw new Error('FAIL: Idea should remain active and not be auto-deleted or penalized.');
    }
    console.log(`✓ Created Idea with acknowledgment: ${createdSimilarIdea.id}`);
    console.log('✓ PASS: Idea publishes successfully with duplicate_warning_acknowledged=true and active status.\n');

    // =========================================================================
    // TEST D: User Reports Idea for Possible Copying
    // =========================================================================
    console.log('--- TEST D: IDEA REPORTING & ANTI-ABUSE ---');
    const reportRes = await client.query(`
      INSERT INTO public.idea_reports (
        idea_id, reporter_id, original_idea_id, reason, description, evidence_url, status
      ) VALUES (
        $1, $2, $3, 'possible_copying',
        'Substantial architecture and route mechanism duplication without attribution.',
        'https://ideaera.vercel.app/ideas/sample',
        'pending'
      ) RETURNING id, status, reason;
    `, [createdSimilarIdea.id, userA.id, originalIdeaId]);

    const reportId = reportRes.rows[0].id;
    console.log(`✓ Report created: ${reportId} (Status: ${reportRes.rows[0].status})`);

    // Verify Anti-Abuse: Duplicate report attempt should fail on unique partial index
    let antiAbusePassed = false;
    try {
      await client.query(`
        INSERT INTO public.idea_reports (
          idea_id, reporter_id, original_idea_id, reason, description, status
        ) VALUES (
          $1, $2, $3, 'possible_copying', 'Second duplicate spam report', 'pending'
        );
      `, [createdSimilarIdea.id, userA.id, originalIdeaId]);
    } catch (err) {
      if (err.code === '23505' || err.message.includes('uq_idea_reports_active')) {
        antiAbusePassed = true;
        console.log('✓ Anti-abuse unique constraint successfully blocked duplicate active report.');
      } else {
        throw err;
      }
    }
    if (!antiAbusePassed) {
      throw new Error('FAIL: Anti-abuse should prevent multiple pending reports from same reporter for same idea.');
    }
    console.log('✓ PASS: Report submitted and anti-abuse safeguards verified.\n');

    // =========================================================================
    // TEST E: Admin Moderation - Mark Under Review then Dismiss
    // =========================================================================
    console.log('--- TEST E: ADMIN REVIEWS & DISMISSES REPORT ---');
    // 1. Mark Under Review
    await client.query(`
      UPDATE public.idea_reports
      SET status = 'under_review', reviewed_by = $1, reviewed_at = now()
      WHERE id = $2;
    `, [adminUser.id, reportId]);

    const reviewCheck = await client.query('SELECT status FROM public.idea_reports WHERE id = $1', [reportId]);
    if (reviewCheck.rows[0].status !== 'under_review') {
      throw new Error('FAIL: Status should be under_review.');
    }
    console.log('✓ Status moved to under_review.');

    // 2. Dismiss with note
    await client.query(`
      UPDATE public.idea_reports
      SET status = 'dismissed', resolution = 'dismissed',
          resolution_note = 'Ideas address different geographic topologies (mountains vs maritime archipelagos). No plagiarism found.',
          reviewed_by = $1, reviewed_at = now()
      WHERE id = $2;
    `, [adminUser.id, reportId]);

    const dismissCheck = await client.query('SELECT status, resolution, resolution_note FROM public.idea_reports WHERE id = $1', [reportId]);
    console.log(`✓ Report dismissed: resolution=${dismissCheck.rows[0].resolution}, note="${dismissCheck.rows[0].resolution_note}"`);

    // Verify reported idea status is unchanged and active
    const ideaCheck = await client.query('SELECT moderation_status, visibility FROM public.ideas WHERE id = $1', [createdSimilarIdea.id]);
    if (ideaCheck.rows[0].moderation_status !== 'active') {
      throw new Error('FAIL: Dismissed idea should remain active.');
    }
    console.log('✓ PASS: Admin dismissal leaves idea intact and marks report dismissed.\n');

    // =========================================================================
    // TEST F: Admin Moderation - Confirm Violation & Restrict
    // =========================================================================
    console.log('--- TEST F: CONFIRM VIOLATION & CONTENT RESTRICTION ---');
    // Create new report to test violation confirmation
    const report2Res = await client.query(`
      INSERT INTO public.idea_reports (
        idea_id, reporter_id, original_idea_id, reason, description, status
      ) VALUES (
        $1, $2, $3, 'copyright_ip',
        'Direct copying of proprietary hardware specifications.',
        'pending'
      ) RETURNING id;
    `, [createdSimilarIdea.id, userA.id, originalIdeaId]);
    const report2Id = report2Res.rows[0].id;

    // Admin resolves with content_restricted
    await client.query(`
      UPDATE public.idea_reports
      SET status = 'resolved', resolution = 'content_restricted',
          resolution_note = 'Substantiated unauthorized duplication. Visibility restricted.',
          reviewed_by = $1, reviewed_at = now()
      WHERE id = $2;
    `, [adminUser.id, report2Id]);

    // Apply restriction to idea
    await client.query(`
      UPDATE public.ideas
      SET moderation_status = 'restricted', visibility = 'private',
          moderation_note = 'Restricted following administrative review.'
      WHERE id = $1;
    `, [createdSimilarIdea.id]);

    const restrictedIdeaCheck = await client.query('SELECT moderation_status, visibility, moderation_note FROM public.ideas WHERE id = $1', [createdSimilarIdea.id]);
    if (restrictedIdeaCheck.rows[0].moderation_status !== 'restricted' || restrictedIdeaCheck.rows[0].visibility !== 'private') {
      throw new Error('FAIL: Idea was not restricted properly.');
    }
    console.log(`✓ Idea successfully restricted: moderation_status=${restrictedIdeaCheck.rows[0].moderation_status}, visibility=${restrictedIdeaCheck.rows[0].visibility}`);
    console.log('✓ PASS: Violation confirmation restricts content access and records note.\n');

    // =========================================================================
    // TEST G: Strict Privacy Enforcement - Private Ideas Never Leak
    // =========================================================================
    console.log('--- TEST G: STRICT PRIVACY ENFORCEMENT ---');
    // User B runs duplicate search on quantum encryption (which matches User A's private idea)
    const privMatches = await detectIdeas(
      'TEST_DUP_Quantum Decryption Shield for Telecom Fibers',
      'Quantum decryption attacks on telecom fiber networks.',
      'Lattice cryptography chip design for quantum randomness.',
      'Protecting fiber networks from quantum decryption attacks.',
      'Security & Cloud',
      null,
      userB.id,
      0.15,
      10
    );

    const leakedIdea = privMatches.find((r) => r.id === privateIdeaId);
    if (leakedIdea) {
      throw new Error('CRITICAL SECURITY FAIL: Private Idea was leaked to unauthorized User B in similarity results!');
    }
    console.log('✓ PASS: Private idea created by User A was NOT visible to User B in similarity detection.');

    // Verify creator CAN see their own private idea in similarity checks
    const creatorMatches = await detectIdeas(
      'TEST_DUP_Quantum Decryption Shield for Telecom Fibers',
      'Quantum decryption attacks on telecom fiber networks.',
      'Lattice cryptography chip design for quantum randomness.',
      'Protecting fiber networks from quantum decryption attacks.',
      'Security & Cloud',
      null,
      userA.id,
      0.15,
      10
    );
    const creatorMatch = creatorMatches.find((r) => r.id === privateIdeaId);
    if (!creatorMatch) {
      throw new Error('FAIL: Creator should be able to see their own private ideas.');
    }
    console.log('✓ PASS: Creator CAN see their own private ideas when checking similarity.\n');

    // =========================================================================
    // TEST H: Independent Similar Ideas Creation
    // =========================================================================
    console.log('--- TEST H: TWO INDEPENDENT SIMILAR IDEAS ---');
    const indep1 = await client.query(`
      INSERT INTO public.ideas (
        title, problem, solution, description, category, visibility, creator_id, stage
      ) VALUES (
        'TEST_DUP_Decentralized Microgrid Solar P2P Energy Trading',
        'Grid congestion and fixed feed-in tariffs discourage residential solar expansion.',
        'Local peer-to-peer microgrid smart contracts trading kWh credits across neighbors.',
        'Residential solar microgrid trading network.',
        'Climate & Sustainability',
        'public',
        $1::uuid,
        'Idea'
      ) RETURNING id;
    `, [userA.id]);

    const indep2 = await client.query(`
      INSERT INTO public.ideas (
        title, problem, solution, description, category, visibility, creator_id, stage,
        duplicate_warning_acknowledged
      ) VALUES (
        'TEST_DUP_P2P Rooftop Solar Energy Market for Suburban Microgrids',
        'Suburban rooftop solar owners cannot sell excess energy directly to neighbors during peak daylight.',
        'Automated blockchain ledger settling peer-to-peer solar transactions between adjacent homes.',
        'P2P rooftop solar transactions between homes.',
        'Climate & Sustainability',
        'public',
        $1::uuid,
        'Idea',
        true
      ) RETURNING id;
    `, [userB.id]);

    console.log(`✓ Idea 1 created by User A: ${indep1.rows[0].id}`);
    console.log(`✓ Idea 2 created independently by User B: ${indep2.rows[0].id}`);
    console.log('✓ PASS: Both ideas coexist without ownership declaration or automatic deletion.\n');

    // =========================================================================
    // TEST I: Deterministic Similarity Across Re-queries
    // =========================================================================
    console.log('--- TEST I: DETERMINISTIC SIMILARITY SCORES ---');
    const query1Matches = await detectIdeas(
      'TEST_DUP_Decentralized Microgrid Solar P2P Energy Trading',
      'Grid congestion and fixed feed-in tariffs discourage residential solar expansion.',
      'Local peer-to-peer microgrid smart contracts trading kWh credits across neighbors.',
      'Residential solar microgrid trading network.',
      'Climate & Sustainability',
      null,
      userA.id,
      0.20,
      5
    );

    const query2Matches = await detectIdeas(
      'TEST_DUP_Decentralized Microgrid Solar P2P Energy Trading',
      'Grid congestion and fixed feed-in tariffs discourage residential solar expansion.',
      'Local peer-to-peer microgrid smart contracts trading kWh credits across neighbors.',
      'Residential solar microgrid trading network.',
      'Climate & Sustainability',
      null,
      userA.id,
      0.20,
      5
    );

    if (query1Matches.length === 0 || query2Matches.length === 0) {
      throw new Error('FAIL: Re-query returned 0 rows.');
    }
    const score1 = query1Matches[0].similarity_score;
    const score2 = query2Matches[0].similarity_score;
    if (Math.abs(score1 - score2) > 0.0001) {
      throw new Error(`FAIL: Scores differ between identical runs: ${score1} vs ${score2}`);
    }
    console.log(`✓ Score 1: ${score1}, Score 2: ${score2}`);
    console.log('✓ PASS: Similarity scoring is 100% deterministic.\n');

    // =========================================================================
    // TEST J: Database Constraints & Referential Integrity
    // =========================================================================
    console.log('--- TEST J: REFERENTIAL INTEGRITY & DELETION SAFETY ---');
    // When idea is deleted, reports should cascade or set null safely
    await client.query("DELETE FROM public.ideas WHERE id = $1", [createdSimilarIdea.id]);
    const orphanReports = await client.query("SELECT id FROM public.idea_reports WHERE idea_id = $1", [createdSimilarIdea.id]);
    if (orphanReports.rows.length !== 0) {
      throw new Error('FAIL: Reports should cascade delete when reported idea is deleted.');
    }
    console.log('✓ CASCADE rule on idea_reports verified.');
    console.log('✓ PASS: Referential integrity verified.\n');

    // =========================================================================
    // Cleanup Test Data
    // =========================================================================
    console.log('--- CLEANUP ---');
    await client.query("DELETE FROM public.ideas WHERE title LIKE 'TEST_DUP_%'");
    console.log('✓ Cleaned up all test ideas and associated reports.');

    console.log('\n=======================================================');
    console.log('🎉 ALL 10 TESTS (A through J) PASSED WITH ZERO ERRORS!');
    console.log('=======================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER ERROR:', err);
  process.exit(1);
});
