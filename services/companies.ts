import { createClient } from "@/lib/supabase/server";
import { Company, CompanyProblem, Idea } from "@/types";
import { formatProfile } from "@/services/profile";

export async function getCompanies(filters?: {
  industry?: string;
  query?: string;
  techStack?: string;
  location?: string;
  verificationStatus?: string;
}): Promise<Company[]> {
  try {
    const supabase = await createClient();
    let qb = supabase.from("companies").select("*, owner:profiles!owner_id(*)");

    if (filters?.industry && filters.industry !== "All" && filters.industry !== "all") {
      qb = qb.eq("industry", filters.industry);
    }

    if (filters?.verificationStatus && filters.verificationStatus !== "All" && filters.verificationStatus !== "all") {
      qb = qb.eq("verification_status", filters.verificationStatus.toLowerCase());
    }

    if (filters?.location && filters.location !== "All" && filters.location !== "all") {
      qb = qb.ilike("location", `%${filters.location}%`);
    }

    if (filters?.techStack && filters.techStack !== "All" && filters.techStack !== "all") {
      qb = qb.contains("tech_stack", [filters.techStack]);
    }

    if (filters?.query) {
      const q = filters.query.trim();
      qb = qb.or(`name.ilike.%${q}%,description.ilike.%${q}%,industry.ilike.%${q}%,location.ilike.%${q}%`);
    }

    const { data, error } = await qb.order("is_verified", { ascending: false }).order("name", { ascending: true });
    if (!error && data) {
      return data.map((c) => ({
        ...c,
        website: c.website_url || c.website,
        tech_stack: Array.isArray(c.tech_stack) ? c.tech_stack : [],
      }));
    }
  } catch (err) {
    console.error("Error fetching companies:", err);
  }

  return [];
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let qb = supabase.from("companies").select("*, owner:profiles!owner_id(*)");
    if (isUuid) {
      qb = qb.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      qb = qb.eq("slug", slug);
    }

    const { data: company, error } = await qb.maybeSingle();

    if (error || !company) {
      return null;
    }

    // Fetch related problems for this company
    const { data: problemsData } = await supabase
      .from("company_problems")
      .select("*, creator:profiles!created_by(*)")
      .eq("company_id", company.id)
      .in("status", ["open", "in_progress", "solved", "closed"])
      .order("created_at", { ascending: false });

    const problemIds = (problemsData || []).map((p) => p.id);

    // Fetch related solution ideas respecting visibility
    let solutions: Idea[] = [];
    if (problemIds.length > 0) {
      let ideasQuery = supabase
        .from("ideas")
        .select("*, creator:profiles!creator_id(*)")
        .or(`company_id.eq.${company.id},problem_id.in.(${problemIds.join(",")})`)
        .order("created_at", { ascending: false });

      if (user) {
        ideasQuery = ideasQuery.or(`visibility.in.(public,community),creator_id.eq.${user.id}`);
      } else {
        ideasQuery = ideasQuery.eq("visibility", "public");
      }

      const { data: rawIdeas } = await ideasQuery;
      if (rawIdeas) {
        solutions = rawIdeas.map((idea) => ({
          ...idea,
          author_id: idea.creator_id,
          author: idea.creator ? formatProfile(idea.creator, user?.id) : undefined,
          display_id: idea.display_id || `IDEA-${idea.id.substring(0, 8).toUpperCase()}`,
          status: (idea.stage?.toLowerCase() === "implemented" ? "implemented" : idea.stage?.toLowerCase() === "in_progress" ? "in_progress" : "open") as any,
        }));
      }
    }

    const problems: CompanyProblem[] = (problemsData || []).map((p) => ({
      ...p,
      required_skills: Array.isArray(p.required_skills) ? p.required_skills : [],
      creator: p.creator ? formatProfile(p.creator, user?.id) : null,
      company: {
        ...company,
        website: company.website_url || company.website,
      },
    }));

    return {
      ...company,
      website: company.website_url || company.website,
      tech_stack: Array.isArray(company.tech_stack) ? company.tech_stack : [],
      challenges_count: problems.length,
      problems,
      solutions,
    };
  } catch (err) {
    console.error("Error fetching company by slug:", err);
    return null;
  }
}

export async function createCompany(companyData: {
  name: string;
  description: string;
  industry: string;
  location: string;
  website_url?: string;
  logo_url?: string;
  size?: string;
  tech_stack?: string[];
}): Promise<Company> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to register a company.");
  }

  const baseSlug = companyData.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: companyData.name.trim(),
      slug,
      description: companyData.description.trim(),
      industry: companyData.industry,
      location: companyData.location.trim(),
      website_url: companyData.website_url?.trim() || null,
      logo_url: companyData.logo_url?.trim() || null,
      size: companyData.size || null,
      tech_stack: companyData.tech_stack || [],
      verification_status: "unverified",
      is_verified: false,
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...data,
    website: data.website_url,
  };
}

export async function requestCompanyVerification(data: {
  company_id: string;
  work_email: string;
  role_title: string;
  verification_document_url?: string;
}): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to request company verification.");
  }

  const { error } = await supabase.from("company_verifications").insert({
    company_id: data.company_id,
    user_id: user.id,
    work_email: data.work_email.trim(),
    role_title: data.role_title.trim(),
    verification_document_url: data.verification_document_url || null,
    status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }

  // Update company status to pending_verification
  await supabase
    .from("companies")
    .update({ verification_status: "pending_verification" })
    .eq("id", data.company_id);

  return { success: true };
}
