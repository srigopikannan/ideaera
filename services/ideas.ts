import { createClient } from "@/lib/supabase/server";
import { Idea, IdeaComment } from "@/types";

function mapIdea(raw: any, isLiked: boolean = false): Idea {
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

  return {
    id: raw.id,
    author_id: raw.creator_id || raw.author_id,
    author: authorProfile,
    title: raw.title,
    description,
    problem,
    solution,
    category: raw.category || "AI & Machine Learning",
    tags: parsedTags,
    status: (raw.stage?.toLowerCase() === "implemented" ? "implemented" : raw.stage?.toLowerCase() === "in_progress" ? "in_progress" : "open") as any,
    likes_count: raw.likes_count || 0,
    comments_count: raw.comments_count || 0,
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

    qb = qb.order("created_at", { ascending: false });

    const { data, error } = await qb;
    if (data && !error) {
      return data.map((idea) => mapIdea(idea, false));
    }
  } catch (err) {
    console.error("Error in getIdeas:", err);
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
      category: data.category,
      stage: "Idea",
      visibility: "public",
      creator_id: user.id,
    })
    .select("*, creator:profiles!creator_id(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to create idea.");
  }

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
    .select("id, creator_id")
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

  const { data: updated, error } = await supabase
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

  if (error || !updated) {
    throw new Error(error?.message || "Failed to update idea.");
  }

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
}
