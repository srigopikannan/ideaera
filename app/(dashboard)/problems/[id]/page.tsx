import { notFound } from "next/navigation";
import { getProblemByIdOrSlug } from "@/services/problems";
import { ProblemDetailView } from "@/components/problems/ProblemDetailView";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problem = await getProblemByIdOrSlug(id);
  if (!problem) return { title: "Problem Not Found — IdeaEra" };
  return {
    title: `${problem.title} — ${problem.company?.name || "Company"} Challenge | IdeaEra`,
    description: problem.summary,
  };
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problem = await getProblemByIdOrSlug(id);

  if (!problem) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ProblemDetailView problem={problem} currentUserId={user?.id} />;
}
