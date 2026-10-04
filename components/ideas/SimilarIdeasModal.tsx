"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  X,
  User,
  Calendar,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { SimilarIdeaMatch } from "@/types";

interface SimilarIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAnyway: () => void;
  matches: SimilarIdeaMatch[];
  isSubmitting?: boolean;
}

export function SimilarIdeasModal({
  isOpen,
  onClose,
  onContinueAnyway,
  matches,
  isSubmitting = false,
}: SimilarIdeasModalProps) {
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

  const highestSimilarity = matches.length > 0 ? matches[0] : null;
  const isHighSeverity = highestSimilarity?.similarity_level === "high";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0c0e14] shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4 bg-gradient-to-r from-white/[0.03] to-transparent">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "p-2.5 rounded-xl border shrink-0 mt-0.5",
                isHighSeverity
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  Concept Duplicate Detection
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full border",
                    isHighSeverity
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  )}
                >
                  {isHighSeverity ? "High Overlap" : "Moderate Overlap"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white tracking-wide">
                Potential Concept Overlap Detected
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                We discovered existing ideas with similar problem statements or solution approaches. Review them below to ensure your innovation brings a fresh angle or distinct contribution.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Similar Ideas List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 uppercase tracking-wider px-1">
            <span>Matched Concepts ({matches.length})</span>
            <span>Similarity Indicator</span>
          </div>

          {matches.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-400">
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                      {item.display_id || "IDEA-" + item.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-indigo-300">{item.category}</span>
                    <span className="text-neutral-500">•</span>
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                </div>

                {/* Similarity Badge */}
                <div className="shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium border",
                      item.similarity_level === "high"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                        : "bg-indigo-500/15 text-indigo-300 border-indigo-500/40"
                    )}
                  >
                    <span>{item.similarity_percentage}%</span>
                    <span className="text-[10px] opacity-75">
                      ({item.similarity_level === "high" ? "High" : "Moderate"})
                    </span>
                  </span>
                </div>
              </div>

              {/* Safe Content Preview */}
              {item.preview && (
                <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] text-xs text-neutral-300 leading-relaxed font-light line-clamp-2">
                  {item.preview}
                </div>
              )}

              {/* Creator & External View Button */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-2 text-neutral-400">
                  <div className="h-5 w-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-[10px] font-semibold text-neutral-200 shrink-0">
                    {item.creator?.avatar_url ? (
                      <img
                        src={item.creator.avatar_url}
                        alt={item.creator.full_name || "Creator"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (item.creator?.full_name || "I").charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-neutral-300 text-xs truncate max-w-[150px] sm:max-w-[220px]">
                    {item.creator?.full_name || "Anonymous Creator"}
                  </span>
                  {item.creator?.username && (
                    <span className="text-neutral-500 text-[11px] font-mono hidden sm:inline">
                      @{item.creator.username}
                    </span>
                  )}
                </div>

                <Link
                  href={`/ideas/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                >
                  <span>View Concept</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Guidance & Actions */}
        <div className="p-6 border-t border-white/[0.08] bg-[#090b10] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-neutral-400 leading-relaxed max-w-md text-center sm:text-left">
            <strong className="text-neutral-200">Note:</strong> Similarity is not proof of copying. If your solution introduces a novel angle, target audience, or execution, you may continue.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white transition-all disabled:opacity-50"
            >
              Refine My Concept
            </button>

            <button
              type="button"
              onClick={onContinueAnyway}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50"
            >
              <span>Continue Anyway</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
