import { createClient } from "@/lib/supabase/server";
import { Project } from "@/types";
import { slugify } from "@/lib/utils";

function mapProject(p: any): Project {
  let description = p.description || "";
  let technologies: string[] = [];
  let imageUrl: string | null = null;

  // Extract [Tech: ...]
  const techMatch = description.match(/\[Tech:\s*([^\]]+)\]/i);
  if (techMatch) {
    technologies = techMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean);
  }

  // Extract [Image: ...]
  const imgMatch = description.match(/\[Image:\s*([^\]]+)\]/i);
  if (imgMatch) {
    imageUrl = imgMatch[1].trim();
  }

  // Clean description
  const cleanDescription = description
    .replace(/\[Tech:\s*[^\]]+\]/gi, "")
    .replace(/\[Image:\s*[^\]]+\]/gi, "")
    .trim();

  return {
    id: p.id,
    slug: p.id,
    name: p.name,
    description: cleanDescription || p.description,
    owner_id: p.owner_id,
    owner: p.owner || undefined,
    repository_url: p.repository_url || null,
    website_url: p.deployment_url || p.website_url || null,
    image_url: imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    status: (p.status || "in_development") as any,
    technologies,
    members: [],
    created_at: p.created_at,
    updated_at: p.updated_at || p.created_at,
  };
}

export async function getProjects(status?: string, query?: string): Promise<Project[]> {
  try {
    const supabase = await createClient();
    let qb = supabase.from("projects").select("*, owner:profiles!owner_id(*)");

    if (status && status !== "All") {
      qb = qb.eq("status", status.toLowerCase());
    }
    if (query) {
      qb = qb.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data, error } = await qb.order("created_at", { ascending: false });
    if (data && !error) {
      return data.map(mapProject);
    }
  } catch (err) {
    console.error("Error in getProjects:", err);
  }

  return [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const supabase = await createClient();

    // Check if slug is UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let qb = supabase.from("projects").select("*, owner:profiles!owner_id(*)");

    if (isUuid) {
      qb = qb.eq("id", slug);
    } else {
      qb = qb.ilike("name", `%${slug}%`);
    }

    const { data, error } = await qb.maybeSingle();
    if (data && !error) {
      return mapProject(data);
    }
  } catch (err) {
    console.error("Error in getProjectBySlug:", err);
  }

  return null;
}

export async function createProject(data: {
  name: string;
  description: string;
  repository_url?: string;
  website_url?: string;
  technologies: string[];
  image_url?: string;
  status?: "idea" | "in_development" | "beta" | "launched";
}): Promise<Project> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a project.");
  }

  let packedDescription = data.description;
  if (data.technologies && data.technologies.length > 0) {
    packedDescription = `[Tech: ${data.technologies.join(", ")}] ${packedDescription}`;
  }
  if (data.image_url && data.image_url.trim()) {
    packedDescription = `[Image: ${data.image_url.trim()}] ${packedDescription}`;
  }

  const { data: inserted, error } = await supabase
    .from("projects")
    .insert({
      name: data.name.trim(),
      description: packedDescription,
      repository_url: data.repository_url?.trim() || null,
      deployment_url: data.website_url?.trim() || null,
      owner_id: user.id,
      status: data.status || "in_development",
    })
    .select("*, owner:profiles!owner_id(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to create project.");
  }

  return mapProject(inserted);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete a project.");
  }

  // 1. Fetch project to verify existence and ownership
  const { data: project, error: fetchErr } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !project) {
    throw new Error("Project not found.");
  }

  if (project.owner_id !== user.id) {
    throw new Error("Unauthorized: You do not have permission to delete this project.");
  }

  // 2. Cascade cleanup dependent records
  await Promise.allSettled([
    supabase.from("project_members").delete().eq("project_id", id),
    supabase.from("project_applications").delete().eq("project_id", id),
    supabase.from("project_skills").delete().eq("project_id", id),
    supabase.from("project_roles").delete().eq("project_id", id),
    supabase.from("project_updates").delete().eq("project_id", id),
    supabase.from("project_comments").delete().eq("project_id", id),
  ]);

  // 3. Delete the parent project record
  const { error: deleteErr } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (deleteErr) {
    throw new Error(deleteErr.message || "Failed to delete project.");
  }
}
