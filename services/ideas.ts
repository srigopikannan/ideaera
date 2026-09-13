import { db } from "@/db";
import { ideas, idea_requirements, idea_bookmarks, profiles, skills } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

export async function createIdea(userId: string, data: {
  title: string;
  problem: string;
  solution: string;
  description: string;
  category: string;
  stage: "Idea" | "Planning" | "Prototype" | "MVP" | "Testing" | "Launch";
  visibility: string;
  requirements: Array<{ skillId: string; minLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert"; priority: string }>;
}) {
  return await db.transaction(async (tx) => {
    const [idea] = await tx.insert(ideas).values({
      creator_id: userId,
      title: data.title,
      problem: data.problem,
      solution: data.solution,
      description: data.description,
      category: data.category,
       stage: data.stage as "Idea" | "Planning" | "Prototype" | "MVP" | "Testing" | "Launch",
      visibility: data.visibility,
    }).returning();

    if (data.requirements && data.requirements.length > 0) {
      await tx.insert(idea_requirements).values(
        data.requirements.map(req => ({
          idea_id: idea.id,
          skill_id: req.skillId,
          min_level: req.minLevel,
          priority: req.priority,
        }))
      );
    }

    return idea;
  });
}

export async function updateIdea(ideaId: string, userId: string, data: {
  title?: string;
  problem?: string;
  solution?: string;
  description?: string;
  category?: string;
  stage?: "Idea" | "Planning" | "Prototype" | "MVP" | "Testing" | "Launch";
  visibility?: string;
  requirements?: Array<{ skillId: string; minLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert"; priority: string }>;
}) {
  // Check ownership
  const idea = await db.query.ideas.findFirst({
    where: and(eq(ideas.id, ideaId), eq(ideas.creator_id, userId)),
  });
  if (!idea) throw new Error("Idea not found or unauthorized");

  return await db.transaction(async (tx) => {
    await tx.update(ideas)
      .set({
        title: data.title,
        problem: data.problem,
        solution: data.solution,
        description: data.description,
        category: data.category,
        stage: data.stage,
        visibility: data.visibility,
        updated_at: new Date(),
      })
      .where(eq(ideas.id, ideaId));

    if (data.requirements) {
      await tx.delete(idea_requirements).where(eq(idea_requirements.idea_id, ideaId));
      await tx.insert(idea_requirements).values(
        data.requirements.map((req) => ({
          idea_id: ideaId,
          skill_id: req.skillId,
          min_level: req.minLevel,
          priority: req.priority,
        }))
      );
    }

    return { success: true };
  });
}

export async function getIdeas(userId: string, filters: { category?: string; stage?: string; search?: string } = {}) {
  const { category, stage, search } = filters;

  return await db.query.ideas.findMany({
    where: (ideas, { and, eq, ilike }) => {
      const conditions = [];
      if (category) conditions.push(eq(ideas.category, category));
      if (stage) {
  conditions.push(
    eq(
      ideas.stage,
      stage as "Idea" | "Planning" | "Prototype" | "MVP" | "Testing" | "Launch"
    )
  );
}
      if (search) conditions.push(ilike(ideas.title, `%${search}%`));
      return and(...conditions);
    },
    orderBy: [desc(ideas.created_at)],
    with: {
      creator: {
        columns: {
          full_name: true,
          avatar_url: true,
          username: true,
        }
      }
    }
  });
}

export async function getIdeaById(ideaId: string) {
  const idea = await db.query.ideas.findFirst({
    where: eq(ideas.id, ideaId),
    with: {
      creator: true,
      requirements: {
        with: {
          skill: true
        }
      }
    }
  });

  if (!idea) return null;
  return idea;
}

export async function toggleIdeaBookmark(userId: string, ideaId: string) {
  const existing = await db.query.idea_bookmarks.findFirst({
    where: and(eq(idea_bookmarks.user_id, userId), eq(idea_bookmarks.idea_id, ideaId)),
  });

  if (existing) {
    await db.delete(idea_bookmarks).where(
  and(
    eq(idea_bookmarks.user_id, userId),
    eq(idea_bookmarks.idea_id, ideaId)
  )
);
    return { bookmarked: false };
  } else {
    await db.insert(idea_bookmarks).values({
      user_id: userId,
      idea_id: ideaId,
    });
    return { bookmarked: true };
  }
}

export async function getMyIdeas(userId: string) {
  return await db.query.ideas.findMany({
    where: eq(ideas.creator_id, userId),
    orderBy: [desc(ideas.created_at)],
  });
}
