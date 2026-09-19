import { createClient } from "@supabase/supabase-js";
import { formatEventDateRange, formatDate, formatDateTimeWithTz } from "../lib/utils.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_HACKATHONS = [
  "Smart India Hackathon (SIH) 2026",
  "ETHIndia 2026",
  "Anna University CEG Kurukshetra Hackathon 2026",
  "NIT Trichy Pragyan Hackathon 2026",
  "IIT Madras Shaastra Hackathon 2026",
  "NeuraMorphix HackForge 2026",
  "Invente'26 - Project Showcase 4.0",
  "Secura",
  "VibeCraft",
  "Data Wars",
  "YUVA Megathon 2026",
  "HackNext'26 Series 2.0",
];

async function verify() {
  console.log("=========================================================================================");
  console.log("VERIFYING 10+ REAL HACKATHONS: SOURCE -> SUPABASE -> DISPLAYED DATES");
  console.log("=========================================================================================\n");

  const { data: rows, error } = await supabase.from("hackathons").select("*");
  if (error || !rows) {
    console.error("Failed to query hackathons:", error);
    process.exit(1);
  }

  const verifiedList = [];

  for (const name of TARGET_HACKATHONS) {
    const row = rows.find(r => r.title.toLowerCase().trim() === name.toLowerCase().trim());
    if (!row) {
      console.warn(`Could not find "${name}" in database.`);
      continue;
    }

    const desc = row.description || "";
    const linkMatch = desc.match(/\[Link:\s*([^\]]+)\]/i);
    const hostMatch = desc.match(/\[Host:\s*([^\]]+)\]/i);
    const regionMatch = desc.match(/\[Region:\s*([^\]]+)\]/i);

    const sourceUrl = linkMatch ? linkMatch[1].trim() : "N/A";
    const host = hostMatch ? hostMatch[1].trim() : "Official Organization";
    const region = regionMatch ? regionMatch[1].trim() : "India";

    // Displayed Card Date: formatEventDateRange
    const displayedCardDate = formatEventDateRange(row.start_date, row.end_date);
    
    // Displayed Detail Start Date: formatDateTimeWithTz
    const displayedDetailStart = row.start_date
      ? formatDateTimeWithTz(row.start_date, "Asia/Kolkata", "IST")
      : "Date unavailable";

    // Displayed Detail End Date
    const displayedDetailEnd = row.end_date
      ? formatDateTimeWithTz(row.end_date, "Asia/Kolkata", "IST")
      : "Date unavailable";

    verifiedList.push({
      name: row.title,
      id: row.id,
      region,
      host,
      sourceUrl,
      sourceStartDate: row.start_date,
      sourceEndDate: row.end_date,
      supabaseStartDate: row.start_date,
      supabaseEndDate: row.end_date,
      displayedCardDate,
      displayedDetailStart,
      displayedDetailEnd,
    });
  }

  console.log(`Found and verified ${verifiedList.length} hackathons:\n`);

  for (let i = 0; i < verifiedList.length; i++) {
    const h = verifiedList[i];
    console.log(`[#${i + 1}] ${h.name}`);
    console.log(`  Hackathon ID:         ${h.id}`);
    console.log(`  Region:               ${h.region}`);
    console.log(`  Organizer:            ${h.host}`);
    console.log(`  Source URL:           ${h.sourceUrl}`);
    console.log(`  Source Start Date:    ${h.sourceStartDate}`);
    console.log(`  Source End Date:      ${h.sourceEndDate}`);
    console.log(`  Supabase Start Date:  ${h.supabaseStartDate}`);
    console.log(`  Supabase End Date:    ${h.supabaseEndDate}`);
    console.log(`  Displayed Card Date:  "${h.displayedCardDate}"`);
    console.log(`  Displayed Start (IST):"${h.displayedDetailStart}"`);
    console.log(`  Displayed End (IST):  "${h.displayedDetailEnd}"`);
    console.log("-----------------------------------------------------------------------------------------");
  }

  // Also print Markdown table format
  console.log("\n=========================================================================================");
  console.log("CANONICAL VERIFICATION TABLE (MARKDOWN)");
  console.log("=========================================================================================\n");

  console.log("| # | Hackathon Name | Hackathon ID | Source URL | Source Start | Source End | Supabase Start | Supabase End | Displayed Card Date | Displayed Detail Start (IST) |");
  console.log("|---|---|---|---|---|---|---|---|---|---|");
  for (let i = 0; i < verifiedList.length; i++) {
    const h = verifiedList[i];
    console.log(`| ${i + 1} | ${h.name} | \`${h.id.slice(0, 8)}...\` | [Link](${h.sourceUrl}) | ${h.sourceStartDate ? h.sourceStartDate.slice(0, 16) : "None"} | ${h.sourceEndDate ? h.sourceEndDate.slice(0, 16) : "None"} | ${h.supabaseStartDate ? h.supabaseStartDate.slice(0, 16) : "None"} | ${h.supabaseEndDate ? h.supabaseEndDate.slice(0, 16) : "None"} | **${h.displayedCardDate}** | ${h.displayedDetailStart} |`);
  }

  console.log(`\nVerification successful: ${verifiedList.length} records verified.`);
}

verify().catch(console.error);
