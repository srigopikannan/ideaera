"use server";

import { createIdea, updateIdea, toggleLikeIdea, addIdeaComment, getIdeas, getIdeaById, deleteIdea } from "@/services/ideas";
import { revalidatePath } from "next/cache";

export async function createIdeaAction(formData: FormData) {
  try {
    const title = (formData.get("title") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "";
    const rawTags = (formData.get("tags") as string)?.trim() || "";
    const rawProblem = formData.get("problem") as string | null;
    const rawSolution = formData.get("solution") as string | null;
    const rawDesc = formData.get("description") as string | null;

    const problem = rawProblem ? rawProblem.trim() : "";
    const solution = rawSolution ? rawSolution.trim() : "";
    const description =
      rawDesc?.trim() ||
      (problem && solution ? `${problem}\n\n${solution}` : problem || solution || title);

    if (!title || (!description && !problem && !solution) || !category) {
      return { error: "Please fill in all required fields (Title, Category, and Concept Details)." };
    }

    const tags = rawTags
      ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const visibility = ((formData.get("visibility") as string)?.trim() || "public") as any;
    const rawSkills = (formData.get("skills_needed") as string)?.trim() || "";
    const skills_needed = rawSkills
      ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const created = await createIdea({
      title,
      description,
      category,
      tags,
      problem: problem || undefined,
      solution: solution || undefined,
      visibility,
      skills_needed,
    });

    revalidatePath("/ideas");
    revalidatePath("/dashboard");
    return { success: true, idea: created };
  } catch (err: any) {
    console.error("Error in createIdeaAction:", err);
    return { error: err?.message || "Failed to publish idea. Please try again." };
  }
}

export async function updateIdeaAction(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const title = (formData.get("title") as string)?.trim() || "";
    const category = (formData.get("category") as string)?.trim() || "";
    const rawTags = (formData.get("tags") as string)?.trim() || "";
    const rawProblem = formData.get("problem") as string | null;
    const rawSolution = formData.get("solution") as string | null;
    const rawDesc = formData.get("description") as string | null;

    const problem = rawProblem ? rawProblem.trim() : "";
    const solution = rawSolution ? rawSolution.trim() : "";
    const description =
      rawDesc?.trim() ||
      (problem && solution ? `${problem}\n\n${solution}` : problem || solution || title);

    if (!id) {
      return { error: "Idea ID is required." };
    }

    if (!title || (!description && !problem && !solution) || !category) {
      return { error: "Please fill in all required fields (Title, Category, and Concept Details)." };
    }

    const tags = rawTags
      ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const updated = await updateIdea(id, {
      title,
      description,
      category,
      tags,
      problem: problem || undefined,
      solution: solution || undefined,
    });

    revalidatePath("/ideas");
    revalidatePath(`/ideas/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true, idea: updated };
  } catch (err: any) {
    console.error("Error in updateIdeaAction:", err);
    return { error: err?.message || "Failed to update idea. Please try again." };
  }
}

export async function toggleLikeAction(ideaId: string) {
  try {
    const res = await toggleLikeIdea(ideaId);
    revalidatePath("/ideas");
    revalidatePath(`/ideas/${ideaId}`);
    return res;
  } catch {
    return { liked: false, likes_count: 0 };
  }
}

export async function addCommentAction(ideaId: string, content: string) {
  try {
    if (!content || content.trim().length === 0) {
      return { error: "Comment cannot be empty." };
    }

    const comment = await addIdeaComment(ideaId, content.trim());
    revalidatePath(`/ideas/${ideaId}`);
    return { success: true, comment };
  } catch (err: any) {
    return { error: err?.message || "Failed to post comment." };
  }
}

export async function deleteIdeaAction(ideaId: string) {
  try {
    if (!ideaId) return { error: "Idea ID is required." };
    await deleteIdea(ideaId);
    revalidatePath("/ideas");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath(`/ideas/${ideaId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteIdeaAction:", err);
    return { error: err?.message || "Failed to delete idea. Please try again." };
  }
}
