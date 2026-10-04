"use client";

import * as React from "react";
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileText,
  Link as LinkIcon,
  HelpCircle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitIdeaReportAction } from "@/app/(dashboard)/actions/ideas";
import { Idea, IdeaReportReason } from "@/types";

interface ReportIdeaModalProps {
  idea: Idea;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS: {
  id: IdeaReportReason;
  label: string;
  description: string;
}[] = [
  {
    id: "possible_copying",
    label: "Possible Copying or Plagiarism",
    description: "Substantial similarity in core architecture, solution mechanism, or problem framing to a pre-existing concept.",
  },
  {
    id: "copyright_ip",
    label: "Copyright or IP Infringement",
    description: "Unauthorized reproduction of proprietary assets, patent-pending algorithms, or protected designs.",
  },
  {
    id: "misleading_ownership",
    label: "Misleading Origin or False Attribution",
    description: "Claiming origin or sole authorship of a project/team effort without authorization.",
  },
  {
    id: "other",
    label: "Other Policy Violation",
    description: "Spam, fraudulent submission, or violation of IdeaEra community standards.",
  },
];

export function ReportIdeaModal({
  idea,
  isOpen,
  onClose,
  onSuccess,
}: ReportIdeaModalProps) {
  const [reason, setReason] = React.useState<IdeaReportReason>("possible_copying");
  const [description, setDescription] = React.useState("");
  const [originalIdeaInput, setOriginalIdeaInput] = React.useState("");
  const [evidenceUrl, setEvidenceUrl] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setReason("possible_copying");
      setDescription("");
      setOriginalIdeaInput("");
      setEvidenceUrl("");
      setError(null);
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

  // Extract UUID or Display ID from original idea input if user pasted a URL or ID
  const parseOriginalIdeaId = (input: string): string | undefined => {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    // Check if full URL: e.g. /ideas/uuid or /ideas/IDEA-1234
    const urlMatch = trimmed.match(/\/ideas\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError("Please provide a detailed explanation (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const originalIdeaId = parseOriginalIdeaId(originalIdeaInput);

      const res = await submitIdeaReportAction({
        ideaId: idea.id,
        reason,
        description: description.trim(),
        originalIdeaId,
        evidenceUrl: evidenceUrl.trim() || undefined,
      });

      if (!res.success) {
        if (res.code === "ALREADY_REPORTED") {
          setError("You already have an active pending report for this idea under moderation review.");
        } else if (res.code === "CANNOT_REPORT_OWN_IDEA") {
          setError("You cannot report your own idea.");
        } else {
          setError(res.error || "Failed to submit report. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0c0e14] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Report Submitted Confidentiality</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Thank you for safeguarding the IdeaEra innovation ecosystem. Our moderation committee will examine this report impartially.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-mono uppercase tracking-wider text-white transition-all border border-white/15"
              >
                Close Notice
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  Concept Integrity Review
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide">
                  Report Concept
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-1">
                  Reporting: <span className="text-neutral-200 font-medium">{idea.title}</span>
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Reason Radio Group */}
            <div className="space-y-2.5">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <span>Reason for Report</span>
                <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => {
                  const isSelected = reason === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setReason(r.id)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                        isSelected
                          ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                          : "bg-white/[0.02] border-white/[0.08] hover:border-white/20"
                      )}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        checked={isSelected}
                        onChange={() => setReason(r.id)}
                        className="mt-0.5 h-3.5 w-3.5 text-indigo-500 focus:ring-0 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-white block">
                          {r.label}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-light leading-relaxed block">
                          {r.description}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reference Original Idea Field (optional or if copying) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span>Alleged Original Idea (URL or ID)</span>
                <span className="text-[10px] text-neutral-500 lowercase font-sans">optional</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-3 h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={originalIdeaInput}
                  onChange={(e) => setOriginalIdeaInput(e.target.value)}
                  placeholder="https://ideaera.vercel.app/ideas/... or IDEA-XXXXXX"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Explanation / Description Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <span>Explanation & Context</span>
                <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the specific similarities or infringement details. What parts of the problem, technology, or solution were copied?"
                rows={4}
                required
                className="w-full p-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/60 transition-colors leading-relaxed"
              />
              <p className="text-[10px] font-mono text-neutral-500">
                Minimum 10 characters ({description.trim().length}/10)
              </p>
            </div>

            {/* Evidence URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span>Evidence or Documentation URL</span>
                <span className="text-[10px] text-neutral-500 lowercase font-sans">optional</span>
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://github.com/... or https://arxiv.org/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            {/* Confidentiality Notice */}
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5 text-[11px] text-neutral-400">
              <Lock className="h-3.5 w-3.5 text-neutral-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-light">
                All reports are strictly confidential. The idea creator will receive administrative guidance only if a substantiated policy violation is confirmed.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || description.trim().length < 10}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-red-900/50 disabled:text-neutral-500 text-white text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Confidential Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
