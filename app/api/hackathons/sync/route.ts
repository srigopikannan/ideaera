import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VERIFIED_FLAGSHIP_HACKATHONS } from "@/lib/constants/hackathons";

function parseISOOrNull(val: any): string | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1970) return d.toISOString();
  } catch {}
  return null;
}

const TN_KEYWORDS = [
  "tamil nadu", "chennai", "coimbatore", "madurai", "trichy", "tiruchirappalli",
  "vellore", "salem", "tirunelveli", "erode", "sivakasi", "namakkal", "thanjavur",
  "ceg", "anna univ", "shaastra", "iitm", "iit madras", "vit", "srm", "sathyabama",
  "kpr", "ssn", "psg", "saveetha", "sns", "amrita vishwa", "cit"
];

function cleanLink(rawUrl: any): string {
  if (!rawUrl) return "https://unstop.com/hackathons";
  let url = String(rawUrl).trim();
  const match = url.match(/(https?:\/\/[^\s]+)$/);
  if (match) url = match[1];
  if (!url.startsWith("http")) {
    url = `https://unstop.com/hackathons/${url}`;
  }
  return url;
}

function extractEventDates(c: any) {
  let startDate: string | null = null;
  let endDate: string | null = null;
  const regDeadline = parseISOOrNull(c.regnRequirements?.end_regn_dt || c.end_regn_dt);

  const rounds = c.rounds || [];
  if (rounds.length > 0) {
    const candidateRounds: any[] = [];
    for (const r of rounds) {
      for (const d of (r.details || [])) {
        if (d.start_date && d.end_date) {
          candidateRounds.push(d);
        }
      }
    }

    if (candidateRounds.length > 0) {
      const mainRound = candidateRounds.find((d: any) =>
        /grand finale|finale|hackathon|main round|offline round|sprint|showcase/i.test(d.title)
      ) || candidateRounds[candidateRounds.length - 1];

      if (mainRound) {
        startDate = parseISOOrNull(mainRound.start_date);
        endDate = parseISOOrNull(mainRound.end_date);
      }
    }
  }

  if (!startDate && c.start_date) {
    startDate = parseISOOrNull(c.start_date);
    endDate = parseISOOrNull(c.end_date || c.start_date);
  }

  return { startDate, endDate, regDeadline };
}

async function fetchLiveUnstopHackathons() {
  const tnQueries = [
    "chennai", "tamil", "coimbatore", "vellore", "trichy",
    "madurai", "srm", "vit", "saveetha", "sathyabama", "kpr", "anna university"
  ];
  const allItems: any[] = [];
  const seenIds = new Set<string>();

  for (const q of tnQueries) {
    try {
      const res = await fetch(
        `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&searchTerm=${q}`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const json = await res.json();
        for (const item of (json?.data?.data || [])) {
          if (item?.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }
    } catch {}
  }

  for (let page = 1; page <= 3; page++) {
    try {
      const res = await fetch(
        `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=50&page=${page}&oppstatus=open`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const json = await res.json();
        for (const item of (json?.data?.data || [])) {
          if (item?.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }
    } catch {}
  }

  const verifiedLive: any[] = [];
  const limit = Math.min(allItems.length, 40);

  for (let i = 0; i < limit; i++) {
    const item = allItems[i];
    try {
      const detailRes = await fetch(`https://unstop.com/api/public/competition/${item.id}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      });
      if (!detailRes.ok) continue;

      const detailJson = await detailRes.json();
      const c = detailJson.data?.competition;
      if (!c || !c.title) continue;

      const dates = extractEventDates(c);
      const host = c.organisation?.name || item.organisation?.name || "Official Institution";
      const fullText = `${c.title} ${host} ${c.details || ""}`.toLowerCase();

      let region: "Tamil Nadu" | "India" | "Asia" | "Global" = "India";
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
      if (c.prizes?.total_prize) {
        prizes =
          typeof c.prizes.total_prize === "number"
            ? `₹${c.prizes.total_prize.toLocaleString("en-IN")}`
            : `₹${c.prizes.total_prize}`;
      } else if (item.prizes?.total_prize) {
        prizes =
          typeof item.prizes.total_prize === "number"
            ? `₹${item.prizes.total_prize.toLocaleString("en-IN")}`
            : `₹${item.prizes.total_prize}`;
      }

      const rawLink = c.seo_url || c.web_url || c.public_url || item.seo_url || item.public_url;
      const link = cleanLink(rawLink);

      const cleanDesc = (c.details || item.details || c.title || "")
        .replace(/<[^>]*>?/gm, "")
        .slice(0, 350)
        .trim();

      const image =
        c.banner ||
        c.logoUrl ||
        item.banner_url ||
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80";

      const isDateTBD = !dates.startDate;

      verifiedLive.push({
        title: c.title.trim(),
        host,
        region,
        location: region === "Tamil Nadu" ? `${host}, Tamil Nadu` : `${host} (Pan-India / Hybrid)`,
        start_date: dates.startDate,
        end_date: dates.endDate,
        registration_deadline: dates.regDeadline,
        is_date_tbd: isDateTBD,
        prize_pool: prizes,
        link,
        image,
        description: cleanDesc ? `${cleanDesc}...` : "Active verified collegiate sprint. Form team members on IdeaEra.",
        min_team_size: c.regnRequirements?.min_team_size || item.team_min || 1,
        max_team_size: c.regnRequirements?.max_team_size || item.team_max || 4,
      });
    } catch {}
  }

  return verifiedLive;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let organizerId = user?.id;
    if (!organizerId) {
      const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
      organizerId = profiles?.[0]?.id;
    }

    if (!organizerId) {
      return NextResponse.json({ error: "No profile available to associate hackathons." }, { status: 400 });
    }

    const liveUnstop = await fetchLiveUnstopHackathons();
    const allHackathons = [...VERIFIED_FLAGSHIP_HACKATHONS, ...liveUnstop];

    let syncedCount = 0;
    for (const hack of allHackathons) {
      const tbdTag = (hack as any).is_date_tbd || !hack.start_date ? " [DateTBD: true]" : "";
      const packedDescription = `[Host: ${hack.host}] [Region: ${hack.region}] [Link: ${hack.link}] [Image: ${hack.image}]${tbdTag} ${hack.description}`;

      const { data: existing } = await supabase
        .from("hackathons")
        .select("id")
        .eq("title", hack.title)
        .maybeSingle();

      const payload = {
        title: hack.title,
        description: packedDescription,
        location: hack.location,
        prize_pool: hack.prize_pool,
        start_date: hack.start_date,
        end_date: hack.end_date,
        registration_deadline: hack.registration_deadline,
        min_team_size: hack.min_team_size,
        max_team_size: hack.max_team_size,
      };

      if (existing) {
        const { error: uErr } = await supabase
          .from("hackathons")
          .update(payload)
          .eq("id", existing.id);

        if (!uErr) syncedCount++;
      } else {
        const { error: iErr } = await supabase.from("hackathons").insert({
          ...payload,
          organizer_id: organizerId,
        });

        if (!iErr) syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} real-time verified hackathons across Tamil Nadu, India, Asia & Worldwide!`,
      count: syncedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Sync failed" }, { status: 500 });
  }
}
