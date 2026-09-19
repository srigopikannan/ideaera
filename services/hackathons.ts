import { createClient } from "@/lib/supabase/server";
import { Hackathon } from "@/types";

function parseHackathonData(h: any): Hackathon {
  let organizer = "Community Organizer";
  let region: Hackathon["region"] = "Global";
  let description = h.description || "";
  let registration_url = `/hackathons/${h.id}`;
  let image_url = h.image_url || null;

  // Extract [Host: ...]
  const hostMatch = description.match(/\[Host:\s*([^\]]+)\]/i);
  if (hostMatch) {
    organizer = hostMatch[1].trim();
  }

  // Extract [Region: ...]
  const regionMatch = description.match(/\[Region:\s*([^\]]+)\]/i);
  if (regionMatch) {
    region = regionMatch[1].trim() as any;
  } else {
    // Auto-detect region from location, title, and description
    const text = `${h.title} ${h.location} ${description}`.toLowerCase();
    if (
      text.includes("tamil nadu") ||
      text.includes("chennai") ||
      text.includes("coimbatore") ||
      text.includes("madurai") ||
      text.includes("trichy") ||
      text.includes("anna univ") ||
      text.includes("naan mudhalvan") ||
      text.includes("iit madras") ||
      text.includes("shaastra") ||
      text.includes("ceg")
    ) {
      region = "Tamil Nadu";
    } else if (
      text.includes("india") ||
      text.includes("bengaluru") ||
      text.includes("bangalore") ||
      text.includes("delhi") ||
      text.includes("mumbai") ||
      text.includes("hyderabad") ||
      text.includes("sih") ||
      text.includes("flipkart") ||
      text.includes("aicte")
    ) {
      region = "India";
    } else if (
      text.includes("asia") ||
      text.includes("singapore") ||
      text.includes("tokyo") ||
      text.includes("japan") ||
      text.includes("korea") ||
      text.includes("nus")
    ) {
      region = "Asia";
    } else {
      region = "Global";
    }
  }

  // Extract [Link: ...]
  const linkMatch = description.match(/\[Link:\s*([^\]]+)\]/i);
  if (linkMatch) {
    registration_url = linkMatch[1].trim();
  }

  // Extract [Image: ...]
  const imageMatch = description.match(/\[Image:\s*([^\]]+)\]/i);
  if (imageMatch) {
    image_url = imageMatch[1].trim();
  }

  // Clean description of bracket tags
  const cleanDescription = description
    .replace(/\[Host:\s*[^\]]+\]/gi, "")
    .replace(/\[Region:\s*[^\]]+\]/gi, "")
    .replace(/\[Link:\s*[^\]]+\]/gi, "")
    .replace(/\[Image:\s*[^\]]+\]/gi, "")
    .replace(/\[DateTBD:\s*[^\]]+\]/gi, "")
    .trim();

  const isDateTBD =
    Boolean(h.is_date_tbd) ||
    description.includes("[DateTBD: true]") ||
    !h.start_date ||
    String(h.start_date).startsWith("1970-01-01");

  const now = Date.now();
  const start_date = isDateTBD ? null : h.start_date;
  const end_date = isDateTBD ? null : h.end_date;

  const regDeadlineTime = h.registration_deadline ? new Date(h.registration_deadline).getTime() : NaN;

  let status: "ongoing" | "upcoming" | "ended" = "upcoming";

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
  } else {
    // Event dates are TBD. Check registration deadline
    if (!isNaN(regDeadlineTime) && regDeadlineTime < now) {
      status = "ended";
    } else {
      status = "upcoming";
    }
  }

  return {
    ...h,
    organizer,
    region,
    description: cleanDescription,
    registration_url,
    image_url: image_url || h.image_url,
    start_date,
    end_date,
    registration_deadline: h.registration_deadline || null,
    is_date_tbd: isDateTBD,
    status,
    mode: h.location?.toLowerCase().includes("online")
      ? "Online"
      : h.location?.toLowerCase().includes("hybrid")
      ? "Hybrid"
      : "In-Person",
    prizes: h.prize_pool || undefined,
  };
}

export async function getHackathons(filter: string = "all"): Promise<Hackathon[]> {
  try {
    const supabase = await createClient();
    let qb = supabase.from("hackathons").select("*, organizer_profile:profiles!organizer_id(*)");

    if (filter === "online") {
      qb = qb.ilike("location", "%online%");
    } else if (filter === "in-person") {
      qb = qb.not("location", "ilike", "%online%");
    }

    const { data, error } = await qb.order("start_date", { ascending: true });
    if (!error && data) {
      const parsed = data.map(parseHackathonData);

      const REGION_RANKS: Record<string, number> = {
        "Tamil Nadu": 1,
        "India": 2,
        "Asia": 3,
        "Global": 4,
      };

      return parsed.sort((a, b) => {
        // 1. Ongoing / Live hackathons first
        if (a.status === "ongoing" && b.status !== "ongoing") return -1;
        if (b.status === "ongoing" && a.status !== "ongoing") return 1;

        // 2. Upcoming before Ended
        if (a.status === "upcoming" && b.status === "ended") return -1;
        if (b.status === "upcoming" && a.status === "ended") return 1;

        // 3. For Ended hackathons: sort by end_date descending (most recent first)
        if (a.status === "ended" && b.status === "ended") {
          const endA = a.end_date ? new Date(a.end_date).getTime() : (a.registration_deadline ? new Date(a.registration_deadline).getTime() : 0);
          const endB = b.end_date ? new Date(b.end_date).getTime() : (b.registration_deadline ? new Date(b.registration_deadline).getTime() : 0);
          return endB - endA;
        }

        // 4. Region priority (Tamil Nadu first, then India, Asia, Global)
        const rankA = REGION_RANKS[a.region || "Global"] || 5;
        const rankB = REGION_RANKS[b.region || "Global"] || 5;
        if (rankA !== rankB) return rankA - rankB;

        // 5. Upcoming hackathons: sort by start_date ASCENDING (soonest first). Nulls/TBD last.
        const timeA = a.start_date ? new Date(a.start_date).getTime() : Infinity;
        const timeB = b.start_date ? new Date(b.start_date).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB;

        // 6. If both have TBD start_date, sort by registration deadline ascending
        const regA = a.registration_deadline ? new Date(a.registration_deadline).getTime() : Infinity;
        const regB = b.registration_deadline ? new Date(b.registration_deadline).getTime() : Infinity;
        return regA - regB;
      });
    }
  } catch (err) {
    console.error("Error fetching hackathons:", err);
  }

  return [];
}

export async function getHackathonById(id: string): Promise<Hackathon | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("hackathons")
      .select("*, organizer_profile:profiles!organizer_id(*)")
      .eq("id", id)
      .maybeSingle();

    if (data && !error) {
      return parseHackathonData(data);
    }
  } catch (err) {
    console.error("Error fetching hackathon by id:", err);
  }

  return null;
}

export async function createHackathon(params: {
  title: string;
  description: string;
  organizer?: string;
  region?: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  prize_pool?: string;
  min_team_size?: number;
  max_team_size?: number;
  registration_url?: string;
  image_url?: string;
}): Promise<Hackathon> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to submit a hackathon.");
  }

  const deadline = params.registration_deadline || params.start_date;

  // Pack organizer, region, link, and image into description tags for lossless storage
  let packedDescription = params.description;
  if (params.organizer) {
    packedDescription = `[Host: ${params.organizer}] ${packedDescription}`;
  }
  if (params.region) {
    packedDescription = `[Region: ${params.region}] ${packedDescription}`;
  }
  if (params.registration_url) {
    packedDescription = `[Link: ${params.registration_url}] ${packedDescription}`;
  }
  if (params.image_url) {
    packedDescription = `[Image: ${params.image_url}] ${packedDescription}`;
  }

  const { data, error } = await supabase
    .from("hackathons")
    .insert({
      title: params.title,
      description: packedDescription,
      organizer_id: user.id,
      location: params.location,
      start_date: params.start_date,
      end_date: params.end_date,
      registration_deadline: deadline,
      prize_pool: params.prize_pool || null,
      min_team_size: params.min_team_size || 1,
      max_team_size: params.max_team_size || 4,
    })
    .select("*, organizer_profile:profiles!organizer_id(*)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return parseHackathonData(data);
}
