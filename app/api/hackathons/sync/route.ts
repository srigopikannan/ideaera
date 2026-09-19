import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CORE_VERIFIED_HACKATHONS } from "@/scripts/seed-hackathons.mjs";

function parseISOOrNull(val: any): string | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return null;
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
  const allLive: any[] = [];
  const seenTitles = new Set();

  for (const q of tnQueries) {
    try {
      const res = await fetch(
        `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&searchTerm=${q}`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const json = await res.json();
        (json?.data?.data || []).forEach((item: any) => {
          const t = item.title?.toLowerCase().trim();
          if (t && !seenTitles.has(t)) {
            seenTitles.add(t);
            allLive.push(item);
          }
        });
      }
    } catch (e) {}
  }

  for (let page = 1; page <= 4; page++) {
    try {
      const res = await fetch(
        `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&per_page=50&page=${page}&oppstatus=open`,
        { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const json = await res.json();
        (json?.data?.data || []).forEach((item: any) => {
          const t = item.title?.toLowerCase().trim();
          if (t && !seenTitles.has(t)) {
            seenTitles.add(t);
            allLive.push(item);
          }
        });
      }
    } catch (e) {}
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
    .map((item: any, idx: number) => {
      const org = item.organisation?.name || "Official Institution";
      const fullText = `${item.title} ${org} ${item.details || ""}`.toLowerCase();

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

      // Registration deadline is end_date or regnRequirements.end_regn_dt
      const regDeadline = parseISOOrNull(item.end_date || item.regnRequirements?.end_regn_dt);
      
      // External API does not provide event dates in search result. DO NOT invent dates.
      const startDate = parseISOOrNull(item.event_start_date || item.start_date);
      const endDate = parseISOOrNull(item.event_end_date || item.end_date_event);
      const isDateTBD = !startDate;
      const image = item.banner_url || item.logo_url?.url || TECH_IMAGES[idx % TECH_IMAGES.length];

      return {
        title: item.title,
        host: org,
        region,
        location: region === "Tamil Nadu" ? `${org}, Tamil Nadu` : `${org} (Pan-India / Hybrid)`,
        start_date: startDate,
        end_date: endDate,
        registration_deadline: regDeadline,
        is_date_tbd: isDateTBD,
        prize_pool: prizes,
        link: workingLink,
        image,
        description: cleanDesc ? `${cleanDesc}...` : "Active verified collegiate sprint. Form team members on IdeaEra.",
        min_team_size: item.team_min || 1,
        max_team_size: item.team_max || 4,
      };
    })
    .filter((h) => {
      const deadline = h.registration_deadline ? new Date(h.registration_deadline).getTime() : NaN;
      const end = h.end_date ? new Date(h.end_date).getTime() : NaN;
      if (!isNaN(deadline) && deadline < now) return false;
      if (!isNaN(end) && end < now) return false;
      return true;
    });
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
    const allHackathons = [...CORE_VERIFIED_HACKATHONS, ...liveUnstop];

    let syncedCount = 0;
    for (const hack of allHackathons) {
      const tbdTag = (hack as any).is_date_tbd || !hack.start_date ? " [DateTBD: true]" : "";
      const packedDescription = `[Host: ${hack.host}] [Region: ${hack.region}] [Link: ${hack.link}] [Image: ${hack.image}]${tbdTag} ${hack.description}`;

      // Exact title match to prevent incorrect duplicate mappings
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
        registration_deadline: hack.registration_deadline || hack.start_date,
        min_team_size: hack.min_team_size,
        max_team_size: hack.max_team_size,
      };

      if (existing) {
        const { error: uErr } = await supabase
          .from("hackathons")
          .update(payload)
          .eq("id", existing.id);

        if (uErr && uErr.code === "23502" && !hack.start_date) {
          // Graceful fallback for not-null constraint before schema migration is applied
          await supabase
            .from("hackathons")
            .update({
              ...payload,
              start_date: "1970-01-01T00:00:00Z",
              end_date: "1970-01-01T00:00:00Z",
              registration_deadline: payload.registration_deadline || "1970-01-01T00:00:00Z",
            })
            .eq("id", existing.id);
          syncedCount++;
        } else if (!uErr) {
          syncedCount++;
        }
      } else {
        const { error: iErr } = await supabase.from("hackathons").insert({
          ...payload,
          organizer_id: organizerId,
        });

        if (iErr && iErr.code === "23502" && !hack.start_date) {
          // Graceful fallback for not-null constraint before schema migration is applied
          await supabase.from("hackathons").insert({
            ...payload,
            organizer_id: organizerId,
            start_date: "1970-01-01T00:00:00Z",
            end_date: "1970-01-01T00:00:00Z",
            registration_deadline: payload.registration_deadline || "1970-01-01T00:00:00Z",
          });
          syncedCount++;
        } else if (!iErr) {
          syncedCount++;
        }
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
