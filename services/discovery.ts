import { db } from "@/db";
import { profiles, user_skills, skills, user_interests, interests } from "@/db/schema";
import { eq, and, or, ne, ilike, SQL } from "drizzle-orm";
import { FullProfile } from "@/db/types";

export interface DiscoveryFilters {
  search?: string;
  skills?: string[];
  minSkillLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  availability?: string;
  remotePreference?: string;
  location?: string;
}

export interface MatchResult {
  profile: FullProfile;
  score: number;
  reasons: string[];
}

export async function discoverPeople(filters: DiscoveryFilters, currentUserId: string) {
  // 1. Build the base query for profiles
  let whereClause: SQL | undefined = ne(profiles.id, currentUserId);

  if (filters.search) {
    whereClause = and(
      whereClause,
      or(
        ilike(profiles.full_name, `%${filters.search}%`),
        ilike(profiles.username, `%${filters.search}%`),
        ilike(profiles.headline, `%${filters.search}%`),
      )
    );
  }

  if (filters.availability) {
    whereClause = and(whereClause, eq(profiles.availability, filters.availability));
  }

  if (filters.remotePreference) {
    whereClause = and(whereClause, eq(profiles.remote_preference, filters.remotePreference));
  }

  if (filters.location) {
    whereClause = and(whereClause, ilike(profiles.location, `%${filters.location}%`));
  }

  const candidateProfiles = await db.query.profiles.findMany({
    where: whereClause,
    limit: 50,
  });

  // 2. Fetch detailed data for candidates to calculate matches
  const results = await Promise.all(
    candidateProfiles.map(async (p) => {
      const userSkills = await db.query.user_skills.findMany({
        where: eq(user_skills.user_id, p.id),
        with: { skill: true },
      });

      const userInterests = await db.query.user_interests.findMany({
        where: eq(user_interests.user_id, p.id),
        with: { interest: true },
      });

      const profileData: FullProfile = {
        ...p,
        skills: userSkills.map(us => ({ name: us.skill.name, level: us.level })),
        experience: [], // simplified for discovery
        certifications: [],
        achievements: [],
        interests: userInterests.map(ui => ui.interest.name),
      };

      const match = await calculateMatchScore(currentUserId, profileData);

      return {
        profile: profileData,
        score: match.score,
        reasons: match.reasons,
      };
    })
  );

  return results.sort((a, b) => b.score - a.score);
}

async function calculateMatchScore(currentUserId: string, targetProfile: FullProfile) {
  let score = 0;
  const reasons: string[] = [];

  const myProfile = await db.query.profiles.findFirst({
    where: eq(profiles.id, currentUserId),
  });

  const mySkills = await db.query.user_skills.findMany({
    where: eq(user_skills.user_id, currentUserId),
    with: { skill: true },
  });

  const myInterests = await db.query.user_interests.findMany({
    where: eq(user_interests.user_id, currentUserId),
    with: { interest: true },
  });

  const mySkillNames = mySkills.map(s => s.skill.name);
  const myInterestNames = myInterests.map(i => i.interest.name);

  const overlappingSkills = targetProfile.skills.filter(s => mySkillNames.includes(s.name));
  if (overlappingSkills.length > 0) {
    score += overlappingSkills.length * 20;
    reasons.push(`Shared skills in ${overlappingSkills.map(s => s.name).join(", ")}`);
  }

  const overlappingInterests = targetProfile.interests.filter(i => myInterestNames.includes(i));
  if (overlappingInterests.length > 0) {
    score += overlappingInterests.length * 10;
    reasons.push(`Common interests in ${overlappingInterests.join(", ")}`);
  }

  if (myProfile?.remote_preference === targetProfile.remote_preference) {
    score += 10;
    reasons.push(`Both prefer ${targetProfile.remote_preference} work`);
  }

  if (targetProfile.availability === "Available Now") {
    score += 15;
    reasons.push("Available to start immediately");
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}
