"use server";

import {
  getProfile,
  updateProfile,
  calculateProfileCompletion,
} from "@/services/profile";
import { ProfileFormValues } from "@/schemas/profile";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function fetchProfileAction() {
  const supabase =await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const profile = await getProfile(user.id);
  const completion = await calculateProfileCompletion(user.id);

  return { profile, completion };
}

export async function updateProfileAction(data: ProfileFormValues) {
  const supabase =  await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await updateProfile(user.id, data);

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);

    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}