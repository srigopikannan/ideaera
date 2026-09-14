import { createClient } from "@/lib/supabase/server";
import { Company } from "@/types";

export async function getCompanies(industry?: string, query?: string): Promise<Company[]> {
  try {
    const supabase = await createClient();
    let qb = supabase.from("companies").select("*, owner:profiles!owner_id(*)");

    if (industry && industry !== "All") {
      qb = qb.eq("industry", industry);
    }
    if (query) {
      qb = qb.or(`name.ilike.%${query}%,description.ilike.%${query}%,industry.ilike.%${query}%`);
    }

    const { data, error } = await qb.order("created_at", { ascending: false });
    if (!error && data) {
      return data.map((c) => ({
        ...c,
        website: c.website_url || c.website,
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
    const { data, error } = await supabase
      .from("companies")
      .select("*, owner:profiles!owner_id(*)")
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();

    if (data && !error) {
      return {
        ...data,
        website: data.website_url || data.website,
      };
    }
  } catch (err) {
    console.error("Error fetching company by slug:", err);
  }

  return null;
}

export async function createCompany(companyData: {
  name: string;
  description: string;
  industry: string;
  location: string;
  website_url?: string;
  logo_url?: string;
  size?: string;
}): Promise<Company> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      name: companyData.name,
      slug,
      description: companyData.description,
      industry: companyData.industry,
      location: companyData.location,
      website_url: companyData.website_url || null,
      logo_url: companyData.logo_url || null,
      size: companyData.size || null,
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
