"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import * as companyService from "@/services/companies";
import { db } from "@/db";
import { company_applications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getCompaniesAction(filters: { search?: string; industry?: string } = {}) {
  return await companyService.getCompanies(filters);
}

export async function getCompanyDetailAction(id: string) {
  return await companyService.getCompanyById(id);
}

export async function createCompanyAction(formData: {
  name: string;
  slug: string;
  description: string;
  website_url?: string;
  logo_url?: string;
  industry?: string;
  size?: string;
  location?: string;
}) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await companyService.createCompany(user.id, formData);
    revalidatePath("/companies");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function applyToCompanyAction(companyId: string, formData: {
  projectId?: string;
  cover_letter: string;
  resume_url?: string;
}) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await companyService.applyToCompany(user.id, companyId, formData);
    revalidatePath(`/companies/${companyId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

export async function getMyCompanyApplicationsAction() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await db.query.company_applications.findMany({
    where: eq(company_applications.user_id, user.id),
    with: {
      company: true,
      project: true
    },
    orderBy: [desc(company_applications.created_at)],
  });
}
