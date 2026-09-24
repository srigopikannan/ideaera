"use client";

import * as React from "react";
import { BadgeWithProgress } from "@/types";
import { UserBadgesResult } from "@/services/badges";
import {
  BadgeDetailModal,
  getBadgeIconComponent,
  getTierColors,
} from "./BadgeDetailModal";
import { formatDate } from "@/lib/utils";
import {
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementsSectionProps {
  badgesResult?: UserBadgesResult | null;
  isCurrentUser: boolean;
}

type FilterTab = "all" | "earned" | "in_progress" | "gold" | "silver" | "bronze";

export function AchievementsSection({
  badgesResult,
  isCurrentUser,
}: AchievementsSectionProps) {
  const [selectedBadge, setSelectedBadge] = React.useState<BadgeWithProgress | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("all");

  if (!badgesResult || !badgesResult.all || badgesResult.all.length === 0) {
    return null;
  }

  const { earned, in_progress, all, summary } = badgesResult;

  const filteredBadges = React.useMemo(() => {
    switch (activeFilter) {
      case "earned":
        return earned;
      case "in_progress":
        return in_progress;
      case "gold":
        return all.filter((b) => b.tier === "gold");
      case "silver":
        return all.filter((b) => b.tier === "silver");
      case "bronze":
        return all.filter((b) => b.tier === "bronze");
      case "all":
      default:
        return all;
    }
  }, [activeFilter, all, earned, in_progress]);

  return (
    <div className="space-y-6">
      {/* Header with Title and Prestige Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-light text-white tracking-wide">
              Achievements & Recognition
            </h2>
          </div>
          <p className="text-xs text-neutral-400 font-light">
            Verified performance milestones earned through real innovation, building, and collaboration.
          </p>
        </div>

        {/* Quick Prestige Tag */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold">{summary.prestige_score}</span>
            <span className="text-amber-400/70 text-[10px] uppercase tracking-wider">Prestige Pts</span>
          </div>

          <div className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-300 text-xs font-mono">
            <span className="text-white font-medium">{summary.total_earned}</span>
            <span className="text-neutral-500 text-[10px] uppercase tracking-wider ml-1">/ {summary.total_available}</span>
          </div>
        </div>
      </div>

      {/* Tier Badges & Stats Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-3xl border border-white/10 bg-[#0a0c13]">
        <div className="space-y-1 text-center sm:text-left sm:border-r sm:border-white/5 sm:pr-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            Total Earned
          </div>
          <div className="text-xl font-light text-white flex items-baseline justify-center sm:justify-start gap-1">
            <span>{summary.total_earned}</span>
            <span className="text-xs text-neutral-500 font-mono">({summary.completion_rate}%)</span>
          </div>
        </div>

        <div className="space-y-1 text-center sm:text-left sm:border-r sm:border-white/5 sm:px-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center justify-center sm:justify-start gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Gold Tier
          </div>
          <div className="text-xl font-light text-amber-300">
            {summary.gold_count}
          </div>
        </div>

        <div className="space-y-1 text-center sm:text-left sm:border-r sm:border-white/5 sm:px-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-300 flex items-center justify-center sm:justify-start gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            Silver Tier
          </div>
          <div className="text-xl font-light text-slate-200">
            {summary.silver_count}
          </div>
        </div>

        <div className="space-y-1 text-center sm:text-left sm:pl-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-orange-400 flex items-center justify-center sm:justify-start gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            Bronze Tier
          </div>
          <div className="text-xl font-light text-orange-300">
            {summary.bronze_count}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition-all shrink-0",
            activeFilter === "all"
              ? "bg-white text-black border-white font-medium"
              : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-white/20"
          )}
        >
          All ({all.length})
        </button>

        <button
          onClick={() => setActiveFilter("earned")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition-all shrink-0 flex items-center gap-1.5",
            activeFilter === "earned"
              ? "bg-emerald-500 text-white border-emerald-400 font-medium"
              : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-white/20"
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
          Earned ({earned.length})
        </button>

        <button
          onClick={() => setActiveFilter("in_progress")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition-all shrink-0 flex items-center gap-1.5",
            activeFilter === "in_progress"
              ? "bg-indigo-600 text-white border-indigo-500 font-medium"
              : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-white/20"
          )}
        >
          <TrendingUp className="h-3 w-3" />
          In Progress ({in_progress.length})
        </button>

        <span className="text-neutral-600 mx-1">|</span>

        <button
          onClick={() => setActiveFilter("gold")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition-all shrink-0 text-amber-300",
            activeFilter === "gold"
              ? "bg-amber-500/20 border-amber-400 text-amber-200 font-medium"
              : "border-amber-500/20 bg-amber-500/5 hover:border-amber-400/40"
          )}
        >
          Gold
        </button>

        <button
          onClick={() => setActiveFilter("silver")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition-all shrink-0 text-slate-300",
            activeFilter === "silver"
              ? "bg-slate-400/20 border-slate-300 text-slate-100 font-medium"
              : "border-slate-400/20 bg-slate-400/5 hover:border-slate-300/40"
          )}
        >
          Silver
        </button>

        <button
          onClick={() => setActiveFilter("bronze")}
          className={cn(
            "px-3 py-1.5 rounded-full border transition-all shrink-0 text-orange-300",
            activeFilter === "bronze"
              ? "bg-orange-500/20 border-orange-400 text-orange-200 font-medium"
              : "border-orange-500/20 bg-orange-500/5 hover:border-orange-400/40"
          )}
        >
          Bronze
        </button>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <div className="p-8 rounded-3xl border border-white/10 bg-[#0a0c13] text-center space-y-2">
          <p className="text-sm text-neutral-400 font-light">
            No badges match this filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const IconComp = getBadgeIconComponent(badge.icon);
            const tierStyle = getTierColors(badge.tier, badge.is_earned);

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={cn(
                  "group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:translate-y-[-2px]",
                  badge.is_earned
                    ? `${tierStyle.bg} ${tierStyle.border} hover:border-white/30 ${tierStyle.glow}`
                    : "bg-[#0a0c13] border-white/10 hover:border-white/20 opacity-80 hover:opacity-100"
                )}
              >
                {/* Top Row: Icon + Tier Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10 transition-transform group-hover:scale-105",
                      tierStyle.iconBg
                    )}
                  >
                    <IconComp className="h-6 w-6" />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border font-medium",
                        tierStyle.badgeBg
                      )}
                    >
                      {tierStyle.tag}
                    </span>

                    {badge.is_earned ? (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {badge.percentage}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Title & Brief Description */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Bottom Row: Progress Bar or Award Date */}
                <div className="pt-2 border-t border-white/[0.06] text-[10px] font-mono">
                  {badge.is_earned ? (
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Awarded {badge.awarded_at ? formatDate(badge.awarded_at) : "Verified"}</span>
                      <span className="text-neutral-500 group-hover:text-white transition-colors flex items-center gap-0.5">
                        Details <ChevronRight className="h-3 w-3 inline" />
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="truncate">{badge.criteria_description}</span>
                        <span className="shrink-0 ml-1 text-neutral-300 font-medium">{badge.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${badge.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
}
