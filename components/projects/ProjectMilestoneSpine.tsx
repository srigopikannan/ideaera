"use client";

import * as React from "react";
import { Check, CircleDot, Sparkles, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  label: string;
  subtitle: string;
  status: "completed" | "current" | "upcoming";
}

interface ProjectMilestoneSpineProps {
  projectStatus: string;
  className?: string;
}

export function ProjectMilestoneSpine({
  projectStatus,
  className = "",
}: ProjectMilestoneSpineProps) {
  // Map project status to milestone stages
  const milestones = React.useMemo<Milestone[]>(() => {
    const isLaunched = projectStatus.toLowerCase() === "launched";
    const isBeta = projectStatus.toLowerCase() === "beta";
    const isBuilding = projectStatus.toLowerCase() === "in_development";

    return [
      {
        id: "m1",
        label: "01 / GENESIS",
        subtitle: "Thesis & Problem Formulation",
        status: "completed",
      },
      {
        id: "m2",
        label: "02 / ARCHITECTURE",
        subtitle: "System Specification & Protocols",
        status: isLaunched || isBeta || isBuilding ? "completed" : "current",
      },
      {
        id: "m3",
        label: "03 / BUILD & BETA",
        subtitle: "Codebase & Peer Testing",
        status: isLaunched ? "completed" : isBeta || isBuilding ? "current" : "upcoming",
      },
      {
        id: "m4",
        label: "04 / PRODUCTION",
        subtitle: "Live Deployment & Possibility",
        status: isLaunched ? "completed" : isBeta ? "current" : "upcoming",
      },
    ];
  }, [projectStatus]);

  // Scroll tracking for active milestone glow
  const [scrollPct, setScrollPct] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      setScrollPct(Math.min(Math.max(window.scrollY / maxScroll, 0), 1));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/[0.08] bg-[#0a0c13] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
            PROJECT EVOLUTION TIMELINE
          </span>
        </div>
        <span className="text-xs font-mono text-neutral-500">
          Scroll-Driven Milestone Sync
        </span>
      </div>

      {/* Interactive Milestone Nodes Track */}
      <div className="relative pt-2 pb-2">
        {/* Background Track Line */}
        <div className="absolute top-1/2 left-4 right-4 sm:left-12 sm:right-12 -translate-y-1/2 h-[2px] bg-white/10" />

        {/* Dynamic Glowing Electric Progress Filament */}
        <div
          className="absolute top-1/2 left-4 sm:left-12 -translate-y-1/2 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-200"
          style={{
            width: "calc(" + Math.min(scrollPct * 1.3, 1) + " * (100% - 32px))",
          }}
        />

        {/* Milestone Nodes */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 z-10">
          {milestones.map((m, idx) => {
            const isCompleted = m.status === "completed";
            const isCurrent = m.status === "current";

            return (
              <div
                key={m.id}
                className="flex flex-col items-center text-center space-y-2 group"
              >
                {/* Node Ring */}
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border",
                    isCompleted
                      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                      : isCurrent
                      ? "border-cyan-400/80 bg-cyan-500/20 text-cyan-200 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse"
                      : "border-white/10 bg-[#0a0c13] text-neutral-600"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <CircleDot className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px] font-mono">{idx + 1}</span>
                  )}
                </div>

                {/* Node Info */}
                <div className="space-y-0.5">
                  <span
                    className={cn(
                      "text-[10px] font-mono tracking-wider block transition-colors",
                      isCompleted || isCurrent ? "text-white font-medium" : "text-neutral-500"
                    )}
                  >
                    {m.label}
                  </span>
                  <p className="text-[10px] text-neutral-500 font-light hidden sm:block">
                    {m.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
