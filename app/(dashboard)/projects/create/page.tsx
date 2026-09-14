"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/app/(dashboard)/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderGit2, Globe, ImageIcon, Rocket } from "lucide-react";
import { Github } from "@/components/ui/brand-icons";

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("in_development");
  const [technologies, setTechnologies] = React.useState("");
  const [repositoryUrl, setRepositoryUrl] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !description.trim()) {
      setError("Please provide a project name and overview.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("status", status);
    formData.append("technologies", technologies);
    formData.append("repository_url", repositoryUrl);
    formData.append("website_url", websiteUrl);
    formData.append("image_url", imageUrl);

    try {
      const res = await createProjectAction(formData);
      if (res.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }

      router.push("/projects");
    } catch (err: any) {
      setError(err?.message || "Failed to create project.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      <Card className="border-border shadow-card bg-surface">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <FolderGit2 className="h-4 w-4" />
            <span>Launch Showcase</span>
          </div>
          <CardTitle className="text-xl">Showcase a New Project</CardTitle>
          <CardDescription>
            Display what your team has built, connect your GitHub repository, and attract contributors.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Project Name
              </label>
              <Input
                placeholder="e.g. Lumina Design Token Engine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Current Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="in_development">In Development (Building)</option>
                  <option value="beta">Public Beta</option>
                  <option value="launched">Launched</option>
                  <option value="idea">Idea / Prototype</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Technologies / Tech Stack (Comma-separated)
                </label>
                <Input
                  placeholder="Next.js, TypeScript, PostgreSQL, Docker"
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Project Overview & Architecture
              </label>
              <Textarea
                rows={5}
                placeholder="Explain the mission of this product, key technical architecture decisions, performance benchmarks, and how developers can participate..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  GitHub / Repository Link
                </label>
                <Input
                  placeholder="https://github.com/organization/repo"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  leftIcon={<Github className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Live Deployment Website URL
                </label>
                <Input
                  placeholder="https://yourproject.app"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  leftIcon={<Globe className="h-4 w-4" />}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Cover Image URL (Optional)
              </label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                leftIcon={<ImageIcon className="h-4 w-4" />}
              />
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Link href="/projects">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="default" isLoading={isLoading}>
                <Rocket className="h-4 w-4 mr-1.5" />
                Publish Showcase
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
