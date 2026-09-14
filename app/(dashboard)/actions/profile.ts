"use server";

import { updateProfile } from "@/services/profile";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const headline = formData.get("headline") as string;
  const bio = formData.get("bio") as string;
  const location = formData.get("location") as string;
  const website = formData.get("website") as string;
  const github_url = formData.get("github_url") as string;
  const linkedin_url = formData.get("linkedin_url") as string;
  const rawSkills = formData.get("skills") as string;

  const skills = rawSkills
    ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const updated = await updateProfile({
    full_name,
    headline,
    bio,
    location,
    website,
    github_url,
    linkedin_url,
    skills,
  });

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/settings");
  revalidatePath("/people");
  revalidatePath("/dashboard");
  return { success: true, profile: updated };
}
