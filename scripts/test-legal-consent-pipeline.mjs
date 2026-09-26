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

async function runTests() {
  await client.connect();
  console.log("==================================================================");
  console.log("   IDEAERA - LEGAL PRIVACY & CONSENT SYSTEM AUTOMATED TESTS");
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
    // Locate profiles for testing
    const profileRes = await client.query("SELECT id, full_name, username FROM public.profiles LIMIT 2");
    assert(profileRes.rows.length >= 2, "Found at least 2 profiles for testing isolation and RLS");
    const testUserA = profileRes.rows[0];
    const testUserB = profileRes.rows[1];
    console.log(`  Test User A: ${testUserA.full_name} (${testUserA.id})`);
    console.log(`  Test User B: ${testUserB.full_name} (${testUserB.id})`);

    // Clean up test consent records for Test User A
    await client.query("DELETE FROM public.user_consents WHERE user_id = $1", [testUserA.id]);

    // ------------------------------------------------------------------
    // TEST A: New user signs up -> Legal consent screen appears
    // ------------------------------------------------------------------
    console.log("\n--- TEST A: Legal Consent Screen UI & Checkbox Configuration ---");
    const signupCode = fs.readFileSync("app/(auth)/signup/page.tsx", "utf8");
    assert(
      signupCode.includes("const [hasAgreed, setHasAgreed] = React.useState(false);"),
      "Checkbox defaults to false (MUST NOT be pre-selected)"
    );
    assert(
      signupCode.includes('href="/privacy"') && signupCode.includes('href="/terms"'),
      "Signup screen displays direct links to Privacy Policy and Terms of Service"
    );
    assert(
      signupCode.includes("Accept & Create Account") || signupCode.includes("Accept &amp; Create Account"),
      "Explicit 'Accept & Create Account' button present on signup form"
    );
    assert(
      signupCode.includes("handleReject") && signupCode.includes("Reject"),
      "Explicit 'Reject' option provided on signup form"
    );

    // ------------------------------------------------------------------
    // TEST B: User does not check consent -> Account creation blocked
    // ------------------------------------------------------------------
    console.log("\n--- TEST B: Rejection / Unchecked Consent Blocks Account Creation ---");
    assert(
      signupCode.includes("if (!hasAgreed) {") &&
      signupCode.includes("You must review and check the agreement box"),
      "Signup submission strictly blocks progression when consent checkbox is unchecked"
    );
    assert(
      signupCode.includes("isRejected ? (") &&
      signupCode.includes("Consent Required"),
      "Reject button toggles blocking state screen with explanation and policy links"
    );

    // ------------------------------------------------------------------
    // TEST C: User checks consent and accepts -> Account created & consent recorded
    // ------------------------------------------------------------------
    console.log("\n--- TEST C: Consent Recording with Immutable Server Timestamp ---");
    const beforeTimestamp = new Date();
    const rpcRes = await client.query(
      `SELECT public.record_user_consent($1, $2, $3, $4, $5, $6) as result;`,
      ['1.0', '1.0', '1.0', 'signup', 'Mozilla/5.0 Test Suite Runner', testUserA.id]
    );

    assert(rpcRes.rows.length === 1, "record_user_consent RPC executed successfully");
    const rpcData = rpcRes.rows[0].result;
    assert(rpcData.success === true, "record_user_consent returned success: true");
    assert(rpcData.user_id === testUserA.id, "Recorded consent belongs to Test User A");

    // Verify row in database
    const dbRow = await client.query(
      "SELECT * FROM public.user_consents WHERE id = $1",
      [rpcData.consent_id]
    );
    assert(dbRow.rows.length === 1, "Consent record verified in public.user_consents table");
    const consent = dbRow.rows[0];
    assert(consent.privacy_policy_version === '1.0', "Privacy policy version recorded as 1.0");
    assert(consent.terms_version === '1.0', "Terms version recorded as 1.0");
    assert(consent.cookie_policy_version === '1.0', "Cookie policy version recorded as 1.0");
    assert(consent.consent_type === 'signup', "Consent type recorded as signup");

    const acceptedAt = new Date(consent.accepted_at);
    const diffMs = Math.abs(acceptedAt.getTime() - beforeTimestamp.getTime());
    assert(diffMs < 30000, `Database timestamp now() recorded accurately (offset: ${diffMs}ms)`);

    // ------------------------------------------------------------------
    // TEST D: User clicks Privacy Policy -> /privacy opens
    // ------------------------------------------------------------------
    console.log("\n--- TEST D: Dedicated /privacy Page Verification ---");
    assert(fs.existsSync("app/(legal)/privacy/page.tsx"), "app/(legal)/privacy/page.tsx exists");
    const privacyContent = fs.readFileSync("app/(legal)/privacy/page.tsx", "utf8");
    assert(privacyContent.includes("Privacy Policy"), "Contains 'Privacy Policy' title");
    assert(privacyContent.includes("Data-Processing Notice"), "Contains 'Data-Processing Notice'");
    assert(privacyContent.includes("Supabase") && privacyContent.includes("TLS"), "Audited infrastructure disclosures present (Supabase, TLS)");
    assert(privacyContent.includes("Account Sovereignty") || privacyContent.includes("Deletion"), "Account deletion / data erasure rights documented");

    // ------------------------------------------------------------------
    // TEST E: User clicks Terms -> /terms opens
    // ------------------------------------------------------------------
    console.log("\n--- TEST E: Dedicated /terms Page Verification ---");
    assert(fs.existsSync("app/(legal)/terms/page.tsx"), "app/(legal)/terms/page.tsx exists");
    const termsContent = fs.readFileSync("app/(legal)/terms/page.tsx", "utf8");
    assert(termsContent.includes("Terms of Service"), "Contains 'Terms of Service' title");
    assert(
      termsContent.includes("do not guarantee that an idea cannot be copied") ||
      termsContent.includes("No Guarantee of Non-Copying"),
      "Mandatory IP clause stating IdeaEra does not provide legal protection against idea copying"
    );

    // ------------------------------------------------------------------
    // TEST F: User clicks Cookie Policy -> /cookies opens
    // ------------------------------------------------------------------
    console.log("\n--- TEST F: Dedicated /cookies Page Verification ---");
    assert(fs.existsSync("app/(legal)/cookies/page.tsx"), "app/(legal)/cookies/page.tsx exists");
    const cookieContent = fs.readFileSync("app/(legal)/cookies/page.tsx", "utf8");
    assert(cookieContent.includes("Cookie Policy"), "Contains 'Cookie Policy' title");
    assert(
      cookieContent.includes("sb-") && cookieContent.includes("Strictly Necessary"),
      "Separates strictly necessary authentication cookies from optional tracking"
    );
    assert(
      cookieContent.includes("Zero Advertising") || cookieContent.includes("do not deploy marketing cookies"),
      "Affirmatively documents absence of marketing/advertising trackers"
    );

    // ------------------------------------------------------------------
    // TEST G: Existing user without current policy acceptance
    // ------------------------------------------------------------------
    console.log("\n--- TEST G: Existing User Without Current Policy Acceptance ---");
    // Ensure User B has no consent records for version 1.0
    await client.query("DELETE FROM public.user_consents WHERE user_id = $1", [testUserB.id]);
    const checkBRes = await client.query(
      `SELECT public.has_accepted_current_policies($1, $2, $3) as accepted;`,
      [testUserB.id, '1.0', '1.0']
    );
    assert(checkBRes.rows[0].accepted === false, "User B without consent returns has_accepted = false");

    // Verify Dashboard layout checks consent status and triggers PolicyConsentModal
    const dashboardLayoutCode = fs.readFileSync("app/(dashboard)/layout.tsx", "utf8");
    assert(
      dashboardLayoutCode.includes("hasAcceptedCurrentPolicies") &&
      dashboardLayoutCode.includes("PolicyConsentModal"),
      "DashboardLayout verifies consent and conditionally renders PolicyConsentModal"
    );

    // ------------------------------------------------------------------
    // TEST H: Existing user with current acceptance
    // ------------------------------------------------------------------
    console.log("\n--- TEST H: Existing User With Current Acceptance ---");
    const checkARes = await client.query(
      `SELECT public.has_accepted_current_policies($1, $2, $3) as accepted;`,
      [testUserA.id, '1.0', '1.0']
    );
    assert(checkARes.rows[0].accepted === true, "User A with 1.0 consent returns has_accepted = true");

    // ------------------------------------------------------------------
    // TEST I: Refresh browser / repeated queries
    // ------------------------------------------------------------------
    console.log("\n--- TEST I: Browser Refresh & Idempotent State Preservation ---");
    const repeat1 = await client.query(`SELECT public.has_accepted_current_policies($1, $2, $3) as accepted;`, [testUserA.id, '1.0', '1.0']);
    const repeat2 = await client.query(`SELECT public.has_accepted_current_policies($1, $2, $3) as accepted;`, [testUserA.id, '1.0', '1.0']);
    const repeat3 = await client.query(`SELECT public.has_accepted_current_policies($1, $2, $3) as accepted;`, [testUserA.id, '1.0', '1.0']);
    assert(
      repeat1.rows[0].accepted === true &&
      repeat2.rows[0].accepted === true &&
      repeat3.rows[0].accepted === true,
      "Consent state remains consistently true across consecutive checks without side effects"
    );

    // ------------------------------------------------------------------
    // TEST J: Mobile signup & modal responsive design
    // ------------------------------------------------------------------
    console.log("\n--- TEST J: Mobile Responsive Configuration ---");
    const modalCode = fs.readFileSync("components/legal/PolicyConsentModal.tsx", "utf8");
    assert(
      signupCode.includes("flex-col sm:flex-row") && signupCode.includes("max-w-md"),
      "Signup page has mobile-responsive flex containers and viewport width limits"
    );
    assert(
      modalCode.includes("max-w-lg") && modalCode.includes("sm:p-8") && modalCode.includes("flex-col-reverse sm:flex-row"),
      "PolicyConsentModal has responsive padding and responsive button layouts"
    );

    // ------------------------------------------------------------------
    // TEST K: Row Level Security (RLS) enforcement
    // ------------------------------------------------------------------
    console.log("\n--- TEST K: RLS Verification on public.user_consents ---");
    const rlsCheck = await client.query(`
      SELECT relrowsecurity, relforcerowsecurity
      FROM pg_class
      WHERE relname = 'user_consents' AND relnamespace = 'public'::regnamespace;
    `);
    assert(rlsCheck.rows[0].relrowsecurity === true, "Row Level Security is enabled on public.user_consents");

    const policyCheck = await client.query(`
      SELECT policyname, qual
      FROM pg_policies
      WHERE tablename = 'user_consents' AND schemaname = 'public';
    `);
    assert(policyCheck.rows.length > 0, "Security policies found for user_consents");
    const hasOwnPolicy = policyCheck.rows.some(p =>
      p.policyname.includes("Users can view their own consent records")
    );
    assert(hasOwnPolicy, "Policy 'Users can view their own consent records' is actively enforced");

    // ------------------------------------------------------------------
    // TEST L: Policy Version Changes (Version Increment Handling)
    // ------------------------------------------------------------------
    console.log("\n--- TEST L: Policy Version Increment Handling & Audit Trail ---");
    // When required version bumps to 2.0, User A (who accepted 1.0) must now be evaluated as false
    const versionBumpCheck = await client.query(
      `SELECT public.has_accepted_current_policies($1, $2, $3) as accepted;`,
      [testUserA.id, '2.0', '1.0']
    );
    assert(
      versionBumpCheck.rows[0].accepted === false,
      "Version bump to 2.0 correctly marks previous 1.0 acceptor as requiring updated consent"
    );

    // User A reviews and accepts version 2.0
    const reConsentRes = await client.query(
      `SELECT public.record_user_consent($1, $2, $3, $4, $5, $6) as result;`,
      ['2.0', '1.0', '1.0', 'policy_update', 'Mozilla/5.0 Re-consent Test', testUserA.id]
    );
    assert(reConsentRes.rows[0].result.success === true, "Re-consent for version 2.0 recorded successfully");

    // Now User A has accepted 2.0
    const versionBumpAccepted = await client.query(
      `SELECT public.has_accepted_current_policies($1, $2, $3) as accepted;`,
      [testUserA.id, '2.0', '1.0']
    );
    assert(
      versionBumpAccepted.rows[0].accepted === true,
      "User A is now verified as having accepted current version 2.0"
    );

    // Verify historical audit trail: User A should have BOTH 1.0 and 2.0 records
    const allConsents = await client.query(
      "SELECT privacy_policy_version, consent_type, accepted_at FROM public.user_consents WHERE user_id = $1 ORDER BY accepted_at ASC;",
      [testUserA.id]
    );
    assert(
      allConsents.rows.length === 2,
      `Immutable audit trail preserved: Found ${allConsents.rows.length} version records for user`
    );
    assert(
      allConsents.rows[0].privacy_policy_version === '1.0' && allConsents.rows[1].privacy_policy_version === '2.0',
      "Audit trail correctly contains chronological v1.0 (signup) followed by v2.0 (policy_update)"
    );

    // ------------------------------------------------------------------
    // TEST PRIVACY CENTER HUB
    // ------------------------------------------------------------------
    console.log("\n--- PRIVACY CENTER HUB VERIFICATION ---");
    assert(fs.existsSync("app/(legal)/privacy-center/page.tsx"), "app/(legal)/privacy-center/page.tsx exists");
    const privacyCenterContent = fs.readFileSync("app/(legal)/privacy-center/page.tsx", "utf8");
    assert(privacyCenterContent.includes("Privacy & Legal Center"), "Contains Privacy Center title");
    assert(privacyCenterContent.includes("getUserConsents"), "Retrieves user consent history from legal service");
    assert(privacyCenterContent.includes("Account Sovereignty"), "Includes account sovereignty and deletion actions");

    console.log("\n==================================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTests();
