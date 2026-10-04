"use client";

import * as React from "react";
import { AlertTriangle, Archive, FolderGit2, Loader2 } from "lucide-react";

export interface DependentProject {
  id: string;
  name: string;
  status?: string;
}

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  isDeleting?: boolean;
  isArchiving?: boolean;
  error?: string | null;
  hasDependencies?: boolean;
  dependentProjects?: DependentProject[];
  onArchive?: () => void | Promise<void>;
  archiveText?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete Permanently",
  isDeleting = false,
  isArchiving = false,
  error = null,
  hasDependencies = false,
  dependentProjects = [],
  onArchive,
  archiveText = "Archive Idea",
}: DeleteConfirmModalProps) {
  const isBusy = isDeleting || isArchiving;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBusy, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isBusy) onClose();
        }}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0e14] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-6 z-10">
        {hasDependencies ? (
          /* DEPENDENCY / CANNOT DELETE STATE */
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Archive className="h-5 w-5" />
              </div>

              <div className="space-y-1.5 min-w-0">
                <h3 className="text-lg font-medium text-white tracking-tight">
                  Cannot Delete Idea
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  This idea is linked to active project work. To preserve project continuity, permanent deletion is blocked.
                </p>
              </div>
            </div>

            {dependentProjects.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-200">
                  <FolderGit2 className="h-3.5 w-3.5" />
                  <span>Linked Active Project{dependentProjects.length > 1 ? "s" : ""}:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dependentProjects.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-neutral-200 font-mono text-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-neutral-400 leading-relaxed font-light">
              <strong className="text-neutral-200 font-medium">Safe Archiving:</strong>{" "}
              Archiving removes this idea from public feeds and search while preserving your team&apos;s project work and repository references.
            </div>
          </div>
        ) : (
          /* STANDARD PERMANENT DELETION STATE */
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <h3 className="text-lg font-medium text-white tracking-tight">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-mono">
            {error}
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>

          {hasDependencies ? (
            <button
              type="button"
              onClick={onArchive}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_24px_rgba(245,158,11,0.35)]"
            >
              {isArchiving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Archiving...</span>
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  <span>{archiveText}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_24px_rgba(239,68,68,0.35)]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>{confirmText}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
