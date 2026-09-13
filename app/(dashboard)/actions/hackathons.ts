"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import * as hackathonService from "@/services/hackathons";

export async function getHackathonsAction(filters: { search?: string; location?: string } = {}) {
  return await hackathonService.getHackathons(filters);
}

export async function getHackathonDetailAction(id: string) {
  return await hackathonService.getHackathonById(id);
}

export async function registerHackathonAction(hackathonId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await hackathonService.registerForHackathon(user.id, hackathonId);
    revalidatePath("/hackathons");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function createTeamAction(hackathonId: string, teamName: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await hackathonService.createHackathonTeam(hackathonId, teamName, user.id);
    revalidatePath(`/hackathons/${hackathonId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function joinTeamAction(teamId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await hackathonService.joinHackathonTeam(teamId, user.id);
    revalidatePath(`/hackathons/teams/${teamId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function getMyHackathonsAction() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await hackathonService.getMyRegisteredHackathons(user.id);
}
