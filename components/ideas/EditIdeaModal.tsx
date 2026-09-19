"use client";

import * as React from "react";
import { X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { updateIdeaAction } from "@/app/(dashboard)/actions/ideas";
import { Idea } from "@/types";

interface EditIdeaModalProps {
  idea: Idea;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedIdea: Partial<Idea>) => void;
}

const CATEGORIES = [
  "AI & Machine Learning",
  "Developer Tools",
  "Climate & Sustainability",
  "Health & Biotech",
  "Security & Cloud",
  "Web3 & Open Source",
];

export function EditIdeaModal({
  idea,
  isOpen,
  onClose,
  onUpdated,
}: EditIdeaModalProps) {
  const [title, setTitle] = React.useState(idea.title || "");
  const [category, setCategory] = React.useState(idea.category || CATEGORIES[0]);
  const [tags, setTags] = React.useState(
    Array.isArray(idea.tags) ? idea.tags.join(", ") : ""
  );
  const resolveInitialValues = (i: Idea) => {
    let p = i.problem?.trim() || "";
    let s = i.solution?.trim() || "";
    if (!p && !s && i.description) {
      const parts = i.description.split(/\r?\n\r?\n/).map((part) => part.trim()).filter(Boolean);
      if (parts.length >= 2) {
        p = parts[0];
        s = parts.slice(1).join("\n\n");
      } else {
        p = i.description.trim();
        s = "";
      }
    }
    return { p, s };
  };

  const initialVals = resolveInitialValues(idea);
  const [problem, setProblem] = React.useState(initialVals.p);
  const [solution, setSolution] = React.useState(initialVals.s);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(idea.title || "");
      setCategory(idea.category || CATEGORIES[0]);
      setTags(Array.isArray(idea.tags) ? idea.tags.join(", ") : "");
      const { p, s } = resolveInitialValues(idea);
      setProblem(p);
      setSolution(s);
      setError(null);
    }
  }, [isOpen, idea]);

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
    if (!title.trim() || !category.trim()) {
      setError("Title and Category are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const pTrim = problem.trim();
    const sTrim = solution.trim();
    const desc = (pTrim && sTrim) ? `${pTrim}\n\n${sTrim}` : (pTrim || sTrim || title.trim());

    const formData = new FormData();
    formData.append("id", idea.id);
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("description", desc);
    formData.append("problem", pTrim);
    formData.append("solution", sTrim);
    formData.append("tags", tags);

    try {
      const res = await updateIdeaAction(formData);
      if (res.error) {
        setError(res.error);
      } else {
        onUpdated({
          title: title.trim(),
          category,
          description: desc,
          problem: pTrim,
          solution: sTrim,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        });
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update concept.");
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
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-lg font-medium text-white tracking-tight">
                Edit Concept Blueprint
              </h3>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              Modify the architectural thesis and parameters of this idea
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
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              Concept Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
              placeholder="e.g. Autonomous Satellite Constellation Router"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-indigo-500 focus:outline-none text-sm text-white transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0c0e14] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
                Tags (Comma-Separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors"
                placeholder="AI, Orbit, Rust, P2P"
              />
            </div>
          </div>

          {/* Problem Statement */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              The Problem (Contextual Friction)
            </label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors resize-none"
              placeholder="What core friction or market bottleneck does this address?"
            />
          </div>

          {/* Solution Statement */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-300">
              The Possibility (Architectural Solution)
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141721] border border-white/10 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder-neutral-500 transition-colors resize-none"
              placeholder="Describe the architectural model, mechanics, and technical approach..."
            />
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
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
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
