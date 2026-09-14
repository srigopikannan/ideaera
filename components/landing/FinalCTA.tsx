"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-32 sm:py-44 bg-[#07080c] border-t border-white/[0.08] overflow-hidden text-center">
      {/* Subtle convergent radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-950/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-8 relative z-10">
        <div className="inline-flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <p className="text-[11px] font-mono tracking-[0.28em] text-neutral-500 uppercase">
            A NEW ERA BEGINS
          </p>
        </div>

        <h2 className="text-4xl sm:text-6xl font-light tracking-[-0.03em] text-white leading-tight">
          Your idea is waiting <br />
          <span className="font-semibold text-neutral-200">
            for the right connection.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
          Share it. Find your people. Start building. Join students, developers, and founders across the globe.
        </p>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/ideas/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:bg-neutral-200 hover:scale-[1.02] shadow-[0_0_35px_rgba(255,255,255,0.18)]"
          >
            <span>Share Your Idea</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <Link
            href="/ideas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-full border border-white/20 bg-white/[0.04] text-white font-semibold text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white/10 hover:border-white/40"
          >
            <span>Explore Ideas</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
