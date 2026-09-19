import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isEpochOrInvalid(dateString) {
  if (!dateString) return true;
  const str = String(dateString).trim();
  if (str === "" || str.startsWith("1970-01-01")) return true;
  const d = new Date(str);
  return isNaN(d.getTime()) || d.getFullYear() <= 1970;
}

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

function formatDate(dateString) {
  if (!dateString || isEpochOrInvalid(dateString)) return "";
  const str = String(dateString).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
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
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatEventDateRange(startStr, endStr, options = { timeZone: "Asia/Kolkata" }) {
  if (isEpochOrInvalid(startStr)) {
    return "Date unavailable";
  }

  const tz = options.timeZone || "Asia/Kolkata";
  const start = new Date(startStr);
  const p1 = getDateParts(start, tz);

  if (isEpochOrInvalid(endStr)) {
    return `${p1.monthStr} ${p1.day}, ${p1.year}`;
  }

  const end = new Date(endStr);
  const p2 = getDateParts(end, tz);

  if (p1.year === p2.year && p1.month === p2.month && p1.day === p2.day) {
    return `${p1.monthStr} ${p1.day}, ${p1.year}`;
  }
  if (p1.year === p2.year && p1.month === p2.month) {
    return `${p1.monthStr} ${p1.day} – ${p2.day}, ${p1.year}`;
  }
  if (p1.year === p2.year) {
    return `${p1.monthStr} ${p1.day} – ${p2.monthStr} ${p2.day}, ${p1.year}`;
  }
  return `${p1.monthStr} ${p1.day}, ${p1.year} – ${p2.monthStr} ${p2.day}, ${p2.year}`;
}

function formatRegistrationDeadline(deadlineStr) {
  if (isEpochOrInvalid(deadlineStr)) {
    return { text: "Open registration", isClosed: false };
  }
  const deadline = new Date(deadlineStr);
  const now = Date.now();
  if (deadline.getTime() < now) {
    return { text: "Registration closed", isClosed: true };
  }
  return {
    text: `Register by ${formatDate(deadlineStr)}`,
    isClosed: false,
  };
}

function formatDateTimeWithTz(dateString, timeZone = "Asia/Kolkata", tzLabel = "IST") {
  if (!dateString || isEpochOrInvalid(dateString)) return "Date unavailable";
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

function parseHackathonData(h) {
  let organizer = "Community Organizer";
  let region = "Global";
  let description = h.description || "";
  let registration_url = `/hackathons/${h.id}`;
  let image_url = h.image_url || null;

  const hostMatch = description.match(/\[Host:\s*([^\]]+)\]/i);
  if (hostMatch) organizer = hostMatch[1].trim();

  const regionMatch = description.match(/\[Region:\s*([^\]]+)\]/i);
  if (regionMatch) region = regionMatch[1].trim();

  const linkMatch = description.match(/\[Link:\s*([^\]]+)\]/i);
  if (linkMatch) registration_url = linkMatch[1].trim();

  const now = Date.now();
  const start_date = h.start_date;
  const end_date = h.end_date;

  let status = "upcoming";
  if (start_date && end_date) {
    const startTime = new Date(start_date).getTime();
    const endTime = new Date(end_date).getTime();
    if (!isNaN(endTime) && now > endTime) {
      status = "ended";
    } else if (!isNaN(startTime) && !isNaN(endTime) && now >= startTime && now <= endTime) {
      status = "ongoing";
    } else {
      status = "upcoming";
    }
  }

  return {
    ...h,
    organizer,
    region,
    start_date,
    end_date,
    status,
    link: registration_url,
  };
}

async function test() {
  const { data, error } = await supabase.from("hackathons").select("*");
  if (error) throw error;

  const parsed = data.map(parseHackathonData);
  const REGION_RANKS = { "Tamil Nadu": 1, "India": 2, "Asia": 3, "Global": 4 };

  const sorted = parsed.sort((a, b) => {
    if (a.status === "ongoing" && b.status !== "ongoing") return -1;
    if (b.status === "ongoing" && a.status !== "ongoing") return 1;
    if (a.status === "upcoming" && b.status === "ended") return -1;
    if (b.status === "upcoming" && a.status === "ended") return 1;
    if (a.status === "ended" && b.status === "ended") {
      const endA = a.end_date ? new Date(a.end_date).getTime() : 0;
      const endB = b.end_date ? new Date(b.end_date).getTime() : 0;
      return endB - endA;
    }
    const rankA = REGION_RANKS[a.region || "Global"] || 5;
    const rankB = REGION_RANKS[b.region || "Global"] || 5;
    if (rankA !== rankB) return rankA - rankB;
    const timeA = a.start_date ? new Date(a.start_date).getTime() : Infinity;
    const timeB = b.start_date ? new Date(b.start_date).getTime() : Infinity;
    return timeA - timeB;
  });

  console.log(`==================================================`);
  console.log(`FRONTEND DISPLAY SIMULATION (${sorted.length} hackathons)`);
  console.log(`==================================================\n`);

  for (let i = 0; i < Math.min(sorted.length, 25); i++) {
    const h = sorted[i];
    const cardRange = formatEventDateRange(h.start_date, h.end_date);
    const deadline = formatRegistrationDeadline(h.registration_deadline);
    const detailFrom = formatDateTimeWithTz(h.start_date);

    console.log(`[#${i + 1}] ${h.title}`);
    console.log(`  ID:            ${h.id}`);
    console.log(`  Status:        ${h.status.toUpperCase()}`);
    console.log(`  Region:        ${h.region}`);
    console.log(`  DB start_date: ${h.start_date}`);
    console.log(`  DB end_date:   ${h.end_date}`);
    console.log(`  Card Displays: "${cardRange}"`);
    console.log(`  Detail From:   "${detailFrom}"`);
    console.log(`  Deadline UI:   "${deadline.text}" (Closed: ${deadline.isClosed})`);
    console.log(`  Source Link:   ${h.link}\n`);
  }
}

test().catch(console.error);
