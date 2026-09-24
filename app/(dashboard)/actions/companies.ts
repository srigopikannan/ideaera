"use server";

import {
  getCompanies,
  getCompanyBySlug,
  createCompany,
  requestCompanyVerification,
} from "@/services/companies";
import { revalidatePath } from "next/cache";

export async function fetchCompaniesAction(filters?: {
  industry?: string;
  query?: string;
  techStack?: string;
  location?: string;
  verificationStatus?: string;
}) {
  return await getCompanies(filters);
}

export async function fetchCompanyBySlugAction(slug: string) {
  return await getCompanyBySlug(slug);
}

export async function createCompanyAction(data: {
  name: string;
  description: string;
  industry: string;
  location: string;
  website_url?: string;
  logo_url?: string;
  size?: string;
  tech_stack?: string[];
}) {
  try {
    const comp = await createCompany(data);
    revalidatePath("/companies");
    return { success: true, company: comp };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create company." };
  }
}

export async function requestCompanyVerificationAction(data: {
  company_id: string;
  work_email: string;
  role_title: string;
  verification_document_url?: string;
}) {
  try {
    await requestCompanyVerification(data);
    revalidatePath("/companies");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to request verification." };
  }
}
