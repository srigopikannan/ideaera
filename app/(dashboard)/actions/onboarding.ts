"use server";

import { updateProfile, getColleges, addCustomCollege, getCurrentUserProfile } from "@/services/profile";
import { revalidatePath } from "next/cache";

export async function getCollegesAction() {
  return await getColleges();
}

export async function addCustomCollegeAction(name: string, city?: string, state?: string) {
  return await addCustomCollege(name, city, state);
}

export interface OnboardingPayload {
  full_name?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  age?: number;
  show_age?: boolean;
  college?: string;
  college_id?: string;
  city?: string;
  state?: string;
  country?: string;
  show_location?: boolean;
  interests?: string[];
}

export async function completeOnboardingAction(payload: OnboardingPayload) {
  try {
    const fullLocation = [payload.city, payload.state, payload.country].filter(Boolean).join(", ") || undefined;

    const updated = await updateProfile({
      full_name: payload.full_name,
      headline: payload.headline,
      bio: payload.bio,
      skills: payload.skills,
      age: payload.age,
      show_age: payload.show_age ?? true,
      college: payload.college,
      college_id: payload.college_id,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      show_location: payload.show_location ?? true,
      location: fullLocation,
      interests: payload.interests,
      onboarding_completed: true,
    });

    revalidatePath("/profile");
    revalidatePath("/people");
    revalidatePath("/dashboard");
    revalidatePath("/onboarding");

    return { success: true, profile: updated };
  } catch (err: any) {
    console.error("Failed to complete onboarding:", err);
    return { success: false, error: err?.message || "Failed to save onboarding data." };
  }
}
