"use server";

import {
  createProject,
  updateProject,
  deleteProject,
  joinProject,
  leaveProject,
} from "@/services/projects";
import { revalidatePath } from "next/cache";

export async function createProjectAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const repository_url = formData.get("repository_url") as string;
    const website_url = formData.get("website_url") as string;
    const image_url = formData.get("image_url") as string;
    const status = (formData.get("status") as any) || "in_development";
    const rawTech = formData.get("technologies") as string;

    if (!name || !description) {
      return { error: "Project name and description are required." };
    }

    const technologies = rawTech
      ? rawTech.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const project = await createProject({
      name,
      description,
      repository_url,
      website_url,
      image_url,
      status,
      technologies,
    });

    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (err: any) {
    console.error("Error in createProjectAction:", err);
    return { error: err?.message || "Failed to create project. Please try again." };
  }
}

export async function updateProjectAction(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const repository_url = formData.get("repository_url") as string;
    const website_url = formData.get("website_url") as string;
    const image_url = formData.get("image_url") as string;
    const status = (formData.get("status") as any) || "in_development";
    const rawTech = formData.get("technologies") as string;

    if (!id) {
      return { error: "Project ID is required." };
    }

    if (!name || !description) {
      return { error: "Project name and description are required." };
    }

    const technologies = rawTech
      ? rawTech.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const project = await updateProject(id, {
      name,
      description,
      repository_url,
      website_url,
      image_url,
      status,
      technologies,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true, project };
  } catch (err: any) {
    console.error("Error in updateProjectAction:", err);
    return { error: err?.message || "Failed to update project. Please try again." };
  }
}

export async function joinProjectAction(projectId: string, role: string = "Collaborator") {
  try {
    if (!projectId) return { error: "Project ID is required." };
    const res = await joinProject(projectId, role);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true, message: res.message };
  } catch (err: any) {
    console.error("Error in joinProjectAction:", err);
    return { error: err?.message || "Failed to join project." };
  }
}

export async function leaveProjectAction(projectId: string) {
  try {
    if (!projectId) return { error: "Project ID is required." };
    await leaveProject(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true };
  } catch (err: any) {
    console.error("Error in leaveProjectAction:", err);
    return { error: err?.message || "Failed to leave project." };
  }
}

export async function deleteProjectAction(projectId: string) {
  try {
    if (!projectId) return { error: "Project ID is required." };
    await deleteProject(projectId);
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteProjectAction:", err);
    return { error: err?.message || "Failed to delete project. Please try again." };
  }
}

/* =========================================================================
   PROJECT RESCUE ACTIONS
   ========================================================================= */

export async function markProjectNeedsHelpAction(
  projectId: string,
  category: string,
  description: string
) {
  try {
    const { markProjectNeedsHelp } = await import("@/services/projects");
    const project = await markProjectNeedsHelp(projectId, { category, description });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (err: any) {
    console.error("Error in markProjectNeedsHelpAction:", err);
    return { error: err?.message || "Failed to mark project as needing help." };
  }
}

export async function resolveProjectHelpAction(projectId: string) {
  try {
    const { resolveProjectHelp } = await import("@/services/projects");
    const project = await resolveProjectHelp(projectId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (err: any) {
    console.error("Error in resolveProjectHelpAction:", err);
    return { error: err?.message || "Failed to resolve help status." };
  }
}

export async function getRescueRecommendationsAction(projectId: string) {
  try {
    const { getRecommendedRescueTeammates } = await import("@/services/projects");
    const candidates = await getRecommendedRescueTeammates(projectId);
    return { success: true, candidates };
  } catch (err: any) {
    console.error("Error in getRescueRecommendationsAction:", err);
    return { error: err?.message || "Failed to fetch rescue recommendations.", candidates: [] };
  }
}

export async function inviteRescueTeammateAction(
  projectId: string,
  receiverId: string,
  message?: string
) {
  try {
    const { inviteRescueTeammate } = await import("@/services/projects");
    const result = await inviteRescueTeammate(projectId, receiverId, message);
    revalidatePath(`/projects/${projectId}`);
    return result;
  } catch (err: any) {
    console.error("Error in inviteRescueTeammateAction:", err);
    return { error: err?.message || "Failed to send rescue invitation." };
  }
}

/* =========================================================================
   SKILL GAP FINDER ACTIONS
   ========================================================================= */

export async function setProjectRequiredSkillsAction(
  projectId: string,
  requiredSkills: string[]
) {
  try {
    const { setProjectRequiredSkills } = await import("@/services/projects");
    const project = await setProjectRequiredSkills(projectId, requiredSkills);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
    return { success: true, project };
  } catch (err: any) {
    console.error("Error in setProjectRequiredSkillsAction:", err);
    return { error: err?.message || "Failed to update required skills." };
  }
}

export async function getProjectSkillGapsAction(projectId: string) {
  try {
    const { getProjectSkillGaps } = await import("@/services/projects");
    const analysis = await getProjectSkillGaps(projectId);
    return { success: true, analysis };
  } catch (err: any) {
    console.error("Error in getProjectSkillGapsAction:", err);
    return { error: err?.message || "Failed to analyze skill gaps." };
  }
}

/* =========================================================================
   PROJECT WORKSPACE ACTIONS (TASKS, MILESTONES, FILES, DISCUSSIONS)
   ========================================================================= */

export async function createProjectTaskAction(
  projectId: string,
  data: {
    title: string;
    description?: string;
    status?: any;
    priority?: any;
    assigned_to?: string;
    due_date?: string;
  }
) {
  try {
    const { createProjectTask } = await import("@/services/projects");
    const task = await createProjectTask(projectId, data);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true, task };
  } catch (err: any) {
    console.error("Error in createProjectTaskAction:", err);
    return { error: err?.message || "Failed to create task." };
  }
}

export async function updateProjectTaskAction(
  taskId: string,
  updates: any,
  projectId?: string
) {
  try {
    const { updateProjectTask } = await import("@/services/projects");
    const task = await updateProjectTask(taskId, updates);
    if (projectId || task.project_id) {
      revalidatePath(`/projects/${projectId || task.project_id}`);
    }
    revalidatePath("/dashboard");
    return { success: true, task };
  } catch (err: any) {
    console.error("Error in updateProjectTaskAction:", err);
    return { error: err?.message || "Failed to update task." };
  }
}

export async function deleteProjectTaskAction(taskId: string, projectId: string) {
  try {
    const { deleteProjectTask } = await import("@/services/projects");
    await deleteProjectTask(taskId);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteProjectTaskAction:", err);
    return { error: err?.message || "Failed to delete task." };
  }
}

export async function createProjectMilestoneAction(
  projectId: string,
  data: {
    title: string;
    description?: string;
    due_date?: string;
  }
) {
  try {
    const { createProjectMilestone } = await import("@/services/projects");
    const milestone = await createProjectMilestone(projectId, data);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, milestone };
  } catch (err: any) {
    console.error("Error in createProjectMilestoneAction:", err);
    return { error: err?.message || "Failed to create milestone." };
  }
}

export async function addProjectFileAction(
  projectId: string,
  data: { name: string; url: string; file_type?: string }
) {
  try {
    const { addProjectFile } = await import("@/services/projects");
    const file = await addProjectFile(projectId, data);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, file };
  } catch (err: any) {
    console.error("Error in addProjectFileAction:", err);
    return { error: err?.message || "Failed to add resource." };
  }
}

export async function deleteProjectFileAction(fileId: string, projectId: string) {
  try {
    const { deleteProjectFile } = await import("@/services/projects");
    await deleteProjectFile(fileId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteProjectFileAction:", err);
    return { error: err?.message || "Failed to delete resource." };
  }
}

export async function addProjectDiscussionAction(
  projectId: string,
  content: string
) {
  try {
    const { addProjectDiscussion } = await import("@/services/projects");
    const discussion = await addProjectDiscussion(projectId, content);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, discussion };
  } catch (err: any) {
    console.error("Error in addProjectDiscussionAction:", err);
    return { error: err?.message || "Failed to post message." };
  }
}

