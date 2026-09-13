import { db } from "@/db";
import { projects, project_members, tasks, milestones, profiles } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

export async function createProject(ownerId: string, data: {
  name: string;
  description: string;
  ideaId?: string;
}) {
  return await db.transaction(async (tx) => {
    const [project] = await tx.insert(projects).values({
      name: data.name,
      description: data.description,
      owner_id: ownerId,
      idea_id: data.ideaId,
    }).returning();

    // Owner is automatically a member with "Owner" role
    await tx.insert(project_members).values({
      project_id: project.id,
      user_id: ownerId,
      role: "Owner",
    });

    return project;
  });
}

export async function getProjectsForUser(userId: string) {
  return await db.query.projects.findMany({
    where: (projects, { exists }) =>
      exists(
        db.select()
          .from(project_members)
          .where(and(
            eq(project_members.project_id, projects.id),
            eq(project_members.user_id, userId)
          ))
      ),
    orderBy: [desc(projects.updated_at)],
  });
}

export async function getProjectById(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      owner: true,
      members: {
        with: {
          user: true
        }
      }
    }
  });

  if (!project) return null;

  const tasksList = await db.query.tasks.findMany({
    where: eq(tasks.project_id, projectId),
    with: {
      milestone: true
    },
    orderBy: [desc(tasks.created_at)]
  });

  const milestonesList = await db.query.milestones.findMany({
    where: eq(milestones.project_id, projectId),
    orderBy: [desc(milestones.due_date)]
  });

  return {
    ...project,
    tasks: tasksList,
    milestones: milestonesList
  };
}

export async function addProjectMember(projectId: string, userId: string, role: "Owner" | "Contributor" | "Viewer") {
  return await db.insert(project_members).values({
    project_id: projectId,
    user_id: userId,
    role,
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  return await db.delete(project_members)
    .where(and(eq(project_members.project_id, projectId), eq(project_members.user_id, userId)));
}

export async function createTask(projectId: string, data: {
  title: string;
  description: string;
  assignedTo?: string;
  status?: "Todo" | "In Progress" | "Review" | "Completed";
  priority?: "Low" | "Medium" | "High" | "Urgent";
  dueDate?: string;
  milestoneId?: string;
}) {
  return await db.insert(tasks).values({
    project_id: projectId,
    title: data.title,
    description: data.description,
    assigned_to: data.assignedTo,
    status: data.status || "Todo",
    priority: data.priority || "Medium",
    due_date: data.dueDate ? new Date(data.dueDate) : null,
    milestone_id: data.milestoneId,
  }).returning();
}

export async function updateTask(taskId: string, data: Partial<{
  title: string;
  description: string;
  assigned_to: string;
  status: "Todo" | "In Progress" | "Review" | "Completed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  due_date: Date;
  milestone_id: string;
}>) {
  return await db.update(tasks)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning();
}

export async function createMilestone(projectId: string, data: { title: string; description: string; dueDate: Date }) {
  return await db.insert(milestones).values({
    project_id: projectId,
    title: data.title,
    description: data.description,
    due_date: data.dueDate,
  }).returning();
}
