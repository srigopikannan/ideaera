import { db } from "@/db";
import { companies, company_projects, company_applications, profiles } from "@/db/schema";
import { eq, and, ilike, desc } from "drizzle-orm";

export async function getCompanies(filters: { search?: string; industry?: string } = {}) {
  const { search, industry } = filters;

  return await db.query.companies.findMany({
    where: (companies, { and, ilike, eq }) => {
      const conditions = [];
      if (search) conditions.push(ilike(companies.name, `%${search}%`));
      if (industry) conditions.push(eq(companies.industry, industry));
      return and(...conditions);
    },
    orderBy: [desc(companies.created_at)],
  });
}

export async function getCompanyById(id: string) {
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, id),
    with: {
      owner: true
    }
  });

  if (!company) return null;

  const projects = await db.query.company_projects.findMany({
    where: eq(company_projects.company_id, id),
    with: {
      project: true
    }
  });

  return {
    ...company,
    projects: projects.map(p => p.project)
  };
}

export async function createCompany(ownerId: string, data: {
  name: string;
  slug: string;
  description: string;
  website_url?: string;
  logo_url?: string;
  industry?: string;
  size?: string;
  location?: string;
}) {
  return await db.insert(companies).values({
    ...data,
    owner_id: ownerId,
  }).returning();
}

export async function applyToCompany(userId: string, companyId: string, data: {
  projectId?: string;
  cover_letter: string;
  resume_url?: string;
}) {
  return await db.insert(company_applications).values({
    company_id: companyId,
    user_id: userId,
    project_id: data.projectId,
    cover_letter: data.cover_letter,
    resume_url: data.resume_url,
  }).returning();
}

export async function getCompanyApplications(companyId: string) {
  return await db.query.company_applications.findMany({
    where: eq(company_applications.company_id, companyId),
    with: {
      user: true,
      project: true
    },
    orderBy: [desc(company_applications.created_at)],
  });
}

export async function updateApplicationStatus(applicationId: string, status: "Pending" | "Reviewing" | "Accepted" | "Rejected") {
  return await db.update(company_applications)
    .set({ status, updated_at: new Date() })
    .where(eq(company_applications.id, applicationId))
    .returning();
}
