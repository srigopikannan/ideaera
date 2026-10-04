import { createClient } from "@/lib/supabase/server";
import {
  Idea,
  IdeaComment,
  IdeaValidationFeedback,
  IdeaValidationData,
  Project,
  IdeaDependencyProject,
  IdeaDeleteResult,
  SimilarIdeaMatch,
  IdeaReport,
  IdeaReportSubmitResult,
  IdeaReportModerateResult,
} from "@/types";
import { checkAndCreateIdeaMilestoneNotification } from "@/services/social";
import { evaluateUserBadges } from "@/services/badges";
import { createProject } from "@/services/projects";
import { rateLimiters } from "@/lib/rate-limit";

export function mapIdea(raw: any, isLiked: boolean = false): Idea {
  const authorProfile = raw.creator || raw.author || null;
  const rawTags = raw.tags;
  let parsedTags: string[] = [];
  if (Array.isArray(rawTags)) {
    parsedTags = rawTags;
  } else if (typeof rawTags === "string" && rawTags.trim()) {
    parsedTags = rawTags.split(",").map((t: string) => t.trim()).filter(Boolean);
  } else if (raw.category) {
    parsedTags = [raw.category];
  }

  // Handle problem and solution distinctly
  let problem = raw.problem ? String(raw.problem).trim() : null;
  let solution = raw.solution ? String(raw.solution).trim() : null;

  // If problem/solution are not populated separately in DB, try splitting description if it has multiple sections
  if (!problem && !solution && raw.description) {
    const parts = raw.description.split(/\r?\n\r?\n/).map((p: string) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      problem = parts[0];
      solution = parts.slice(1).join("\n\n");
    } else {
      problem = raw.description;
      solution = null;
    }
  }

  const description =
    raw.description ||
    (problem && solution ? `${problem}\n\n${solution}` : problem || solution || "");

  const displayId = `IDEA-${String(raw.id).substring(0, 8).toUpperCase()}`;

  let status: Idea["status"] = "open";
  if (raw.status === "archived" || raw.deleted_at) {
    status = "archived";
  } else if (raw.stage?.toLowerCase() === "implemented") {
    status = "implemented";
  } else if (raw.stage?.toLowerCase() === "in_progress") {
    status = "in_progress";
  }

  return {
    id: raw.id,
    display_id: displayId,
    author_id: raw.creator_id || raw.author_id,
    author: authorProfile,
    title: raw.title,
    description,
    problem,
    solution,
    goals: raw.goals || null,
    skills_needed: Array.isArray(raw.skills_needed) ? raw.skills_needed : [],
    collaboration_info: raw.collaboration_info || null,
    version: raw.version || 1,
    version_history: Array.isArray(raw.version_history) ? raw.version_history : [],
    category: raw.category || "AI & Machine Learning",
    tags: parsedTags,
    status,
    visibility: raw.visibility || "public",
    likes_count: raw.likes_count || 0,
    comments_count: raw.comments_count || 0,
    deleted_at: raw.deleted_at || null,
    deleted_by: raw.deleted_by || null,
    duplicate_warning_acknowledged: Boolean(raw.duplicate_warning_acknowledged),
    moderation_status: raw.moderation_status || "active",
    moderation_note: raw.moderation_note || null,
    validation_status: raw.validation_status || "not_validated",
    validation_target_users: raw.validation_target_users || null,
    validation_why_it_matters: raw.validation_why_it_matters || null,
    validation_alternatives: raw.validation_alternatives || null,
    validation_expected_benefits: raw.validation_expected_benefits || null,
    validation_questions: Array.isArray(raw.validation_questions) ? raw.validation_questions : [],
    created_at: raw.created_at,
    updated_at: raw.updated_at || raw.created_at,
    is_liked: isLiked,
  };
}

export async function getIdeas(
  category?: string,
  sort: "trending" | "popular" | "recent" = "trending",
  query?: string,
  page: number = 1,
  limit: number = 24
): Promise<Idea[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let qb = supabase.from("ideas").select("*, creator:profiles!creator_id(*)");

    // Exclude archived and soft-deleted ideas from public discovery
    qb = qb.is("deleted_at", null).neq("status", "archived");

    // Enforce Visibility at query layer:
    // - Authenticated: can view public, community, and their own private ideas
    // - Anonymous: can view only public ideas
    if (user) {
      qb = qb.or(`visibility.eq.public,visibility.eq.community,creator_id.eq.${user.id}`);
    } else {
      qb = qb.eq("visibility", "public");
    }

    if (category && category !== "All") {
      qb = qb.eq("category", category);
    }
    if (query) {
      qb = qb.or(`title.ilike.%${query}%,description.ilike.%${query}%,problem.ilike.%${query}%,solution.ilike.%${query}%`);
    }

    if (sort === "popular") {
      qb = qb.order("likes_count", { ascending: false }).order("created_at", { ascending: false });
    } else {
      qb = qb.order("created_at", { ascending: false });
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(60, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;
    qb = qb.range(offset, offset + safeLimit - 1);

    const { data, error } = await qb;
    if (data && !error) {
      return data.map((idea) => mapIdea(idea, false));
    }
  } catch (err) {
    console.error("Error in getIdeas:", err);
  }

  return [];
}

export async function getIdeasByUserId(userId: string): Promise<Idea[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let qb = supabase
      .from("ideas")
      .select("*, creator:profiles!creator_id(id, full_name, username, avatar_url)")
      .eq("creator_id", userId);

    // If viewing someone else's profile, hide their private ideas and archived ideas
    if (!user || user.id !== userId) {
      qb = qb.is("deleted_at", null).neq("status", "archived");
      qb = user
        ? qb.or("visibility.eq.public,visibility.eq.community")
        : qb.eq("visibility", "public");
    }

    const { data, error } = await qb
      .order("created_at", { ascending: false })
      .limit(30);

    if (data && !error) {
      return data.map((idea) => mapIdea(idea, false));
    }
  } catch (err) {
    console.error("Error in getIdeasByUserId:", err);
  }

  return [];
}

export async function getIdeaById(id: string): Promise<Idea | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("ideas")
      .select("*, creator:profiles!creator_id(*)")
      .eq("id", id)
      .maybeSingle();

    if (data && !error) {
      // If idea is archived, only creator and connected project members can access it
      if (data.status === "archived" || data.deleted_at) {
        if (!user) return null;
        if (user.id !== data.creator_id) {
          const { data: projectLinks } = await supabase
            .from("projects")
            .select("id, owner_id, project_members(user_id)")
            .eq("idea_id", id);

          const isConnected = (projectLinks || []).some(
            (p: any) =>
              p.owner_id === user.id ||
              p.project_members?.some((m: any) => m.user_id === user.id)
          );

          if (!isConnected) return null;
        }
      }

      // Enforce strict idea visibility protection
      if (data.visibility === "private" && (!user || user.id !== data.creator_id)) {
        return null; // Private ideas are strictly creator-only
      }
      if (data.visibility === "community" && !user) {
        return null; // Community ideas require authenticated session
      }

      let isLiked = false;
      if (user) {
        try {
          const { data: likeRow } = await supabase
            .from("idea_likes")
            .select("id")
            .eq("idea_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          isLiked = Boolean(likeRow);
        } catch {
          // fallback
        }
      }
      return mapIdea(data, isLiked);
    }
  } catch (err) {
    console.error("Error in getIdeaById:", err);
  }

  return null;
}

export async function getIdeaComments(ideaId: string): Promise<IdeaComment[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("idea_comments")
      .select("*, user:profiles(*)")
      .eq("idea_id", ideaId)
      .order("created_at", { ascending: true });

    if (data && !error) return data;
  } catch (err) {
    console.error("Error in getIdeaComments (table may not exist):", err);
  }

  return [];
}

export async function createIdea(data: {
  title: string;
  description: string;
  category: string;
  tags: string[];
  problem?: string;
  solution?: string;
  visibility?: 'public' | 'community' | 'selected' | 'private';
  skills_needed?: string[];
  collaboration_info?: string;
  goals?: string;
  duplicate_warning_acknowledged?: boolean;
}): Promise<Idea> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to share an idea.");
  }

  const problem = data.problem !== undefined && data.problem !== null ? data.problem.trim() : null;
  const solution = data.solution !== undefined && data.solution !== null ? data.solution.trim() : null;
  const description =
    data.description?.trim() ||
    (problem && solution ? `${problem}\n\n${solution}` : problem || solution || data.title.trim());

  const { data: inserted, error } = await supabase
    .from("ideas")
    .insert({
      title: data.title.trim(),
      description,
      problem,
      solution,
      goals: data.goals?.trim() || null,
      skills_needed: data.skills_needed || [],
      collaboration_info: data.collaboration_info?.trim() || null,
      category: data.category,
      stage: "Idea",
      visibility: data.visibility || "public",
      creator_id: user.id,
      duplicate_warning_acknowledged: Boolean(data.duplicate_warning_acknowledged),
    })
    .select("*, creator:profiles!creator_id(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to create idea.");
  }

  // Trigger badge evaluation asynchronously
  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge evaluation on createIdea error:", err)
  );

  return mapIdea(inserted);
}

export async function updateIdea(
  id: string,
  data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    problem?: string;
    solution?: string;
    duplicate_warning_acknowledged?: boolean;
  }
): Promise<Idea> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update an idea.");
  }

  // 1. Fetch idea to verify existence and ownership
  const { data: idea, error: fetchErr } = await supabase
    .from("ideas")
    .select("id, creator_id, version, version_history, category")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !idea) {
    throw new Error("Idea not found.");
  }

  if (idea.creator_id !== user.id) {
    throw new Error("Unauthorized: You do not have permission to edit this idea.");
  }

  const problem = data.problem !== undefined && data.problem !== null ? data.problem.trim() : null;
  const solution = data.solution !== undefined && data.solution !== null ? data.solution.trim() : null;
  const description =
    data.description?.trim() ||
    (problem && solution ? `${problem}\n\n${solution}` : problem || solution || data.title.trim());

  const currentVer = typeof idea.version === "number" ? idea.version : 1;
  const nextVer = currentVer + 1;
  const existingHistory = Array.isArray(idea.version_history) ? idea.version_history : [];
  const nextHistory = [
    ...existingHistory,
    {
      version_number: nextVer,
      created_at: new Date().toISOString(),
      changed_by: user.id,
      change_summary: `Revision ${nextVer}: Refined idea parameters in ${data.category}`,
    },
  ];

  let updated: any = null;

  const updateFields: any = {
    title: data.title.trim(),
    description,
    problem,
    solution,
    category: data.category,
    version: nextVer,
    version_history: nextHistory,
    updated_at: new Date().toISOString(),
  };

  if (data.duplicate_warning_acknowledged !== undefined) {
    updateFields.duplicate_warning_acknowledged = Boolean(data.duplicate_warning_acknowledged);
  }

  try {
    const { data: resData, error: updateErr } = await supabase
      .from("ideas")
      .update(updateFields)
      .eq("id", id)
      .eq("creator_id", user.id)
      .select("*, creator:profiles!creator_id(*)")
      .single();

    if (!updateErr && resData) {
      updated = resData;
    } else {
      // Fallback
      delete updateFields.version;
      delete updateFields.version_history;
      const { data: fallbackData } = await supabase
        .from("ideas")
        .update(updateFields)
        .eq("id", id)
        .eq("creator_id", user.id)
        .select("*, creator:profiles!creator_id(*)")
        .single();
      updated = fallbackData;
    }
  } catch {
    const { data: fallbackData } = await supabase
      .from("ideas")
      .update({
        title: data.title.trim(),
        description,
        problem,
        solution,
        category: data.category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("creator_id", user.id)
      .select("*, creator:profiles!creator_id(*)")
      .single();
    updated = fallbackData;
  }

  if (!updated) {
    throw new Error("Failed to update idea.");
  }

  evaluateUserBadges(user.id).catch(console.warn);

  return mapIdea(updated);
}

export async function toggleLikeIdea(id: string): Promise<{ liked: boolean; likes_count: number }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("You must be logged in to upvote an idea.");
    }

    // Rate Limiting Protection (60 likes / min)
    const rateCheck = rateLimiters.likes.check(user.id);
    if (!rateCheck.success) {
      throw new Error("You are upvoting too fast. Please wait a moment.");
    }

    const { data: existing } = await supabase
      .from("idea_likes")
      .select("id")
      .eq("idea_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("idea_likes").delete().eq("id", existing.id);
    } else {
      // Insert with unique constraint protection (uq_idea_likes_user_idea)
      const { error: insertErr } = await supabase.from("idea_likes").insert({ idea_id: id, user_id: user.id });
      if (insertErr && insertErr.code !== "23505") { // 23505 is unique violation, ignore race-condition duplicate
        console.error("Error inserting like:", insertErr);
      }

      // Notify idea creator if someone else liked their idea
      try {
        const { data: idea } = await supabase.from("ideas").select("creator_id, title").eq("id", id).single();
        if (idea && idea.creator_id && idea.creator_id !== user.id) {
          const { data: existingNotif } = await supabase
            .from("notifications")
            .select("id")
            .eq("recipient_id", idea.creator_id)
            .eq("actor_id", user.id)
            .eq("idea_id", id)
            .eq("type", "idea_like")
            .maybeSingle();

          if (!existingNotif) {
            await supabase.from("notifications").insert({
              recipient_id: idea.creator_id,
              user_id: idea.creator_id,
              actor_id: user.id,
              idea_id: id,
              related_id: id,
              type: "idea_like",
              title: "Concept Endorsement",
              message: `endorsed your idea "${idea.title}".`,
              read: false,
              is_read: false,
            });
          }
        }
      } catch (likeNotifErr) {
        console.error("Error creating idea_like notification:", likeNotifErr);
      }

      // Check milestone threshold
      try {
        await checkAndCreateIdeaMilestoneNotification(id);
      } catch (milestoneErr) {
        console.error("Error checking milestone notification:", milestoneErr);
      }
    }

    const { data: updated } = await supabase.from("ideas").select("likes_count").eq("id", id).single();
    return { liked: !existing, likes_count: updated?.likes_count || 0 };
  } catch (err: any) {
    if (err?.message?.includes("too fast")) throw err;
    return { liked: false, likes_count: 0 };
  }
}

export async function addIdeaComment(ideaId: string, content: string): Promise<IdeaComment> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to post a comment.");
  }

  const { data: inserted, error } = await supabase
    .from("idea_comments")
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      content,
    })
    .select("*, user:profiles(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Comments are currently unavailable.");
  }

  // Notify idea creator if someone else commented on their idea
  try {
    const { data: idea } = await supabase.from("ideas").select("creator_id, title").eq("id", ideaId).single();
    if (idea && idea.creator_id && idea.creator_id !== user.id) {
      await supabase.from("notifications").insert({
        recipient_id: idea.creator_id,
        user_id: idea.creator_id,
        actor_id: user.id,
        idea_id: ideaId,
        related_id: ideaId,
        type: "idea_comment",
        title: "New Critique Note",
        message: `commented on your idea "${idea.title}".`,
        read: false,
        is_read: false,
      });
    }
  } catch (commentNotifErr) {
    console.error("Error creating idea_comment notification:", commentNotifErr);
  }

  return inserted;
}

export async function checkIdeaDependencies(id: string): Promise<{
  hasDependencies: boolean;
  projects: IdeaDependencyProject[];
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_idea_dependencies", {
      target_idea_id: id,
    });

    if (!error && data) {
      return {
        hasDependencies: Boolean(data.has_dependencies),
        projects: Array.isArray(data.projects) ? data.projects : [],
      };
    }

    // Direct fallback query
    const { data: projectRows, error: projErr } = await supabase
      .from("projects")
      .select("id, name, owner_id, status")
      .eq("idea_id", id);

    if (projErr) throw projErr;

    const projects: IdeaDependencyProject[] = (projectRows || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      owner_id: p.owner_id,
      status: p.status,
    }));

    return {
      hasDependencies: projects.length > 0,
      projects,
    };
  } catch (err) {
    console.error("Error in checkIdeaDependencies:", err);
    return { hasDependencies: false, projects: [] };
  }
}

export async function deleteIdea(id: string): Promise<IdeaDeleteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete an idea.");
  }

  // 1. Fetch idea to verify existence and ownership
  const { data: idea, error: fetchErr } = await supabase
    .from("ideas")
    .select("id, creator_id, title")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !idea) {
    throw new Error("Idea not found.");
  }

  if (idea.creator_id !== user.id) {
    throw new Error("Unauthorized: You do not have permission to delete this idea.");
  }

  // 2. Execute transactional deletion / dependency validation via RPC
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("delete_or_archive_idea", {
    p_idea_id: id,
    p_user_id: user.id,
    p_action: "delete",
  });

  if (!rpcErr && rpcResult) {
    if (!rpcResult.success) {
      if (rpcResult.code === "IDEA_HAS_DEPENDENCIES") {
        const error: any = new Error(
          rpcResult.message || "This idea is linked to active project(s) and cannot be permanently deleted. You can archive it instead."
        );
        error.code = "IDEA_HAS_DEPENDENCIES";
        error.dependencies = rpcResult.dependencies || { projects: [] };
        throw error;
      }
      throw new Error(rpcResult.message || "Failed to delete idea.");
    }

    // Automatically re-evaluate user badges to revoke/update achievements upon idea deletion
    evaluateUserBadges(user.id).catch((err) =>
      console.warn("Badge re-evaluation on deleteIdea error:", err)
    );

    return {
      success: true,
      action: "deleted",
      message: "Idea permanently deleted successfully.",
    };
  }

  // Fallback: If RPC not present, manual check and transactional cleanup
  const dep = await checkIdeaDependencies(id);
  if (dep.hasDependencies) {
    const error: any = new Error(
      "This idea is linked to active project(s) and cannot be permanently deleted. You can archive it instead."
    );
    error.code = "IDEA_HAS_DEPENDENCIES";
    error.dependencies = { projects: dep.projects };
    throw error;
  }

  // Cascade cleanup dependent records
  await Promise.allSettled([
    supabase.from("idea_comments").delete().eq("idea_id", id),
    supabase.from("idea_likes").delete().eq("idea_id", id),
    supabase.from("idea_bookmarks").delete().eq("idea_id", id),
    supabase.from("idea_requirements").delete().eq("idea_id", id),
    supabase.from("idea_validation_feedback").delete().eq("idea_id", id),
    supabase.from("notifications").delete().eq("idea_id", id),
  ]);

  // Delete the parent idea record
  const { error: deleteErr } = await supabase
    .from("ideas")
    .delete()
    .eq("id", id)
    .eq("creator_id", user.id);

  if (deleteErr) {
    throw new Error(deleteErr.message || "Failed to delete idea.");
  }

  // Automatically re-evaluate user badges to revoke/update achievements upon idea deletion
  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge re-evaluation on deleteIdea error:", err)
  );

  return {
    success: true,
    action: "deleted",
    message: "Idea permanently deleted successfully.",
  };
}

export async function archiveIdea(id: string): Promise<IdeaDeleteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to archive an idea.");
  }

  // 1. Fetch idea to verify existence and ownership
  const { data: idea, error: fetchErr } = await supabase
    .from("ideas")
    .select("id, creator_id, title")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !idea) {
    throw new Error("Idea not found.");
  }

  if (idea.creator_id !== user.id) {
    throw new Error("Unauthorized: You do not have permission to archive this idea.");
  }

  // 2. Execute via RPC
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("delete_or_archive_idea", {
    p_idea_id: id,
    p_user_id: user.id,
    p_action: "archive",
  });

  if (!rpcErr && rpcResult) {
    if (!rpcResult.success) {
      throw new Error(rpcResult.message || "Failed to archive idea.");
    }

    evaluateUserBadges(user.id).catch((err) =>
      console.warn("Badge re-evaluation on archiveIdea error:", err)
    );

    return {
      success: true,
      action: "archived",
      message: "Idea archived successfully. Project continuity preserved.",
    };
  }

  // Fallback: direct update
  const { error: updateErr } = await supabase
    .from("ideas")
    .update({
      status: "archived",
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (updateErr) {
    throw new Error(updateErr.message || "Failed to archive idea.");
  }

  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge re-evaluation on archiveIdea error:", err)
  );

  return {
    success: true,
    action: "archived",
    message: "Idea archived successfully. Project continuity preserved.",
  };
}

/* =========================================================================
   FEATURE 3: 📊 IDEA VALIDATION
   ========================================================================= */

export async function updateIdeaValidation(
  ideaId: string,
  data: {
    status?: "not_validated" | "testing" | "validated";
    target_users?: string;
    why_it_matters?: string;
    alternatives?: string;
    expected_benefits?: string;
    questions?: string[];
  }
): Promise<Idea> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be signed in.");

  const { data: idea } = await supabase
    .from("ideas")
    .select("creator_id")
    .eq("id", ideaId)
    .single();

  if (!idea || idea.creator_id !== user.id) {
    throw new Error("Unauthorized: Only the idea creator can update validation parameters.");
  }

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.status !== undefined) payload.validation_status = data.status;
  if (data.target_users !== undefined) payload.validation_target_users = data.target_users.trim() || null;
  if (data.why_it_matters !== undefined) payload.validation_why_it_matters = data.why_it_matters.trim() || null;
  if (data.alternatives !== undefined) payload.validation_alternatives = data.alternatives.trim() || null;
  if (data.expected_benefits !== undefined) payload.validation_expected_benefits = data.expected_benefits.trim() || null;
  if (data.questions !== undefined) {
    payload.validation_questions = data.questions.map((q) => q.trim()).filter(Boolean);
  }

  const { data: updated, error } = await supabase
    .from("ideas")
    .update(payload)
    .eq("id", ideaId)
    .select("*, creator:profiles!creator_id(*)")
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to update validation data.");
  }

  return mapIdea(updated);
}

export async function submitIdeaValidationFeedback(
  ideaId: string,
  data: {
    vote: "valid" | "needs_work" | "impractical";
    feedback: string;
    answers?: Record<string, string>;
  }
): Promise<IdeaValidationFeedback> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in to submit feedback.");

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, creator_id")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("Idea not found.");

  const { data: inserted, error } = await supabase
    .from("idea_validation_feedback")
    .upsert(
      {
        idea_id: ideaId,
        user_id: user.id,
        vote: data.vote,
        feedback: data.feedback.trim(),
        answers: data.answers || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "idea_id,user_id" }
    )
    .select("*, user:profiles!user_id(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to record validation feedback.");
  }

  // Notify creator if not self
  if (idea.creator_id !== user.id) {
    try {
      const { data: reviewerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      await supabase.from("notifications").insert({
        user_id: idea.creator_id,
        recipient_id: idea.creator_id,
        actor_id: user.id,
        entity_id: ideaId,
        related_id: ideaId,
        idea_id: ideaId,
        type: "validation_feedback",
        title: "📊 Idea Validation Feedback",
        message: `${reviewerProfile?.full_name || "A community member"} shared validation feedback on "${idea.title}".`,
        read: false,
        is_read: false,
        data: { idea_id: ideaId, vote: data.vote },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Failed to dispatch validation feedback notification:", e);
    }
  }

  return {
    id: inserted.id,
    idea_id: inserted.idea_id,
    user_id: inserted.user_id,
    user: inserted.user || undefined,
    vote: inserted.vote,
    feedback: inserted.feedback,
    answers: inserted.answers,
    created_at: inserted.created_at,
    updated_at: inserted.updated_at,
  };
}

export async function getIdeaValidationData(ideaId: string): Promise<IdeaValidationData> {
  try {
    const supabase = await createClient();

    const [ideaRes, feedbackRes] = await Promise.all([
      supabase
        .from("ideas")
        .select(
          "validation_status, validation_target_users, validation_why_it_matters, validation_alternatives, validation_expected_benefits, validation_questions"
        )
        .eq("id", ideaId)
        .single(),
      supabase
        .from("idea_validation_feedback")
        .select("*, user:profiles!user_id(id, full_name, username, avatar_url, headline)")
        .eq("idea_id", ideaId)
        .order("created_at", { ascending: false }),
    ]);

    const idea = ideaRes.data;
    const feedbackList: IdeaValidationFeedback[] = (feedbackRes.data || []).map((f: any) => ({
      id: f.id,
      idea_id: f.idea_id,
      user_id: f.user_id,
      user: f.user || undefined,
      vote: f.vote,
      feedback: f.feedback,
      answers: f.answers,
      created_at: f.created_at,
      updated_at: f.updated_at,
    }));

    const total = feedbackList.length;
    const validCount = feedbackList.filter((f) => f.vote === "valid").length;
    const needsWorkCount = feedbackList.filter((f) => f.vote === "needs_work").length;
    const impracticalCount = feedbackList.filter((f) => f.vote === "impractical").length;

    const positivePercentage = total > 0 ? Math.round((validCount / total) * 100) : 0;

    return {
      status: (idea?.validation_status as any) || "not_validated",
      target_users: idea?.validation_target_users || null,
      why_it_matters: idea?.validation_why_it_matters || null,
      alternatives: idea?.validation_alternatives || null,
      expected_benefits: idea?.validation_expected_benefits || null,
      questions: Array.isArray(idea?.validation_questions) ? idea.validation_questions : [],
      feedback: feedbackList,
      summary: {
        total,
        valid_count: validCount,
        needs_work_count: needsWorkCount,
        impractical_count: impracticalCount,
        positive_percentage: positivePercentage,
      },
    };
  } catch (err) {
    console.error("Error in getIdeaValidationData:", err);
    return {
      status: "not_validated",
      target_users: null,
      why_it_matters: null,
      alternatives: null,
      expected_benefits: null,
      questions: [],
      feedback: [],
      summary: {
        total: 0,
        valid_count: 0,
        needs_work_count: 0,
        impractical_count: 0,
        positive_percentage: 0,
      },
    };
  }
}

export async function convertIdeaToProject(ideaId: string): Promise<Project> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { data: idea, error: ideaErr } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    .single();

  if (ideaErr || !idea) {
    throw new Error("Idea not found.");
  }

  if (idea.creator_id !== user.id) {
    throw new Error("Unauthorized: Only the creator of an idea can convert it into a project.");
  }

  // Create project linking to idea
  const project = await createProject({
    name: idea.title,
    description: idea.description || idea.problem || "Project derived from innovation idea.",
    technologies: Array.isArray(idea.skills_needed) ? idea.skills_needed : [],
    required_skills: Array.isArray(idea.skills_needed) ? idea.skills_needed : [],
    idea_id: idea.id,
    status: "in_development",
  });

  // Update idea stage to In Progress
  await supabase
    .from("ideas")
    .update({ stage: "Planning", updated_at: new Date().toISOString() })
    .eq("id", ideaId);

  return project;
}

/* =========================================================================
   FEATURE: 🔍 DUPLICATE IDEA DETECTION
   ========================================================================= */

export async function checkSimilarIdeas(params: {
  title: string;
  problem?: string;
  solution?: string;
  description?: string;
  category?: string;
  excludeIdeaId?: string;
  threshold?: number;
  limit?: number;
}): Promise<{
  matches: SimilarIdeaMatch[];
  maxSimilarity: number;
  highestLevel: "high" | "medium" | "low";
  highestSimilarityLevel: "high" | "medium" | "low";
  hasMatches: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cleanTitle = (params.title || "").trim();
    if (!cleanTitle || cleanTitle.length < 3) {
      return { matches: [], maxSimilarity: 0, highestLevel: "low", highestSimilarityLevel: "low", hasMatches: false };
    }

    const { data, error } = await supabase.rpc("detect_duplicate_ideas", {
      p_title: cleanTitle,
      p_problem: params.problem?.trim() || null,
      p_solution: params.solution?.trim() || null,
      p_description: params.description?.trim() || null,
      p_category: params.category || null,
      p_exclude_idea_id: params.excludeIdeaId || null,
      p_viewer_id: user?.id || null,
      p_threshold: params.threshold ?? 0.35,
      p_limit: params.limit ?? 5,
    });

    if (error) {
      console.error("Error calling detect_duplicate_ideas RPC:", error);
      return { matches: [], maxSimilarity: 0, highestLevel: "low", highestSimilarityLevel: "low", hasMatches: false };
    }

    const matches: SimilarIdeaMatch[] = Array.isArray(data) ? data : [];
    let maxSimilarity = 0;
    for (const m of matches) {
      if (typeof m.similarity_score === "number" && m.similarity_score > maxSimilarity) {
        maxSimilarity = m.similarity_score;
      }
    }

    const highestLevel =
      maxSimilarity >= 0.65 ? "high" : maxSimilarity >= 0.35 ? "medium" : "low";

    const hasMatches = matches.length > 0;
    return {
      matches,
      maxSimilarity,
      highestLevel,
      highestSimilarityLevel: highestLevel,
      hasMatches,
    };
  } catch (err) {
    console.error("Error in checkSimilarIdeas:", err);
    return { matches: [], maxSimilarity: 0, highestLevel: "low", highestSimilarityLevel: "low", hasMatches: false };
  }
}

/* =========================================================================
   FEATURE: 🚨 IDEA REPORTING & MODERATION SYSTEM
   ========================================================================= */

export async function submitIdeaReport(params: {
  ideaId: string;
  reason: "possible_copying" | "copyright_ip" | "misleading_ownership" | "other";
  description: string;
  originalIdeaId?: string;
  evidenceUrl?: string;
}): Promise<IdeaReportSubmitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, code: "UNAUTHORIZED", error: "You must be logged in to report an idea." };
  }

  // 1. Fetch idea to verify existence and check that user isn't reporting their own idea
  const { data: idea, error: ideaErr } = await supabase
    .from("ideas")
    .select("id, title, creator_id")
    .eq("id", params.ideaId)
    .maybeSingle();

  if (ideaErr || !idea) {
    return { success: false, code: "NOT_FOUND", error: "Idea not found." };
  }

  if (idea.creator_id === user.id) {
    return {
      success: false,
      code: "CANNOT_REPORT_OWN_IDEA",
      error: "You cannot report your own idea.",
    };
  }

  const desc = (params.description || "").trim();
  if (desc.length < 10) {
    return {
      success: false,
      code: "INVALID_INPUT",
      error: "Please provide a detailed explanation of at least 10 characters.",
    };
  }

  // 2. Check for active pending/under_review report from this user for this idea (anti-abuse)
  const { data: existingReport } = await supabase
    .from("idea_reports")
    .select("id, status")
    .eq("idea_id", params.ideaId)
    .eq("reporter_id", user.id)
    .in("status", ["pending", "under_review"])
    .maybeSingle();

  if (existingReport) {
    return {
      success: false,
      code: "ALREADY_REPORTED",
      error: "You have already submitted a report for this idea that is pending review.",
    };
  }

  // 3. Verify original idea if specified
  let validOriginalIdeaId: string | null = null;
  if (params.originalIdeaId && params.originalIdeaId !== params.ideaId) {
    const { data: origIdea } = await supabase
      .from("ideas")
      .select("id")
      .eq("id", params.originalIdeaId)
      .maybeSingle();
    if (origIdea) {
      validOriginalIdeaId = origIdea.id;
    }
  }

  // 4. Insert report
  const { data: inserted, error: insertErr } = await supabase
    .from("idea_reports")
    .insert({
      idea_id: params.ideaId,
      reporter_id: user.id,
      original_idea_id: validOriginalIdeaId,
      reason: params.reason,
      description: desc,
      evidence_url: params.evidenceUrl?.trim() || null,
      status: "pending",
    })
    .select("*, idea:ideas(*), reporter:profiles(*)")
    .single();

  if (insertErr || !inserted) {
    console.error("Error inserting idea_report:", insertErr);
    return { success: false, error: insertErr?.message || "Failed to submit report. Please try again." };
  }

  return { success: true, report: inserted as any };
}

export async function getIdeaReports(filter?: {
  status?: string;
  reason?: string;
  limit?: number;
}): Promise<IdeaReport[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    let qb = supabase
      .from("idea_reports")
      .select(`
        *,
        idea:ideas(*, creator:profiles!creator_id(*)),
        reporter:profiles!reporter_id(*),
        original_idea:ideas!original_idea_id(*, creator:profiles!creator_id(*)),
        reviewer:profiles!reviewed_by(*)
      `)
      .order("created_at", { ascending: false });

    if (filter?.status && filter.status !== "all") {
      qb = qb.eq("status", filter.status);
    }
    if (filter?.reason && filter.reason !== "all") {
      qb = qb.eq("reason", filter.reason);
    }
    if (filter?.limit) {
      qb = qb.limit(filter.limit);
    }

    const { data, error } = await qb;
    if (error) {
      console.error("Error fetching idea_reports:", error);
      return [];
    }

    return (data || []) as any[];
  } catch (err) {
    console.error("Error in getIdeaReports:", err);
    return [];
  }
}

export async function getIdeaReportById(reportId: string): Promise<IdeaReport | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("idea_reports")
      .select(`
        *,
        idea:ideas(*, creator:profiles!creator_id(*)),
        reporter:profiles!reporter_id(*),
        original_idea:ideas!original_idea_id(*, creator:profiles!creator_id(*)),
        reviewer:profiles!reviewed_by(*)
      `)
      .eq("id", reportId)
      .maybeSingle();

    if (error || !data) return null;
    return data as any;
  } catch (err) {
    console.error("Error in getIdeaReportById:", err);
    return null;
  }
}

export async function moderateIdeaReport(params: {
  reportId: string;
  status: "under_review" | "resolved" | "dismissed";
  resolution?: "no_action" | "violation_confirmed" | "content_restricted" | "dismissed" | "other";
  resolutionNote?: string;
}): Promise<IdeaReportModerateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  // Verify admin authorization
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    return { success: false, error: "Unauthorized: only administrators can moderate reports." };
  }

  // 1. Fetch report details
  const { data: report, error: fetchErr } = await supabase
    .from("idea_reports")
    .select("*, idea:ideas(id, title, creator_id)")
    .eq("id", params.reportId)
    .maybeSingle();

  if (fetchErr || !report) {
    return { success: false, error: "Report not found." };
  }

  const updatePayload: any = {
    status: params.status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (params.resolution) {
    updatePayload.resolution = params.resolution;
  }
  if (params.resolutionNote !== undefined) {
    updatePayload.resolution_note = params.resolutionNote?.trim() || null;
  }

  // 2. Update report
  const { data: updatedReport, error: updateErr } = await supabase
    .from("idea_reports")
    .update(updatePayload)
    .eq("id", params.reportId)
    .select(`
      *,
      idea:ideas(*, creator:profiles!creator_id(*)),
      reporter:profiles!reporter_id(*),
      original_idea:ideas!original_idea_id(*, creator:profiles!creator_id(*)),
      reviewer:profiles!reviewed_by(*)
    `)
    .single();

  if (updateErr || !updatedReport) {
    return { success: false, error: updateErr?.message || "Failed to update report." };
  }

  // 3. Apply Content Restriction if violation confirmed
  if (params.resolution === "content_restricted" || params.resolution === "violation_confirmed") {
    await supabase
      .from("ideas")
      .update({
        moderation_status: "restricted",
        visibility: "private",
        moderation_note: params.resolutionNote || "Restricted by platform administration following moderation review.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.idea_id);
  }

  // 4. Send notifications
  try {
    const ideaTitle = report.idea?.title || "your concept";

    // A. Notify Reporter of status update
    let reporterMsg = `Your report for idea "${ideaTitle}" has been updated to: ${params.status.replace("_", " ")}.`;
    if (params.status === "dismissed") {
      reporterMsg = `Your report for idea "${ideaTitle}" was reviewed and dismissed. ${params.resolutionNote ? `Note: ${params.resolutionNote}` : ""}`;
    } else if (params.status === "resolved") {
      reporterMsg = `Your report for idea "${ideaTitle}" was reviewed and resolved. Action: ${params.resolution || "completed"}.`;
    }

    await supabase.from("notifications").insert({
      recipient_id: report.reporter_id,
      user_id: report.reporter_id,
      actor_id: user.id,
      type: "idea_report_update",
      title: "🛡️ Report Status Update",
      message: reporterMsg,
      idea_id: report.idea_id,
      related_id: report.id,
      read: false,
      is_read: false,
      data: {
        report_id: report.id,
        status: params.status,
        resolution: params.resolution,
      },
    });

    // B. Confidential Notification to Reported Idea Creator if action taken or under review
    if (report.idea?.creator_id && report.idea.creator_id !== user.id) {
      if (params.status === "under_review") {
        await supabase.from("notifications").insert({
          recipient_id: report.idea.creator_id,
          user_id: report.idea.creator_id,
          actor_id: user.id,
          type: "idea_moderation_review",
          title: "Notice: Concept Under Review",
          message: `Your idea "${ideaTitle}" has been flagged for moderation review by platform administrators. No action is required at this time.`,
          idea_id: report.idea_id,
          related_id: report.id,
          read: false,
          is_read: false,
        });
      } else if (params.resolution === "content_restricted" || params.resolution === "violation_confirmed") {
        await supabase.from("notifications").insert({
          recipient_id: report.idea.creator_id,
          user_id: report.idea.creator_id,
          actor_id: user.id,
          type: "idea_moderation_action",
          title: "⚠️ Moderation Decision Notice",
          message: `Following administrative review, content access for idea "${ideaTitle}" has been restricted. ${params.resolutionNote ? `Reason: ${params.resolutionNote}` : ""}`,
          idea_id: report.idea_id,
          related_id: report.id,
          read: false,
          is_read: false,
        });
      }
    }
  } catch (notifErr) {
    console.error("Error creating report notifications:", notifErr);
  }

  return { success: true, report: updatedReport as any };
}

export async function getUserSubmittedReports(): Promise<IdeaReport[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("idea_reports")
      .select("*, idea:ideas(id, title, category, display_id)")
      .eq("reporter_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data || []) as any[];
  } catch (err) {
    console.error("Error in getUserSubmittedReports:", err);
    return [];
  }
}

