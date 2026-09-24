"use server";

import {
  getProblems,
  getProblemByIdOrSlug,
  createProblem,
  toggleSaveProblem,
  reportProblem,
  updateProblemStatus,
  getProblemTeammates,
} from "@/services/problems";
import { ProblemDifficulty, ProblemSourceType, ProblemStatus } from "@/types";
import { revalidatePath } from "next/cache";

export async function getProblemsAction(options?: {
  industry?: string;
  skills?: string[];
  difficulty?: string;
  status?: string;
  sourceType?: string;
  companySlugOrId?: string;
  query?: string;
  limit?: number;
  offset?: number;
}) {
  return await getProblems(options);
}

export async function getProblemByIdOrSlugAction(idOrSlug: string) {
  return await getProblemByIdOrSlug(idOrSlug);
}

export async function createProblemAction(data: {
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
}) {
  try {
    const problem = await createProblem(data);
    revalidatePath("/problems");
    revalidatePath(`/problems/${problem.slug}`);
    revalidatePath("/companies");
    return { success: true, problem };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to submit problem." };
  }
}

export async function toggleSaveProblemAction(problemId: string) {
  try {
    const res = await toggleSaveProblem(problemId);
    revalidatePath(`/problems/${problemId}`);
    return { success: true, isSaved: res.isSaved };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save problem." };
  }
}

export async function reportProblemAction(data: {
  problem_id: string;
  reason: string;
  details?: string;
}) {
  try {
    await reportProblem(data);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to report problem." };
  }
}

export async function updateProblemStatusAction(problemId: string, status: ProblemStatus) {
  try {
    await updateProblemStatus(problemId, status);
    revalidatePath("/problems");
    revalidatePath(`/problems/${problemId}`);
    revalidatePath("/companies");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update problem status." };
  }
}

export async function getProblemTeammatesAction(problemId: string) {
  return await getProblemTeammates(problemId);
}
