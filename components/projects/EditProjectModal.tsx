"use client";

import * as React from "react";
import { X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { updateProjectAction } from "@/app/(dashboard)/actions/projects";
import { Project } from "@/types";

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedProject: Partial<Project>) => void;
}

const STATUS_OPTIONS = [
  { value: "idea", label: "Idea / Concept" },
  { value: "in_development", label: "In Development" },
  { value: "beta", label: "Beta / Testing" },
  { value: "launched", label: "Launched / Live" },
];

export function EditProjectModal({
  project,
  isOpen,
  onClose,
  onUpdated,
}: EditProjectModalProps) {
  const [name, setName] = React.useState(project.name || "");
  const [description, setDescription] = React.useState(project.description || "");
  const [status, setStatus] = React.useState(project.status || "in_development");
  const [technologies, setTechnologies] = React.useState(
    Array.isArray(project.technologies) ? project.technologies.join(", ") : ""
  );
  const [repositoryUrl, setRepositoryUrl] = React.useState(project.repository_url || "");
  const [websiteUrl, setWebsiteUrl] = React.useState(project.website_url || "");
  const [imageUrl, setImageUrl] = React.useState(project.image_url || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "in_development");
      setTechnologies(
        Array.isArray(project.technologies) ? project.technologies.join(", ") : ""
      );
      setRepositoryUrl(project.repository_url || "");
      setWebsiteUrl(project.website_url || "");
      setImageUrl(project.image_url || "");
      setError(null);
    }
  }, [isOpen, project]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Venture name and description are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("id", project.id);
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("status", status);
    formData.append("technologies", technologies);
    formData.append("repository_url", repositoryUrl.trim());
    formData.append("website_url", websiteUrl.trim());
    formData.append("image_url", imageUrl.trim());

    try {
      const res = await updateProjectAction(formData);
      if (res.error) {
        setError(res.error);
      } else {
        const parsedTech = technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        onUpdated({
          name: name.trim(),
          description: description.trim(),
          status: status as any,
          technologies: parsedTech,
          repository_url: repositoryUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          image_url: imageUrl.trim() || null,
        });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0e14] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-6 z-10 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="text-lg font-medium text-white tracking-tight">
                Edit Venture Blueprint
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              Update project specifications, evolution stage, and access links
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Venture Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
                placeholder="e.g. Hyperion Protocol"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Evolution Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white transition-colors"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0c0e14] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              System Overview & Thesis <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors resize-none"
              placeholder="What does this venture build and solve?"
            />
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Technology Stack (Comma-Separated)
            </label>
            <input
              type="text"
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
              placeholder="Next.js, Rust, Tailwind CSS, PostgreSQL"
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Repository URL
              </label>
              <input
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
                placeholder="https://github.com/..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Deployment / Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
                placeholder="https://myproject.com"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
