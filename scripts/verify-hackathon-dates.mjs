import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDateParts(date, timeZone = "Asia/Kolkata") {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone,
    });
    const parts = formatter.formatToParts(date);
    let year = 0, monthStr = "", monthIndex = 0, day = 0;
    for (const part of parts) {
      if (part.type === "year") year = parseInt(part.value, 10);
      if (part.type === "month") {
        monthStr = part.value;
        monthIndex = MONTH_ABBRS.indexOf(monthStr);
      }
      if (part.type === "day") day = parseInt(part.value, 10);
    }
    return { year, month: monthIndex, monthStr, day };
  } catch {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      monthStr: MONTH_ABBRS[date.getMonth()] || "",
      day: date.getDate(),
    };
  }
}

function isEpochOrInvalid(dateString) {
  if (!dateString) return true;
  const str = String(dateString).trim();
  if (str === "" || str.startsWith("1970-01-01")) return true;
  const d = new Date(str);
  return isNaN(d.getTime()) || d.getFullYear() <= 1970;
}

function formatDate(dateString) {
  if (!dateString || isEpochOrInvalid(dateString)) return "";
  const str = String(dateString).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    return `${MONTH_ABBRS[month] || ""} ${day}, ${year}`;
  }
  const date = new Date(str);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatEventDateRange(startStr, endStr, options = { timeZone: "Asia/Kolkata" }) {
  if (isEpochOrInvalid(startStr)) return "Date TBD";
  const start = new Date(startStr);
  if (isEpochOrInvalid(endStr)) return formatDate(startStr);
  const end = new Date(endStr);
  const tz = options.timeZone || "Asia/Kolkata";
  const p1 = getDateParts(start, tz);
  const p2 = getDateParts(end, tz);

  if (p1.year === p2.year && p1.month === p2.month && p1.day === p2.day) {
    return `${p1.monthStr} ${p1.day}, ${p1.year}`;
  }
  if (p1.year === p2.year && p1.month === p2.month) {
    return `${p1.monthStr} ${p1.day} � ${p2.day}, ${p1.year}`;
  }
  if (p1.year === p2.year) {
    return `${p1.monthStr} ${p1.day} � ${p2.monthStr} ${p2.day}, ${p1.year}`;
  }
  return `${p1.monthStr} ${p1.day}, ${p1.year} � ${p2.monthStr} ${p2.day}, ${p2.year}`;
}

function formatRegistrationDeadline(deadlineStr) {
  if (isEpochOrInvalid(deadlineStr)) return { text: "Open registration", isClosed: false };
  const deadline = new Date(deadlineStr);
  const now = Date.now();
  if (deadline.getTime() < now) return { text: "Registration closed", isClosed: true };
  return { text: `Register by ${formatDate(deadlineStr)}`, isClosed: false };
}

function formatDateTimeWithTz(dateString, timeZone = "Asia/Kolkata", tzLabel = "IST") {
  if (!dateString || isEpochOrInvalid(dateString)) return "Date to be announced";
  const date = new Date(dateString);
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(date);
    return `${formatted} ${tzLabel}`;
  } catch {
    return formatDate(dateString);
  }
}

async function runTests() {
  console.log("==========================================");
  console.log("RUNNING COMPREHENSIVE HACKATHON DATE TESTS");
  console.log("==========================================\n");

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
  // TEST SUITE 1: UTILS & FORMATTING TESTS
  // ----------------------------------------------------
  console.log("--- TEST SUITE 1: Utility & Formatter Tests ---");

  const range1 = formatEventDateRange("2026-10-25T08:00:00Z", "2026-10-27T18:00:00Z");
  assert("Case A: Multi-day same month formats Oct 25 and 27, 2026", range1.includes("Oct 25") && range1.includes("27, 2026"), range1);

  const range2 = formatEventDateRange("2026-10-15T09:00:00Z", "2026-10-15T18:00:00Z");
  assert("Case B: Single day event formats 'Oct 15, 2026'", range2 === "Oct 15, 2026", range2);

  const range3 = formatEventDateRange(null, null);
  assert("Case C: Null dates format 'Date TBD'", range3 === "Date TBD", range3);

  const range4 = formatEventDateRange("1970-01-01T00:00:00Z", "1970-01-01T00:00:00Z");
  assert("Case D: Epoch sentinel formats 'Date TBD'", range4 === "Date TBD", range4);

  const dateFormatted = formatDate("2026-10-15");
  assert("Case E: YYYY-MM-DD calendar date is preserved without shift", dateFormatted === "Oct 15, 2026", dateFormatted);

  const deadlineFuture = formatRegistrationDeadline("2026-11-20T23:59:00Z");
  assert("Case F: Future deadline has isClosed=false and 'Register by Nov 20, 2026'", !deadlineFuture.isClosed && deadlineFuture.text === "Register by Nov 20, 2026", JSON.stringify(deadlineFuture));

  const deadlinePast = formatRegistrationDeadline("2026-08-01T23:59:00Z");
  assert("Case G: Past deadline has isClosed=true and 'Registration closed'", deadlinePast.isClosed && deadlinePast.text === "Registration closed", JSON.stringify(deadlinePast));

  const istTime = formatDateTimeWithTz("2026-10-25T08:00:00Z", "Asia/Kolkata", "IST");
  assert("Case H: Explicit IST time formatting contains IST", istTime.includes("IST") && istTime.includes("Oct 25, 2026"), istTime);

  // ----------------------------------------------------
  // TEST SUITE 2: LIVE SUPABASE DATABASE INTEGRITY
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 2: Supabase Database Integrity ---");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: rows, error: qErr } = await supabase.from("hackathons").select("*");
  assert("Database query succeeds", !qErr && rows && rows.length > 0, qErr?.message);

  console.log(`Total live hackathon rows in database: ${rows.length}`);

  const ceg = rows.find(r => r.title.includes("CEG Kurukshetra"));
  assert("CEG Kurukshetra exists in DB", Boolean(ceg), "Missing CEG Kurukshetra");
  if (ceg) {
    assert("CEG Kurukshetra start_date is 2026-10-25", ceg.start_date.includes("2026-10-25"), ceg.start_date);
    assert("CEG Kurukshetra end_date is 2026-10-27", ceg.end_date.includes("2026-10-27"), ceg.end_date);
    assert("CEG Kurukshetra registration_deadline is 2026-10-18", ceg.registration_deadline.includes("2026-10-18"), ceg.registration_deadline);
  }

  const shaastra = rows.find(r => r.title.includes("Shaastra"));
  assert("IIT Madras Shaastra exists in DB", Boolean(shaastra), "Missing Shaastra");
  if (shaastra) {
    assert("Shaastra start_date is 2026-10-10", shaastra.start_date.includes("2026-10-10"), shaastra.start_date);
    assert("Shaastra registration_deadline is 2026-10-05", shaastra.registration_deadline.includes("2026-10-05"), shaastra.registration_deadline);
  }

  const sih = rows.find(r => r.title.includes("Smart India Hackathon"));
  assert("Smart India Hackathon exists in DB", Boolean(sih), "Missing SIH");
  if (sih) {
    assert("SIH start_date is 2026-12-05", sih.start_date.includes("2026-12-05"), sih.start_date);
  }

  const fakeStartSummer = rows.filter(r => {
    if (r.title.includes("2026") && (r.title.includes("Kurukshetra") || r.title.includes("Shaastra") || r.title.includes("SIH"))) return false;
    return r.start_date && (r.start_date.includes("2026-07-") || r.start_date.includes("2026-08-"));
  });
  assert("Zero scraped hackathons have July/August approved_date as start_date", fakeStartSummer.length === 0, `Found ${fakeStartSummer.length} records`);

  const scrapedRows = rows.filter(r => r.description?.includes("[DateTBD: true]"));
  console.log(`Scraped active hackathons flagged with authentic TBD event dates: ${scrapedRows.length}`);
  assert("Scraped records correctly tagged with [DateTBD: true]", scrapedRows.length > 0, "No scraped records with [DateTBD: true]");

  // ----------------------------------------------------
  // TEST SUITE 3: HTTP PRODUCTION ENDPOINTS
  // ----------------------------------------------------
  console.log("\n--- TEST SUITE 3: HTTP Server Endpoints ---");
  try {
    const resList = await fetch("http://localhost:3000/hackathons");
    assert("GET /hackathons returns 200 OK", resList.status === 200, `Status: ${resList.status}`);
    const htmlList = await resList.text();
    assert("HTML includes CEG Kurukshetra", htmlList.includes("CEG Kurukshetra"), "CEG not found in HTML");
    assert("HTML includes formatted date range 'Oct 25'", htmlList.includes("Oct 25"), "Date range not found in HTML");
    assert("HTML includes 'Register by'", htmlList.includes("Register by") || htmlList.includes("Registration closed"), "Deadline not found in HTML");

    if (ceg) {
      const resDetail = await fetch(`http://localhost:3000/hackathons/${ceg.id}`);
      assert("GET /hackathons/[id] returns 200 OK", resDetail.status === 200, `Status: ${resDetail.status}`);
      const htmlDetail = await resDetail.text();
      assert("Detail page displays event date range", htmlDetail.includes("Oct 25"), "Date range not found in detail page");
      assert("Detail page includes IST time", htmlDetail.includes("IST"), "IST time not found in detail page");
    }
  } catch (err) {
    assert("Server HTTP fetch", false, err.message);
  }

  console.log("\n==========================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================");

  if (failed > 0) process.exit(1);
}

runTests();
