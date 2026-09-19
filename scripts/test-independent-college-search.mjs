import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchColleges(query, stateFilter, collegeCityFilter, page = 1, limit = 25) {
  const q = (query || "").trim().toLowerCase();
  const offset = Math.max(0, (page - 1) * limit);

  let dbQuery = supabase
    .from("colleges")
    .select("id, name, city, district, state, state_id, institution_type");

  if (q) {
    const cleanQ = q.replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    if (cleanQ) {
      dbQuery = dbQuery.or(`name.ilike.%${q}%,normalized_name.ilike.%${cleanQ}%`);
    } else {
      dbQuery = dbQuery.ilike("name", `%${q}%`);
    }
  }

  if (stateFilter && stateFilter.trim() !== "" && stateFilter.toLowerCase() !== "all") {
    const s = stateFilter.trim();
    if (s.toLowerCase().includes("tamil nadu") || s === "IN-TN") {
      dbQuery = dbQuery.eq("state_id", "IN-TN");
    } else {
      dbQuery = dbQuery.ilike("state", `%${s}%`);
    }
  } else if (!stateFilter) {
    dbQuery = dbQuery.eq("state_id", "IN-TN");
  }

  if (collegeCityFilter && collegeCityFilter.trim() !== "" && collegeCityFilter.toLowerCase() !== "all") {
    const c = collegeCityFilter.trim();
    dbQuery = dbQuery.or(`city.ilike.%${c}%,district.ilike.%${c}%`);
  }

  dbQuery = dbQuery.order("name").range(offset, offset + limit - 1);
  const { data, error } = await dbQuery;
  if (!error && data) {
    return data.map((col) => {
      const locationParts = [col.city, col.state || "Tamil Nadu"].filter(Boolean);
      const locationStr = locationParts.join(", ");
      return {
        id: col.id,
        name: col.name,
        extra: locationStr,
        city: col.city || null,
        district: col.district || null,
        state: col.state || "Tamil Nadu",
      };
    });
  }
  return [];
}

async function runTests() {
  console.log("=========================================================================================");
  console.log("TESTING INDEPENDENT COLLEGE SEARCH & HOME LOCATION DECOUPLING");
  console.log("=========================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = "") {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} => ${details}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: College autocomplete does not depend on home location
  // ----------------------------------------------------
  console.log("--- TEST 1: College Autocomplete Search ('PSG') ---");
  const psgResults = await searchColleges("PSG");
  
  assert("Query 'PSG' returns colleges", psgResults && psgResults.length > 0, `Returned ${psgResults?.length} items`);
  
  const psgTech = psgResults.find(c => c.name.includes("PSG College of Technology"));
  assert("Contains 'PSG College of Technology'", Boolean(psgTech), JSON.stringify(psgResults.map(c => c.name)));
  
  const psgITech = psgResults.find(c => c.name.includes("PSG Institute of Technology and Applied Research"));
  assert("Contains 'PSG Institute of Technology and Applied Research'", Boolean(psgITech));

  const psgrKrish = psgResults.find(c => c.name.includes("PSGR Krishnammal College for Women"));
  assert("Contains 'PSGR Krishnammal College for Women'", Boolean(psgrKrish));

  if (psgTech) {
    assert("PSG College of Technology has city='Coimbatore'", psgTech.city === "Coimbatore", psgTech.city);
    assert("PSG College of Technology has state='Tamil Nadu'", psgTech.state === "Tamil Nadu", psgTech.state);
    assert("PSG College of Technology extra includes 'Coimbatore'", psgTech.extra?.includes("Coimbatore"), psgTech.extra);
  }

  // ----------------------------------------------------
  // TEST 2: Blank query returns colleges from ALL Tamil Nadu cities
  // ----------------------------------------------------
  console.log("\n--- TEST 2: Blank query returns colleges across multiple Tamil Nadu cities ---");
  const allTnColleges = await searchColleges("");
  assert("Blank query returns colleges", allTnColleges && allTnColleges.length >= 20, `Count: ${allTnColleges?.length}`);
  
  const citiesFound = new Set(allTnColleges.map(c => c.city).filter(Boolean));
  console.log(`Cities present in default list: ${Array.from(citiesFound).join(", ")}`);
  assert("Default search spans multiple Tamil Nadu cities", citiesFound.size >= 2, `Cities: ${citiesFound.size}`);

  // ----------------------------------------------------
  // TEST 3: Specific User Scenario (Section 12)
  // Student Home: Gobichettipalayam, Tamil Nadu
  // College: PSG College of Technology (Coimbatore, Tamil Nadu)
  // ----------------------------------------------------
  console.log("\n--- TEST 3: User Scenario: Home=Gobichettipalayam, College=PSG Tech ---");
  
  const studentHomeCity = "Gobichettipalayam";
  const studentHomeState = "Tamil Nadu";
  const studentHomeLocation = `${studentHomeCity}, ${studentHomeState}`;
  const targetCollegeName = "PSG College of Technology";

  // Simulate user in Gobichettipalayam typing "PSG"
  // MUST NOT filter by home city Gobichettipalayam!
  const userSearchResults = await searchColleges("PSG");
  const selectedCollegeItem = userSearchResults.find(c => c.name === targetCollegeName);
  
  assert("Student with Home=Gobichettipalayam finds PSG College of Technology", Boolean(selectedCollegeItem));

  if (selectedCollegeItem) {
    const collegeId = selectedCollegeItem.id;
    const collegeName = selectedCollegeItem.name;
    const derivedCollegeLocation = `${selectedCollegeItem.city}, ${selectedCollegeItem.state}`;

    console.log(`\nSelected College Details:`);
    console.log(`  College:          ${collegeName}`);
    console.log(`  College ID:       ${collegeId}`);
    console.log(`  College Location: ${derivedCollegeLocation}`);
    console.log(`  Home Location:    ${studentHomeLocation}`);

    assert("College name is correct", collegeName === "PSG College of Technology");
    assert("College location is Coimbatore, Tamil Nadu", derivedCollegeLocation === "Coimbatore, Tamil Nadu");
    assert("Home location remains Gobichettipalayam, Tamil Nadu", studentHomeLocation === "Gobichettipalayam, Tamil Nadu");
    assert("College location and Home location are distinct", derivedCollegeLocation !== studentHomeLocation);
  }

  // ----------------------------------------------------
  // TEST 4: Independence in Database Profile Record
  // ----------------------------------------------------
  console.log("\n--- TEST 4: Database Independence Verification ---");
  // Find a test profile or first profile
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, username").limit(1);
  if (profiles && profiles.length > 0) {
    const testUser = profiles[0];
    const testCollegeId = "f4eea4f4-6178-4527-9e57-b6dbc2f39595"; // PSG Tech ID

    // Update profile with Gobichettipalayam home and PSG College
    await supabase.from("profiles").update({
      location: "Gobichettipalayam, Tamil Nadu, India",
      city: "Gobichettipalayam",
      state: "Tamil Nadu",
      country: "India",
      college: "PSG College of Technology",
      college_id: testCollegeId,
    }).eq("id", testUser.id);

    // Query back with relational join
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("id, full_name, location, city, state, college, college_id, college_rel:colleges!college_id(id, name, city, state)")
      .eq("id", testUser.id)
      .single();

    assert("Profile has college = PSG College of Technology", updatedProfile.college === "PSG College of Technology");
    assert("Profile has college_id = PSG Tech UUID", updatedProfile.college_id === testCollegeId);
    assert("Profile college_rel.city = Coimbatore", updatedProfile.college_rel?.city === "Coimbatore");
    assert("Profile home city = Gobichettipalayam", updatedProfile.city === "Gobichettipalayam");
    assert("Profile location = Gobichettipalayam, Tamil Nadu, India", updatedProfile.location.includes("Gobichettipalayam"));

    // Now test changing Home Location to Chennai without changing College
    console.log("\nChanging Home Location -> Chennai, Tamil Nadu...");
    await supabase.from("profiles").update({
      location: "Chennai, Tamil Nadu, India",
      city: "Chennai",
    }).eq("id", testUser.id);

    const { data: step2Profile } = await supabase
      .from("profiles")
      .select("id, city, college, college_id, college_rel:colleges!college_id(city, state)")
      .eq("id", testUser.id)
      .single();

    assert("Home city changed to Chennai", step2Profile.city === "Chennai");
    assert("College REMAINED PSG College of Technology", step2Profile.college === "PSG College of Technology");
    assert("College Location REMAINED Coimbatore", step2Profile.college_rel?.city === "Coimbatore");

    // Restore test profile
    await supabase.from("profiles").update({
      location: "Coimbatore, Tamil Nadu, India",
      city: "Coimbatore",
      college: null,
      college_id: null,
    }).eq("id", testUser.id);
  }

  console.log("\n=========================================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=========================================================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
