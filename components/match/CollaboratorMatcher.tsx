"use client";

import * as React from "react";
import Link from "next/link";
import { MatchRecommendation } from "@/types";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
import {
  Zap,
  Sparkles,
  UserPlus,
  Check,
  ShieldCheck,
  Network,
  Layers,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingSynergyNetwork } from "@/components/match/LivingSynergyNetwork";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";

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
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-6 sm:p-12 space-y-10 select-none overflow-x-hidden">
      {/* Floating Top HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
              SYNERGY ENGINE // RESONANCE FIELD
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extralight text-white uppercase tracking-tight">
            Collaborator Field.
          </h1>
        </div>

        {/* HUD Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Minimum Resonance Filter */}
          <div className="inline-flex items-center p-1 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl">
            {[
              { label: "ALL RESONANCE", value: 0 },
              { label: "> 50% SYNERGY", value: 50 },
              { label: "> 75% HIGH BOND", value: 75 },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setMinScore(f.value)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all",
                  minScore === f.value
                    ? "bg-white text-black font-semibold shadow-lg"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl">
            <button
              onClick={() => setViewMode("network")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all",
                viewMode === "network"
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Network className="h-3 w-3" />
              <span>Spatial Network</span>
            </button>
            <button
              onClick={() => setViewMode("dossiers")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all",
                viewMode === "dossiers"
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Layers className="h-3 w-3" />
              <span>Dossiers</span>
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
                className="group relative rounded-3xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl p-6 sm:p-8 space-y-6 hover:border-cyan-500/40 hover:bg-[#0e111a] transition-all duration-300 shadow-xl flex flex-col justify-between"
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
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Identity */}
                  <div>
                    <h3 className="text-xl font-light text-white group-hover:text-cyan-200 transition-colors">
                      {rec.profile.full_name}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">
                      @{rec.profile.username}
                    </p>
                    {rec.profile.headline && (
                      <p className="text-xs text-neutral-300 font-light pt-2 line-clamp-2">
                        {rec.profile.headline}
                      </p>
                    )}
                  </div>

                  {/* Shared Skills */}
                  {rec.sharedSkills && rec.sharedSkills.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                        Synchronized Capabilities
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
                    <div className="w-full py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-2">
                      <Check className="h-3.5 w-3.5" />
                      <span>Bond Established</span>
                    </div>
                  ) : isPending ? (
                    <div className="w-full py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 text-xs font-mono text-center">
                      Signal Transmitted
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(rec.profile.id)}
                      disabled={isConnecting}
                      className="w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:scale-[1.02]"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>{isConnecting ? "Transmitting..." : "Initiate Signal"}</span>
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
