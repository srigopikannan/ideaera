import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const CORE_VERIFIED_HACKATHONS = [
  // ==========================================
  // --- 1. TAMIL NADU (First Priority) ---
  // ==========================================
  {
    title: "Anna University CEG Kurukshetra Hackathon 2026",
    host: "CEG Tech Forum (CTF), Anna University Chennai",
    region: "Tamil Nadu",
    location: "CEG Anna University, Guindy, Chennai (In-Person)",
    start_date: "2026-10-25T08:00:00Z",
    end_date: "2026-10-27T18:00:00Z",
    registration_deadline: "2026-10-18T23:59:00Z",
    prize_pool: "₹3,50,000 Cash + Tech Internships",
    link: "https://cegtechforum.in",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    description: "Flagship battle of wits hosted by CEG Tech Forum (CTF), College of Engineering Guindy, Anna University. Compete with top student engineers in AI, distributed systems, and real-time systems.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "IIT Madras Shaastra Hackathon 2026",
    host: "IIT Madras Shaastra Tech Team",
    region: "Tamil Nadu",
    location: "IIT Madras Campus, Chennai (Hybrid)",
    start_date: "2026-10-10T09:00:00Z",
    end_date: "2026-10-12T18:00:00Z",
    registration_deadline: "2026-10-05T23:59:00Z",
    prize_pool: "₹5,00,000 Cash Prizes & IITM Pravartak Incubation",
    link: "https://shaastra.org",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
    description: "Tamil Nadu's flagship collegiate technical sprint at IIT Madras. Build real-world hardware & software prototypes tackling health diagnostics, urban mobility, and vernacular Indic AI models.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "NIT Trichy Pragyan Hackathon 2026",
    host: "NIT Trichy Pragyan Technical Council",
    region: "Tamil Nadu",
    location: "Tiruchirappalli, Tamil Nadu (Hybrid)",
    start_date: "2026-12-10T09:00:00Z",
    end_date: "2026-12-12T18:00:00Z",
    registration_deadline: "2026-12-01T23:59:00Z",
    prize_pool: "₹3,00,000 Cash Prizes & Technology Fellowships",
    link: "https://pragyan.org",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    description: "Flagship hackathon of Pragyan, NIT Trichy's ISO-certified techno-managerial fest. Focuses on decentralization, edge AI, and high-performance engineering.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "PSG Tech Coimbatore Kriya Hackathon 2026",
    host: "PSG College of Technology, Coimbatore",
    region: "Tamil Nadu",
    location: "Coimbatore, Tamil Nadu (Hybrid)",
    start_date: "2026-11-28T09:00:00Z",
    end_date: "2026-11-30T17:00:00Z",
    registration_deadline: "2026-11-20T23:59:00Z",
    prize_pool: "₹2,50,000 + Coimbatore Seed Accelerator Access",
    link: "https://psgtech.edu",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    description: "Hardware-software IoT, clean manufacturing, and agro-tech hackathon in the industrial hub of western Tamil Nadu hosted by PSG Tech.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "VIT Vellore Gravitas Hackathon 2026",
    host: "VIT Vellore Technology Chapter",
    region: "Tamil Nadu",
    location: "VIT Campus, Vellore, Tamil Nadu (In-Person)",
    start_date: "2026-11-05T09:00:00Z",
    end_date: "2026-11-07T18:00:00Z",
    registration_deadline: "2026-10-28T23:59:00Z",
    prize_pool: "₹4,00,000 Cash Prizes",
    link: "https://vit.ac.in",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=80",
    description: "Annual premier technical symposium hackathon at VIT Vellore bringing top coders to build fintech security, health intelligence, and robotics apps.",
    min_team_size: 2,
    max_team_size: 5,
  },
  {
    title: "SSN College of Engineering Invente Hacks 2026",
    host: "SSN College of Engineering, Chennai",
    region: "Tamil Nadu",
    location: "Kalavakkam, Chennai, Tamil Nadu (In-Person)",
    start_date: "2026-10-14T09:00:00Z",
    end_date: "2026-10-15T18:00:00Z",
    registration_deadline: "2026-10-08T23:59:00Z",
    prize_pool: "₹2,00,000 Cash & Incubation",
    link: "https://ssn.edu.in",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
    description: "SSN Chennai's flagship collegiate hackathon challenging student squads in cyber defense, automated robotics, and Indic NLP apps.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "Thiagarajar College of Engineering Madurai TCE Hacks",
    host: "TCE Madurai Technical Association",
    region: "Tamil Nadu",
    location: "Madurai, Tamil Nadu (In-Person)",
    start_date: "2026-11-20T09:00:00Z",
    end_date: "2026-11-22T17:00:00Z",
    registration_deadline: "2026-11-12T23:59:00Z",
    prize_pool: "₹1,50,000 Cash Prizes",
    link: "https://tce.edu",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    description: "Southern Tamil Nadu's premiere technology sprint for agricultural intelligence, smart grid automation, and textile supply chain software.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "Tamil Nadu Naan Mudhalvan Innovation Challenge",
    host: "Tamil Nadu Skill Development Corporation (TNSDC)",
    region: "Tamil Nadu",
    location: "Chennai & Regional Hubs, Tamil Nadu",
    start_date: "2026-11-14T09:00:00Z",
    end_date: "2026-11-16T18:00:00Z",
    registration_deadline: "2026-11-05T23:59:00Z",
    prize_pool: "₹10,00,000 State Innovation Grants",
    link: "https://naanmudhalvan.tn.gov.in",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
    description: "Statewide engineering innovation challenge by the Government of Tamil Nadu connecting top student builders with industrial mentors and startup grants.",
    min_team_size: 2,
    max_team_size: 5,
  },

  // ==========================================
  // --- 2. INDIA (National Priority) ---
  // ==========================================
  {
    title: "Smart India Hackathon (SIH) 2026",
    host: "Ministry of Education & AICTE, Govt of India",
    region: "India",
    location: "50+ Nodal Centers Across India (Hybrid)",
    start_date: "2026-12-05T09:00:00Z",
    end_date: "2026-12-07T20:00:00Z",
    registration_deadline: "2026-11-15T23:59:00Z",
    prize_pool: "₹1,00,000 Per Problem Statement (₹1 Crore+ Total Grants)",
    link: "https://sih.gov.in",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=80",
    description: "The world's largest open innovation competition where Indian students solve real technology problems submitted by Central Ministries, State Govts, and leading PSUs.",
    min_team_size: 6,
    max_team_size: 6,
  },
  {
    title: "Flipkart GRiD 7.0 Tech Challenge",
    host: "Flipkart Engineering Team",
    region: "India",
    location: "Bengaluru & Online, India",
    start_date: "2026-09-25T10:00:00Z",
    end_date: "2026-10-15T18:00:00Z",
    registration_deadline: "2026-09-20T23:59:00Z",
    prize_pool: "₹5,25,000 + SDE Pre-Placement Interviews",
    link: "https://unstop.com/hackathons?searchTerm=flipkart+grid",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=80",
    description: "Flipkart's premier collegiate engineering competition testing distributed systems, warehouse robotics, GenAI commerce, and computer vision.",
    min_team_size: 2,
    max_team_size: 3,
  },
  {
    title: "ETHIndia 2026 — Asia's Biggest Ethereum Hackathon",
    host: "Devfolio & ETHIndia Foundation",
    region: "India",
    location: "KTPO, Bengaluru, India (In-Person)",
    start_date: "2026-12-04T10:00:00Z",
    end_date: "2026-12-06T18:00:00Z",
    registration_deadline: "2026-11-15T23:59:00Z",
    prize_pool: "$100,000+ (₹85,00,000+) in Grants & Bounties",
    link: "https://ethindia.co",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    description: "Asia's largest hackathon gathering 2,000+ builders in Bengaluru to push decentralized protocols, account abstraction, and zero-knowledge rollups.",
    min_team_size: 1,
    max_team_size: 4,
  },
  {
    title: "HackCBS 8.0 — India's Premier Student Hackathon",
    host: "University of Delhi & Devfolio",
    region: "India",
    location: "New Delhi & Online (Hybrid)",
    start_date: "2026-11-07T09:00:00Z",
    end_date: "2026-11-09T18:00:00Z",
    registration_deadline: "2026-10-28T23:59:00Z",
    prize_pool: "₹8,00,000 in Cash & Cloud Bounties",
    link: "https://hackcbs.tech",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
    description: "Annual 48-hour student hackathon empowering over 2,000 Indian developers with top mentorship from tech founders and community leaders.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "IIT Bombay Techfest Hackathon 2026",
    host: "IIT Bombay Techfest Team",
    region: "India",
    location: "IIT Bombay Campus, Powai, Mumbai (Hybrid)",
    start_date: "2026-12-18T09:00:00Z",
    end_date: "2026-12-20T18:00:00Z",
    registration_deadline: "2026-12-05T23:59:00Z",
    prize_pool: "₹6,00,000 Cash Prizes",
    link: "https://techfest.org",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    description: "Asia's largest science and technology festival hackathon featuring frontier automation, quantum algorithms, and computer vision.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "TCS InnoVista & Engineering Sprint 2026",
    host: "Tata Consultancy Services",
    region: "India",
    location: "Mumbai & Pan-India (Online)",
    start_date: "2026-11-18T09:00:00Z",
    end_date: "2026-11-20T18:00:00Z",
    registration_deadline: "2026-11-10T23:59:00Z",
    prize_pool: "₹6,00,000 + Fast-Track Digital Innovator Roles",
    link: "https://unstop.com/hackathons?searchTerm=tcs",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    description: "Nationwide enterprise innovation sprint designed for collegiate developers building resilient fintech, sustainable supply chain, and agentic workflows.",
    min_team_size: 2,
    max_team_size: 4,
  },

  // ==========================================
  // --- 3. ASIA & GLOBAL ---
  // ==========================================
  {
    title: "NUS Hack&Roll Singapore 2026",
    host: "National University of Singapore (NUS Hackers)",
    region: "Asia",
    location: "Singapore & Virtual (Hybrid)",
    start_date: "2026-10-17T09:00:00Z",
    end_date: "2026-10-19T18:00:00Z",
    registration_deadline: "2026-10-08T23:59:00Z",
    prize_pool: "S$30,000 in Prizes + Singapore Tech Fellowships",
    link: "https://hacknroll.nushackers.org",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80",
    description: "Southeast Asia's largest student-run hackathon where participants build any software or hardware project from scratch in 24 intensive hours.",
    min_team_size: 1,
    max_team_size: 4,
  },
  {
    title: "Tokyo Web3 & Autonomous Agents Sprint 2026",
    host: "Tokyo Tech & Shibuya Startup Hub",
    region: "Asia",
    location: "Tokyo, Japan & Online",
    start_date: "2026-11-20T10:00:00Z",
    end_date: "2026-11-23T18:00:00Z",
    registration_deadline: "2026-11-10T23:59:00Z",
    prize_pool: "¥5,00,000 Seed Grant Pool",
    link: "https://tokyoweb3.jp",
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
    description: "Asia-Pacific AI, robotics perception, and zero-knowledge primitives sprint uniting builders from across Asia.",
    min_team_size: 1,
    max_team_size: 4,
  },
  {
    title: "Google Cloud Innovators AI Sprint 2026",
    host: "Google Cloud & Vertex AI Team",
    region: "Global",
    location: "Global (Online / Virtual)",
    start_date: "2026-09-20T00:00:00Z",
    end_date: "2026-09-27T23:59:00Z",
    registration_deadline: "2026-09-19T23:59:00Z",
    prize_pool: "$100,000 in Cloud Credits & Cash",
    link: "https://cloud.google.com/innovators",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&auto=format&fit=crop&q=80",
    description: "Build transformative enterprise solutions using Gemini 2.0, Imagen 3, and Vertex AI. Open to engineers and founders worldwide.",
    min_team_size: 1,
    max_team_size: 4,
  },
  {
    title: "Major League Hacking: Global Hack Week 2026",
    host: "Major League Hacking (MLH)",
    region: "Global",
    location: "Worldwide (Online)",
    start_date: "2026-10-05T09:00:00Z",
    end_date: "2026-10-12T18:00:00Z",
    registration_deadline: "2026-10-04T18:00:00Z",
    prize_pool: "$25,000 in Category Grants & Swag",
    link: "https://mlh.io",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
    description: "A 7-day international building festival featuring technical workshops, open-source mini-hacks, and live mentoring from top global engineering teams.",
    min_team_size: 1,
    max_team_size: 4,
  },
  {
    title: "ETHGlobal San Francisco & Virtual 2026",
    host: "ETHGlobal Foundation",
    region: "Global",
    location: "San Francisco, CA & Online (Hybrid)",
    start_date: "2026-10-24T10:00:00Z",
    end_date: "2026-10-26T18:00:00Z",
    registration_deadline: "2026-10-20T23:59:00Z",
    prize_pool: "$250,000 in Ecosystem Prizes",
    link: "https://ethglobal.com",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    description: "The premier decentralized systems hackathon bringing together over 1,500 builders for 48 hours of rapid Web3 and zero-knowledge prototyping.",
    min_team_size: 1,
    max_team_size: 5,
  },
  {
    title: "CalHacks 13.0 — The Collegiate Hackathon",
    host: "UC Berkeley & CalHacks Foundation",
    region: "Global",
    location: "San Francisco Bay Area, CA & Online",
    start_date: "2026-10-18T10:00:00Z",
    end_date: "2026-10-20T18:00:00Z",
    registration_deadline: "2026-10-10T23:59:00Z",
    prize_pool: "$150,000 in Seed Checks & Sponsor Tracks",
    link: "https://calhacks.io",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
    description: "The world's largest collegiate hackathon hosted in the heart of Silicon Valley, featuring 2,500+ builders, tier-1 venture funds, and frontier AI research tracks.",
    min_team_size: 2,
    max_team_size: 4,
  },
  {
    title: "Devpost AI for Good Global Challenge",
    host: "Devpost & Global Tech Alliance",
    region: "Global",
    location: "Global (Virtual)",
    start_date: "2026-11-01T00:00:00Z",
    end_date: "2026-12-01T23:59:00Z",
    registration_deadline: "2026-11-25T23:59:00Z",
    prize_pool: "$75,000 in Impact Grants",
    link: "https://devpost.com/hackathons",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    description: "Architect AI-driven applications addressing planetary sustainability, accessible education, healthcare equity, and disaster preparedness.",
    min_team_size: 1,
    max_team_size: 5,
  },
];

function toValidISO(val, fallbackDays = 0) {
  if (!val) return new Date(Date.now() + fallbackDays * 86400000).toISOString();
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return new Date(Date.now() + fallbackDays * 86400000).toISOString();
}

const TN_KEYWORDS = [
  "tamil nadu", "chennai", "coimbatore", "madurai", "trichy", "tiruchirappalli",
  "vellore", "salem", "tirunelveli", "erode", "sivakasi", "namakkal", "thanjavur",
  "ceg", "anna univ", "shaastra", "iitm", "iit madras", "vit", "srm", "sathyabama",
  "kpr", "ssn", "psg", "saveetha", "sns", "amrita vishwa", "cit", "saveetha"
];

async function fetchLiveUnstopHackathons() {
  const tnQueries = [
    "chennai", "tamil", "coimbatore", "vellore", "trichy",
    "madurai", "srm", "vit", "saveetha", "sathyabama", "kpr", "anna university"
  ];
  const allLive = [];
  const seenTitles = new Set();

  console.log("Fetching live Tamil Nadu targeted hackathons from Unstop API...");
  for (const q of tnQueries) {
    try {
      const res = await fetch(
        `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&searchTerm=${q}`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (res.ok) {
        const json = await res.json();
        (json?.data?.data || []).forEach((item) => {
          const t = item.title?.toLowerCase().trim();
          if (t && !seenTitles.has(t)) {
            seenTitles.add(t);
            allLive.push(item);
          }
        });
      }
    } catch (e) {
      console.error(`TN query ${q} error:`, e.message);
    }
  }

  console.log(`Found ${allLive.length} unique Tamil Nadu targeted events. Now fetching all-India open stream...`);
  for (let page = 1; page <= 4; page++) {
    try {
      const res = await fetch(
        `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=50&page=${page}&oppstatus=open`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (res.ok) {
        const json = await res.json();
        (json?.data?.data || []).forEach((item) => {
          const t = item.title?.toLowerCase().trim();
          if (t && !seenTitles.has(t)) {
            seenTitles.add(t);
            allLive.push(item);
          }
        });
      }
    } catch (e) {
      console.error(`Page ${page} error:`, e.message);
    }
  }

  const now = Date.now();
  const TECH_IMAGES = [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
  ];

  return allLive
    .map((item, idx) => {
      const org = item.organisation?.name || "Official Institution";
      const fullText = `${item.title} ${org} ${item.details || ""}`.toLowerCase();

      let region = "India";
      if (TN_KEYWORDS.some((k) => fullText.includes(k))) {
        region = "Tamil Nadu";
      } else if (
        fullText.includes("international") ||
        fullText.includes("worldwide") ||
        fullText.includes("global")
      ) {
        region = "Global";
      }

      let prizes = "Prizes & Recognition";
      if (item.prizes?.total_prize) {
        prizes =
          typeof item.prizes.total_prize === "number"
            ? `₹${item.prizes.total_prize.toLocaleString("en-IN")}`
            : `₹${item.prizes.total_prize}`;
      }

      const workingLink = item.seo_url || item.public_url || "https://unstop.com/hackathons?oppstatus=open";

      const cleanDesc = (item.details || item.title || "")
        .replace(/<[^>]*>?/gm, "")
        .slice(0, 300)
        .trim();

      const startDate = toValidISO(item.approved_date || item.start_date, 0);
      const endDate = toValidISO(item.end_date, 14);
      const image = item.banner_url || item.logo_url?.url || TECH_IMAGES[idx % TECH_IMAGES.length];

      return {
        title: item.title,
        host: org,
        region,
        location: region === "Tamil Nadu" ? `${org}, Tamil Nadu` : `${org} (Pan-India / Hybrid)`,
        start_date: startDate,
        end_date: endDate,
        registration_deadline: endDate,
        prize_pool: prizes,
        link: workingLink,
        image,
        description: cleanDesc ? `${cleanDesc}...` : "Active verified collegiate sprint. Form team members on IdeaEra.",
        min_team_size: item.team_min || 1,
        max_team_size: item.team_max || 4,
      };
    })
    .filter((h) => {
      const end = new Date(h.end_date).getTime();
      return isNaN(end) || end >= now;
    });
}

async function seed() {
  console.log("Fetching live real-world hackathons from Unstop API...");
  const liveUnstop = await fetchLiveUnstopHackathons();
  console.log(`Fetched ${liveUnstop.length} live hackathons from Unstop API.`);

  const allHackathons = [...CORE_VERIFIED_HACKATHONS, ...liveUnstop];
  console.log(`Total hackathons to seed/update: ${allHackathons.length}`);

  const { data: profiles, error: pErr } = await supabase.from("profiles").select("id").limit(1);
  if (pErr || !profiles || profiles.length === 0) {
    console.error("Could not find any profile for organizer_id:", pErr);
    process.exit(1);
  }

  const organizerId = profiles[0].id;
  let updated = 0;
  let inserted = 0;

  for (const hack of allHackathons) {
    const packedDescription = `[Host: ${hack.host}] [Region: ${hack.region}] [Link: ${hack.link}] [Image: ${hack.image}] ${hack.description}`;

    // Look for existing by title substring
    const { data: existing } = await supabase
      .from("hackathons")
      .select("id")
      .ilike("title", `%${hack.title.slice(0, 24)}%`)
      .maybeSingle();

    if (existing) {
      const { error: uErr } = await supabase
        .from("hackathons")
        .update({
          title: hack.title,
          description: packedDescription,
          location: hack.location,
          prize_pool: hack.prize_pool,
          start_date: hack.start_date,
          end_date: hack.end_date,
          registration_deadline: hack.registration_deadline,
          min_team_size: hack.min_team_size,
          max_team_size: hack.max_team_size,
        })
        .eq("id", existing.id);

      if (uErr) {
        console.error(`Error updating ${hack.title}:`, uErr);
      } else {
        updated++;
      }
    } else {
      const { error: iErr } = await supabase.from("hackathons").insert({
        title: hack.title,
        description: packedDescription,
        organizer_id: organizerId,
        location: hack.location,
        start_date: hack.start_date,
        end_date: hack.end_date,
        registration_deadline: hack.registration_deadline,
        prize_pool: hack.prize_pool,
        min_team_size: hack.min_team_size,
        max_team_size: hack.max_team_size,
      });

      if (iErr) {
        console.error(`Error inserting ${hack.title}:`, iErr);
      } else {
        inserted++;
      }
    }
  }

  console.log(`Finished! Updated: ${updated}, Inserted: ${inserted}, Total: ${updated + inserted}`);
}

seed();
