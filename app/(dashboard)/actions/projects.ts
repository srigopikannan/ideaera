"use server";

import { createProject, deleteProject } from "@/services/projects";
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
