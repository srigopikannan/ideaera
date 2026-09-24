import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/services/companies";
import { CompanyProfileView } from "@/components/companies/CompanyProfileView";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "Company Not Found — IdeaEra" };
  return {
    title: `${company.name} — Real-World Problems & Solutions | IdeaEra`,
    description: company.description.slice(0, 160),
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <CompanyProfileView company={company} currentUserId={user?.id} />;
}
