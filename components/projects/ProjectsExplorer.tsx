"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import { PlusCircle, ArrowUpRight, FolderGit2, Globe, Sparkles, Activity, Layers } from "lucide-react";
import { Github } from "@/components/ui/brand-icons";
import { cn } from "@/lib/utils";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";

interface ProjectsExplorerProps {
  initialProjects: Project[];
}

export function ProjectsExplorer({ initialProjects }: ProjectsExplorerProps) {
  const router = useRouter();
  const [projects] = React.useState<Project[]>(initialProjects);
  const [selectedFilter, setSelectedFilter] = React.useState<string>("All");

  const filtered = React.useMemo(() => {
    if (selectedFilter === "All") return projects;
    return projects.filter((p) => p.status.toLowerCase() === selectedFilter.toLowerCase());
  }, [projects, selectedFilter]);

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 sm:space-y-12 select-none overflow-x-hidden">
      {/* Floating Top HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
              EVOLVING VENTURES // SYSTEM LANDSCAPE
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extralight text-white uppercase tracking-tight">
            Active Systems.
          </h1>
        </div>

        {/* Filter Pills & Launch Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center max-w-full overflow-x-auto no-scrollbar p-1 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shrink-0">
            {["All", "launched", "beta", "in_development", "idea"].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedFilter(s)}
                className={cn(
                  "px-3 py-1.5 sm:px-3.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all shrink-0",
                  selectedFilter === s
                    ? "bg-white text-black font-semibold shadow-lg"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {s === "in_development" ? "Building" : s.toUpperCase()}
              </button>
            ))}
          </div>

          <Link
            href="/projects/create"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all shadow-xl hover:scale-105"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Launch Venture</span>
          </Link>
        </div>
      </div>

      {/* Living Systems Landscape */}
      {filtered.length === 0 ? (
        <div className="py-20 flex items-center justify-center">
          <LivingEmptyState
            title="NO VENTURES DETECTED IN ORBIT."
            subtitle="The system landscape is quiet. Step into the forge and launch the first architecture."
            actionText="Launch Venture"
            actionHref="/projects/create"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {filtered.map((proj, idx) => {
            const isLaunched = proj.status === "launched";
            const isBuilding = proj.status === "in_development";
            const isBeta = proj.status === "beta";

            // Visual size: First/Launched projects occupy more grid footprint
            const colSpan = idx === 0 || isLaunched ? "lg:col-span-8" : "lg:col-span-4";

            let statusColor = "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
            let glow = "rgba(99, 102, 241, 0.2)";
            if (isLaunched) {
              statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
              glow = "rgba(52, 211, 153, 0.25)";
            } else if (isBeta) {
              statusColor = "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
              glow = "rgba(56, 189, 248, 0.25)";
            } else if (proj.status === "idea") {
              statusColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
              glow = "rgba(245, 158, 11, 0.25)";
            }

            return (
              <div
                key={proj.id}
                onClick={() => router.push("/projects/" + proj.id)}
                className={cn(
                  colSpan,
                  "group relative rounded-3xl border border-white/[0.08] bg-[#0a0c13] p-5 sm:p-10 cursor-pointer overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:-translate-y-1 space-y-6"
                )}
                style={{
                  boxShadow: "0 10px 40px -10px " + glow,
                }}
              >
                {/* Header Tag & Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border backdrop-blur-md",
                      statusColor
                    )}
                  >
                    SYSTEM // {proj.status.replace("_", " ")}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <h3 className={cn("font-light text-white group-hover:text-indigo-200 transition-colors tracking-tight leading-tight", colSpan === "lg:col-span-8" ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl")}>
                    {proj.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>
                </div>

                {/* Evolving System Internal Nodes Tree: IDEAS -> PEOPLE -> MILESTONES */}
                <div className="pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="space-y-1">
                    <span className="text-neutral-500 uppercase tracking-wider block">ORIGIN</span>
                    <span className="text-neutral-300 truncate block">
                      {proj.related_idea_id ? "Linked Spark" : "Direct Genesis"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-neutral-500 uppercase tracking-wider block">CREW</span>
                    <span className="text-neutral-300 truncate block">
                      @{proj.owner?.username || "creator"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-neutral-500 uppercase tracking-wider block">TELEMETRY</span>
                    <span className="text-white truncate block">
                      {proj.technologies?.length || 0} Modules
                    </span>
                  </div>
                </div>

                {/* Tech Chips */}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {proj.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-md text-[10px] font-mono border border-white/10 bg-white/[0.02] text-neutral-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
