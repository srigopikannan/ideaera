"use server";

import { getAllProfiles } from "@/services/profile";
import { getIdeas } from "@/services/ideas";
import { getProjects } from "@/services/projects";
import { getHackathons } from "@/services/hackathons";
import { rateLimiters } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

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
    college?: string | null;
    skills?: string[];
    city?: string | null;
    state?: string | null;
  }[];
  ideas: { id: string; title: string; category: string; display_id?: string }[];
  projects: { id: string; slug: string; name: string; description: string }[];
  hackathons: { id: string; title: string; mode: string }[];
}

export async function searchGlobalAction(query: string): Promise<GlobalSearchResult> {
  if (!query || query.trim().length === 0) {
    return {
      people: [],
      ideas: [],
      projects: [],
      hackathons: [],
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const identifier = user?.id || "anon_search";
    const rl = rateLimiters.search.check(identifier);
    if (!rl.allowed) {
      return { people: [], ideas: [], projects: [], hackathons: [] };
    }
  } catch {
    // If auth client fails, continue with caution
  }

  const cleanQuery = query.trim();

  const [people, ideas, projects, hackathons] = await Promise.all([
    getAllProfiles({ query: cleanQuery, limit: 5 }),
    getIdeas(undefined, "popular", cleanQuery, 1, 4),
    getProjects(undefined, cleanQuery),
    getHackathons("all"),
  ]);

  const q = query.toLowerCase();
  const matchedHackathons = hackathons.filter(
    (h) =>
      h.title.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q) ||
      (h.organizer || "").toLowerCase().includes(q)
  );

  return {
    people: people.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.full_name,
      username: p.username,
      headline: p.headline,
      avatar_url: p.avatar_url,
      github_url: p.github_url,
      linkedin_url: p.linkedin_url,
      location: p.location,
      college: p.college,
      skills: p.skills,
      city: p.city,
      state: p.state,
    })),
    ideas: ideas.slice(0, 4).map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      display_id: i.display_id || `IDEA-${i.id.substring(0, 8).toUpperCase()}`,
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
  };
}
