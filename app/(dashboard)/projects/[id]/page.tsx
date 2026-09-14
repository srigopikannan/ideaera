import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/services/projects";
import { getCurrentUserProfile } from "@/services/profile";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (!project) return { title: "Project Not Found — IdeaEra" };
  return {
    title: `${project.name} — IdeaEra Project Showcase`,
    description: project.description.slice(0, 150),
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, currentUser] = await Promise.all([
    getProjectBySlug(id),
    getCurrentUserProfile(),
  ]);

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} currentUser={currentUser} />;
}
