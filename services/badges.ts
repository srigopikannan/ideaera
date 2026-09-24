import { createClient } from "@/lib/supabase/server";
import { Badge, BadgeWithProgress, UserBadge } from "@/types";

export interface UserActivityMetrics {
  ideas_count: number;
  projects_count: number;
  connections_count: number;
  hackathons_count: number;
}

export interface BadgeSummary {
  total_earned: number;
  total_available: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
  prestige_score: number;
  completion_rate: number;
  metrics: UserActivityMetrics;
}

export interface UserBadgesResult {
  earned: BadgeWithProgress[];
  in_progress: BadgeWithProgress[];
  all: BadgeWithProgress[];
  summary: BadgeSummary;
}

/**
 * Calculates raw user metrics across verified database tables.
 */
export async function calculateUserMetrics(userId: string): Promise<UserActivityMetrics> {
  const supabase = await createClient();

  const [ideasRes, projectsRes, connsRes, hackathonsRes] = await Promise.all([
    supabase
      .from("ideas")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", userId)
      .not("title", "is", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .not("name", "is", null),
    supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`),
    supabase
      .from("hackathons")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", userId),
  ]);

  return {
    ideas_count: ideasRes.count || 0,
    projects_count: projectsRes.count || 0,
    connections_count: connsRes.count || 0,
    hackathons_count: hackathonsRes.count || 0,
  };
}

/**
 * Evaluates active badges against user metrics and awards newly earned badges.
 * Idempotent: previously awarded badges will not be duplicated.
 */
export async function evaluateUserBadges(userId: string): Promise<{
  success: boolean;
  metrics: UserActivityMetrics;
  newly_awarded: Array<{
    badge_id: string;
    name: string;
    slug: string;
    tier: string;
  }>;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("evaluate_and_award_user_badges", {
      target_user_id: userId,
    });

    if (error) {
      console.error("Error executing evaluate_and_award_user_badges RPC:", error);
      const metrics = await calculateUserMetrics(userId);
      return {
        success: false,
        metrics,
        newly_awarded: [],
      };
    }

    return (
      data || {
        success: true,
        metrics: { ideas_count: 0, projects_count: 0, connections_count: 0, hackathons_count: 0 },
        newly_awarded: [],
      }
    );
  } catch (err) {
    console.error("evaluateUserBadges exception:", err);
    const metrics = await calculateUserMetrics(userId);
    return {
      success: false,
      metrics,
      newly_awarded: [],
    };
  }
}

/**
 * Fetches all active badges with real progress information for a user.
 */
export async function getUserBadgesWithProgress(
  userId: string,
  isCurrentUser: boolean = false
): Promise<UserBadgesResult> {
  const supabase = await createClient();

  // If current user is loading profile, trigger evaluation to ensure latest awards are up to date
  if (isCurrentUser) {
    try {
      await evaluateUserBadges(userId);
    } catch (e) {
      console.warn("User badge evaluation during fetch failed:", e);
    }
  }

  // Fetch active badges and user's earned badges in parallel
  const [badgesRes, userBadgesRes, metrics] = await Promise.all([
    supabase
      .from("badges")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("user_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", userId),
    calculateUserMetrics(userId),
  ]);

  const allBadges: Badge[] = (badgesRes.data as Badge[]) || [];
  const userBadges: UserBadge[] = (userBadgesRes.data as UserBadge[]) || [];

  const earnedMap = new Map<string, UserBadge>();
  userBadges.forEach((ub) => {
    earnedMap.set(ub.badge_id, ub);
  });

  const tierOrder: Record<string, number> = { gold: 1, silver: 2, bronze: 3 };

  const badgesWithProgress: BadgeWithProgress[] = allBadges.map((badge) => {
    const earned = earnedMap.get(badge.id);
    const isEarned = Boolean(earned);

    let currentValue = 0;
    let percentage = 0;

    if (badge.criteria_type === "ideas_created") {
      currentValue = metrics.ideas_count;
      percentage = Math.min(100, Math.round((currentValue / badge.criteria_value) * 100));
    } else if (badge.criteria_type === "projects_created") {
      currentValue = metrics.projects_count;
      percentage = Math.min(100, Math.round((currentValue / badge.criteria_value) * 100));
    } else if (badge.criteria_type === "connections_count") {
      currentValue = metrics.connections_count;
      percentage = Math.min(100, Math.round((currentValue / badge.criteria_value) * 100));
    } else if (badge.criteria_type === "hackathons_count") {
      currentValue = metrics.hackathons_count;
      percentage = Math.min(100, Math.round((currentValue / badge.criteria_value) * 100));
    } else if (badge.criteria_type === "composite") {
      if (badge.slug === "high-performer") {
        const ideasPart = Math.min(1, metrics.ideas_count / 2) * 50;
        const projectsPart = Math.min(1, metrics.projects_count / 1) * 50;
        currentValue = Math.min(2, metrics.ideas_count) + Math.min(1, metrics.projects_count);
        percentage = Math.min(100, Math.round(ideasPart + projectsPart));
      } else if (badge.slug === "top-performer") {
        const ideasPart = Math.min(1, metrics.ideas_count / 3) * 40;
        const projectsPart = Math.min(1, metrics.projects_count / 1) * 30;
        const connsPart = Math.min(1, metrics.connections_count / 2) * 30;
        currentValue =
          Math.min(3, metrics.ideas_count) +
          Math.min(1, metrics.projects_count) +
          Math.min(2, metrics.connections_count);
        percentage = Math.min(100, Math.round(ideasPart + projectsPart + connsPart));
      } else {
        const totalActivity = metrics.ideas_count + metrics.projects_count + metrics.connections_count;
        currentValue = totalActivity;
        percentage = Math.min(100, Math.round((totalActivity / badge.criteria_value) * 100));
      }
    }

    if (isEarned) {
      percentage = 100;
    }

    return {
      ...badge,
      is_earned: isEarned,
      awarded_at: earned?.awarded_at || null,
      awarded_by: earned?.awarded_by || null,
      evidence: earned?.evidence || undefined,
      current_value: currentValue,
      percentage: Math.max(0, Math.min(100, percentage)),
    };
  });

  // Sort: Earned first, then by tier prestige (Gold -> Silver -> Bronze), then by percentage descending
  badgesWithProgress.sort((a, b) => {
    if (a.is_earned !== b.is_earned) return a.is_earned ? -1 : 1;
    const tierDiff = (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4);
    if (tierDiff !== 0) return tierDiff;
    return b.percentage - a.percentage;
  });

  const earned = badgesWithProgress.filter((b) => b.is_earned);
  const inProgress = badgesWithProgress.filter((b) => !b.is_earned);

  const bronzeCount = earned.filter((b) => b.tier === "bronze").length;
  const silverCount = earned.filter((b) => b.tier === "silver").length;
  const goldCount = earned.filter((b) => b.tier === "gold").length;

  const prestigeScore = bronzeCount * 100 + silverCount * 300 + goldCount * 1000;
  const completionRate =
    allBadges.length > 0 ? Math.round((earned.length / allBadges.length) * 100) : 0;

  return {
    earned,
    in_progress: inProgress,
    all: badgesWithProgress,
    summary: {
      total_earned: earned.length,
      total_available: allBadges.length,
      bronze_count: bronzeCount,
      silver_count: silverCount,
      gold_count: goldCount,
      prestige_score: prestigeScore,
      completion_rate: completionRate,
      metrics,
    },
  };
}

/**
 * Admin action to manually award a badge to a user with audit evidence.
 */
export async function adminAwardBadge(
  adminUserId: string,
  targetUserId: string,
  badgeId: string,
  reason: string = "Manual recognition by administrator"
): Promise<{ success: boolean; user_badge_id?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_award_badge", {
    p_admin_user_id: adminUserId,
    p_target_user_id: targetUserId,
    p_badge_id: badgeId,
    p_reason: reason,
  });

  if (error) {
    console.error("Error in adminAwardBadge:", error);
    return { success: false, error: error.message };
  }

  return data as any;
}

/**
 * Admin action to revoke an awarded badge.
 */
export async function adminRevokeBadge(
  adminUserId: string,
  targetUserId: string,
  badgeId: string,
  reason: string = "Revoked by administrator"
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_revoke_badge", {
    p_admin_user_id: adminUserId,
    p_target_user_id: targetUserId,
    p_badge_id: badgeId,
    p_reason: reason,
  });

  if (error) {
    console.error("Error in adminRevokeBadge:", error);
    return { success: false, error: error.message };
  }

  return data as any;
}
