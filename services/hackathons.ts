import { db } from "@/db";
import { hackathons, hackathon_registrations, hackathon_teams, hackathon_team_members, profiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getHackathons(filters: { search?: string; location?: string } = {}) {
  const { search, location } = filters;

  return await db.query.hackathons.findMany({
    where: (hackathons, { and, ilike }) => {
      const conditions = [];
      if (search) conditions.push(ilike(hackathons.title, `%${search}%`));
      if (location) conditions.push(ilike(hackathons.location, `%${location}%`));
      return and(...conditions);
    },
    orderBy: [desc(hackathons.start_date)],
    with: {
      organizer: true
    }
  });
}

export async function getHackathonById(id: string) {
  return await db.query.hackathons.findFirst({
    where: eq(hackathons.id, id),
    with: {
      organizer: true
    }
  });
}

export async function registerForHackathon(userId: string, hackathonId: string) {
  return await db.insert(hackathon_registrations).values({
    user_id: userId,
    hackathon_id: hackathonId,
  });
}

export async function createHackathonTeam(hackathonId: string, teamName: string, captainId: string) {
  return await db.transaction(async (tx) => {
    const [team] = await tx.insert(hackathon_teams).values({
      hackathon_id: hackathonId,
      team_name: teamName,
    }).returning();

    await tx.insert(hackathon_team_members).values({
      team_id: team.id,
      user_id: captainId,
      role: "Captain",
    });

    return team;
  });
}

export async function joinHackathonTeam(teamId: string, userId: string) {
  return await db.insert(hackathon_team_members).values({
    team_id: teamId,
    user_id: userId,
    role: "Member",
  });
}

export async function getMyRegisteredHackathons(userId: string) {
  return await db.query.hackathon_registrations.findMany({
    where: eq(hackathon_registrations.user_id, userId),
    with: {
      hackathon: true
    }
  });
}
