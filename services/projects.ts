import { createClient } from "@/lib/supabase/server";
import {
  Project,
  ProjectTask,
  ProjectMilestone,
  ProjectFile,
  ProjectDiscussion,
  ProjectActivity,
  SkillGapAnalysis,
  Profile,
  TaskStatus,
  TaskPriority,
} from "@/types";
import { slugify } from "@/lib/utils";
import { evaluateUserBadges } from "@/services/badges";

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

  const reqSkills =
    Array.isArray(p.required_skills) && p.required_skills.length > 0
      ? p.required_skills
      : technologies;

  return {
    id: p.id,
    slug: p.id,
    name: p.name,
    description: cleanDescription || p.description,
    owner_id: p.owner_id,
    owner: p.owner || undefined,
    repository_url: p.repository_url || null,
    website_url: p.deployment_url || p.website_url || null,
    image_url:
      imageUrl ||
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
    status: (p.status || "in_development") as any,
    technologies: reqSkills,
    required_skills: reqSkills,
    needs_help: Boolean(p.needs_help),
    help_category: p.help_category || null,
    help_description: p.help_description || null,
    help_requested_at: p.help_requested_at || null,
    idea_id: p.idea_id || null,
    related_idea_id: p.idea_id || null,
    tasks_count: typeof p.tasks_count === "number" ? p.tasks_count : 0,
    completed_tasks_count:
      typeof p.completed_tasks_count === "number" ? p.completed_tasks_count : 0,
    progress: typeof p.progress === "number" ? p.progress : 0,
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
      if (status.toLowerCase() === "needs_help") {
        qb = qb.eq("needs_help", true);
      } else {
        qb = qb.eq("status", status.toLowerCase());
      }
    }
    if (query) {
      qb = qb.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data, error } = await qb.order("created_at", { ascending: false }).limit(50);
    if (data && !error) {
      return data.map(mapProject);
    }
  } catch (err) {
    console.error("Error in getProjects:", err);
  }

  return [];
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, owner:profiles!owner_id(id, full_name, username, avatar_url)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data && !error) {
      return data.map(mapProject);
    }
  } catch (err) {
    console.error("Error in getProjectsByUserId:", err);
  }

  return [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    let qb = supabase.from("projects").select("*, owner:profiles!owner_id(*)");

    if (isUuid) {
      qb = qb.eq("id", slug);
    } else {
      qb = qb.ilike("name", `%${slug}%`);
    }

    const { data, error } = await qb.maybeSingle();
    if (data && !error) {
      const mapped = mapProject(data);
      try {
        const { data: membersData } = await supabase
          .from("project_members")
          .select("*, user:profiles!user_id(*)")
          .eq("project_id", data.id)
          .order("joined_at", { ascending: true });

        if (membersData) {
          mapped.members = membersData.map((m: any) => ({
            project_id: m.project_id,
            user_id: m.user_id,
            role: m.role || "Contributor",
            joined_at: m.joined_at,
            user: m.user || undefined,
          }));
        }
      } catch (membersErr) {
        console.error("Error fetching project members:", membersErr);
      }
      return mapped;
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
  required_skills?: string[];
  image_url?: string;
  status?: "idea" | "in_development" | "beta" | "launched";
  idea_id?: string;
  needs_help?: boolean;
  help_category?: string;
  help_description?: string;
}): Promise<Project> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a project.");
  }

  const reqSkills = data.required_skills || data.technologies || [];
  let packedDescription = data.description;
  if (reqSkills.length > 0) {
    packedDescription = `[Tech: ${reqSkills.join(", ")}] ${packedDescription}`;
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
      idea_id: data.idea_id || null,
      required_skills: reqSkills,
      needs_help: Boolean(data.needs_help),
      help_category: data.help_category || null,
      help_description: data.help_description || null,
      help_requested_at: data.needs_help ? new Date().toISOString() : null,
    })
    .select("*, owner:profiles!owner_id(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to create project.");
  }

  // 1. Add owner as member in project_members
  await supabase.from("project_members").upsert(
    {
      project_id: inserted.id,
      user_id: user.id,
      role: "Owner",
      joined_at: new Date().toISOString(),
    },
    { onConflict: "project_id,user_id" }
  );

  // 2. Seed standard workspace milestones
  await seedStandardMilestones(inserted.id);

  // 3. Log initial activity
  await logProjectActivity(inserted.id, user.id, "created_project", {
    name: inserted.name,
  });

  // 4. Trigger badge evaluation asynchronously
  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge evaluation on createProject error:", err)
  );

  return mapProject(inserted);
}

export async function updateProject(
  id: string,
  data: {
    name: string;
    description: string;
    repository_url?: string;
    website_url?: string;
    technologies: string[];
    required_skills?: string[];
    image_url?: string;
    status?: "idea" | "in_development" | "beta" | "launched";
    needs_help?: boolean;
    help_category?: string;
    help_description?: string;
  }
): Promise<Project> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update a project.");
  }

  // Verify ownership or membership
  const { data: existing, error: fetchErr } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !existing) {
    throw new Error("Project not found.");
  }

  if (existing.owner_id !== user.id) {
    throw new Error("Unauthorized: Only the project architect can modify this project.");
  }

  const reqSkills = data.required_skills || data.technologies || [];
  let packedDescription = data.description;
  if (reqSkills.length > 0) {
    packedDescription = `[Tech: ${reqSkills.join(", ")}] ${packedDescription}`;
  }
  if (data.image_url && data.image_url.trim()) {
    packedDescription = `[Image: ${data.image_url.trim()}] ${packedDescription}`;
  }

  const updatePayload: any = {
    name: data.name.trim(),
    description: packedDescription,
    repository_url: data.repository_url?.trim() || null,
    deployment_url: data.website_url?.trim() || null,
    status: data.status || "in_development",
    required_skills: reqSkills,
    updated_at: new Date().toISOString(),
  };

  if (data.needs_help !== undefined) {
    updatePayload.needs_help = data.needs_help;
    updatePayload.help_category = data.help_category || null;
    updatePayload.help_description = data.help_description || null;
    if (data.needs_help) {
      updatePayload.help_requested_at = new Date().toISOString();
    }
  }

  const { data: updated, error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*, owner:profiles!owner_id(*)")
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to update project.");
  }

  await logProjectActivity(id, user.id, "updated_project", { name: updated.name });

  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge re-evaluation on updateProject error:", err)
  );

  return mapProject(updated);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete a project.");
  }

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

  // Collect team member ids before deleting records
  const { data: memberRows } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", id);
  const memberUserIds = memberRows ? memberRows.map((m) => m.user_id) : [];

  await Promise.allSettled([
    supabase.from("project_members").delete().eq("project_id", id),
    supabase.from("tasks").delete().eq("project_id", id),
    supabase.from("milestones").delete().eq("project_id", id),
    supabase.from("project_files").delete().eq("project_id", id),
    supabase.from("project_discussions").delete().eq("project_id", id),
    supabase.from("project_activity").delete().eq("project_id", id),
    supabase.from("project_rescue_invitations").delete().eq("project_id", id),
  ]);

  const { error: deleteErr } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (deleteErr) {
    throw new Error(deleteErr.message || "Failed to delete project.");
  }

  // Automatically re-evaluate user badges for owner and impacted members
  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge re-evaluation on deleteProject owner error:", err)
  );
  for (const mid of memberUserIds) {
    if (mid && mid !== user.id) {
      evaluateUserBadges(mid).catch((err) =>
        console.warn("Badge re-evaluation on deleteProject member error:", err)
      );
    }
  }
}

export async function joinProject(
  projectId: string,
  role: string = "Collaborator"
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to join a project.");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, owner_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    throw new Error("Project not found.");
  }

  if (project.owner_id === user.id) {
    return { success: true, message: "You are the project owner." };
  }

  const { data: existing } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { success: true, message: "You are already a team member." };
  }

  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: user.id,
    role: role || "Collaborator",
    joined_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || "Failed to join project.");
  }

  await logProjectActivity(projectId, user.id, "joined_project", { role });

  // Notify owner
  await supabase.from("notifications").insert({
    recipient_id: project.owner_id,
    actor_id: user.id,
    type: "project_rescue_invite",
    title: "New Team Member",
    content: `Joined ${project.name} as ${role}.`,
    link: `/projects/${projectId}`,
    created_at: new Date().toISOString(),
  });

  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge evaluation error on joinProject:", err)
  );

  return { success: true, message: `Successfully joined ${project.name}!` };
}

export async function leaveProject(projectId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to leave a project.");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .single();

  if (project?.owner_id === user.id) {
    throw new Error("The project owner cannot leave the project.");
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message || "Failed to leave project.");
  }

  await logProjectActivity(projectId, user.id, "left_project");

  evaluateUserBadges(user.id).catch((err) =>
    console.warn("Badge re-evaluation on leaveProject error:", err)
  );
}

/* =========================================================================
   FEATURE 1: 🚨 PROJECT RESCUE
   ========================================================================= */

export async function markProjectNeedsHelp(
  projectId: string,
  params: { category: string; description: string }
): Promise<Project> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to manage project help status.");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_id, name")
    .eq("id", projectId)
    .single();

  if (!project || project.owner_id !== user.id) {
    throw new Error("Unauthorized: Only the project owner can request project rescue.");
  }

  const { data: updated, error } = await supabase
    .from("projects")
    .update({
      needs_help: true,
      help_category: params.category,
      help_description: params.description.trim(),
      help_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select("*, owner:profiles!owner_id(*)")
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to flag project for rescue.");
  }

  await logProjectActivity(projectId, user.id, "requested_rescue", {
    category: params.category,
    description: params.description,
  });

  return mapProject(updated);
}

export async function resolveProjectHelp(projectId: string): Promise<Project> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: updated, error } = await supabase
    .from("projects")
    .update({
      needs_help: false,
      help_category: null,
      help_description: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .select("*, owner:profiles!owner_id(*)")
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to resolve project rescue.");
  }

  await logProjectActivity(projectId, user.id, "resolved_rescue", {});

  return mapProject(updated);
}

export async function getRecommendedRescueTeammates(projectId: string): Promise<
  Array<{
    profile: Profile;
    match_score: number;
    matching_skills: string[];
    is_available: boolean;
    already_invited: boolean;
  }>
> {
  try {
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("*, owner:profiles!owner_id(*)")
      .eq("id", projectId)
      .single();

    if (!project) return [];

    // Fetch existing members and pending invites
    const [membersRes, invitesRes, profilesRes] = await Promise.all([
      supabase.from("project_members").select("user_id").eq("project_id", projectId),
      supabase
        .from("project_rescue_invitations")
        .select("receiver_id, status")
        .eq("project_id", projectId),
      supabase
        .from("profiles")
        .select("*")
        .neq("id", project.owner_id)
        .limit(50),
    ]);

    const memberIds = new Set((membersRes.data || []).map((m: any) => m.user_id));
    const invitedIds = new Set(
      (invitesRes.data || [])
        .filter((i: any) => i.status === "pending")
        .map((i: any) => i.receiver_id)
    );

    const targetCategory = (project.help_category || "").toLowerCase();
    const requiredSkills: string[] = Array.isArray(project.required_skills)
      ? project.required_skills.map((s: string) => s.toLowerCase())
      : [];

    const categoryKeywords: Record<string, string[]> = {
      developer: ["typescript", "javascript", "python", "react", "node", "coding", "software"],
      designer: ["figma", "ui", "ux", "design", "wireframing", "prototyping"],
      "ai/ml": ["python", "machine learning", "ai", "pytorch", "tensorflow", "llm", "data"],
      backend: ["node.js", "python", "postgresql", "sql", "api", "database", "backend"],
      frontend: ["react", "next.js", "tailwind", "css", "html", "javascript", "frontend"],
      "ui/ux": ["figma", "ui/ux", "user research", "wireframing", "visual design"],
      researcher: ["research", "data analysis", "writing", "academic", "papers"],
      "business/marketing": ["marketing", "growth", "business", "pitching", "sales"],
      "mentor/guidance": ["architecture", "leadership", "mentorship", "management"],
    };

    const keywords = categoryKeywords[targetCategory] || [targetCategory];

    const results = (profilesRes.data || [])
      .filter((p: any) => !memberIds.has(p.id))
      .map((p: any) => {
        const userSkills: string[] = Array.isArray(p.skills) ? p.skills : [];
        const userInterests: string[] = Array.isArray(p.interests) ? p.interests : [];
        const lowerSkills = userSkills.map((s) => s.toLowerCase());

        // Match against project required skills and category keywords
        const matched = userSkills.filter((s) => {
          const lower = s.toLowerCase();
          return (
            requiredSkills.includes(lower) ||
            keywords.some((k) => lower.includes(k) || k.includes(lower))
          );
        });

        // Availability score
        const avail = (p.availability || "").toLowerCase();
        const isAvailable =
          avail.includes("available") && !avail.includes("not currently available");

        let score = matched.length * 20;
        if (isAvailable) score += 30;
        if (avail.includes("weekends") || avail.includes("evenings")) score += 15;
        if (p.college && project.owner?.college && p.college === project.owner.college) {
          score += 15;
        }

        return {
          profile: p as Profile,
          match_score: score,
          matching_skills: matched,
          is_available: isAvailable,
          already_invited: invitedIds.has(p.id),
        };
      })
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, 10);

    return results;
  } catch (err) {
    console.error("Error in getRecommendedRescueTeammates:", err);
    return [];
  }
}

export async function inviteRescueTeammate(
  projectId: string,
  targetUserId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Must be signed in to invite teammates." };
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, owner_id, help_category, owner:profiles!owner_id(full_name)")
      .eq("id", projectId)
      .single();

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const category = project.help_category || "Team Member";

    // 1. Upsert rescue invitation
    const { error: inviteErr } = await supabase.from("project_rescue_invitations").upsert(
      {
        project_id: projectId,
        sender_id: user.id,
        receiver_id: targetUserId,
        category,
        message: message?.trim() || null,
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,receiver_id" }
    );

    if (inviteErr) {
      return { success: false, error: inviteErr.message };
    }

    // 2. Dispatches real notification to invited user
    const senderName = (project.owner as any)?.full_name || "Project Leader";
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      recipient_id: targetUserId,
      actor_id: user.id,
      entity_id: projectId,
      related_id: projectId,
      project_id: projectId,
      type: "project_rescue_invite",
      title: "🚨 Project Rescue Request",
      message: `${senderName} invited you to join and help rescue "${project.name}" as ${category}.`,
      read: false,
      is_read: false,
      data: {
        project_id: projectId,
        project_name: project.name,
        category,
        message: message || undefined,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await logProjectActivity(projectId, user.id, "invited_rescue_member", {
      target_user_id: targetUserId,
      category,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Error in inviteRescueTeammate:", err);
    return { success: false, error: err.message };
  }
}

/* =========================================================================
   FEATURE 2: 🧩 SKILL GAP FINDER
   ========================================================================= */

export async function setProjectRequiredSkills(
  projectId: string,
  requiredSkills: string[]
): Promise<Project> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const cleanSkills = Array.from(new Set(requiredSkills.map((s) => s.trim()).filter(Boolean)));

  const { data: updated, error } = await supabase
    .from("projects")
    .update({
      required_skills: cleanSkills,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select("*, owner:profiles!owner_id(*)")
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to update required skills.");
  }

  await logProjectActivity(projectId, user.id, "updated_required_skills", {
    skills: cleanSkills,
  });

  return mapProject(updated);
}

export async function getProjectSkillGaps(projectId: string): Promise<SkillGapAnalysis> {
  try {
    const supabase = await createClient();

    // Fetch project and team members
    const [projectRes, membersRes] = await Promise.all([
      supabase.from("projects").select("id, owner_id, required_skills").eq("id", projectId).single(),
      supabase
        .from("project_members")
        .select("user_id, role, user:profiles!user_id(id, full_name, username, avatar_url, skills)")
        .eq("project_id", projectId),
    ]);

    const project = projectRes.data;
    if (!project) {
      return { required_skills: [], team_skills: [], skill_gaps: [], coverage_percentage: 0 };
    }

    // Also fetch owner profile
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, skills")
      .eq("id", project.owner_id)
      .maybeSingle();

    const teamProfiles: any[] = [];
    if (ownerProfile) teamProfiles.push(ownerProfile);
    (membersRes.data || []).forEach((m: any) => {
      if (m.user && m.user.id !== project.owner_id) {
        teamProfiles.push(m.user);
      }
    });

    const requiredSkills: string[] = Array.isArray(project.required_skills)
      ? project.required_skills
      : [];

    const coveredSkillsMap = new Map<
      string,
      { id: string; name: string; username: string; avatar_url?: string | null }[]
    >();
    const missingSkills: string[] = [];

    requiredSkills.forEach((reqSkill) => {
      const cleanReq = reqSkill.toLowerCase().trim();
      const matchingMembers: any[] = [];

      teamProfiles.forEach((member) => {
        const userSkills = Array.isArray(member.skills) ? member.skills : [];
        const hasSkill = userSkills.some((s: string) => {
          const cleanUserSkill = s.toLowerCase().trim();
          return cleanUserSkill === cleanReq || cleanUserSkill.includes(cleanReq) || cleanReq.includes(cleanUserSkill);
        });

        if (hasSkill) {
          matchingMembers.push({
            id: member.id,
            name: member.full_name || member.username,
            username: member.username,
            avatar_url: member.avatar_url,
          });
        }
      });

      if (matchingMembers.length > 0) {
        coveredSkillsMap.set(reqSkill, matchingMembers);
      } else {
        missingSkills.push(reqSkill);
      }
    });

    const teamSkills = Array.from(coveredSkillsMap.entries()).map(([skill, members]) => ({
      skill,
      members,
    }));

    const coveragePercentage =
      requiredSkills.length > 0
        ? Math.round((teamSkills.length / requiredSkills.length) * 100)
        : 100;

    return {
      required_skills: requiredSkills,
      team_skills: teamSkills,
      skill_gaps: missingSkills,
      coverage_percentage: coveragePercentage,
    };
  } catch (err) {
    console.error("Error in getProjectSkillGaps:", err);
    return { required_skills: [], team_skills: [], skill_gaps: [], coverage_percentage: 0 };
  }
}

/* =========================================================================
   FEATURE 5: 🏗️ PROJECT WORKSPACE & TASKS
   ========================================================================= */

export async function getProjectWorkspaceData(projectId: string) {
  try {
    const supabase = await createClient();

    const [
      projectRes,
      membersRes,
      tasksRes,
      milestonesRes,
      filesRes,
      discussionsRes,
      activityRes,
    ] = await Promise.all([
      supabase.from("projects").select("*, owner:profiles!owner_id(*)").eq("id", projectId).single(),
      supabase
        .from("project_members")
        .select("*, user:profiles!user_id(*)")
        .eq("project_id", projectId)
        .order("joined_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("*, assignee:profiles!assigned_to(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true }),
      supabase
        .from("project_files")
        .select("*, uploader:profiles!uploaded_by(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("project_discussions")
        .select("*, user:profiles!user_id(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("project_activity")
        .select("*, user:profiles!user_id(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    if (!projectRes.data) return null;

    const project = mapProject(projectRes.data);
    const members = (membersRes.data || []).map((m: any) => ({
      project_id: m.project_id,
      user_id: m.user_id,
      role: m.role || "Contributor",
      joined_at: m.joined_at,
      user: m.user || undefined,
    }));

    const tasks: ProjectTask[] = (tasksRes.data || []).map((t: any) => ({
      id: t.id,
      project_id: t.project_id,
      milestone_id: t.milestone_id,
      title: t.title,
      description: t.description,
      assigned_to: t.assigned_to,
      assignee: t.assignee || null,
      status: (t.status || "Todo") as TaskStatus,
      priority: (t.priority || "Medium") as TaskPriority,
      due_date: t.due_date,
      completed_at: t.completed_at,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const milestones: ProjectMilestone[] = (milestonesRes.data || []).map((m: any) => ({
      id: m.id,
      project_id: m.project_id,
      title: m.title,
      description: m.description,
      due_date: m.due_date,
      completed_at: m.completed_at,
      created_at: m.created_at,
      tasks: tasks.filter((t) => t.milestone_id === m.id),
    }));

    const files: ProjectFile[] = (filesRes.data || []).map((f: any) => ({
      id: f.id,
      project_id: f.project_id,
      name: f.name,
      url: f.url,
      file_type: f.file_type || "link",
      uploaded_by: f.uploaded_by,
      uploader: f.uploader || null,
      created_at: f.created_at,
    }));

    const discussions: ProjectDiscussion[] = (discussionsRes.data || []).map((d: any) => ({
      id: d.id,
      project_id: d.project_id,
      user_id: d.user_id,
      user: d.user || null,
      content: d.content,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    const activity: ProjectActivity[] = (activityRes.data || []).map((a: any) => ({
      id: a.id,
      project_id: a.project_id,
      user_id: a.user_id,
      user: a.user || null,
      action: a.action,
      details: a.details,
      created_at: a.created_at,
    }));

    // Calculate real progress
    const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
    const progress =
      tasks.length > 0
        ? Math.round((completedTasksCount / tasks.length) * 100)
        : project.status === "launched"
        ? 100
        : 15;

    project.tasks_count = tasks.length;
    project.completed_tasks_count = completedTasksCount;
    project.progress = progress;
    project.members = members;

    const skill_gaps = await getProjectSkillGaps(projectId);

    return {
      project,
      members,
      tasks,
      milestones,
      files,
      discussions,
      activity,
      skill_gaps,
      progress,
    };
  } catch (err) {
    console.error("Error in getProjectWorkspaceData:", err);
    return null;
  }
}

export async function createProjectTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    assigned_to?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string;
    milestone_id?: string;
  }
): Promise<ProjectTask> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      milestone_id: data.milestone_id || null,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      assigned_to: data.assigned_to || null,
      status: data.status || "Todo",
      priority: data.priority || "Medium",
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*, assignee:profiles!assigned_to(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to create task.");
  }

  // Notify assignee if assigned to someone else
  if (data.assigned_to && data.assigned_to !== user.id) {
    try {
      const { data: proj } = await supabase.from("projects").select("name").eq("id", projectId).single();
      await supabase.from("notifications").insert({
        user_id: data.assigned_to,
        recipient_id: data.assigned_to,
        actor_id: user.id,
        entity_id: projectId,
        related_id: inserted.id,
        project_id: projectId,
        type: "task_assigned",
        title: "📋 New Task Assigned",
        message: `You were assigned task "${inserted.title}" in ${proj?.name || "the project"}.`,
        read: false,
        is_read: false,
        data: { project_id: projectId, task_id: inserted.id, task_title: inserted.title },
      });
    } catch (e) {
      console.warn("Failed to dispatch task assignment notification:", e);
    }
  }

  await logProjectActivity(projectId, user.id, "created_task", {
    task_id: inserted.id,
    title: inserted.title,
  });

  return inserted as ProjectTask;
}

export async function updateProjectTask(
  taskId: string,
  data: Partial<ProjectTask>
): Promise<ProjectTask> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updatePayload.title = data.title.trim();
  if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
  if (data.assigned_to !== undefined) updatePayload.assigned_to = data.assigned_to || null;
  if (data.status !== undefined) {
    updatePayload.status = data.status;
    if (data.status === "Completed") {
      updatePayload.completed_at = new Date().toISOString();
    } else {
      updatePayload.completed_at = null;
    }
  }
  if (data.priority !== undefined) updatePayload.priority = data.priority;
  if (data.due_date !== undefined) updatePayload.due_date = data.due_date || null;
  if (data.milestone_id !== undefined) updatePayload.milestone_id = data.milestone_id || null;

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", taskId)
    .select("*, assignee:profiles!assigned_to(*)")
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Failed to update task.");
  }

  if (data.status === "Completed") {
    await logProjectActivity(updated.project_id, user.id, "completed_task", {
      task_id: taskId,
      title: updated.title,
    });
  }

  return updated as ProjectTask;
}

export async function deleteProjectTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) {
    throw new Error(error.message || "Failed to delete task.");
  }
}

export async function seedStandardMilestones(projectId: string): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("milestones")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const standardMilestones = [
    { title: "Planning & Architecture", description: "Define system requirements, tech stack, and user stories" },
    { title: "Prototype / Wireframes", description: "Build interactive mockup and core UX layout" },
    { title: "Development Sprint", description: "Implement backend APIs, database schemas, and frontend UI" },
    { title: "Testing & Hardening", description: "Run end-to-end tests, fix security issues, and gather feedback" },
    { title: "Final Launch & Demo", description: "Deploy to production, submit to hackathons, and publish demo" },
  ];

  for (const m of standardMilestones) {
    await supabase.from("milestones").insert({
      project_id: projectId,
      title: m.title,
      description: m.description,
      created_at: new Date().toISOString(),
    });
  }
}

export async function createProjectMilestone(
  projectId: string,
  data: { title: string; description?: string; due_date?: string }
): Promise<ProjectMilestone> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { data: inserted, error } = await supabase
    .from("milestones")
    .insert({
      project_id: projectId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      due_date: data.due_date || null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to create milestone.");
  }

  await logProjectActivity(projectId, user.id, "created_milestone", {
    milestone_id: inserted.id,
    title: inserted.title,
  });

  return inserted as ProjectMilestone;
}

export async function addProjectFile(
  projectId: string,
  data: { name: string; url: string; file_type?: string }
): Promise<ProjectFile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { data: inserted, error } = await supabase
    .from("project_files")
    .insert({
      project_id: projectId,
      name: data.name.trim(),
      url: data.url.trim(),
      file_type: data.file_type || "link",
      uploaded_by: user.id,
      created_at: new Date().toISOString(),
    })
    .select("*, uploader:profiles!uploaded_by(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to add project resource.");
  }

  await logProjectActivity(projectId, user.id, "added_file", {
    name: inserted.name,
    url: inserted.url,
  });

  return inserted as ProjectFile;
}

export async function deleteProjectFile(fileId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_files").delete().eq("id", fileId);
  if (error) {
    throw new Error(error.message || "Failed to delete file.");
  }
}

export async function addProjectDiscussion(
  projectId: string,
  content: string
): Promise<ProjectDiscussion> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Must be logged in.");

  const { data: inserted, error } = await supabase
    .from("project_discussions")
    .insert({
      project_id: projectId,
      user_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*, user:profiles!user_id(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to post message.");
  }

  return inserted as ProjectDiscussion;
}

export async function logProjectActivity(
  projectId: string,
  userId: string | null,
  action: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("project_activity").insert({
      project_id: projectId,
      user_id: userId,
      action,
      details,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to log project activity:", err);
  }
}
