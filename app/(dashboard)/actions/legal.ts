"use server";

import { createClient } from "@/lib/supabase/server";
import {
  hasAcceptedCurrentPolicies,
  getUserConsents,
  recordUserConsent,
} from "@/services/legal";
import { revalidatePath } from "next/cache";

export async function checkUserConsentStatusAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { authenticated: false, hasAccepted: false };
    }

    const hasAccepted = await hasAcceptedCurrentPolicies(user.id);
    return { authenticated: true, hasAccepted, userId: user.id };
  } catch (err: any) {
    console.error("Error in checkUserConsentStatusAction:", err);
    return { authenticated: false, hasAccepted: false, error: err?.message };
  }
}

export async function acceptCurrentPoliciesAction(
  consentType: "signup" | "policy_update" | "re_consent" = "policy_update",
  userId?: string
) {
  try {
    const result = await recordUserConsent({ consentType, userId });

    if (result.success) {
      revalidatePath("/privacy-center");
      revalidatePath("/dashboard");
      revalidatePath("/profile");
    }

    return result;
  } catch (err: any) {
    console.error("Error in acceptCurrentPoliciesAction:", err);
    return { success: false, error: err?.message || "Failed to record consent." };
  }
}

export async function getUserConsentHistoryAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const history = await getUserConsents(user.id);
    return { success: true, data: history };
  } catch (err: any) {
    console.error("Error in getUserConsentHistoryAction:", err);
    return { success: false, error: err?.message || "Failed to fetch consent history." };
  }
}
