"use client";

import * as React from "react";
import Link from "next/link";
import { MatchRecommendation } from "@/types";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
import {
  Zap,
  UserPlus,
  Check,
  Network,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingSynergyNetwork } from "@/components/match/LivingSynergyNetwork";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";
import { Avatar } from "@/components/ui/avatar";

interface CollaboratorMatcherProps {
  initialRecommendations: MatchRecommendation[];
}

export function CollaboratorMatcher({
  initialRecommendations,
}: CollaboratorMatcherProps) {
  const [recommendations] = React.useState<MatchRecommendation[]>(initialRecommendations);
  const [viewMode, setViewMode] = React.useState<"network" | "dossiers">("network");
  const [minScore, setMinScore] = React.useState<number>(0);
  const [connectingMap, setConnectingMap] = React.useState<Record<string, boolean>>({});
  const [connectedMap, setConnectedMap] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialRecommendations.forEach((r) => {
      if (r.profile.connection_status === "connected") {
        init[r.profile.id] = true;
      }
    });
    return init;
  });
  const [pendingMap, setPendingMap] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialRecommendations.forEach((r) => {
      if (r.profile.connection_status === "pending_sent") {
        init[r.profile.id] = true;
      }
    });
    return init;
  });

  const filtered = React.useMemo(() => {
    return recommendations.filter((r) => (r.matchScore || 0) >= minScore);
  }, [recommendations, minScore]);

  const handleConnect = async (targetUserId: string) => {
    setConnectingMap((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      const res = await requestConnectionAction(targetUserId);
      if (res?.connection?.status === "accepted") {
        setConnectedMap((prev) => ({ ...prev, [targetUserId]: true }));
      } else {
        setPendingMap((prev) => ({ ...prev, [targetUserId]: true }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 select-none overflow-x-hidden">
      {/* Floating Top HUD */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400 font-medium">
              SYNERGY ENGINE // RESONANCE FIELD
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extralight text-white uppercase tracking-tight leading-[0.95]">
            COLLABORATOR
            <br />
            FIELD.
          </h1>
        </div>

        {/* HUD Filter & View Switcher Stacked Rows */}
        <div className="flex flex-col items-start md:items-end gap-3 max-w-full overflow-x-auto no-scrollbar pb-1">
          {/* Row 1: Minimum Resonance Filter */}
          <div className="inline-flex items-center p-1 rounded-full border border-white/10 bg-[#0a0c13]/90 backdrop-blur-xl shadow-lg shrink-0">
            {[
              { label: "ALL RESONANCE", value: 0 },
              { label: "> 50% SYNERGY", value: 50 },
              { label: "> 75% HIGH BOND", value: 75 },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setMinScore(f.value)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap",
                  minScore === f.value
                    ? "bg-white text-black font-semibold shadow-md"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Row 2: View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-full border border-white/10 bg-[#0a0c13]/90 backdrop-blur-xl shadow-lg shrink-0">
            <button
              onClick={() => setViewMode("network")}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap",
                viewMode === "network"
                  ? "bg-white text-black font-semibold shadow-md"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Network className="h-3 w-3" />
              <span>SPATIAL NETWORK</span>
            </button>
            <button
              onClick={() => setViewMode("dossiers")}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all whitespace-nowrap",
                viewMode === "dossiers"
                  ? "bg-white text-black font-semibold shadow-md"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Layers className="h-3 w-3" />
              <span>DOSSIERS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Experience Body */}
      {filtered.length === 0 ? (
        <div className="py-20 flex items-center justify-center">
          <LivingEmptyState
            title="NO RESONATING SIGNALS DETECTED IN THIS FREQUENCY."
            subtitle="Broaden your resonance threshold or invite talent into the constellation to ignite new synergies."
            actionText="Explore Talent Constellation"
            actionHref="/people"
          />
        </div>
      ) : viewMode === "network" ? (
        <LivingSynergyNetwork
          recommendations={filtered}
          onConnect={handleConnect}
          connectingMap={connectingMap}
          connectedMap={connectedMap}
          pendingMap={pendingMap}
        />
      ) : (
        /* Holographic Dossiers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((rec) => {
            const isConnected =
              connectedMap[rec.profile.id] ||
              rec.profile.connection_status === "connected";
            const isPending =
              pendingMap[rec.profile.id] ||
              rec.profile.connection_status === "pending_sent";
            const isConnecting = connectingMap[rec.profile.id];

            return (
              <div
                key={rec.profile.id}
                className="group relative rounded-3xl border border-white/10 bg-[#0a0c13]/75 backdrop-blur-xl p-6 sm:p-7 space-y-5 hover:border-cyan-500/40 hover:bg-[#0e111a] transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar with Match Score */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono uppercase tracking-wider">
                      <Zap className="h-3 w-3" />
                      <span>{rec.matchScore}% Resonance</span>
                    </span>

                    <Link
                      href={"/people/" + rec.profile.username}
                      className="text-xs font-mono text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      <span>Dossier</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {/* Identity with Avatar */}
                  <div className="flex items-start gap-3.5 pt-1">
                    <Avatar
                      src={rec.profile.avatar_url}
                      alt={rec.profile.full_name || rec.profile.username}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={"/people/" + rec.profile.username}
                        className="text-lg font-light text-white group-hover:text-cyan-200 transition-colors block truncate"
                      >
                        {rec.profile.full_name}
                      </Link>
                      <p className="text-xs text-neutral-400 font-mono">
                        @{rec.profile.username}
                      </p>
                      {rec.profile.headline && (
                        <p className="text-xs text-neutral-300 font-light pt-1.5 line-clamp-2 leading-relaxed">
                          {rec.profile.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {rec.profile.skills && rec.profile.skills.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                        Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar">
                        {rec.profile.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-neutral-300 border border-white/10"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shared Skills */}
                  {rec.sharedSkills && rec.sharedSkills.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                        Shared:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.sharedSkills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Complementary Skills */}
                  {rec.complementarySkills && rec.complementarySkills.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
                        Complementary:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.complementarySkills.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {rec.profile.interests && rec.profile.interests.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                        Interests:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.profile.interests.map((i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Projects */}
                  {rec.projects && rec.projects.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                        Projects:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.projects.map((p) => (
                          <Link
                            key={p.id}
                            href={"/projects/" + p.id}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:border-emerald-400 transition-colors inline-flex items-center gap-1"
                          >
                            <span>{p.name}</span>
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Synergy Rationale */}
                  {rec.matchReason && (
                    <p className="text-xs text-neutral-400 font-light leading-relaxed border-t border-white/[0.08] pt-3">
                      {rec.matchReason}
                    </p>
                  )}
                </div>

                {/* Connection Trigger */}
                <div className="pt-4">
                  {isConnected ? (
                    <div className="w-full py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono font-semibold text-center flex items-center justify-center gap-2">
                      <Check className="h-3.5 w-3.5" />
                      <span>CONNECTED</span>
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-neutral-400 text-xs font-mono font-semibold text-center">
                      REQUEST SENT
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(rec.profile.id)}
                      disabled={isConnecting}
                      className="w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:scale-[1.01]"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>{isConnecting ? "CONNECTING..." : "CONNECT"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
