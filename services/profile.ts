import { db } from "@/db";
import { profiles, user_skills, skills, experience, certifications, achievements } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ProfileFormValues } from "@/schemas/profile";

export async function getProfile(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });

  if (!profile) return null;

  const userSkills = await db.query.user_skills.findMany({
    where: eq(user_skills.user_id, userId),
    with: {
      skill: true,
    },
  });

  const userExperience = await db.query.experience.findMany({
    where: eq(experience.user_id, userId),
  });

  const userCertifications = await db.query.certifications.findMany({
    where: eq(certifications.user_id, userId),
  });

  const userAchievements = await db.query.achievements.findMany({
    where: eq(achievements.user_id, userId),
  });

  return {
    ...profile,
    skills: userSkills.map(us => ({
      name: us.skill.name,
      level: us.level,
    })),
    experience: userExperience,
    certifications: userCertifications,
    achievements: userAchievements,
  };
}

export async function updateProfile(userId: string, data: ProfileFormValues) {
  return await db.update(profiles)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();
}

export async function calculateProfileCompletion(userId: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
  if (!profile) return 0;

  let score = 0;
  const totalPoints = 10;

  if (profile.full_name) score++;
  if (profile.headline) score++;
  if (profile.bio) score++;
  if (profile.avatar_url) score++;
  if (profile.location) score++;
  if (profile.remote_preference) score++;
  if (profile.availability) score++;
  if (profile.github_url) score++;
  if (profile.linkedin_url) score++;
  if (profile.portfolio_url) score++;

  const skillCount = await db.select({ count: eq(user_skills.user_id, userId) }).from(user_skills);
  // simplified logic for now

  return Math.round((score / totalPoints) * 100);
}
