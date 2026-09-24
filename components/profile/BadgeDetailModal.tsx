"use client";

import * as React from "react";
import { BadgeWithProgress } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Lightbulb,
  FolderGit2,
  Users,
  Trophy,
  Sparkles,
  Rocket,
  UserCheck,
  Zap,
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeDetailModalProps {
  badge: BadgeWithProgress | null;
  isOpen: boolean;
  onClose: () => void;
}

export function getBadgeIconComponent(iconName: string) {
  switch (iconName?.toLowerCase()) {
    case "lightbulb":
      return Lightbulb;
    case "foldergit2":
      return FolderGit2;
    case "users":
      return Users;
    case "trophy":
      return Trophy;
    case "sparkles":
      return Sparkles;
    case "rocket":
      return Rocket;
    case "usercheck":
      return UserCheck;
    case "zap":
      return Zap;
    case "award":
    default:
      return Award;
  }
}

export function getTierColors(tier: string, isEarned: boolean = true) {
  switch (tier?.toLowerCase()) {
    case "gold":
      return {
        border: isEarned ? "border-amber-400/50" : "border-amber-500/20",
        bg: isEarned ? "bg-gradient-to-b from-amber-500/20 via-amber-950/20 to-black/80" : "bg-[#0c0d12]",
        glow: isEarned ? "shadow-[0_0_30px_rgba(245,158,11,0.25)]" : "",
        accentText: "text-amber-400",
        badgeBg: "bg-amber-400/10 text-amber-300 border-amber-400/30",
        iconBg: isEarned ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-500/30" : "bg-neutral-800 text-neutral-500",
        tag: "Gold Tier",
      };
    case "silver":
      return {
        border: isEarned ? "border-slate-300/40" : "border-slate-500/20",
        bg: isEarned ? "bg-gradient-to-b from-slate-400/15 via-slate-900/30 to-black/80" : "bg-[#0c0d12]",
        glow: isEarned ? "shadow-[0_0_25px_rgba(203,213,225,0.18)]" : "",
        accentText: "text-slate-200",
        badgeBg: "bg-slate-300/10 text-slate-200 border-slate-300/30",
        iconBg: isEarned ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 shadow-md shadow-slate-400/20" : "bg-neutral-800 text-neutral-500",
        tag: "Silver Tier",
      };
    case "bronze":
    default:
      return {
        border: isEarned ? "border-orange-500/40" : "border-orange-500/20",
        bg: isEarned ? "bg-gradient-to-b from-orange-600/15 via-orange-950/20 to-black/80" : "bg-[#0c0d12]",
        glow: isEarned ? "shadow-[0_0_20px_rgba(249,115,22,0.15)]" : "",
        accentText: "text-orange-300",
        badgeBg: "bg-orange-500/10 text-orange-300 border-orange-500/30",
        iconBg: isEarned ? "bg-gradient-to-br from-orange-400 to-amber-700 text-black shadow-md shadow-orange-500/20" : "bg-neutral-800 text-neutral-500",
        tag: "Bronze Tier",
      };
  }
}

export function BadgeDetailModal({ badge, isOpen, onClose }: BadgeDetailModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !badge) return null;

  const IconComp = getBadgeIconComponent(badge.icon);
  const tierStyle = getTierColors(badge.tier, badge.is_earned);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-3xl border bg-[#0a0c13] text-left shadow-2xl transition-all z-10 animate-in zoom-in-95 duration-200",
          tierStyle.border,
          tierStyle.glow
        )}
      >
        {/* Subtle decorative background gradient */}
        <div
          className={cn(
            "absolute -top-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-30 pointer-events-none",
            badge.tier === "gold" ? "bg-amber-500" : badge.tier === "silver" ? "bg-slate-300" : "bg-orange-500"
          )}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 rounded-full p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header with Icon and Tier Badge */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "h-16 w-16 sm:h-20 sm:w-20 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 transition-transform",
                tierStyle.iconBg
              )}
            >
              <IconComp className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border font-medium",
                    tierStyle.badgeBg
                  )}
                >
                  {tierStyle.tag}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-neutral-300">
                  {badge.category.replace("_", " ")}
                </span>

                {badge.is_earned ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border border-neutral-700 bg-neutral-900 text-neutral-400">
                    <Lock className="h-3 w-3" />
                    Locked ({badge.percentage}%)
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-light text-white tracking-wide">
                {badge.name}
              </h3>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              {badge.description}
            </p>
          </div>

          {/* Why It Matters */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-400 font-medium">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Why This Matters</span>
            </div>
            <p className="text-xs text-neutral-300 font-light leading-relaxed">
              {badge.why_it_matters}
            </p>
          </div>

          {/* Criteria & Progress Section */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-neutral-500" />
                Qualification Criteria
              </span>
              <span className={badge.is_earned ? "text-emerald-400 font-medium" : "text-neutral-300"}>
                {badge.is_earned ? "Completed" : `${badge.current_value} / ${badge.criteria_value}`}
              </span>
            </div>

            <p className="text-xs text-neutral-300 font-mono">
              {badge.criteria_description}
            </p>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    badge.is_earned
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-gradient-to-r from-indigo-500 to-purple-500"
                  )}
                  style={{ width: `${badge.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>0%</span>
                <span>{badge.percentage}% Achieved</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Verification & Metadata Section */}
          {badge.is_earned && (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-medium">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified Achievement Record</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-neutral-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Awarded: {badge.awarded_at ? formatDate(badge.awarded_at) : "Verified"}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Authority: </span>
                  <span className="text-neutral-300 capitalize">{badge.awarded_by || "System Core"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
