import { notFound } from "next/navigation";
import { getIdeaById, getIdeaComments, getIdeaValidationData } from "@/services/ideas";
import { getCurrentUserProfile } from "@/services/profile";
import { IdeaDetailView } from "@/components/ideas/IdeaDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await getIdeaById(id);
  if (!idea) return { title: "Idea Not Found — IdeaEra" };
  return {
    title: `${idea.title} — IdeaEra`,
    description: idea.description.slice(0, 150),
  };
}

export default async function IdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [idea, comments, currentUser, validationData] = await Promise.all([
    getIdeaById(id),
    getIdeaComments(id),
    getCurrentUserProfile(),
    getIdeaValidationData(id),
  ]);

  if (!idea) {
    notFound();
  }

  return (
    <IdeaDetailView
      idea={idea}
      initialComments={comments}
      currentUser={currentUser}
      initialValidationData={validationData}
    />
  );
}
