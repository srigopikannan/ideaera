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
