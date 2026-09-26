"use server";

import { createClient } from "@/lib/supabase/server";
import {
  evaluateUserBadges,
  getUserBadgesWithProgress,
  adminAwardBadge,
  adminRevokeBadge,
} from "@/services/badges";
import { revalidatePath } from "next/cache";

export async function evaluateMyBadgesAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await evaluateUserBadges(user.id);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return result;
  } catch (err: any) {
    console.error("Error in evaluateMyBadgesAction:", err);
    return { success: false, error: err?.message || "Failed to evaluate badges" };
  }
}

export async function recalculateBadgesAction(targetUserId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    let uid = user.id;
    if (targetUserId && targetUserId !== user.id) {
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (callerProfile?.role === "admin" || user.app_metadata?.role === "admin") {
        uid = targetUserId;
      } else {
        return {
          success: false,
          error: "Unauthorized: only administrators can recalculate other users' achievements.",
        };
      }
    }

    const result = await evaluateUserBadges(uid);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return result;
  } catch (err: any) {
    console.error("Error in recalculateBadgesAction:", err);
    return { success: false, error: err?.message || "Failed to recalculate badges" };
  }
}

export async function getBadgeAuditLogsAction(userId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    let uid = user.id;
    if (userId && userId !== user.id) {
      const { data: callerProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (callerProfile?.role === "admin" || user.app_metadata?.role === "admin") {
        uid = userId;
      } else {
        return {
          success: false,
          error: "Unauthorized: audit logs are restricted to your own profile.",
        };
      }
    }

    const { getUserBadgeAuditLogs } = await import("@/services/badges");
    const logs = await getUserBadgeAuditLogs(uid);
    return { success: true, data: logs };
  } catch (err: any) {
    console.error("Error in getBadgeAuditLogsAction:", err);
    return { success: false, error: err?.message || "Failed to fetch audit logs" };
  }
}

export async function getUserBadgesAction(userId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isCurrentUser = user?.id === userId;

    const badges = await getUserBadgesWithProgress(userId, isCurrentUser);
    return { success: true, data: badges };
  } catch (err: any) {
    console.error("Error in getUserBadgesAction:", err);
    return { success: false, error: err?.message || "Failed to fetch badges" };
  }
}

export async function adminAwardBadgeAction(
  targetUserId: string,
  badgeId: string,
  reason?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const res = await adminAwardBadge(user.id, targetUserId, badgeId, reason);
    revalidatePath("/profile");
    return res;
  } catch (err: any) {
    console.error("Error in adminAwardBadgeAction:", err);
    return { success: false, error: err?.message || "Failed to award badge" };
  }
}

export async function adminRevokeBadgeAction(
  targetUserId: string,
  badgeId: string,
  reason?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const res = await adminRevokeBadge(user.id, targetUserId, badgeId, reason);
    revalidatePath("/profile");
    return res;
  } catch (err: any) {
    console.error("Error in adminRevokeBadgeAction:", err);
    return { success: false, error: err?.message || "Failed to revoke badge" };
  }
}
