"use server";

import {
  searchStates,
  searchCities,
  searchColleges,
  createCustomCollege,
  ReferenceItem,
} from "@/services/reference-data";

export async function getStatesAction(query?: string): Promise<ReferenceItem[]> {
  return await searchStates(query);
}

export async function getCitiesAction(state: string, query?: string): Promise<ReferenceItem[]> {
  return await searchCities(state, query);
}

export async function getCollegesAction(
  query?: string,
  state?: string,
  city?: string
): Promise<ReferenceItem[]> {
  return await searchColleges(query, state, city);
}

export async function addCustomCollegeAction(
  name: string,
  city?: string,
  state?: string
): Promise<ReferenceItem> {
  return await createCustomCollege(name, city, state);
}
