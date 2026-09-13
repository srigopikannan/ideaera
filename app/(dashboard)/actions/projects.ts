"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import * as projectService from "@/services/projects";
import { db } from "@/db";
import { project_members } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createProjectAction(formData: {
  name: string;
  description: string;
  ideaId?: string;
}) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await projectService.createProject(user.id, formData);
    revalidatePath("/projects");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function getMyProjectsAction() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await projectService.getProjectsForUser(user.id);
}

export async function getProjectDetailAction(projectId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check membership
  const membership = await db.query.project_members.findFirst({
    where: and(eq(project_members.project_id, projectId), eq(project_members.user_id, user.id))
  });

  if (!membership) {
    return { success: false, error: "You are not a member of this project" };
  }

  const project = await projectService.getProjectById(projectId);
  return { success: true, project, role: membership.role };
}

export async function addMemberAction(projectId: string, userId: string, role: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Only Owner can add members
  const membership = await db.query.project_members.findFirst({
    where: and(eq(project_members.project_id, projectId), eq(project_members.user_id, user.id))
  });

  if (membership?.role !== "Owner") {
    return { success: false, error: "Only project owners can add members" };
  }

  try {
    await projectService.addProjectMember(
  projectId,
  userId,
  role as "Owner" | "Contributor" | "Viewer"
);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function createTaskAction(projectId: string, formData: {
  title: string;
  description: string;
  assignedTo?: string;
  status?: "Todo" | "In Progress" | "Review" | "Completed";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  dueDate?: string;
  milestoneId?: string;
}) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await projectService.createTask(projectId, formData);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function updateTaskStatusAction(taskId: string, status: string, projectId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await projectService.updateTask(taskId, {
  status: status as "Todo" | "In Progress" | "Review" | "Completed",
});
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}
