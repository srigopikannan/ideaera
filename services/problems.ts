import { createClient } from "@/lib/supabase/server";
import { CompanyProblem, ProblemStatus, ProblemSourceType, ProblemDifficulty, Profile, MatchRecommendation } from "@/types";
import { getAllProfiles, formatProfile } from "@/services/profile";

export async function getProblems(options?: {
  industry?: string;
  skills?: string[];
  difficulty?: string;
  status?: string;
  sourceType?: string;
  companySlugOrId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ problems: CompanyProblem[]; total: number }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let qb = supabase
      .from("company_problems")
      .select("*, company:companies(*), creator:profiles!created_by(*)", { count: "exact" });

    // Status filter
    if (options?.status && options.status !== "all" && options.status !== "All") {
      qb = qb.eq("status", options.status.toLowerCase());
    } else {
      // Default to public active statuses unless explicit
      qb = qb.in("status", ["open", "in_progress", "solved", "closed"]);
    }

    // Source type filter (Official vs Community)
    if (options?.sourceType && options.sourceType !== "all" && options.sourceType !== "All") {
      qb = qb.eq("source_type", options.sourceType);
    }

    // Industry filter
    if (options?.industry && options.industry !== "all" && options.industry !== "All") {
      qb = qb.eq("industry", options.industry);
    }

    // Difficulty filter
    if (options?.difficulty && options.difficulty !== "all" && options.difficulty !== "All") {
      qb = qb.eq("difficulty", options.difficulty);
    }

    // Company filter (by slug or ID)
    if (options?.companySlugOrId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.companySlugOrId);
      if (isUuid) {
        qb = qb.eq("company_id", options.companySlugOrId);
      } else {
        // Find company ID by slug first
        const { data: comp } = await supabase
          .from("companies")
          .select("id")
          .eq("slug", options.companySlugOrId)
          .maybeSingle();
        if (comp) {
          qb = qb.eq("company_id", comp.id);
        }
      }
    }

    // Search query
    if (options?.query && options.query.trim()) {
      const q = options.query.trim();
      qb = qb.or(`title.ilike.%${q}%,summary.ilike.%${q}%,industry.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Skills filter (array overlap)
    if (options?.skills && options.skills.length > 0) {
      qb = qb.overlaps("required_skills", options.skills);
    }

    // Ordering
    qb = qb.order("created_at", { ascending: false });

    if (options?.limit) {
      const offset = options.offset || 0;
      qb = qb.range(offset, offset + options.limit - 1);
    }

    const { data, count, error } = await qb;

    if (error) {
      console.error("Error fetching company problems:", error);
      return { problems: [], total: 0 };
    }

    // Check saved state for current user
    let savedIds = new Set<string>();
    if (user && data && data.length > 0) {
      try {
        const probIds = data.map((p) => p.id);
        const { data: saves } = await supabase
          .from("problem_saves")
          .select("problem_id")
          .eq("user_id", user.id)
          .in("problem_id", probIds);
        if (saves) {
          savedIds = new Set(saves.map((s) => s.problem_id));
        }
      } catch (saveErr) {
        console.error("Error fetching saved problems:", saveErr);
      }
    }

    const problems: CompanyProblem[] = (data || []).map((row) => ({
      ...row,
      required_skills: Array.isArray(row.required_skills) ? row.required_skills : [],
      is_saved: savedIds.has(row.id),
      company: row.company
        ? {
            ...row.company,
            website: row.company.website_url || row.company.website,
          }
        : undefined,
      creator: row.creator ? formatProfile(row.creator, user?.id) : null,
    }));

    return { problems, total: count || problems.length };
  } catch (err) {
    console.error("Error in getProblems:", err);
    return { problems: [], total: 0 };
  }
}

export async function getProblemByIdOrSlug(idOrSlug: string): Promise<CompanyProblem | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let qb = supabase
      .from("company_problems")
      .select("*, company:companies(*), creator:profiles!created_by(*)");

    if (isUuid) {
      qb = qb.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
    } else {
      qb = qb.eq("slug", idOrSlug);
    }

    const { data: problem, error } = await qb.maybeSingle();

    if (error || !problem) {
      return null;
    }

    // Increment view count asynchronously
    supabase
      .from("company_problems")
      .update({ views_count: (problem.views_count || 0) + 1 })
      .eq("id", problem.id)
      .then();

    // Check if saved by current user
    let isSaved = false;
    if (user) {
      try {
        const { data: save } = await supabase
          .from("problem_saves")
          .select("problem_id")
          .eq("user_id", user.id)
          .eq("problem_id", problem.id)
          .maybeSingle();
        isSaved = Boolean(save);
      } catch {}
    }

    // Fetch permitted solution ideas linked to this problem
    // Respect visibility: public always; community if user logged in; private ONLY if author is current user
    let solutionsQuery = supabase
      .from("ideas")
      .select("*, creator:profiles!creator_id(*)")
      .eq("problem_id", problem.id)
      .order("created_at", { ascending: false });

    if (user) {
      solutionsQuery = solutionsQuery.or(`visibility.in.(public,community),creator_id.eq.${user.id}`);
    } else {
      solutionsQuery = solutionsQuery.eq("visibility", "public");
    }

    const { data: rawSolutions } = await solutionsQuery;

    const solutions = (rawSolutions || []).map((sol) => ({
      ...sol,
      author_id: sol.creator_id,
      author: sol.creator ? formatProfile(sol.creator, user?.id) : undefined,
      display_id: sol.display_id || `IDEA-${sol.id.substring(0, 8).toUpperCase()}`,
      status: (sol.stage?.toLowerCase() === "implemented" ? "implemented" : sol.stage?.toLowerCase() === "in_progress" ? "in_progress" : "open") as any,
    }));

    return {
      ...problem,
      required_skills: Array.isArray(problem.required_skills) ? problem.required_skills : [],
      is_saved: isSaved,
      company: problem.company
        ? {
            ...problem.company,
            website: problem.company.website_url || problem.company.website,
          }
        : undefined,
      creator: problem.creator ? formatProfile(problem.creator, user?.id) : null,
      solutions,
      solutions_count: solutions.length,
    };
  } catch (err) {
    console.error("Error in getProblemByIdOrSlug:", err);
    return null;
  }
}

export async function createProblem(data: {
  company_id: string;
  title: string;
  summary: string;
  description: string;
  industry: string;
  difficulty: ProblemDifficulty;
  problem_type?: string;
  source_type?: ProblemSourceType;
  source_title?: string;
  source_url?: string;
  required_skills: string[];
}): Promise<CompanyProblem> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to submit a problem.");
  }

  // Base slug generation
  const baseSlug = data.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

  // Default source_type is community unless verified
  const sourceType: ProblemSourceType =
    data.source_type === "official_company" ? "official_company" : "community";

  // Official challenges require verification check; otherwise default to pending_review
  let initialStatus: ProblemStatus = "open";
  if (sourceType === "official_company") {
    initialStatus = "pending_review";
  }

  const { data: inserted, error } = await supabase
    .from("company_problems")
    .insert({
      company_id: data.company_id,
      title: data.title.trim(),
      slug,
      summary: data.summary.trim(),
      description: data.description.trim(),
      problem_type: data.problem_type || "real_world_problem",
      source_type: sourceType,
      source_title: data.source_title?.trim() || null,
      source_url: data.source_url?.trim() || null,
      industry: data.industry,
      difficulty: data.difficulty,
      required_skills: data.required_skills,
      status: initialStatus,
      created_by: user.id,
      last_reviewed_at: new Date().toISOString(),
    })
    .select("*, company:companies(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to create problem.");
  }

  // Update challenges_count on company
  await supabase
    .from("companies")
    .update({
      challenges_count: (inserted.company?.challenges_count || 0) + 1,
    })
    .eq("id", data.company_id);

  return {
    ...inserted,
    company: inserted.company
      ? {
          ...inserted.company,
          website: inserted.company.website_url || inserted.company.website,
        }
      : undefined,
  };
}

export async function toggleSaveProblem(problemId: string): Promise<{ isSaved: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to save problems.");
  }

  const { data: existing } = await supabase
    .from("problem_saves")
    .select("problem_id")
    .eq("user_id", user.id)
    .eq("problem_id", problemId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("problem_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("problem_id", problemId);
    return { isSaved: false };
  } else {
    await supabase.from("problem_saves").insert({
      user_id: user.id,
      problem_id: problemId,
    });
    return { isSaved: true };
  }
}

export async function reportProblem(data: {
  problem_id: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("problem_reports").insert({
    problem_id: data.problem_id,
    reporter_id: user?.id || null,
    reason: data.reason,
    details: data.details?.trim() || null,
    status: "pending",
  });

  if (error) {
    console.error("Error creating problem report:", error);
    throw new Error(error.message);
  }

  return { success: true };
}

export async function updateProblemStatus(
  problemId: string,
  status: ProblemStatus
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update problem status.");
  }

  // Fetch problem to verify ownership or admin authorization
  const { data: prob } = await supabase
    .from("company_problems")
    .select("id, created_by, company_id, company:companies(owner_id)")
    .eq("id", problemId)
    .maybeSingle();

  if (!prob) {
    throw new Error("Problem not found.");
  }

  const isCreator = prob.created_by === user.id;
  const isCompanyOwner = (prob.company as any)?.owner_id === user.id;

  if (!isCreator && !isCompanyOwner) {
    // Only creator or company owner or authorized admin can update
    throw new Error("Unauthorized: You do not have permission to update this problem status.");
  }

  const { error } = await supabase
    .from("company_problems")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", problemId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function getProblemTeammates(problemId: string): Promise<MatchRecommendation[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: problem } = await supabase
      .from("company_problems")
      .select("id, title, required_skills, industry")
      .eq("id", problemId)
      .maybeSingle();

    if (!problem) return [];

    const reqSkills = new Set(
      (problem.required_skills || []).map((s: string) => s.toLowerCase().trim())
    );

    const allProfiles = await getAllProfiles();
    const candidates = user ? allProfiles.filter((p) => p.id !== user.id) : allProfiles;

    const recommendations: MatchRecommendation[] = candidates.map((cand) => {
      const candSkills = cand.skills || [];
      const matchingSkills = candSkills.filter((s) => reqSkills.has(s.toLowerCase().trim()));
      const otherSkills = candSkills.filter((s) => !reqSkills.has(s.toLowerCase().trim()));

      const hasMatchingSkill = matchingSkills.length > 0;
      const skillScore = Math.min(matchingSkills.length * 28, 60);

      // Baseline synergy
      const baseSynergy = 35 + (candSkills.length > 0 ? 15 : 0);
      const matchScore = Math.min(Math.max(baseSynergy + skillScore, 45), 98);

      let matchReason = "";
      if (matchingSkills.length > 0) {
        matchReason = `Proficient in required capabilities: ${matchingSkills.slice(0, 3).join(", ")}.`;
      } else {
        matchReason = `Adjacent technical expertise relevant for ${problem.industry} solutions.`;
      }

      return {
        profile: cand,
        matchScore,
        matchReason,
        sharedSkills: matchingSkills,
        sharedInterests: [problem.industry],
        complementarySkills: otherSkills.slice(0, 3),
      };
    });

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  } catch (err) {
    console.error("Error in getProblemTeammates:", err);
    return [];
  }
}
