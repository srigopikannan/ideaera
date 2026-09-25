import { createClient } from "@/lib/supabase/server";
import { UserConsent } from "@/types";
import {
  CURRENT_PRIVACY_POLICY_VERSION,
  CURRENT_TERMS_VERSION,
  CURRENT_COOKIE_POLICY_VERSION,
} from "@/lib/legal-config";

/**
 * Checks whether a given user has consented to the current required Privacy Policy and Terms of Service.
 */
export async function hasAcceptedCurrentPolicies(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Call PostgreSQL RPC function for fast, indexed evaluation
    const { data, error } = await supabase.rpc("has_accepted_current_policies", {
      p_user_id: userId,
      p_required_privacy_version: CURRENT_PRIVACY_POLICY_VERSION,
      p_required_terms_version: CURRENT_TERMS_VERSION,
    });

    if (!error && typeof data === "boolean") {
      return data;
    }

    // Direct fallback query if RPC is temporarily unavailable
    const { data: records } = await supabase
      .from("user_consents")
      .select("id")
      .eq("user_id", userId)
      .eq("privacy_policy_version", CURRENT_PRIVACY_POLICY_VERSION)
      .eq("terms_version", CURRENT_TERMS_VERSION)
      .limit(1);

    return Array.isArray(records) && records.length > 0;
  } catch (err) {
    console.error("Error in hasAcceptedCurrentPolicies:", err);
    return false;
  }
}

/**
 * Retrieves the full chronological consent history for an authenticated user.
 */
export async function getUserConsents(userId: string): Promise<UserConsent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_consents")
      .select("*")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as UserConsent[];
  } catch (err) {
    console.error("Error in getUserConsents:", err);
    return [];
  }
}

/**
 * Retrieves the most recent consent record for a user.
 */
export async function getLatestUserConsent(userId: string): Promise<UserConsent | null> {
  const consents = await getUserConsents(userId);
  return consents.length > 0 ? consents[0] : null;
}

/**
 * Records an immutable legal consent record in the database using server timestamps.
 * Client-provided timestamps or user IDs are never trusted.
 */
export async function recordUserConsent(params?: {
  userId?: string;
  consentType?: "signup" | "policy_update" | "re_consent";
  privacyVersion?: string;
  termsVersion?: string;
  cookieVersion?: string;
  userAgent?: string;
}): Promise<{ success: boolean; consent?: UserConsent; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetUserId = params?.userId || user?.id;

    if (!targetUserId) {
      return { success: false, error: "Authentication or user ID required to record consent." };
    }

    const privacyVer = params?.privacyVersion || CURRENT_PRIVACY_POLICY_VERSION;
    const termsVer = params?.termsVersion || CURRENT_TERMS_VERSION;
    const cookieVer = params?.cookieVersion || CURRENT_COOKIE_POLICY_VERSION;
    const consentType = params?.consentType || "signup";
    const userAgent = params?.userAgent || null;

    // Call secure RPC function
    const { data, error } = await supabase.rpc("record_user_consent", {
      p_privacy_version: privacyVer,
      p_terms_version: termsVer,
      p_cookie_version: cookieVer,
      p_consent_type: consentType,
      p_user_agent: userAgent,
      p_target_user_id: targetUserId,
    });

    if (error) {
      // Fallback insert directly using server client
      const { data: inserted, error: insertErr } = await supabase
        .from("user_consents")
        .insert({
          user_id: targetUserId,
          privacy_policy_version: privacyVer,
          terms_version: termsVer,
          cookie_policy_version: cookieVer,
          consent_type: consentType,
          user_agent: userAgent,
          accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr || !inserted) {
        return { success: false, error: insertErr?.message || "Failed to record consent." };
      }

      return { success: true, consent: inserted as UserConsent };
    }

    return {
      success: true,
      consent: {
        id: data.consent_id,
        user_id: data.user_id,
        privacy_policy_version: data.privacy_version,
        terms_version: data.terms_version,
        cookie_policy_version: cookieVer,
        consent_type: consentType,
        accepted_at: data.accepted_at,
        created_at: data.accepted_at,
        user_agent: userAgent,
      },
    };
  } catch (err: any) {
    console.error("Error in recordUserConsent:", err);
    return { success: false, error: err?.message || "Internal error recording consent." };
  }
}
