"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SceneFinalCTA() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 sm:px-12 lg:px-24 z-10 border-t border-white/[0.04] overflow-hidden">
      {/* Radiant Amber Arrival Halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none select-none animate-pulse" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="inline-flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)]" />
          <p className="text-[11px] font-mono tracking-[0.35em] text-neutral-500 uppercase">
            A NEW ERA BEGINS
          </p>
        </div>

        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-tight uppercase">
          Your idea is waiting <br />
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-amber-200 drop-shadow-[0_0_35px_rgba(255,255,255,0.2)]">
            for the right connection.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
          Share it. Find your people. Start building.
        </p>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/ideas/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-[0.22em] transition-all duration-300 hover:bg-neutral-200 hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.25)]"
          >
            <span>SHARE YOUR IDEA</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <Link
            href="/ideas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full border border-white/20 bg-black/40 text-white font-semibold text-xs uppercase tracking-[0.22em] backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/50"
          >
            <span>EXPLORE IDEAS</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
