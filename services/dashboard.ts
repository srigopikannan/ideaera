import { createClient } from "@/lib/supabase/server";
import {
  PersonalInnovationDashboard,
  NextStepRecommendation,
  Idea,
  Project,
  Hackathon,
} from "@/types";
import { getUserBadgesWithProgress } from "@/services/badges";
import { getProjectSkillGaps } from "@/services/projects";
import { mapIdea } from "@/services/ideas";

function mapProjectRecord(p: any): Project {
  let description = p.description || "";
  let technologies: string[] = [];
  let imageUrl: string | null = null;

  const techMatch = description.match(/\[Tech:\s*([^\]]+)\]/i);
  if (techMatch) {
    technologies = techMatch[1].split(",").map((t: string) => t.trim()).filter(Boolean);
  }

  const imgMatch = description.match(/\[Image:\s*([^\]]+)\]/i);
  if (imgMatch) {
    imageUrl = imgMatch[1].trim();
  }

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

export async function getPersonalInnovationDashboard(
  userId: string
): Promise<PersonalInnovationDashboard> {
  const supabase = await createClient();

  // 1. Fetch user's profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const userSkills: string[] = Array.isArray(userProfile?.skills) ? userProfile.skills : [];

  // 2. Fetch User's Ideas
  const { data: rawIdeas } = await supabase
    .from("ideas")
    .select("*, creator:profiles!creator_id(*)")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });

  const userIdeas: Idea[] = (rawIdeas || []).map((r) => mapIdea(r, false));
  const validatedIdeas = userIdeas.filter((i) => i.validation_status === "validated");
  const developingIdeas = userIdeas.filter(
    (i) => i.status === "in_progress" || i.validation_status === "testing"
  );

  // 3. Fetch User's Owned Projects
  const { data: rawOwnedProjects } = await supabase
    .from("projects")
    .select("*, owner:profiles!owner_id(*)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  const ownedProjects: Project[] = (rawOwnedProjects || []).map(mapProjectRecord);

  // 4. Fetch Projects where user is a team member
  const { data: memberRows } = await supabase
    .from("project_members")
    .select("project:projects(*, owner:profiles!owner_id(*))")
    .eq("user_id", userId);

  const memberProjects: Project[] = (memberRows || [])
    .map((r: any) => r.project)
    .filter(Boolean)
    .filter((p: any) => p.owner_id !== userId)
    .map(mapProjectRecord);

  // Combined project sets
  const allUserProjects = [...ownedProjects, ...memberProjects];
  const activeProjects = allUserProjects.filter((p) => p.status !== "launched");
  const completedProjects = allUserProjects.filter((p) => p.status === "launched");
  const needsHelpProjects = allUserProjects.filter((p) => p.needs_help);

  // 5. Fetch Collaborators count
  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, receiver_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

  const collaboratorSet = new Set<string>();
  (connections || []).forEach((c) => {
    if (c.requester_id !== userId) collaboratorSet.add(c.requester_id);
    if (c.receiver_id !== userId) collaboratorSet.add(c.receiver_id);
  });

  // 6. Fetch User's Hackathons
  let joinedHackathons: Hackathon[] = [];
  try {
    const { data: hackathonParticipants } = await supabase
      .from("hackathon_participants")
      .select("hackathon:hackathons(*)")
      .eq("user_id", userId);

    if (hackathonParticipants && hackathonParticipants.length > 0) {
      joinedHackathons = hackathonParticipants
        .map((hp: any) => hp.hackathon)
        .filter(Boolean);
    }
  } catch (err) {
    // If hackathon_participants doesn't exist, fallback gracefully
  }

  // 7. Aggregate Skills Needed & Skill Gaps across user's active owned projects
  const neededSkillsSet = new Set<string>();
  const gapSkillsSet = new Set<string>();

  for (const proj of ownedProjects.filter((p) => p.status !== "launched")) {
    (proj.required_skills || []).forEach((s) => neededSkillsSet.add(s));
    try {
      const gaps = await getProjectSkillGaps(proj.id);
      gaps.skill_gaps.forEach((g) => gapSkillsSet.add(g));
    } catch {
      // Ignore gap calculation failures for individual projects
    }
  }

  // 8. Fetch User's Badges
  let badgesResult;
  try {
    badgesResult = await getUserBadgesWithProgress(userId, true);
  } catch {
    badgesResult = {
      earned: [],
      in_progress: [],
      all: [],
      summary: {
        total_earned: 0,
        total_available: 0,
        bronze_count: 0,
        silver_count: 0,
        gold_count: 0,
        prestige_score: 0,
        completion_rate: 0,
        metrics: {
          ideas_count: userIdeas.length,
          projects_count: ownedProjects.length,
          connections_count: collaboratorSet.size,
          hackathons_count: joinedHackathons.length,
        },
      },
    };
  }

  // 9. Fetch Tasks assigned to user
  const { data: assignedTasks } = await supabase
    .from("tasks")
    .select("*, project:projects(id, name)")
    .eq("assigned_to", userId)
    .neq("status", "Completed")
    .limit(5);

  // 10. Generate "Your Next Step" Recommendations (Rule Engine)
  const nextSteps: NextStepRecommendation[] = [];

  // Rule A: Rescue projects needing urgent help
  for (const proj of ownedProjects.filter((p) => p.needs_help)) {
    nextSteps.push({
      id: `rescue-${proj.id}`,
      title: `Invite Helpers to "${proj.name}"`,
      description: `Your project is marked as "Needs Help" (${proj.help_category || "General"}). Match and invite rescue collaborators.`,
      category: "rescue",
      action_label: "Find Helpers",
      action_url: `/projects/${proj.id}#rescue`,
      priority: "high",
    });
  }

  // Rule B: Skill gaps in active projects
  for (const proj of ownedProjects.filter((p) => p.status !== "launched")) {
    const gaps = (proj.required_skills || []).filter((s) => !userSkills.includes(s));
    if (gaps.length > 0) {
      const topGap = gaps[0];
      nextSteps.push({
        id: `gap-${proj.id}-${topGap}`,
        title: `Fill Skill Gap in "${proj.name}"`,
        description: `Your project requires "${topGap}". Connect with students who specialize in it.`,
        category: "skills",
        action_label: `Find ${topGap} Talent`,
        action_url: `/people?skill=${encodeURIComponent(topGap)}`,
        priority: "medium",
      });
      break;
    }
  }

  // Rule C: Ideas needing validation
  const unvalidatedIdea = userIdeas.find((i) => i.validation_status === "not_validated");
  if (unvalidatedIdea) {
    nextSteps.push({
      id: `validate-${unvalidatedIdea.id}`,
      title: `Validate "${unvalidatedIdea.title}"`,
      description: "Define your target users and problem statement to gather feedback from the IdeaEra community.",
      category: "validation",
      action_label: "Open Validation",
      action_url: `/ideas/${unvalidatedIdea.id}#validation`,
      priority: "high",
    });
  }

  // Rule D: Validated idea ready to become a project
  const validatedReadyIdea = userIdeas.find(
    (i) => i.validation_status === "validated" && !allUserProjects.some((p) => p.idea_id === i.id)
  );
  if (validatedReadyIdea) {
    nextSteps.push({
      id: `convert-${validatedReadyIdea.id}`,
      title: `Launch "${validatedReadyIdea.title}" into Project`,
      description: "Your idea has been validated! Set up a Project Workspace with tasks, milestones, and team roles.",
      category: "project",
      action_label: "Convert to Project",
      action_url: `/ideas/${validatedReadyIdea.id}`,
      priority: "high",
    });
  }

  // Rule E: Assigned pending tasks
  if (assignedTasks && assignedTasks.length > 0) {
    const task = assignedTasks[0];
    nextSteps.push({
      id: `task-${task.id}`,
      title: `Work on Task: "${task.title}"`,
      description: `Assigned in "${task.project?.name || "Project"}". Keep momentum going.`,
      category: "task",
      action_label: "Go to Workspace",
      action_url: `/projects/${task.project_id}?tab=tasks`,
      priority: "medium",
    });
  }

  // Rule F: Empty profile availability
  if (!userProfile?.availability || userProfile.availability === "Not currently available") {
    nextSteps.push({
      id: "availability-update",
      title: "Set Your Collaboration Availability",
      description: "Let teammates know when you can contribute (evenings, weekends, or weekly hours).",
      category: "community",
      action_label: "Update Profile",
      action_url: "/profile/edit",
      priority: "low",
    });
  }

  // Rule G: If no ideas yet
  if (userIdeas.length === 0) {
    nextSteps.push({
      id: "create-first-idea",
      title: "Publish Your First Idea",
      description: "Share a spark with the IdeaEra network to find co-founders, feedback, and early traction.",
      category: "idea",
      action_label: "Create Idea",
      action_url: "/ideas/create",
      priority: "high",
    });
  }

  // Rule H: Upcoming hackathons discovery
  nextSteps.push({
    id: "hackathon-discovery",
    title: "Browse Upcoming Hackathons",
    description: "Form a team and build prototype solutions for upcoming student hackathons.",
    category: "hackathon",
    action_label: "Explore Hackathons",
    action_url: "/hackathons",
    priority: "low",
  });

  return {
    ideas: {
      created: userIdeas,
      developing: developingIdeas,
      total_count: userIdeas.length,
      validated_count: validatedIdeas.length,
    },
    projects: {
      active: activeProjects,
      completed: completedProjects,
      needs_help: needsHelpProjects,
      total_count: allUserProjects.length,
    },
    team: {
      member_of: memberProjects,
      collaborators_count: collaboratorSet.size,
    },
    hackathons: {
      joined: joinedHackathons,
      total_count: joinedHackathons.length,
    },
    skills: {
      profile_skills: userSkills,
      project_skills_needed: Array.from(neededSkillsSet),
      gap_skills: Array.from(gapSkillsSet),
    },
    badges: badgesResult,
    next_steps: nextSteps.slice(0, 5),
  };
}
