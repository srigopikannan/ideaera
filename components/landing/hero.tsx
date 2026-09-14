"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Hero3DScene } from "@/components/3d/Hero3DScene";
import { Card3D } from "@/components/3d/Card3D";

export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between pt-32 pb-12 sm:pt-40 sm:pb-16 overflow-hidden bg-[#07080c]">
      {/* Subtle deep ambient atmospheric light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-b from-indigo-950/25 via-blue-950/15 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-950/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Editorial Typography Column */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <p className="text-[11px] sm:text-xs font-mono tracking-[0.28em] text-neutral-400 uppercase">
                IDEAS • PEOPLE • POSSIBILITIES
              </p>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-[-0.03em] text-white leading-[1.06]">
              Every great thing <br />
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-white to-neutral-400">
                starts as an idea.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-light leading-relaxed">
              Discover ideas. Find your people. Build what comes next. Connect with creators, designers, and engineers to turn ambitious concepts into working reality.
            </p>

            {/* Editorial Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/ideas"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:bg-neutral-200 hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                <span>Explore Ideas</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/ideas/create"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/20 bg-white/[0.04] text-white font-semibold text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white/10 hover:border-white/40"
              >
                <span>Share Your Idea</span>
              </Link>
            </div>

            {/* Micro Live Metrics */}
            <div className="pt-8 grid grid-cols-3 gap-4 sm:gap-6 border-t border-white/[0.08] max-w-lg">
              <div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">195+</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mt-1">Live Sprints</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">122</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mt-1">TN Competitions</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-light text-white tracking-tight">₹1.5Cr+</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mt-1">Prize Capital</div>
              </div>
            </div>
          </div>

          {/* Interactive 3D Idea Object Column */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
              <Hero3DScene />

              {/* Floating Architectural Badge: Shaastra Sprint */}
              <Card3D
                maxTilt={10}
                scale={1.03}
                className="absolute -top-2 right-0 sm:right-2 p-3 px-4 rounded-2xl bg-[#0e1017]/80 border border-white/10 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] pointer-events-auto"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium tracking-wide text-neutral-200">IIT Madras Shaastra</span>
                </div>
                <p className="text-[10px] font-mono text-neutral-400 mt-0.5">₹5,00,000 Incubation Pool</p>
              </Card3D>

              {/* Floating Architectural Badge: Anna Univ */}
              <Card3D
                maxTilt={10}
                scale={1.03}
                className="absolute -bottom-2 left-0 sm:left-2 p-3 px-4 rounded-2xl bg-[#0e1017]/80 border border-white/10 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] pointer-events-auto"
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="text-[11px] font-medium tracking-wide text-neutral-200">Kurukshetra Sprint</span>
                </div>
                <p className="text-[10px] font-mono text-neutral-400 mt-0.5">CEG Guindy • Chennai</p>
              </Card3D>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Prompt (Part 8 Requirement) */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-8 flex items-center justify-between border-t border-white/[0.05]">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">
            SCROLL TO EXPLORE
          </span>
          <ArrowDown className="h-3 w-3 text-neutral-500 animate-bounce" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-600 hidden sm:block">
          IDEA ERA PLATFORM
        </div>
      </div>
    </section>
  );
}
