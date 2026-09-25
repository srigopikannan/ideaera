"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { markProjectNeedsHelpAction } from "@/app/(dashboard)/actions/projects";
import {
  AlertTriangle,
  LifeBuoy,
  X,
  Code2,
  Palette,
  Cpu,
  Database,
  Layout,
  Layers,
  Search,
  TrendingUp,
  Compass,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectRescueModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: "Developer", label: "Developer", icon: Code2, desc: "General software development & architecture" },
  { id: "Frontend", label: "Frontend", icon: Layout, desc: "React, Next.js, UI engineering & animations" },
  { id: "Backend", label: "Backend", icon: Database, desc: "APIs, databases, server actions & auth" },
  { id: "AI/ML", label: "AI/ML", icon: Cpu, desc: "LLMs, embeddings, computer vision & agents" },
  { id: "Designer", label: "Designer", icon: Palette, desc: "Figma design, graphic assets & branding" },
  { id: "UI/UX", label: "UI/UX", icon: Layers, desc: "User flows, prototyping & micro-interactions" },
  { id: "Researcher", label: "Researcher", icon: Search, desc: "Academic research, data analysis & synthesis" },
  { id: "Business/Marketing", label: "Business/Marketing", icon: TrendingUp, desc: "Growth, pitch deck, go-to-market" },
  { id: "Mentor/Guidance", label: "Mentor/Guidance", icon: Compass, desc: "Code review, architecture guidance" },
  { id: "Other", label: "Other", icon: HelpCircle, desc: "Any other operational blocker" },
];

export function ProjectRescueModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}: ProjectRescueModalProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState("Developer");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe what your team is stuck on.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await markProjectNeedsHelpAction(
      projectId,
      selectedCategory,
      description.trim()
    );

    setIsSubmitting(false);

    if (res.success) {
      onSuccess?.();
      onClose();
      router.refresh();
    } else {
      setError(res.error || "Failed to flag project for rescue.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-rose-500/30 bg-[#0e111a] p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <LifeBuoy className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-light text-white flex items-center gap-2">
                <span>Activate Project Rescue</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                  Needs Help
                </span>
              </h3>
              <p className="text-xs font-mono text-neutral-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                For &quot;{projectName}&quot;
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
              What kind of talent / assistance do you need?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => {
                const CatIcon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all flex items-center gap-2.5",
                      isSelected
                        ? "border-rose-500 bg-rose-500/10 text-white ring-1 ring-rose-500/40"
                        : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white"
                    )}
                  >
                    <CatIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-rose-400" : "text-neutral-500"
                      )}
                    />
                    <div className="truncate">
                      <span className="text-xs font-mono font-medium block truncate">
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blocker Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
              Describe the specific blocker or problem
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Stuck on PostgreSQL real-time sync with Supabase and edge cases in the notification stream..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-rose-500 resize-none font-sans"
            />
            <p className="text-[11px] font-mono text-neutral-500">
              This explanation will be shown to prospective rescue collaborators and mentors.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-white/10 text-neutral-400 hover:text-white text-xs font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/30 disabled:opacity-40"
            >
              <LifeBuoy className="h-4 w-4" />
              <span>{isSubmitting ? "Broadcasting..." : "Request Rescue"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
