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

  const college = formData.has("college")
    ? (formData.get("college") as string).trim() || null
    : undefined;
  const college_id = formData.has("college_id")
    ? (formData.get("college_id") as string).trim() || null
    : undefined;
  const rawAge = formData.get("age") as string;
  const age = rawAge ? parseInt(rawAge, 10) : undefined;
  const show_age = formData.has("show_age") ? formData.get("show_age") === "true" : undefined;
  const city = (formData.get("city") as string) || undefined;
  const state = (formData.get("state") as string) || undefined;
  const country = (formData.get("country") as string) || undefined;
  const show_location = formData.has("show_location") ? formData.get("show_location") === "true" : undefined;
  const rawInterests = formData.get("interests") as string;
  const interests = rawInterests
    ? rawInterests.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  const availability = formData.has("availability")
    ? (formData.get("availability") as string).trim() || undefined
    : undefined;
  const availability_hours = formData.has("availability_hours")
    ? (formData.get("availability_hours") as string).trim() || undefined
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
    college,
    college_id,
    age,
    show_age,
    city,
    state,
    country,
    show_location,
    interests,
    availability,
    availability_hours,
  });

  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  revalidatePath("/settings");
  revalidatePath("/people");
  revalidatePath("/dashboard");
  return { success: true, profile: updated };
}
