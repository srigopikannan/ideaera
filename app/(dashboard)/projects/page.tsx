import { getMyProjectsAction } from "@/app/(dashboard)/actions/projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { FolderKanban, Plus, ExternalLink, Calendar } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function ProjectsPage() {
  const projects = await getMyProjectsAction();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">Manage your active collaborations and build milestones.</p>
        </div>
        <Button asChild className="w-fit">
          <NextLink href="/projects/create" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </NextLink>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-20 border-2 border-dashed rounded-3xl">
            <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground">Start a new project or convert an idea into one.</p>
            <div className="flex justify-center gap-3 mt-6">
              <Button asChild variant="outline">
                <NextLink href="/projects/create">Create Project</NextLink>
              </Button>
              <Button asChild>
                <NextLink href="/ideas">Explore Ideas</NextLink>
              </Button>
            </div>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {project.status}
                  </Badge>
                  <div className="flex gap-1">
                    {project.repository_url && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                        <NextLink href={project.repository_url} target="_blank"><ExternalLink className="h-3 w-3" /></NextLink>
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl line-clamp-1">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-6 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Updated {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1">
                  <NextLink href={`/projects/${project.id}`}>
                    Open Workspace
                  </NextLink>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Missing Badge import
import { Badge } from "@/components/ui/badge";
