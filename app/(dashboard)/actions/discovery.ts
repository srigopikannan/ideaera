"use server";

import { getAllProfiles } from "@/services/profile";
import { getIdeas } from "@/services/ideas";
import { getProjects } from "@/services/projects";
import { getHackathons } from "@/services/hackathons";
import { getCompanies } from "@/services/companies";

export interface GlobalSearchResult {
  people: {
    id: string;
    name: string;
    username: string;
    headline?: string | null;
    avatar_url?: string | null;
    github_url?: string | null;
    linkedin_url?: string | null;
    location?: string | null;
  }[];
  ideas: { id: string; title: string; category: string }[];
  projects: { id: string; slug: string; name: string; description: string }[];
  hackathons: { id: string; title: string; mode: string }[];
  companies: { id: string; slug: string; name: string; industry: string }[];
}

export async function searchGlobalAction(query: string): Promise<GlobalSearchResult> {
  if (!query || query.trim().length === 0) {
    return {
      people: [],
      ideas: [],
      projects: [],
      hackathons: [],
      companies: [],
    };
  }

  const [people, ideas, projects, hackathons, companies] = await Promise.all([
    getAllProfiles(query),
    getIdeas(undefined, "popular", query),
    getProjects(undefined, query),
    getHackathons("all"),
    getCompanies(undefined, query),
  ]);

  const q = query.toLowerCase();
  const matchedHackathons = hackathons.filter(
    (h) =>
      h.title.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q) ||
      (h.organizer || "").toLowerCase().includes(q)
  );

  return {
    people: people.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.full_name,
      username: p.username,
      headline: p.headline,
      avatar_url: p.avatar_url,
      github_url: p.github_url,
      linkedin_url: p.linkedin_url,
      location: p.location,
    })),
    ideas: ideas.slice(0, 4).map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
    })),
    projects: projects.slice(0, 4).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
    })),
    hackathons: matchedHackathons.slice(0, 3).map((h) => ({
      id: h.id,
      title: h.title,
      mode: h.mode || "Online",
    })),
    companies: companies.slice(0, 3).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      industry: c.industry,
    })),
  };
}
