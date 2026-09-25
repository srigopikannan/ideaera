"use client";

import * as React from "react";
import Link from "next/link";
import { Idea, Profile, Hackathon, PersonalInnovationDashboard } from "@/types";
import {
  PlusCircle,
  Compass,
  Users,
  Trophy,
  Sparkles,
  ArrowUpRight,
  FolderGit2,
  Zap,
  Activity,
  Globe,
  Radio,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";
import { InnovationDashboardView } from "@/components/dashboard/InnovationDashboardView";

interface LivingIdeaSpaceProps {
  currentUser: Profile | null;
  trendingIdeas: Idea[];
  recommendedPeople: Profile[];
  upcomingHackathons: Hackathon[];
  totalIdeasCount: number;
  totalPeopleCount: number;
  totalHackathonsCount: number;
  innovationDashboard?: PersonalInnovationDashboard | null;
}

export function LivingIdeaSpace({
  currentUser,
  trendingIdeas,
  recommendedPeople,
  upcomingHackathons,
  totalIdeasCount,
  totalPeopleCount,
  totalHackathonsCount,
  innovationDashboard,
}: LivingIdeaSpaceProps) {
  const [activeMode, setActiveMode] = React.useState<"cockpit" | "ecosystem">(
    currentUser && innovationDashboard ? "cockpit" : "ecosystem"
  );

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mouseRef = React.useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const firstName = currentUser?.full_name
    ? currentUser.full_name.split(" ")[0]
    : "Innovator";

  React.useEffect(() => {
    if (activeMode !== "ecosystem") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left) / (rect.width || 1) - 0.5;
      mouseRef.current.targetY = (e.clientY - rect.top) / (rect.height || 1) - 0.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const particleCount = 48;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      angle: (i / particleCount) * Math.PI * 2,
      dist: 60 + Math.random() * 180,
      speed: 0.002 + Math.random() * 0.006,
      size: 1 + Math.random() * 2.2,
      alpha: 0.2 + Math.random() * 0.6,
      yTilt: (Math.random() - 0.5) * 60,
    }));

    let t = 0;

    const render = () => {
      t += 0.016;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2 + mouseRef.current.x * 35;
      const cy = height / 2 + mouseRef.current.y * 25;

      // Outer Gravitational Field Rings
      const ringRadii = [90, 150, 220];
      ringRadii.forEach((r, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.45, Math.PI / 12, 0, Math.PI * 2);
        ctx.strokeStyle =
          idx === 0
            ? "rgba(99, 102, 241, 0.25)"
            : idx === 1
            ? "rgba(56, 189, 248, 0.2)"
            : "rgba(168, 85, 247, 0.15)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.stroke();
        ctx.restore();
      });

      // Drifting Stardust Nodes
      particles.forEach((pt) => {
        pt.angle += pt.speed;
        const px = cx + Math.cos(pt.angle) * pt.dist;
        const py = cy + Math.sin(pt.angle) * (pt.dist * 0.45) + pt.yTilt;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, " + pt.alpha + ")";
        ctx.shadowColor = "rgba(56, 189, 248, 0.8)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeMode]);

  const leadIdea = trendingIdeas.length > 0 ? trendingIdeas[0] : null;
  const secondaryIdea = trendingIdeas.length > 1 ? trendingIdeas[1] : null;
  const leadHackathon = upcomingHackathons.length > 0 ? upcomingHackathons[0] : null;

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-8 sm:space-y-10 select-none overflow-x-hidden">
      {/* Top Ambient Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.9)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
              IDEA SYNTHESIS COMMAND BRIDGE // OPERATIONAL
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extralight text-white uppercase tracking-tight">
            Welcome, {firstName}.
          </h1>
        </div>

        {/* Global Conduits Capsule */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mode Switcher */}
          {currentUser && innovationDashboard && (
            <div className="inline-flex items-center p-1 rounded-2xl border border-white/10 bg-[#0a0c13]">
              <button
                type="button"
                onClick={() => setActiveMode("cockpit")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all",
                  activeMode === "cockpit"
                    ? "bg-white text-black font-semibold shadow-md"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Zap className="h-3 w-3 text-indigo-500" />
                <span>My Cockpit</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("ecosystem")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all",
                  activeMode === "ecosystem"
                    ? "bg-white text-black font-semibold shadow-md"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                <Globe className="h-3 w-3" />
                <span>Ecosystem</span>
              </button>
            </div>
          )}

          <Link
            href="/ideas/create"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all shadow-xl hover:scale-105"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Ignite Idea</span>
          </Link>

          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10 bg-[#0a0c13]/80 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-all"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Living Field</span>
          </Link>
        </div>
      </div>

      {/* RENDER PERSONAL INNOVATION COCKPIT OR ECOSYSTEM CANVAS */}
      {activeMode === "cockpit" && currentUser && innovationDashboard ? (
        <InnovationDashboardView currentUser={currentUser} dashboard={innovationDashboard} />
      ) : (
        /* Asymmetric Command Layout: 7 / 5 Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left Column (Col-span 7): Living Reactor & Origin Telemetry */}
          <div className="lg:col-span-7 relative rounded-3xl border border-white/[0.08] bg-[#07090e] p-5 sm:p-8 lg:p-12 overflow-hidden shadow-2xl flex flex-col justify-between min-h-[480px] sm:min-h-[580px]">
            {/* Background Canvas */}
            <div className="absolute inset-0 pointer-events-none opacity-80">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Top Layer */}
            <div className="relative z-10 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono uppercase tracking-widest">
                <Activity className="h-3 w-3 animate-spin" />
                <span>ECOSYSTEM SYNTHESIS CORE</span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest block">
                  NETWORK GRAVITATIONAL CENTER
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extralight text-white tracking-tight leading-tight">
                  Where collegiate intelligence aggregates into tangible systems.
                </h2>
              </div>
            </div>

            {/* Middle Reactor Node: Lead Trending Concept */}
            <div className="relative z-10 my-6 sm:my-8 p-5 sm:p-6 rounded-2xl border border-white/10 bg-[#0a0c13]/70 backdrop-blur-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Apex Gravitational Vector</span>
                </span>
                <span className="text-neutral-500">{leadIdea?.category || "AI & SYSTEMS"}</span>
              </div>

              {leadIdea ? (
                <div className="space-y-2">
                  <Link
                    href={`/ideas/${leadIdea.id}`}
                    className="text-lg sm:text-2xl font-light text-white hover:text-indigo-300 transition-colors block truncate"
                  >
                    {leadIdea.title}
                  </Link>
                  <p className="text-xs sm:text-sm text-neutral-300 font-light line-clamp-2 leading-relaxed">
                    {leadIdea.description}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-mono text-neutral-500 italic">
                  No active gravitational vectors recorded yet. Ignite the first concept.
                </p>
              )}

              {leadIdea && (
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs font-mono text-neutral-400">
                  <span>@{leadIdea.author?.username || (leadIdea as any).creator?.username || "innovator"}</span>
                  <Link
                    href={`/ideas/${leadIdea.id}`}
                    className="inline-flex items-center gap-1 text-white hover:text-indigo-300 uppercase tracking-wider text-[11px]"
                  >
                    <span>Inspect Concept</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom Live Metrics Bar */}
            <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                  Synthesized Ideas
                </span>
                <span className="text-xl sm:text-2xl font-light font-mono text-white">
                  {totalIdeasCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                  Active Builders
                </span>
                <span className="text-xl sm:text-2xl font-light font-mono text-cyan-400">
                  {totalPeopleCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                  Active Sprints
                </span>
                <span className="text-xl sm:text-2xl font-light font-mono text-amber-400">
                  {totalHackathonsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Col-span 5): Lateral Radar & Tactical Modules */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 sm:space-y-8">
            {/* Secondary Resonance Node */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <span className="text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-purple-400" />
                  <span>Sub-Harmonic Spark</span>
                </span>
                <span>{secondaryIdea?.category || "ECOSYSTEM"}</span>
              </div>

              {secondaryIdea ? (
                <div className="space-y-2">
                  <Link
                    href={`/ideas/${secondaryIdea.id}`}
                    className="text-base sm:text-xl font-light text-white hover:text-purple-300 transition-colors block line-clamp-1"
                  >
                    {secondaryIdea.title}
                  </Link>
                  <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                    {secondaryIdea.description}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-mono text-neutral-500 italic">
                  Ecosystem scanning for secondary frequencies...
                </p>
              )}

              {secondaryIdea && (
                <div className="pt-2 flex justify-end">
                  <Link
                    href={`/ideas/${secondaryIdea.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-purple-300 hover:text-white"
                  >
                    <span>Explore Frequency</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Talent Constellation Proximity Node */}
            <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <span className="text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>Proximity Nodes</span>
                </span>
                <Link
                  href="/people"
                  className="text-xs text-neutral-500 hover:text-white uppercase transition-colors"
                >
                  Full Radar →
                </Link>
              </div>

              <div className="space-y-3">
                {recommendedPeople.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    href={`/people/${p.username}`}
                    className="p-3 rounded-2xl border border-white/[0.05] bg-[#08090e] hover:border-white/20 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.full_name || ""}
                          className="h-8 w-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-cyan-500/10 text-cyan-300 font-mono text-xs flex items-center justify-center shrink-0">
                          {(p.full_name || "P")[0]}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors block truncate">
                          {p.full_name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 truncate block">
                          @{p.username}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Active Sprint Capsule */}
            {leadHackathon ? (
              <Link
                href={`/hackathons/${leadHackathon.id}`}
                className="p-6 sm:p-8 rounded-3xl border border-amber-500/20 bg-amber-950/10 hover:border-amber-500/40 transition-all space-y-3 block shadow-xl group"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 text-amber-400">
                    <Trophy className="h-3 w-3" />
                    <span>ACTIVE SPRINT // {leadHackathon.mode || "ONLINE"}</span>
                  </span>
                  {leadHackathon.prize_pool && (
                    <span className="text-white font-mono">{leadHackathon.prize_pool}</span>
                  )}
                </div>

                <h4 className="text-base font-light text-white group-hover:text-amber-200 transition-colors">
                  {leadHackathon.title}
                </h4>

                <p className="text-xs text-neutral-400 font-light line-clamp-1 leading-relaxed">
                  {leadHackathon.description}
                </p>
              </Link>
            ) : (
              <div className="p-6 rounded-3xl border border-white/[0.06] bg-[#0a0c13] text-center text-xs font-mono text-neutral-500">
                No active sprints scheduled.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
