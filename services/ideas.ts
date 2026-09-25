import { createClient } from "@/lib/supabase/server";
import { Idea, IdeaComment, IdeaValidationFeedback, IdeaValidationData, Project } from "@/types";
import { checkAndCreateIdeaMilestoneNotification } from "@/services/social";
import { evaluateUserBadges } from "@/services/badges";
import { createProject } from "@/services/projects";

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
    status: (raw.stage?.toLowerCase() === "implemented" ? "implemented" : raw.stage?.toLowerCase() === "in_progress" ? "in_progress" : "open") as any,
    visibility: raw.visibility || "public",
    likes_count: raw.likes_count || 0,
    comments_count: raw.comments_count || 0,
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
  query?: string
): Promise<Idea[]> {
  try {
    const supabase = await createClient();

    let qb = supabase.from("ideas").select("*, creator:profiles!creator_id(*)");

    if (category && category !== "All") {
      qb = qb.eq("category", category);
    }
    if (query) {
      qb = qb.or(`title.ilike.%${query}%,description.ilike.%${query}%,problem.ilike.%${query}%,solution.ilike.%${query}%`);
    }

    qb = qb.order("created_at", { ascending: false }).limit(50);

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
    const { data, error } = await supabase
      .from("ideas")
      .select("*, creator:profiles!creator_id(id, full_name, username, avatar_url)")
      .eq("creator_id", userId)
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
      let isLiked = false;
      if (user) {
        try {
          const { data: likeRow } = await supabase
            .from("idea_likes")
            .select("idea_id")
            .eq("idea_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          isLiked = Boolean(likeRow);
        } catch {
          // table may not exist
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

  try {
    const { data: resData, error: updateErr } = await supabase
      .from("ideas")
      .update({
        title: data.title.trim(),
        description,
        problem,
        solution,
        category: data.category,
        version: nextVer,
        version_history: nextHistory,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("creator_id", user.id)
      .select("*, creator:profiles!creator_id(*)")
      .single();

    if (!updateErr && resData) {
      updated = resData;
    } else {
      // Fallback if version/version_history columns not yet applied
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

    const { data: existing } = await supabase
      .from("idea_likes")
      .select("*")
      .eq("idea_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("idea_likes").delete().eq("idea_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("idea_likes").insert({ idea_id: id, user_id: user.id });

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
  } catch {
    // If idea_likes table does not exist, return neutral state
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

export async function deleteIdea(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete an idea.");
  }

  // 1. Fetch idea to verify existence and ownership
  const { data: idea, error: fetchErr } = await supabase
    .from("ideas")
    .select("id, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !idea) {
    throw new Error("Idea not found.");
  }

  if (idea.creator_id !== user.id) {
    throw new Error("Unauthorized: You do not have permission to delete this idea.");
  }

  // 2. Cascade cleanup dependent records
  await Promise.allSettled([
    supabase.from("idea_comments").delete().eq("idea_id", id),
    supabase.from("idea_likes").delete().eq("idea_id", id),
    supabase.from("idea_tags").delete().eq("idea_id", id),
    supabase.from("idea_votes").delete().eq("idea_id", id),
    supabase.from("idea_validation_feedback").delete().eq("idea_id", id),
  ]);

  // 3. Delete the parent idea record
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

