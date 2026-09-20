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

export function isDeletedProfile(p: any): boolean {
  if (!p) return true;
  if (p.is_deleted === true) return true;
  if (typeof p.username === "string" && p.username.toLowerCase().startsWith("deleted_")) return true;
  if (p.full_name === "[Deleted User]") return true;
  return false;
}

export function formatProfile(p: any, viewerUserId?: string): Profile {
  const skillsList: string[] = [];
  if (Array.isArray(p.user_skills)) {
    p.user_skills.forEach((us: any) => {
      if (us.skill?.name) skillsList.push(us.skill.name);
      else if (typeof us.skill === "string") skillsList.push(us.skill);
    });
  }

  const skills = skillsList.length > 0 ? skillsList : (p.skills || []);

  // Filter out any obsolete generic boilerplate defaults
  const isGenericHeadline = (h?: string | null) =>
    !h ||
    h.toLowerCase().includes("innovator & creator") ||
    h.toLowerCase().includes("creator of ideaera") ||
    h.toLowerCase().includes("creator on ideaera") ||
    h.toLowerCase().includes("innovator profile on ideaera");

  const isGenericBio = (b?: string | null) =>
    !b ||
    b.toLowerCase().includes("passionate about turning innovative concepts into impactful technology products");

  const cleanHeadline = isGenericHeadline(p.headline) ? null : p.headline;
  const cleanBio = isGenericBio(p.bio) ? null : p.bio;

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

  // College resolution (checks college_id, college column, availability column fallback, or raw)
  const college = p.college || p.availability || p.college_rel?.name || null;
  const college_id = p.college_id || p.college_rel?.id || null;
  const college_location = p.college_rel
    ? [p.college_rel.city, p.college_rel.state || "Tamil Nadu"].filter(Boolean).join(", ")
    : null;

  return {
    ...p,
    headline: cleanHeadline,
    bio: cleanBio,
    website: p.portfolio_url || p.website || null,
    portfolio_url: p.portfolio_url || p.website || null,
    github_url: p.github_url || null,
    linkedin_url: p.linkedin_url || null,
    location: displayLocation,
    city: displayCity,
    state: displayState,
    country: displayCountry,
    show_location: showLocation,
    college,
    college_id,
    college_location,
    age: displayAge,
    show_age: showAge,
    onboarding_completed: Boolean(
      p.onboarding_completed ?? (cleanHeadline && skills.length > 0)
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
      .select("*, college_rel:colleges!college_id(id, name, city, district, state), user_skills(*, skill:skills(*))")
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
        .select("*, college_rel:colleges!college_id(id, name, city, district, state), user_skills(*, skill:skills(*))")
        .single();
      data = createdProfile;
    }

    if (data) {
      if (isDeletedProfile(data)) {
        return GUEST_PROFILE;
      }
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
      .select("*, college_rel:colleges!college_id(id, name, city, district, state), user_skills(*, skill:skills(*))")
      .eq("username", username)
      .maybeSingle();

    if (data && !error) {
      if (isDeletedProfile(data)) {
        return null;
      }
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

export async function getProfileById(id: string): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("*, college_rel:colleges!college_id(id, name, city, district, state), user_skills(*, skill:skills(*))")
      .eq("id", id)
      .maybeSingle();

    if (data && !error) {
      if (isDeletedProfile(data)) {
        return null;
      }
      return formatProfile(data, currentUserId);
    }
  } catch (err) {
    console.error("Error in getProfileById:", err);
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
      .select("*, college_rel:colleges!college_id(id, name, city, district, state), user_skills(*, skill:skills(*))");

    if (options.query) {
      queryBuilder = queryBuilder.or(
        `full_name.ilike.%${options.query}%,username.ilike.%${options.query}%,headline.ilike.%${options.query}%,bio.ilike.%${options.query}%,location.ilike.%${options.query}%`
      );
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false });
    if (data && !error) {
      let results = data
        .filter((d) => !isDeletedProfile(d))
        .map((d) => formatProfile(d, currentUserId));

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

  if (profileData.college !== undefined) {
    updatePayload.college = profileData.college || null;
    updatePayload.availability = profileData.college || null;
  }

  if (profileData.college_id !== undefined) {
    updatePayload.college_id = profileData.college_id || null;
  }

  const websiteVal = profileData.portfolio_url || profileData.website;
  if (websiteVal !== undefined) {
    updatePayload.portfolio_url = websiteVal;
  }

  let finalProfileRecord: any = null;

  // Attempt extended update (if columns college, college_id, age, city, state, show_age etc. exist in DB)
  try {
    const extendedPayload = {
      ...updatePayload,
      ...(profileData.college !== undefined ? { college: profileData.college || null } : {}),
      ...(profileData.college_id !== undefined ? { college_id: profileData.college_id || null } : {}),
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
        college_id: profileData.college_id || null,
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

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Verify user profile exists
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (pErr || !profile) {
      return { success: false, error: "Profile not found or access denied." };
    }

    // 2. Clean up notifications for this user
    try {
      await supabase.from("notifications").delete().eq("user_id", userId);
    } catch (e) {
      console.error("Error deleting notifications:", e);
    }

    // 3. Clean up connections where user is requester or receiver
    try {
      await supabase.from("connections").delete().eq("requester_id", userId);
      await supabase.from("connections").delete().eq("receiver_id", userId);
    } catch (e) {
      console.error("Error deleting connections:", e);
    }

    // 4. Clean up messages where user is sender or receiver
    try {
      await supabase.from("messages").delete().eq("sender_id", userId);
      await supabase.from("messages").delete().eq("receiver_id", userId);
    } catch (e) {
      console.error("Error deleting messages:", e);
    }

    // 5. Clean up user_skills and user_interests
    try {
      await supabase.from("user_skills").delete().eq("user_id", userId);
    } catch (e) {
      console.error("Error deleting user_skills:", e);
    }

    try {
      await supabase.from("user_interests").delete().eq("user_id", userId);
    } catch (e) {
      console.error("Error deleting user_interests:", e);
    }

    // 6. Collaborative project handling
    // User might be a member of other projects (project_members)
    try {
      await supabase.from("project_members").delete().eq("user_id", userId);
    } catch (e) {
      console.error("Error removing from project_members:", e);
    }

    // User might be owner of projects (projects.owner_id)
    try {
      const { data: ownedProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("owner_id", userId);

      if (ownedProjects && ownedProjects.length > 0) {
        for (const proj of ownedProjects) {
          // Check if there are other members in project_members
          const { data: members } = await supabase
            .from("project_members")
            .select("user_id")
            .eq("project_id", proj.id)
            .neq("user_id", userId)
            .limit(1);

          if (members && members.length > 0) {
            // Transfer ownership to the first active collaborator
            await supabase
              .from("projects")
              .update({ owner_id: members[0].user_id })
              .eq("id", proj.id);
            // Remove collaborator from project_members since they are now owner
            await supabase
              .from("project_members")
              .delete()
              .eq("project_id", proj.id)
              .eq("user_id", members[0].user_id);
          } else {
            // No other members, delete the project
            await supabase.from("projects").delete().eq("id", proj.id);
          }
        }
      }
    } catch (e) {
      console.error("Error handling owned projects:", e);
    }

    // 7. Delete user ideas
    try {
      await supabase.from("ideas").delete().eq("creator_id", userId);
    } catch (e) {
      console.error("Error deleting user ideas:", e);
    }

    // 8. Reassign hackathon organizer if this user is set as organizer_id
    // Crucial: seeded hackathons reference an organizer profile.
    try {
      const { data: orgHackathons } = await supabase
        .from("hackathons")
        .select("id")
        .eq("organizer_id", userId)
        .limit(1);

      if (orgHackathons && orgHackathons.length > 0) {
        const { data: fallbackProfile } = await supabase
          .from("profiles")
          .select("id")
          .neq("id", userId)
          .limit(1)
          .maybeSingle();

        if (fallbackProfile) {
          await supabase
            .from("hackathons")
            .update({ organizer_id: fallbackProfile.id })
            .eq("organizer_id", userId);
        }
      }
    } catch (e) {
      console.error("Error reassigning hackathon organizer:", e);
    }

    // 9. Clean up companies created by user if any
    try {
      await supabase.from("companies").delete().eq("owner_id", userId);
    } catch (e) {
      // Table or column might differ, safely ignored
    }

    // 10. Attempt hard delete on profiles table
    let hardDeleteSuccess = false;
    try {
      const { error: delErr } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (!delErr) {
        hardDeleteSuccess = true;
      } else {
        console.warn("Hard delete on profiles returned error, falling back to tombstone redaction:", delErr.message);
      }
    } catch (delCatch) {
      console.warn("Exception during profiles hard delete:", delCatch);
    }

    // If hard delete was blocked (e.g. before RLS policy applied or cascade block),
    // immediately execute dual-compatible tombstone redaction:
    if (!hardDeleteSuccess) {
      const tombstoneTag = `deleted_${Date.now()}_${userId.substring(0, 8)}`;
      await supabase
        .from("profiles")
        .update({
          full_name: "[Deleted User]",
          username: tombstoneTag,
          headline: null,
          bio: null,
          avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=deleted`,
          location: null,
          city: null,
          state: null,
          country: null,
          college: null,
          age: null,
          github_url: null,
          linkedin_url: null,
          portfolio_url: null,
          website: null,
          onboarding_completed: false,
        })
        .eq("id", userId);
    }

    // 11. Sign out session on server
    try {
      await supabase.auth.signOut();
    } catch (soErr) {
      console.error("Error signing out user:", soErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Fatal error deleting user account:", err);
    return { success: false, error: err?.message || "Failed to delete account." };
  }
}

