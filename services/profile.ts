import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types";

const GUEST_PROFILE: Profile = {
  id: "guest",
  username: "guest",
  full_name: "Innovator",
  headline: "Innovator & Builder on IdeaEra",
  bio: "Welcome to IdeaEra! Connect your account to share ideas and projects.",
  avatar_url: "https://api.dicebear.com/7.x/shapes/svg?seed=guest",
  skills: [],
  interests: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function formatProfile(p: any): Profile {
  const skillsList: string[] = [];
  if (Array.isArray(p.user_skills)) {
    p.user_skills.forEach((us: any) => {
      if (us.skill?.name) skillsList.push(us.skill.name);
      else if (typeof us.skill === "string") skillsList.push(us.skill);
    });
  }

  const skills = skillsList.length > 0 ? skillsList : (p.skills || []);

  return {
    ...p,
    website: p.portfolio_url || p.website || null,
    portfolio_url: p.portfolio_url || p.website || null,
    github_url: p.github_url || null,
    linkedin_url: p.linkedin_url || null,
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

    let { data, error } = await supabase
      .from("profiles")
      .select("*, user_skills(*, skill:skills(*))")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) {
      const username = user.user_metadata?.username || user.email?.split("@")[0] || `user_${user.id.substring(0, 6)}`;
      const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Innovator";
      const { data: createdProfile } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username,
          full_name: fullName,
          headline: "Innovator & Creator on IdeaEra",
          bio: "Passionate about turning innovative concepts into impactful technology products.",
          avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.id}`,
        })
        .select("*, user_skills(*, skill:skills(*))")
        .single();
      data = createdProfile;
    }

    if (data) {
      return formatProfile(data);
    }
  } catch (err) {
    console.error("Error in getCurrentUserProfile:", err);
  }

  return GUEST_PROFILE;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*, user_skills(*, skill:skills(*))")
      .eq("username", username)
      .maybeSingle();

    if (data && !error) {
      return formatProfile(data);
    }
  } catch (err) {
    console.error("Error in getProfileByUsername:", err);
  }

  return null;
}

export async function getAllProfiles(query?: string, skillFilter?: string): Promise<Profile[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id;

    let queryBuilder = supabase.from("profiles").select("*, user_skills(*, skill:skills(*))");

    if (query) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,headline.ilike.%${query}%,bio.ilike.%${query}%`);
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false });
    if (data && !error) {
      let results = data.map(formatProfile);

      // Exclude current user from the talent directory so they only see potential teammates
      if (currentUserId) {
        results = results.filter((p) => p.id !== currentUserId);
      }

      if (skillFilter && skillFilter !== "All") {
        results = results.filter((p) =>
          p.skills?.some((s: string) => s.toLowerCase() === skillFilter.toLowerCase())
        );
      }

      return results;
    }
  } catch (err) {
    console.error("Error in getAllProfiles:", err);
  }

  return [];
}

export async function updateProfile(profileData: Partial<Profile> & { website?: string }): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update your profile.");
  }

  const userId = user.id;

  // Only update columns that exist on the Supabase profiles table
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (profileData.full_name !== undefined) updatePayload.full_name = profileData.full_name;
  if (profileData.headline !== undefined) updatePayload.headline = profileData.headline;
  if (profileData.bio !== undefined) updatePayload.bio = profileData.bio;
  if (profileData.location !== undefined) updatePayload.location = profileData.location;
  if (profileData.github_url !== undefined) updatePayload.github_url = profileData.github_url;
  if (profileData.linkedin_url !== undefined) updatePayload.linkedin_url = profileData.linkedin_url;
  if (profileData.avatar_url !== undefined) updatePayload.avatar_url = profileData.avatar_url;

  // The database column is portfolio_url
  const websiteVal = profileData.portfolio_url || profileData.website;
  if (websiteVal !== undefined) {
    updatePayload.portfolio_url = websiteVal;
  }

  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .single();

  if (profileError || !updatedProfile) {
    throw new Error(profileError?.message || "Failed to update profile.");
  }

  // Persist skills in user_skills table
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
    ...updatedProfile,
    skills: profileData.skills || [],
  });
}
