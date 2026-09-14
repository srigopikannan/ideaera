"use server";

import { getCompanies, getCompanyBySlug, createCompany } from "@/services/companies";

export async function fetchCompaniesAction(industry?: string, query?: string) {
  return await getCompanies(industry, query);
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
}) {
  return await createCompany(data);
}
