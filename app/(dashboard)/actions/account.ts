"use server";

import { createClient } from "@/lib/supabase/server";
import { deleteUserAccount } from "@/services/profile";
import { revalidatePath } from "next/cache";

export async function deleteAccountAction(confirmationText: string): Promise<{ success: boolean; error?: string }> {
  // 1. Strict validation: require user to type "DELETE" exactly
  if (!confirmationText || confirmationText.trim() !== "DELETE") {
    return {
      success: false,
      error: 'You must type "DELETE" exactly to confirm deletion.',
    };
  }

  // 2. Authenticate session server-side
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return {
      success: false,
      error: "Unauthorized. You must be signed in to delete your account.",
    };
  }

  // 3. Perform server-side deletion of user account and associated resources
  const result = await deleteUserAccount(user.id);

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to delete account. Please try again.",
    };
  }

  // 4. Invalidate cached routes across the application
  try {
    revalidatePath("/profile");
    revalidatePath("/people");
    revalidatePath("/match");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
  } catch (revErr) {
    console.warn("Path revalidation warning:", revErr);
  }

  return { success: true };
}
