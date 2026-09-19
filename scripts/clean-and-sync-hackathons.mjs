import { createClient } from "@supabase/supabase-js";
import { CORE_VERIFIED_HACKATHONS } from "./seed-hackathons.mjs";

const SUPABASE_URL = "https://jhmnemzgbcwcryzolzbz.supabase.co";
const SUPABASE_KEY = "sb_publishable_8ddKnV869Oj7ZQ1LHJ7myQ_ifOmyhxD";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanAndSync() {
  console.log("Starting hackathon database cleanup and sync...");

  // 1. Fetch all existing hackathons
  const { data: allHackathons, error: fetchErr } = await supabase
    .from("hackathons")
    .select("*");

  if (fetchErr || !allHackathons) {
    console.error("Error fetching hackathons:", fetchErr);
    process.exit(1);
  }

  console.log(`Total existing hackathon records in database: ${allHackathons.length}`);

  const coreTitlesSet = new Set(CORE_VERIFIED_HACKATHONS.map(h => h.title.trim().toLowerCase()));

  // 2. Update / Insert all Core Verified Hackathons
  let coreUpdated = 0;
  let coreInserted = 0;

  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  const organizerId = profiles?.[0]?.id;

  for (const core of CORE_VERIFIED_HACKATHONS) {
    const packedDescription = `[Host: ${core.host}] [Region: ${core.region}] [Link: ${core.link}] [Image: ${core.image}] ${core.description}`;

    const existing = allHackathons.find(
      h => h.title.trim().toLowerCase() === core.title.trim().toLowerCase()
    );

    const payload = {
      title: core.title,
      description: packedDescription,
      location: core.location,
      prize_pool: core.prize_pool,
      start_date: core.start_date,
      end_date: core.end_date,
      registration_deadline: core.registration_deadline,
      min_team_size: core.min_team_size,
      max_team_size: core.max_team_size,
    };

    if (existing) {
      const { error: uErr } = await supabase
        .from("hackathons")
        .update(payload)
        .eq("id", existing.id);

      if (uErr) {
        console.error(`Error updating core hackathon ${core.title}:`, uErr);
      } else {
        coreUpdated++;
      }
    } else {
      const { error: iErr } = await supabase.from("hackathons").insert({
        ...payload,
        organizer_id: organizerId,
      });

      if (iErr) {
        console.error(`Error inserting core hackathon ${core.title}:`, iErr);
      } else {
        coreInserted++;
      }
    }
  }

  console.log(`Core Hackathons: ${coreUpdated} updated, ${coreInserted} inserted.`);

  // 3. Process Scraped / External Hackathons
  const now = Date.now();
  let deletedExpired = 0;
  let deletedDuplicates = 0;
  let tbdUpdated = 0;
  const seenTitles = new Set(CORE_VERIFIED_HACKATHONS.map(h => h.title.trim().toLowerCase()));

  for (const h of allHackathons) {
    const normTitle = h.title.trim().toLowerCase();
    // Skip core hackathons
    if (coreTitlesSet.has(normTitle)) continue;

    // Deduplicate
    if (seenTitles.has(normTitle)) {
      await supabase.from("hackathons").delete().eq("id", h.id);
      deletedDuplicates++;
      continue;
    }
    seenTitles.add(normTitle);

    // Check if expired
    const deadlineTime = h.registration_deadline ? new Date(h.registration_deadline).getTime() : NaN;
    const endTime = h.end_date ? new Date(h.end_date).getTime() : NaN;
    const isPast = (!isNaN(endTime) && endTime < now) && (!isNaN(deadlineTime) && deadlineTime < now);

    if (isPast) {
      await supabase.from("hackathons").delete().eq("id", h.id);
      deletedExpired++;
      continue;
    }

    // For active scraped hackathons:
    const authenticDeadline = h.registration_deadline || h.end_date;

    let desc = h.description || "";
    if (!desc.includes("[DateTBD: true]")) {
      desc = `[DateTBD: true] ${desc}`;
    }

    const payload = {
      description: desc,
      registration_deadline: authenticDeadline,
      start_date: null,
      end_date: null,
    };

    const { error: updateErr } = await supabase
      .from("hackathons")
      .update(payload)
      .eq("id", h.id);

    if (updateErr && updateErr.code === "23502") {
      // Fallback if not-null constraint is present
      await supabase
        .from("hackathons")
        .update({
          description: desc,
          registration_deadline: authenticDeadline,
          start_date: "1970-01-01T00:00:00Z",
          end_date: "1970-01-01T00:00:00Z",
        })
        .eq("id", h.id);
      tbdUpdated++;
    } else if (!updateErr) {
      tbdUpdated++;
    } else {
      console.error(`Error updating scraped hackathon ${h.title}:`, updateErr);
    }
  }

  console.log(`Deleted ${deletedDuplicates} duplicate records.`);
  console.log(`Deleted ${deletedExpired} expired past records.`);
  console.log(`Updated ${tbdUpdated} active scraped records with authentic registration deadline and TBD event dates.`);
  console.log("Cleanup and sync completed successfully.");
}

cleanAndSync();
