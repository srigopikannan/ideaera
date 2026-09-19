"use client";

import * as React from "react";
import Link from "next/link";
import { Hackathon } from "@/types";
import { SyncHackathonsButton } from "@/components/hackathons/SyncHackathonsButton";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";
import {
  Trophy,
  Globe,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  ArrowUpRight,
  Plus,
  Radio,
} from "lucide-react";
import { cn, formatDate, formatEventDateRange, formatRegistrationDeadline } from "@/lib/utils";

interface HackathonsExplorerProps {
  initialHackathons: Hackathon[];
}

export function HackathonsExplorer({ initialHackathons }: HackathonsExplorerProps) {
  const [hackathons, setHackathons] = React.useState<Hackathon[]>(initialHackathons);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRegion, setSelectedRegion] = React.useState<"all" | "Tamil Nadu" | "India" | "Asia" | "Global">("all");
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "live" | "upcoming" | "past" | "online" | "in-person">("all");

  React.useEffect(() => {
    setHackathons(initialHackathons);
  }, [initialHackathons]);

  const regionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: hackathons.length,
      "Tamil Nadu": 0,
      India: 0,
      Asia: 0,
      Global: 0,
    };
    hackathons.forEach((h) => {
      const r = h.region || "Global";
      if (r in counts) {
        counts[r]++;
      } else {
        counts.Global++;
      }
    });
    return counts;
  }, [hackathons]);

  const filteredHackathons = React.useMemo(() => {
    return hackathons.filter((h) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        h.title.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        (h.organizer || "").toLowerCase().includes(q) ||
        (h.region || "").toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q);

      let matchesFilter = true;
      if (selectedFilter === "live") {
        matchesFilter = h.status === "ongoing";
      } else if (selectedFilter === "upcoming") {
        matchesFilter = h.status === "upcoming";
      } else if (selectedFilter === "past") {
        matchesFilter = h.status === "ended";
      } else if (selectedFilter === "online") {
        matchesFilter = h.mode === "Online" || h.mode === "Hybrid";
      } else if (selectedFilter === "in-person") {
        matchesFilter = h.mode === "In-Person" || h.mode === "Hybrid";
      }

      let matchesRegion = true;
      if (selectedRegion !== "all") {
        matchesRegion = (h.region || "Global") === selectedRegion;
      }

      return matchesSearch && matchesFilter && matchesRegion;
    });
  }, [hackathons, searchQuery, selectedFilter, selectedRegion]);

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-10 select-none overflow-x-hidden">
      {/* Top Ambient HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
              TEMPORAL EVENT RADAR // COMPETITIVE SPRINTS
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extralight text-white uppercase tracking-tight">
            Sprint Horizon.
          </h1>
        </div>

        {/* Global Conduits */}
        <div className="flex flex-wrap items-center gap-3">
          <SyncHackathonsButton />
          <Link
            href="/hackathons/submit"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all shadow-xl hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Sprint</span>
          </Link>
        </div>
      </div>

      {/* Floating Filter Radar Capsule */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Region Selector Pills */}
        <div className="inline-flex items-center max-w-full overflow-x-auto no-scrollbar p-1 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shrink-0 gap-1">
          {(["all", "Tamil Nadu", "India", "Asia", "Global"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={cn(
                "px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all shrink-0",
                selectedRegion === r
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {r === "all" ? "All Sectors" : r} ({regionCounts[r] || 0})
            </button>
          ))}
        </div>

        {/* Status Mode Selector */}
        <div className="inline-flex items-center max-w-full overflow-x-auto no-scrollbar p-1 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shrink-0">
          {[
            { label: "ALL STATUS", value: "all" },
            { label: "LIVE NOW", value: "live" },
            { label: "UPCOMING", value: "upcoming" },
            { label: "CONCLUDED", value: "past" },
            { label: "ONLINE", value: "online" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedFilter(f.value as any)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all shrink-0",
                selectedFilter === f.value
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sprint Cards Matrix */}
      {filteredHackathons.length === 0 ? (
        <div className="py-20 flex items-center justify-center">
          <LivingEmptyState
            title="NO COMPETITIVE SPRINTS DETECTED IN THIS SECTOR."
            subtitle="Broadcast an enterprise or collegiate hackathon into the temporal horizon."
            actionText="Submit Sprint"
            actionHref="/hackathons/submit"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hack) => {
            const isLive = hack.status === "ongoing";
            const isEnded = hack.status === "ended";
            const eventDatesStr = formatEventDateRange(hack.start_date, hack.end_date);
            const regDeadline = formatRegistrationDeadline(hack.registration_deadline);

            return (
              <Link
                key={hack.id}
                href={`/hackathons/${hack.id}`}
                className="group relative rounded-3xl border border-white/10 bg-[#0a0c13]/75 backdrop-blur-xl p-5 sm:p-8 space-y-5 sm:space-y-6 hover:border-amber-500/40 hover:bg-[#0e111a] transition-all duration-300 shadow-xl flex flex-col justify-between block"
              >
                <div className="space-y-4">
                  {/* Status Indicator & Mode */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          isLive
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"
                            : isEnded
                            ? "bg-neutral-500"
                            : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                        )}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                        {isLive ? "LIVE IN PROGRESS" : isEnded ? "CONCLUDED" : "UPCOMING SPRINT"}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 border border-white/10 px-2.5 py-0.5 rounded-full">
                      {hack.mode || "ONLINE"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-light text-white group-hover:text-amber-200 transition-colors leading-snug">
                      {hack.title}
                    </h3>
                    {hack.organizer && (
                      <p className="text-xs text-neutral-400 font-mono pt-1">
                        Hosted by {hack.organizer}
                      </p>
                    )}
                    <p className="text-xs text-neutral-400 font-light pt-2 line-clamp-2 leading-relaxed">
                      {hack.description}
                    </p>
                  </div>

                  {/* Prize Telemetry */}
                  {hack.prize_pool && (
                    <div className="p-3 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                        PRIZE ALLOCATION
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-200">
                        {hack.prize_pool}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {hack.tags && hack.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hack.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.03] border border-white/10 text-neutral-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Horizon Metrics */}
                <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5 text-[10px] font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="font-medium text-[11px]">{eventDatesStr}</span>
                    </div>

                    {hack.registration_deadline && (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-wider shrink-0",
                          regDeadline.isClosed
                            ? "border-red-500/20 text-red-400/90 bg-red-500/10"
                            : "border-amber-500/25 text-amber-300 bg-amber-500/10"
                        )}
                      >
                        {regDeadline.text}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-neutral-500 pt-0.5">
                    <span className="line-clamp-1 max-w-[200px]">{hack.location}</span>
                    <div className="flex items-center gap-1 text-white group-hover:text-amber-300 transition-colors shrink-0">
                      <span>Inspect Sprint</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
