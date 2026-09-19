import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types";

const GUEST_PROFILE: Profile = {
  id: "guest",
  username: "guest",
  full_name: "Explorer",
  headline: "",
  bio: "Welcome to IdeaEra! Connect your account to share ideas and collaborate.",
  avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=guest",
  skills: [],
  interests: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  onboarding_completed: false,
};

function formatProfile(p: any, viewerUserId?: string): Profile {
  const skillsList: string[] = [];
  if (Array.isArray(p.user_skills)) {
    p.user_skills.forEach((us: any) => {
      if (us.skill?.name) skillsList.push(us.skill.name);
      else if (typeof us.skill === "string") skillsList.push(us.skill);
    });
  }

  const skills = skillsList.length > 0 ? skillsList : (p.skills || []);

  // Parse location and privacy
  let city = p.city || null;
  let state = p.state || null;
  let country = p.country || "India";
  let location = p.location || null;

  if (!city && !state && location && typeof location === "string") {
    const parts = location.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      city = parts[0];
      state = parts[1];
      if (parts.length >= 3) country = parts[2];
    } else if (parts.length === 1) {
      city = parts[0];
    }
  }

  const isOwner = viewerUserId && viewerUserId === p.id;
  const showLocation = Boolean(p.show_location ?? true);
  const showAge = Boolean(p.show_age ?? false);

  const displayLocation = (isOwner || showLocation)
    ? (location || (city && state ? `${city}, ${state}` : city || state || null))
    : null;
  const displayCity = (isOwner || showLocation) ? city : null;
  const displayState = (isOwner || showLocation) ? state : null;
  const displayCountry = (isOwner || showLocation) ? country : null;
  const displayAge = (isOwner || showAge) && p.age ? Number(p.age) : null;

  return {
    ...p,
    website: p.portfolio_url || p.website || null,
    portfolio_url: p.portfolio_url || p.website || null,
    github_url: p.github_url || null,
    linkedin_url: p.linkedin_url || null,
    location: displayLocation,
    city: displayCity,
    state: displayState,
    country: displayCountry,
    show_location: showLocation,
    college: p.college || null,
    age: displayAge,
    show_age: showAge,
    onboarding_completed: Boolean(
      p.onboarding_completed ?? (p.headline && skills.length > 0)
    ),
    skills,
    interests: p.interests || [],
  };
}

export async function getCurrentUserProfile(): Promise<Profile> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return GUEST_PROFILE;
    }

    let { data } = await supabase
      .from("profiles")
      .select("*, user_skills(*, skill:skills(*))")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) {
      const username =
        user.user_metadata?.username ||
        user.email?.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") ||
        `user_${user.id.substring(0, 6)}`;
      const fullName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "New Member";

      const { data: createdProfile } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username,
          full_name: fullName,
          headline: user.user_metadata?.headline || null,
          bio: user.user_metadata?.bio || null,
          avatar_url:
            user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/shapes/svg?seed=${user.id}`,
        })
        .select("*, user_skills(*, skill:skills(*))")
        .single();
      data = createdProfile;
    }

    if (data) {
      return formatProfile(data, user.id);
    }
  } catch (err) {
    console.error("Error in getCurrentUserProfile:", err);
  }

  return GUEST_PROFILE;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_skills(*, skill:skills(*))")
      .eq("username", username)
      .maybeSingle();

    if (data && !error) {
      const formatted = formatProfile(data, currentUserId);
      let connectionStatus: "none" | "pending_sent" | "pending_received" | "connected" = "none";

      if (currentUserId && currentUserId !== formatted.id) {
        try {
          const { data: conn } = await supabase
            .from("connections")
            .select("requester_id, receiver_id, status")
            .or(
              `and(requester_id.eq.${currentUserId},receiver_id.eq.${formatted.id}),and(requester_id.eq.${formatted.id},receiver_id.eq.${currentUserId})`
            )
            .maybeSingle();

          if (conn) {
            if (conn.status === "accepted") {
              connectionStatus = "connected";
            } else if (conn.status === "pending") {
              connectionStatus =
                conn.requester_id === currentUserId ? "pending_sent" : "pending_received";
            }
          }
        } catch (connErr) {
          console.error("Error fetching connection status in getProfileByUsername:", connErr);
        }
      }

      return {
        ...formatted,
        connection_status: connectionStatus,
      };
    }
  } catch (err) {
    console.error("Error in getProfileByUsername:", err);
  }

  return null;
}

export interface ProfileFilterOptions {
  query?: string;
  skillFilter?: string;
  collegeFilter?: string;
  cityFilter?: string;
  stateFilter?: string;
}

export async function getAllProfiles(
  optionsOrQuery?: ProfileFilterOptions | string,
  legacySkillFilter?: string
): Promise<Profile[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const options: ProfileFilterOptions =
      typeof optionsOrQuery === "string"
        ? { query: optionsOrQuery, skillFilter: legacySkillFilter }
        : optionsOrQuery || {};

    let queryBuilder = supabase
      .from("profiles")
      .select("*, user_skills(*, skill:skills(*))");

    if (options.query) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${options.query}%,username.ilike.%${options.query}%,headline.ilike.%${options.query}%,bio.ilike.%${options.query}%,location.ilike.%${options.query}%`
      );
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false });
    if (data && !error) {
      let results = data.map((d) => formatProfile(d, currentUserId));

      // Exclude current user from candidate directories
      if (currentUserId) {
        results = results.filter((p) => p.id !== currentUserId);
      }

      // Filter by skill
      if (options.skillFilter && options.skillFilter !== "All") {
        const target = options.skillFilter.toLowerCase();
        results = results.filter((p) =>
          p.skills?.some((s: string) => s.toLowerCase().includes(target))
        );
      }

      // Filter by college
      if (options.collegeFilter && options.collegeFilter !== "All") {
        const targetCollege = options.collegeFilter.toLowerCase();
        results = results.filter((p) =>
          (p.college && p.college.toLowerCase().includes(targetCollege)) ||
          (p.headline && p.headline.toLowerCase().includes(targetCollege))
        );
      }

      // Filter by city
      if (options.cityFilter && options.cityFilter !== "All") {
        const targetCity = options.cityFilter.toLowerCase();
        results = results.filter((p) =>
          (p.city && p.city.toLowerCase().includes(targetCity)) ||
          (p.location && p.location.toLowerCase().includes(targetCity))
        );
      }

      // Filter by state
      if (options.stateFilter && options.stateFilter !== "All") {
        const targetState = options.stateFilter.toLowerCase();
        results = results.filter((p) =>
          (p.state && p.state.toLowerCase().includes(targetState)) ||
          (p.location && p.location.toLowerCase().includes(targetState))
        );
      }

      // Fetch connection statuses for current user
      const statusMap: Record<string, "none" | "pending_sent" | "pending_received" | "connected"> = {};
      if (currentUserId) {
        try {
          const { data: userConns } = await supabase
            .from("connections")
            .select("requester_id, receiver_id, status")
            .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

          if (userConns) {
            for (const c of userConns) {
              const otherId = c.requester_id === currentUserId ? c.receiver_id : c.requester_id;
              if (c.status === "accepted") {
                statusMap[otherId] = "connected";
              } else if (c.status === "pending") {
                if (c.requester_id === currentUserId) {
                  statusMap[otherId] = "pending_sent";
                } else {
                  statusMap[otherId] = "pending_received";
                }
              }
            }
          }
        } catch (connErr) {
          console.error("Error fetching connections in getAllProfiles:", connErr);
        }
      }

      return results.map((p) => ({
        ...p,
        connection_status: statusMap[p.id] || "none",
      }));
    }
  } catch (err) {
    console.error("Error in getAllProfiles:", err);
  }

  return [];
}

export async function updateProfile(
  profileData: Partial<Profile> & { website?: string }
): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update your profile.");
  }

  const userId = user.id;

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (profileData.full_name !== undefined) updatePayload.full_name = profileData.full_name;
  if (profileData.headline !== undefined) updatePayload.headline = profileData.headline;
  if (profileData.bio !== undefined) updatePayload.bio = profileData.bio;
  if (profileData.github_url !== undefined) updatePayload.github_url = profileData.github_url;
  if (profileData.linkedin_url !== undefined) updatePayload.linkedin_url = profileData.linkedin_url;
  if (profileData.avatar_url !== undefined) updatePayload.avatar_url = profileData.avatar_url;

  // Format clean location string
  if (profileData.city || profileData.state) {
    const locParts = [profileData.city, profileData.state, profileData.country || "India"].filter(Boolean);
    updatePayload.location = locParts.join(", ");
  } else if (profileData.location !== undefined) {
    updatePayload.location = profileData.location;
  }

  const websiteVal = profileData.portfolio_url || profileData.website;
  if (websiteVal !== undefined) {
    updatePayload.portfolio_url = websiteVal;
  }

  let finalProfileRecord: any = null;

  // Attempt extended update (if columns college, age, city, state, show_age etc. exist in DB)
  try {
    const extendedPayload = {
      ...updatePayload,
      ...(profileData.college !== undefined ? { college: profileData.college } : {}),
      ...(profileData.age !== undefined ? { age: profileData.age ? Number(profileData.age) : null } : {}),
      ...(profileData.show_age !== undefined ? { show_age: profileData.show_age } : {}),
      ...(profileData.city !== undefined ? { city: profileData.city } : {}),
      ...(profileData.state !== undefined ? { state: profileData.state } : {}),
      ...(profileData.country !== undefined ? { country: profileData.country } : {}),
      ...(profileData.show_location !== undefined ? { show_location: profileData.show_location } : {}),
      ...(profileData.onboarding_completed !== undefined ? { onboarding_completed: profileData.onboarding_completed } : {}),
    };

    const { data: extUpdated, error: extErr } = await supabase
      .from("profiles")
      .update(extendedPayload)
      .eq("id", userId)
      .select()
      .maybeSingle();

    if (!extErr && extUpdated) {
      finalProfileRecord = extUpdated;
    } else {
      // Fall back to standard update
      const { data: stdUpdated } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId)
        .select()
        .single();
      finalProfileRecord = stdUpdated;
    }
  } catch {
    const { data: stdUpdated } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select()
      .single();
    finalProfileRecord = stdUpdated;
  }

  // Also mirror to auth user metadata so onboarding state & privacy persist reliably
  try {
    await supabase.auth.updateUser({
      data: {
        full_name: profileData.full_name,
        headline: profileData.headline,
        college: profileData.college,
        age: profileData.age,
        show_age: profileData.show_age,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
        show_location: profileData.show_location,
        onboarding_completed: profileData.onboarding_completed ?? true,
      },
    });
  } catch {}

  // Persist skills in user_skills table without duplicates
  if (Array.isArray(profileData.skills)) {
    try {
      await supabase.from("user_skills").delete().eq("user_id", userId);

      for (const rawSkill of profileData.skills) {
        const skillName = rawSkill.trim();
        if (!skillName) continue;

        let { data: skillRow } = await supabase
          .from("skills")
          .select("id")
          .ilike("name", skillName)
          .maybeSingle();

        if (!skillRow) {
          const { data: newSkill } = await supabase
            .from("skills")
            .insert({ name: skillName })
            .select("id")
            .maybeSingle();
          skillRow = newSkill;
        }

        if (skillRow?.id) {
          await supabase.from("user_skills").insert({
            user_id: userId,
            skill_id: skillRow.id,
            level: "Intermediate",
          });
        }
      }
    } catch (err) {
      console.error("Error updating user_skills:", err);
    }
  }

  return formatProfile({
    ...(finalProfileRecord || updatePayload),
    ...profileData,
    skills: profileData.skills || [],
  }, userId);
}

export async function getColleges(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("colleges").select("name").order("name");
    if (!error && data && data.length > 0) {
      return data.map((c: any) => c.name);
    }
  } catch {}

  return [
    "PSG College of Technology",
    "Coimbatore Institute of Technology (CIT)",
    "Kumaraguru College of Technology (KCT)",
    "Government College of Technology (GCT)",
    "Sri Krishna College of Engineering & Technology (SKCET)",
    "College of Engineering, Guindy (CEG Anna University)",
    "Madras Institute of Technology (MIT Anna University)",
    "Indian Institute of Technology Madras (IIT Madras)",
    "SSN College of Engineering",
    "National Institute of Technology Tiruchirappalli (NIT Trichy)",
    "Thiagarajar College of Engineering (TCE)",
    "Vellore Institute of Technology (VIT)",
    "SRM Institute of Science and Technology",
    "Amrita Vishwa Vidyapeetham",
    "BITS Pilani",
    "Indian Institute of Science (IISc)",
    "IIT Bombay",
    "IIT Delhi",
  ];
}

export async function addCustomCollege(name: string, city?: string, state?: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) return "";
  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("colleges")
      .select("name")
      .ilike("name", trimmed)
      .maybeSingle();
    if (existing) return existing.name;

    await supabase.from("colleges").insert({
      name: trimmed,
      city: city || null,
      state: state || null,
    });
  } catch {}
  return trimmed;
}
