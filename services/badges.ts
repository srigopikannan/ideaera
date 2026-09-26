import { createClient } from "@/lib/supabase/server";
import {
  Badge,
  BadgeWithProgress,
  UserBadge,
  BadgeAuditLog,
  UserActivityMetrics,
  TierProgression,
  TierProgressionRequirement,
  BadgeEvaluationResult,
} from "@/types";

export type { UserActivityMetrics, TierProgression, TierProgressionRequirement, BadgeEvaluationResult };

export interface BadgeSummary {
  total_earned: number;
  total_available: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
  prestige_score: number;
  completion_rate: number;
  metrics: UserActivityMetrics;
  tier_progression: TierProgression;
}

export interface UserBadgesResult {
  earned: BadgeWithProgress[];
  in_progress: BadgeWithProgress[];
  all: BadgeWithProgress[];
  summary: BadgeSummary;
}

/**
 * Calculates raw user metrics across verified database tables with anti-gaming quality thresholds.
 */
export async function calculateUserMetrics(userId: string): Promise<UserActivityMetrics> {
  const supabase = await createClient();

  // Prefer calling authoritative evaluate_and_sync_user_badges RPC
  try {
    const { data, error } = await supabase.rpc("evaluate_and_sync_user_badges", {
      target_user_id: userId,
    });
    if (!error && data?.metrics) {
      return data.metrics as UserActivityMetrics;
    }
  } catch (err) {
    console.warn("RPC calculate metrics fallback:", err);
  }

  // Fallback with anti-gaming checks
  const [ideasRes, projectsRes, compProjectsRes, connsRes, hackathonRegsRes, hackathonsOrganizedRes, teamRes, tasksRes] =
    await Promise.all([
      supabase
        .from("ideas")
        .select("id, title, description, problem, solution, validation_status")
        .eq("creator_id", userId),
      supabase
        .from("projects")
        .select("id, name, description, repository_url, deployment_url, required_skills, status")
        .eq("owner_id", userId),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId)
        .or("status.ilike.%complete%,status.eq.Done,status.eq.Launched"),
      supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`),
      supabase
        .from("hackathon_registrations")
        .select("hackathon_id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("hackathons")
        .select("id", { count: "exact", head: true })
        .eq("organizer_id", userId),
      supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", userId),
      supabase
        .from("tasks")
        .select("id, project_id", { count: "exact" })
        .eq("assigned_to", userId)
        .eq("status", "Completed"),
    ]);

  const validIdeas = (ideasRes.data || []).filter((i: any) => {
    if (!i.title || i.title.trim().length < 5) return false;
    const descLen = (i.description || "").trim().length;
    const probLen = (i.problem || "").trim().length;
    const solLen = (i.solution || "").trim().length;
    return (
      descLen >= 50 ||
      (probLen >= 20 && solLen >= 20) ||
      ["testing", "validated"].includes(i.validation_status)
    );
  }).length;

  const validProjects = (projectsRes.data || []).filter((p: any) => {
    if (!p.name || p.name.trim().length < 3) return false;
    if ((p.description || "").trim().length < 50) return false;
    return (
      Boolean(p.repository_url?.trim()) ||
      Boolean(p.deployment_url?.trim()) ||
      (Array.isArray(p.required_skills) && p.required_skills.length > 0)
    );
  }).length;

  const hackathonsCount = (hackathonRegsRes.count || 0) + (hackathonsOrganizedRes.count || 0);

  // Meaningful team contributions: member who completed at least 1 task on that project
  const completedTaskProjectIds = new Set((tasksRes.data || []).map((t: any) => t.project_id));
  const validTeamCount = (teamRes.data || []).filter((pm: any) =>
    completedTaskProjectIds.has(pm.project_id)
  ).length;

  return {
    ideas_count: validIdeas,
    projects_count: validProjects,
    completed_projects_count: compProjectsRes.count || 0,
    connections_count: connsRes.count || 0,
    hackathons_count: hackathonsCount,
    team_contributions_count: validTeamCount,
    completed_tasks_count: tasksRes.count || 0,
  };
}

/**
 * Computes explicit tier progression toward next tier (Bronze -> Silver -> Gold).
 */
export function computeTierProgression(
  earned: BadgeWithProgress[],
  metrics: UserActivityMetrics
): TierProgression {
  const hasGoldBadge = earned.some((b) => b.tier === "gold");
  const silverBadges = earned.filter((b) => b.tier === "silver");
  const bronzeBadges = earned.filter((b) => b.tier === "bronze");

  const ideas = metrics.ideas_count || 0;
  const projects = metrics.projects_count || 0;
  const compProjects = metrics.completed_projects_count || 0;
  const tasks = metrics.completed_tasks_count || 0;
  const hackathons = metrics.hackathons_count || 0;
  const connections = metrics.connections_count || 0;

  // Tier 3: Gold (Top Performer)
  if (hasGoldBadge) {
    return {
      currentTier: "gold",
      currentTierLabel: "Gold — Top Performer",
      nextTier: null,
      nextTierLabel: null,
      progressPercentage: 100,
      requirementsToNextTier: [
        {
          label: "Elite Tier Maintained across all innovation disciplines",
          current: 1,
          target: 1,
          satisfied: true,
        },
      ],
    };
  }

  // Tier 2: Silver (High Performer)
  if (silverBadges.length >= 1) {
    const goldReqs: TierProgressionRequirement[] = [
      {
        label: "5 Developed Ideas",
        current: Math.min(5, ideas),
        target: 5,
        satisfied: ideas >= 5,
      },
      {
        label: "2 Software Projects",
        current: Math.min(2, projects),
        target: 2,
        satisfied: projects >= 2,
      },
      {
        label: "1 Completed Project",
        current: Math.min(1, compProjects),
        target: 1,
        satisfied: compProjects >= 1,
      },
      {
        label: "3 Completed Project Tasks",
        current: Math.min(3, tasks),
        target: 3,
        satisfied: tasks >= 3,
      },
      {
        label: "1 Hackathon or 3 Connections",
        current: Math.min(1, hackathons >= 1 || connections >= 3 ? 1 : 0),
        target: 1,
        satisfied: hackathons >= 1 || connections >= 3,
      },
    ];

    const satisfiedCount = goldReqs.filter((r) => r.satisfied).length;
    const progressPct = Math.round((satisfiedCount / goldReqs.length) * 100);

    return {
      currentTier: "silver",
      currentTierLabel: "Silver — High Performer",
      nextTier: "gold",
      nextTierLabel: "Gold — Top Performer",
      progressPercentage: progressPct,
      requirementsToNextTier: goldReqs,
    };
  }

  // Tier 1: Bronze (Active Innovator)
  if (bronzeBadges.length >= 1) {
    const silverReqs: TierProgressionRequirement[] = [
      {
        label: "2 Developed Ideas",
        current: Math.min(2, ideas),
        target: 2,
        satisfied: ideas >= 2,
      },
      {
        label: "1 Software Project",
        current: Math.min(1, projects),
        target: 1,
        satisfied: projects >= 1,
      },
      {
        label: "1 Completed Task / Team Work",
        current: Math.min(1, tasks),
        target: 1,
        satisfied: tasks >= 1,
      },
    ];

    const satisfiedCount = silverReqs.filter((r) => r.satisfied).length;
    const progressPct = Math.round((satisfiedCount / silverReqs.length) * 100);

    return {
      currentTier: "bronze",
      currentTierLabel: "Bronze — Active Innovator",
      nextTier: "silver",
      nextTierLabel: "Silver — High Performer",
      progressPercentage: progressPct,
      requirementsToNextTier: silverReqs,
    };
  }

  // No Tier: Aspiring Innovator
  const bronzeReqs: TierProgressionRequirement[] = [
    {
      label: "1 Developed Idea or Software Project",
      current: Math.min(1, Math.max(ideas, projects)),
      target: 1,
      satisfied: ideas >= 1 || projects >= 1,
    },
    {
      label: "1 Connection, Team Work, or Hackathon",
      current: Math.min(1, Math.max(connections, tasks, hackathons)),
      target: 1,
      satisfied: connections >= 1 || tasks >= 1 || hackathons >= 1,
    },
  ];

  const satisfiedCount = bronzeReqs.filter((r) => r.satisfied).length;
  const progressPct = Math.round((satisfiedCount / bronzeReqs.length) * 100);

  return {
    currentTier: "none",
    currentTierLabel: "Aspiring Innovator",
    nextTier: "bronze",
    nextTierLabel: "Bronze — Active Innovator",
    progressPercentage: progressPct,
    requirementsToNextTier: bronzeReqs,
  };
}

/**
 * Evaluates active badges against CURRENT real user metrics.
 * - Awards missing badges when criteria are met
 * - Revokes badges when criteria are no longer met (due to deletion/modification)
 * - Logs every award and revocation with audit evidence
 * - Automatically keeps notifications in sync
 */
export async function evaluateUserBadges(userId: string): Promise<BadgeEvaluationResult> {
  try {
    const supabase = await createClient();

    // Execute evaluate_and_sync_user_badges RPC in database
    let { data, error } = await supabase.rpc("evaluate_and_sync_user_badges", {
      target_user_id: userId,
    });

    if (error) {
      const fb = await supabase.rpc("evaluate_and_award_user_badges", {
        target_user_id: userId,
      });
      data = fb.data;
      error = fb.error;
    }

    if (error) {
      console.error("Error executing evaluate_and_sync_user_badges RPC:", error);
      const metrics = await calculateUserMetrics(userId);
      return {
        success: false,
        metrics,
        newly_awarded: [],
        revoked: [],
        currently_valid: [],
      };
    }

    return {
      success: true,
      metrics: data?.metrics || {
        ideas_count: 0,
        projects_count: 0,
        completed_projects_count: 0,
        connections_count: 0,
        hackathons_count: 0,
        team_contributions_count: 0,
        completed_tasks_count: 0,
      },
      newly_awarded: data?.newly_awarded || [],
      revoked: data?.revoked || [],
      currently_valid: data?.currently_valid || [],
    };
  } catch (err) {
    console.error("evaluateUserBadges exception:", err);
    const metrics = await calculateUserMetrics(userId);
    return {
      success: false,
      metrics,
      newly_awarded: [],
      revoked: [],
      currently_valid: [],
    };
  }
}

/**
 * Fetches all active badges with real progress information for a user.
 * Always triggers server-side re-evaluation to ensure 100% current validity.
 */
export async function getUserBadgesWithProgress(
  userId: string,
  isCurrentUser: boolean = false
): Promise<UserBadgesResult> {
  const supabase = await createClient();

  // Re-evaluate on every fetch so profiles ALWAYS display CURRENT valid achievements
  try {
    await evaluateUserBadges(userId);
  } catch (e) {
    console.warn("User badge evaluation during fetch failed:", e);
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
    } else if (badge.criteria_type === "team_contributions") {
      currentValue = metrics.team_contributions_count || 0;
      percentage = Math.min(100, Math.round((currentValue / badge.criteria_value) * 100));
    } else if (badge.criteria_type === "composite") {
      if (badge.slug === "active-innovator") {
        currentValue = Math.max(metrics.ideas_count, metrics.projects_count);
        percentage = currentValue >= 1 ? 100 : 0;
      } else if (badge.slug === "high-performer") {
        const ideasPart = Math.min(1, metrics.ideas_count / 2) * 40;
        const projectsPart = Math.min(1, metrics.projects_count / 1) * 30;
        const tasksPart = Math.min(1, (metrics.completed_tasks_count || 0) / 1) * 30;
        currentValue =
          Math.min(2, metrics.ideas_count) +
          Math.min(1, metrics.projects_count) +
          Math.min(1, metrics.completed_tasks_count || 0);
        percentage = Math.min(100, Math.round(ideasPart + projectsPart + tasksPart));
      } else if (badge.slug === "top-performer") {
        const ideasPart = Math.min(1, metrics.ideas_count / 5) * 25;
        const projectsPart = Math.min(1, metrics.projects_count / 2) * 20;
        const compProjPart = Math.min(1, (metrics.completed_projects_count || 0) / 1) * 20;
        const tasksPart = Math.min(1, (metrics.completed_tasks_count || 0) / 3) * 20;
        const engagePart = Math.min(1, Math.max(metrics.hackathons_count / 1, metrics.connections_count / 3)) * 15;
        currentValue =
          Math.min(5, metrics.ideas_count) +
          Math.min(2, metrics.projects_count) +
          Math.min(1, metrics.completed_projects_count || 0) +
          Math.min(3, metrics.completed_tasks_count || 0) +
          Math.min(1, metrics.hackathons_count >= 1 || metrics.connections_count >= 3 ? 1 : 0);
        percentage = Math.min(100, Math.round(ideasPart + projectsPart + compProjPart + tasksPart + engagePart));
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

  const tierProgression = computeTierProgression(earned, metrics);

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
      tier_progression: tierProgression,
    },
  };
}

/**
 * Fetches the complete immutable audit trail of badge awards and revocations for a user.
 */
export async function getUserBadgeAuditLogs(userId: string): Promise<BadgeAuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("badge_audit_logs")
    .select("*, badge:badges(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return data as any[];
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
