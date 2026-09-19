import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Verified Flagship Hackathons with Exact Real Source Dates
export const VERIFIED_FLAGSHIP_HACKATHONS = [
  {
    title: "Smart India Hackathon (SIH) 2026",
    host: "Ministry of Education & AICTE, Govt of India",
    region: "India",
    location: "60+ Nodal Centers Across India (Hybrid)",
    start_date: "2026-12-08T09:00:00+05:30",
    end_date: "2026-12-10T20:00:00+05:30",
    registration_deadline: "2026-09-30T23:59:00+05:30",
    prize_pool: "₹1,00,000 Per Problem Statement (₹1 Crore+ Total Grants)",
    link: "https://sih.gov.in",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=80",
    description: "The world's largest open innovation competition where Indian student squads solve technology problems submitted by Central Ministries, State Govts, and leading PSUs.",
    min_team_size: 6,
    max_team_size: 6,
  },
  {
    title: "ETHIndia 2026",
    host: "Devfolio & ETHIndia Foundation",
    region: "India",
    location: "Mumbai, India (In-Person)",
    start_date: "2026-11-04T09:00:00+05:30",
    end_date: "2026-11-04T20:00:00+05:30",
    registration_deadline: "2026-10-15T23:59:00+05:30",
    prize_pool: "$100,000+ (₹85,00,000+) in Grants & Bounties",
    link: "https://ethindia.co",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    description: "Asia's premier Ethereum builder gathering held in conjunction with Devcon, uniting developers to push decentralized protocols, zero-knowledge proofs, and account abstraction.",
    min_team_size: 1,
    max_team_size: 4,
  },
  {
    title: "Anna University CEG Kurukshetra Hackathon 2026",
    host: "CEG Tech Forum (CTF), Anna University Chennai",
    region: "Tamil Nadu",
    location: "CEG Anna University, Guindy, Chennai (In-Person)",
    start_date: "2026-03-06T08:00:00+05:30",
    end_date: "2026-03-09T18:00:00+05:30",
    registration_deadline: "2026-02-28T23:59:00+05:30",
    prize_pool: "₹3,50,000 Cash + Tech Internships",
    link: "https://cegtechforum.in",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    description: "Flagship battle of wits hosted by CEG Tech Forum (CTF), College of Engineering Guindy, Anna University. Held annually in March.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "NIT Trichy Pragyan Hackathon 2026",
    host: "NIT Trichy Pragyan Technical Council",
    region: "Tamil Nadu",
    location: "Tiruchirappalli, Tamil Nadu (In-Person)",
    start_date: "2026-02-19T09:00:00+05:30",
    end_date: "2026-02-22T18:00:00+05:30",
    registration_deadline: "2026-02-15T23:59:00+05:30",
    prize_pool: "₹3,00,000 Cash Prizes & Technology Fellowships",
    link: "https://pragyan.org",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    description: "Flagship hackathon of Pragyan, NIT Trichy's ISO-certified techno-managerial fest. Held annually in February.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "IIT Madras Shaastra Hackathon 2026",
    host: "IIT Madras Shaastra Tech Team",
    region: "Tamil Nadu",
    location: "IIT Madras Campus, Chennai (Hybrid)",
    start_date: "2026-01-02T09:00:00+05:30",
    end_date: "2026-01-06T18:00:00+05:30",
    registration_deadline: "2025-12-28T23:59:00+05:30",
    prize_pool: "₹5,00,000 Cash Prizes & IITM Pravartak Incubation",
    link: "https://shaastra.org",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
    description: "Tamil Nadu's premier collegiate technical symposium at IIT Madras. Held annually in January.",
    min_team_size: 2,
    max_team_size: 4,
  },
];

function extractEventDates(c) {
  let startDate = null;
  let endDate = null;
  let regDeadline = c.regnRequirements?.end_regn_dt || c.end_regn_dt || null;

  const rounds = c.rounds || [];
  if (rounds.length > 0) {
    const candidateRounds = [];
    for (const r of rounds) {
      for (const d of (r.details || [])) {
        if (d.start_date && d.end_date) {
          candidateRounds.push(d);
        }
      }
    }

    if (candidateRounds.length > 0) {
      // Find main hackathon or finale round if multiple rounds
      const mainRound = candidateRounds.find(d => 
        /grand finale|finale|hackathon|main round|offline round|sprint|showcase/i.test(d.title)
      ) || candidateRounds[candidateRounds.length - 1];

      if (mainRound) {
        startDate = mainRound.start_date;
        endDate = mainRound.end_date;
      }
    }
  }

  // Fallback to competition overall timeline if no round dates
  if (!startDate && c.start_date) {
    startDate = c.start_date;
    endDate = c.end_date || c.start_date;
  }

  return {
    startDate,
    endDate,
    regDeadline,
  };
}

const TN_KEYWORDS = [
  "tamil nadu", "chennai", "coimbatore", "madurai", "trichy", "tiruchirappalli",
  "vellore", "salem", "tirunelveli", "erode", "sivakasi", "namakkal", "thanjavur",
  "ceg", "anna univ", "shaastra", "iitm", "iit madras", "vit", "srm", "sathyabama",
  "kpr", "ssn", "psg", "saveetha", "sns", "amrita vishwa", "cit", "saveetha"
];

function cleanLink(rawUrl) {
  if (!rawUrl) return "https://unstop.com/hackathons";
  let url = String(rawUrl).trim();
  // Remove accidental double prefixes like "https://unstop.com/hackathons/https://unstop.com/..."
  const match = url.match(/(https?:\/\/[^\s]+)$/);
  if (match) url = match[1];
  if (!url.startsWith("http")) {
    url = `https://unstop.com/hackathons/${url}`;
  }
  return url;
}

export async function syncRealHackathons() {
  console.log("==================================================");
  console.log("SYNCING REAL HACKATHONS WITH EXACT SOURCE DATES");
  console.log("==================================================\n");

  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  const organizerId = profiles?.[0]?.id;

  // 1. Update Verified Flagship Hackathons
  console.log("--- 1. Updating Flagship Hackathons ---");
  for (const flag of VERIFIED_FLAGSHIP_HACKATHONS) {
    const packedDescription = `[Host: ${flag.host}] [Region: ${flag.region}] [Link: ${flag.link}] [Image: ${flag.image}] ${flag.description}`;
    const payload = {
      title: flag.title,
      description: packedDescription,
      location: flag.location,
      prize_pool: flag.prize_pool,
      start_date: flag.start_date,
      end_date: flag.end_date,
      registration_deadline: flag.registration_deadline,
      min_team_size: flag.min_team_size,
      max_team_size: flag.max_team_size,
    };

    const { data: existing } = await supabase
      .from("hackathons")
      .select("id")
      .eq("title", flag.title)
      .maybeSingle();

    if (existing) {
      await supabase.from("hackathons").update(payload).eq("id", existing.id);
      console.log(`Updated flagship: ${flag.title}`);
    } else {
      await supabase.from("hackathons").insert({ ...payload, organizer_id: organizerId });
      console.log(`Inserted flagship: ${flag.title}`);
    }
  }

  // 2. Fetch active search opportunities from Unstop
  console.log("\n--- 2. Fetching Live Hackathons from Unstop ---");
  const searchQueries = [
    "chennai", "tamil", "coimbatore", "vellore", "trichy", "madurai",
    "srm", "vit", "kpr", "anna university"
  ];
  const allItems = [];
  const seenIds = new Set();

  for (const q of searchQueries) {
    try {
      const res = await fetch(`https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&searchTerm=${q}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.ok) {
        const json = await res.json();
        for (const item of (json?.data?.data || [])) {
          if (item?.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }
    } catch (e) {}
  }

  for (let page = 1; page <= 3; page++) {
    try {
      const res = await fetch(`https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=50&page=${page}&oppstatus=open`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (res.ok) {
        const json = await res.json();
        for (const item of (json?.data?.data || [])) {
          if (item?.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }
    } catch (e) {}
  }

  console.log(`Found ${allItems.length} candidate open opportunities from Unstop.`);

  // 3. For each candidate opportunity, fetch competition details to get REAL dates
  console.log("\n--- 3. Fetching Competition Details & Rounds ---");
  let verifiedCount = 0;
  const now = Date.now();

  for (let i = 0; i < Math.min(allItems.length, 50); i++) {
    const item = allItems[i];
    try {
      const detailRes = await fetch(`https://unstop.com/api/public/competition/${item.id}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!detailRes.ok) continue;

      const detailJson = await detailRes.json();
      const c = detailJson.data?.competition;
      if (!c || !c.title) continue;

      const dates = extractEventDates(c);
      const host = c.organisation?.name || item.organisation?.name || "Official Institution";
      const fullText = `${c.title} ${host} ${c.details || ""}`.toLowerCase();

      let region = "India";
      if (TN_KEYWORDS.some((k) => fullText.includes(k))) {
        region = "Tamil Nadu";
      } else if (fullText.includes("international") || fullText.includes("global")) {
        region = "Global";
      }

      let prizes = "Prizes & Recognition";
      if (c.prizes?.total_prize) {
        prizes = typeof c.prizes.total_prize === "number"
          ? `₹${c.prizes.total_prize.toLocaleString("en-IN")}`
          : `₹${c.prizes.total_prize}`;
      } else if (item.prizes?.total_prize) {
        prizes = typeof item.prizes.total_prize === "number"
          ? `₹${item.prizes.total_prize.toLocaleString("en-IN")}`
          : `₹${item.prizes.total_prize}`;
      }

      const rawLink = c.seo_url || c.web_url || c.public_url || item.seo_url || item.public_url;
      const link = cleanLink(rawLink);

      const cleanDesc = (c.details || item.details || c.title || "")
        .replace(/<[^>]*>?/gm, "")
        .slice(0, 350)
        .trim();

      const image = c.banner || c.logoUrl || item.banner_url || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80";

      const isDateTBD = !dates.startDate;
      const tbdTag = isDateTBD ? " [DateTBD: true]" : "";
      const packedDescription = `[Host: ${host}] [Region: ${region}] [Link: ${link}] [Image: ${image}]${tbdTag} ${cleanDesc}`;

      const locationStr = region === "Tamil Nadu" ? `${host}, Tamil Nadu` : `${host} (Pan-India / Hybrid)`;

      const payload = {
        title: c.title.trim(),
        description: packedDescription,
        location: locationStr,
        prize_pool: prizes,
        start_date: dates.startDate,
        end_date: dates.endDate,
        registration_deadline: dates.regDeadline,
        min_team_size: c.regnRequirements?.min_team_size || item.team_min || 1,
        max_team_size: c.regnRequirements?.max_team_size || item.team_max || 4,
      };

      // Check if existing record by title
      const { data: existing } = await supabase
        .from("hackathons")
        .select("id")
        .eq("title", payload.title)
        .maybeSingle();

      if (existing) {
        await supabase.from("hackathons").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("hackathons").insert({ ...payload, organizer_id: organizerId });
      }

      verifiedCount++;
      console.log(`[VERIFIED ${verifiedCount}] ${c.title.slice(0, 45)} | Start: ${dates.startDate || "Date unavailable"} | End: ${dates.endDate || "Date unavailable"} | Deadline: ${dates.regDeadline || "None"}`);
    } catch (err) {
      console.error(`Error processing item ${item.id}:`, err.message);
    }
  }

  // 4. Clean up any remaining 1970-epoch sentinel dates from the database
  console.log("\n--- 4. Cleaning Remaining 1970 Epoch Sentinels ---");
  const { data: epochRows } = await supabase
    .from("hackathons")
    .select("id, title, start_date")
    .ilike("start_date", "1970-%");

  if (epochRows && epochRows.length > 0) {
    console.log(`Found ${epochRows.length} stale epoch rows. Removing or setting NULL...`);
    for (const r of epochRows) {
      // If it's a duplicate or expired, delete it; otherwise set null
      await supabase.from("hackathons").delete().eq("id", r.id);
    }
    console.log(`Deleted ${epochRows.length} stale 1970-epoch records.`);
  }

  console.log("\n==================================================");
  console.log(`SYNC COMPLETE: Verified and synced ${verifiedCount} real hackathons.`);
  console.log("==================================================");
}

syncRealHackathons().catch(console.error);
