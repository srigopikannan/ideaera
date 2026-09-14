"use server";

import { getHackathons, getHackathonById, createHackathon } from "@/services/hackathons";

export async function fetchHackathonsAction(filter?: string) {
  return await getHackathons(filter);
}

export async function fetchHackathonByIdAction(id: string) {
  return await getHackathonById(id);
}

export async function createHackathonAction(params: {
  title: string;
  description: string;
  organizer?: string;
  region?: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  prize_pool?: string;
  min_team_size?: number;
  max_team_size?: number;
  registration_url?: string;
  image_url?: string;
}) {
  return await createHackathon(params);
}
