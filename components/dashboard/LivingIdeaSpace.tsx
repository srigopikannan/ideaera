"use client";

import * as React from "react";
import Link from "next/link";
import { Idea, Profile, Hackathon } from "@/types";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";

interface LivingIdeaSpaceProps {
  currentUser: Profile | null;
  trendingIdeas: Idea[];
  recommendedPeople: Profile[];
  upcomingHackathons: Hackathon[];
  totalIdeasCount: number;
  totalPeopleCount: number;
  totalHackathonsCount: number;
}

export function LivingIdeaSpace({
  currentUser,
  trendingIdeas,
  recommendedPeople,
  upcomingHackathons,
  totalIdeasCount,
  totalPeopleCount,
  totalHackathonsCount,
}: LivingIdeaSpaceProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mouseRef = React.useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const firstName = currentUser?.full_name
    ? currentUser.full_name.split(" ")[0]
    : "Innovator";

  React.useEffect(() => {
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

    // Dynamic orbital particle swarm
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
      const cy = height / 2 + mouseRef.current.y * 35;

      // Central Reactor Core Glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
      coreGrad.addColorStop(0, "rgba(99, 102, 241, 0.28)");
      coreGrad.addColorStop(0.4, "rgba(168, 85, 247, 0.12)");
      coreGrad.addColorStop(0.8, "rgba(56, 189, 248, 0.04)");
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 180, 0, Math.PI * 2);
      ctx.fill();

      // Gyroscopic Coordinate Rings
      [90, 160, 240].forEach((r, idx) => {
        ctx.save();
        ctx.beginPath();
        const spin = idx % 2 === 0 ? t * (0.3 + idx * 0.1) : -t * (0.25 + idx * 0.08);
        ctx.ellipse(cx, cy, r, r * 0.42, spin, 0, Math.PI * 2);
        ctx.strokeStyle =
          idx === 0
            ? "rgba(99, 102, 241, 0.35)"
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
  }, []);

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
            The Bridge.
          </h1>
        </div>

        {/* Global Conduits Capsule */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

          <Link
            href="/match"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border border-white/10 bg-[#0a0c13]/80 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-all"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Synergy Engine</span>
          </Link>
        </div>
      </div>

      {/* Asymmetric Command Layout: 7 / 5 Grid */}
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
              <span>CORE FREQUENCY // SYNCHRONIZED</span>
            </div>

            <div className="space-y-2 sm:space-y-3 max-w-xl">
              <h2 className="text-2xl sm:text-5xl font-extralight text-white uppercase tracking-tight leading-[1.08]">
                Welcome, {firstName}.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
                Your creative nexus is active. Formulate hypotheses, tether to complementary minds across the global constellation, and deploy living ventures.
              </p>
            </div>
          </div>

          {/* Bottom Telemetry Strip */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-white/[0.08]">
            <Link href="/ideas" className="space-y-0.5 sm:space-y-1 group">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 group-hover:text-indigo-400 transition-colors block">
                CONSTELLATION SPARKS
              </span>
              <span className="text-xl sm:text-4xl font-mono text-white font-light group-hover:text-indigo-200 transition-colors">
                {totalIdeasCount}
              </span>
            </Link>

            <Link href="/people" className="space-y-0.5 sm:space-y-1 group">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 group-hover:text-cyan-400 transition-colors block">
                ACTIVE BUILDERS
              </span>
              <span className="text-xl sm:text-4xl font-mono text-white font-light group-hover:text-cyan-200 transition-colors">
                {totalPeopleCount}
              </span>
            </Link>

            <Link href="/hackathons" className="space-y-0.5 sm:space-y-1 group">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 group-hover:text-amber-400 transition-colors block">
                COMPETITIVE SPRINTS
              </span>
              <span className="text-xl sm:text-4xl font-mono text-white font-light group-hover:text-amber-200 transition-colors">
                {totalHackathonsCount}
              </span>
            </Link>
          </div>
        </div>

        {/* Right Column (Col-span 5): Peripheral Satellites */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Satellite 1: Primary Resonance Spark */}
          {leadIdea ? (
            <Link
              href={"/ideas/" + leadIdea.id}
              className="group relative rounded-3xl border border-white/10 bg-[#0a0c13]/80 backdrop-blur-xl p-6 sm:p-8 space-y-4 hover:border-indigo-500/40 hover:bg-[#0e111a] transition-all duration-300 shadow-xl block"
            >
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                <span className="inline-flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="h-3 w-3" />
                  <span>PRIMARY SPARK // {leadIdea.category}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
              </div>

              <h3 className="text-xl font-light text-white group-hover:text-indigo-200 transition-colors leading-snug">
                {leadIdea.title}
              </h3>

              <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                {leadIdea.description}
              </p>

              <div className="flex items-center gap-3 pt-2 text-[10px] font-mono text-neutral-500">
                <span>BY {leadIdea.author?.full_name || "FOUNDER"}</span>
                <span>•</span>
                <span>{leadIdea.likes_count || 0} RESONANCE VOTES</span>
              </div>
            </Link>
          ) : (
            <div className="p-6 rounded-3xl border border-white/[0.06] bg-[#0a0c13] text-center text-xs font-mono text-neutral-500">
              No ideas ignited yet. Be the first.
            </div>
          )}

          {/* Satellite 2: Synergy Radar (Recommended Collaborators) */}
          <div className="rounded-3xl border border-white/10 bg-[#0a0c13]/80 backdrop-blur-xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>SYNERGY RADAR</span>
              </div>
              <Link
                href="/match"
                className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                Scan All →
              </Link>
            </div>

            <div className="space-y-3">
              {recommendedPeople.slice(0, 3).map((peer) => (
                <Link
                  key={peer.id}
                  href={"/people/" + peer.username}
                  className="flex items-center justify-between p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-mono text-indigo-300">
                      {(peer.full_name || peer.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-light text-white group-hover:text-cyan-200 transition-colors">
                        {peer.full_name || peer.username}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {peer.headline || "@" + peer.username}
                      </p>
                    </div>
                  </div>

                  <ArrowUpRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Satellite 3: Sprint Horizon Deck */}
          {leadHackathon ? (
            <Link
              href={"/hackathons/" + leadHackathon.id}
              className="group relative rounded-3xl border border-white/10 bg-[#0a0c13]/80 backdrop-blur-xl p-6 sm:p-8 space-y-3 hover:border-amber-500/40 hover:bg-[#0e111a] transition-all duration-300 shadow-xl block"
            >
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
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
    </div>
  );
}
