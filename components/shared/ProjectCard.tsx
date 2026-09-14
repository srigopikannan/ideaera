"use client";

import Link from "next/link";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Globe, GitFork, Users } from "lucide-react";
import { Github } from "@/components/ui/brand-icons";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "launched":
        return <Badge variant="success">Launched</Badge>;
      case "beta":
        return <Badge variant="accent">Beta</Badge>;
      case "in_development":
        return <Badge variant="default">Building</Badge>;
      case "idea":
        return <Badge variant="secondary">Idea Phase</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-border/90 flex flex-col justify-between group">
      <div>
        {/* Cover Image Banner */}
        <div className="relative h-44 w-full bg-muted overflow-hidden">
          <img
            src={
              project.image_url ||
              "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"
            }
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3">{getStatusBadge(project.status)}</div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/projects/${project.slug}`}
              className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate"
            >
              {project.name}
            </Link>
          </div>

          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Tech Stack Pills */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3.5">
              {project.technologies.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                >
                  {tech}
                </span>
              ))}
              {project.technologies.length > 4 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{project.technologies.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Details */}
      <div className="p-5 pt-0">
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>
              {project.members?.length || 1}{" "}
              {(project.members?.length || 1) === 1 ? "member" : "members"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                title="GitHub Repo"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.website_url && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                title="Live Website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
            <Link
              href={`/projects/${project.slug}`}
              className="text-xs font-semibold text-primary hover:underline ml-1"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
