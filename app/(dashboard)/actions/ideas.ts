"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import * as ideaService from "@/services/ideas";
import { db } from "@/db";

export async function getAvailableSkillsAction() {
  const allSkills = await db.query.skills.findMany();
  return allSkills;
}

export async function createIdeaAction(formData: {
  title: string;
  problem: string;
  solution: string;
  description: string;
  category: string;
  stage: "Idea" | "Planning" | "Prototype" | "MVP" | "Testing" | "Launch";
  visibility: string;
  requirements: Array<{ skillId: string; minLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert"; priority: string }>;
}) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await ideaService.createIdea(user.id, formData);
    revalidatePath("/ideas");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function getIdeasAction(filters: { category?: string; stage?: string; search?: string } = {}) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await ideaService.getIdeas(user.id, filters);
}

export async function getIdeaDetailAction(ideaId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const idea = await ideaService.getIdeaById(ideaId);
  if (!idea) return { success: false, error: "Idea not found" };

  const isBookmarked = await db.query.idea_bookmarks.findFirst({
    where: (idea_bookmarks, { and, eq }) =>
      and(eq(idea_bookmarks.user_id, user.id), eq(idea_bookmarks.idea_id, ideaId))
  });

  return {
    success: true,
    idea,
    isBookmarked: !!isBookmarked
  };
}

export async function toggleBookmarkAction(ideaId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await ideaService.toggleIdeaBookmark(user.id, ideaId);
    revalidatePath(`/ideas/${ideaId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function getMyIdeasAction() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await ideaService.getMyIdeas(user.id);
}
