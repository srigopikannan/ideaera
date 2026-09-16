import { getProjects } from "@/services/projects";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { FolderGit2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects Showcase — IdeaEra",
  description: "Explore innovative products, software tools, and prototypes built by the community.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
          <FolderGit2 className="h-4 w-4" />
          <span>Product Showcase</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Built on IdeaEra.
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Discover deployed web applications, developer tooling, open-source repositories, and autonomous systems engineered by community members.
        </p>
      </div>

      <ProjectsExplorer initialProjects={projects} />
    </div>
  );
}
