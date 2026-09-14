"use server";

import { createIdea, toggleLikeIdea, addIdeaComment, getIdeas, getIdeaById, deleteIdea } from "@/services/ideas";
import { revalidatePath } from "next/cache";

export async function createIdeaAction(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const rawTags = formData.get("tags") as string;
    const problem = (formData.get("problem") as string) || description;
    const solution = (formData.get("solution") as string) || description;

    if (!title || !description || !category) {
      return { error: "Please fill in all required fields (Title, Category, and Description)." };
    }

    const tags = rawTags
      ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const created = await createIdea({
      title,
      description,
      category,
      tags,
      problem,
      solution,
    });

    revalidatePath("/ideas");
    revalidatePath("/dashboard");
    return { success: true, idea: created };
  } catch (err: any) {
    console.error("Error in createIdeaAction:", err);
    return { error: err?.message || "Failed to publish idea. Please try again." };
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
