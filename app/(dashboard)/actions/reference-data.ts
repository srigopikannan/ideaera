"use server";

import {
  searchStates,
  searchCities,
  searchColleges,
  createCustomCollege,
  submitCollegeSuggestion,
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
  collegeState?: string,
  collegeCity?: string
): Promise<ReferenceItem[]> {
  return await searchColleges(query, collegeState, collegeCity);
}

export async function addCustomCollegeAction(
  name: string,
  city?: string,
  state?: string
): Promise<ReferenceItem> {
  return await createCustomCollege(name, city, state);
}

export async function suggestCollegeAction(
  name: string,
  city?: string,
  state?: string,
  district?: string
): Promise<{ success: boolean; message: string; id?: string }> {
  return await submitCollegeSuggestion(name, city, state, district);
}

