"use client";

import * as React from "react";

export function TheIdeaSection() {
  return (
    <section id="about" className="relative py-28 sm:py-36 bg-[#090a0f] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header Eyebrow */}
        <div className="flex items-center gap-3 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
          <p className="text-[11px] font-mono tracking-[0.28em] text-neutral-500 uppercase">
            01 • THE ORIGIN
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Main Statement */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.12]">
              An idea is only <br />
              <span className="font-semibold text-neutral-300">the beginning.</span>
            </h2>

            <p className="text-lg sm:text-xl text-neutral-400 font-light leading-relaxed max-w-xl">
              Every project starts as a thought. The right people can turn that thought into something real.
            </p>

            <p className="text-sm text-neutral-500 font-light leading-relaxed max-w-lg">
              On Idea Era, sparks of curiosity evolve through purposeful dialogue, peer critique, and collaborative sprints. You never have to build alone.
            </p>
          </div>

          {/* Minimal Geometric Dispersion Graphic */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-sm aspect-square rounded-3xl border border-white/[0.08] bg-white/[0.01] p-8 flex flex-col justify-between backdrop-blur-sm">
              <div className="flex justify-between items-start text-[10px] font-mono text-neutral-500 tracking-wider">
                <span>01. SEED</span>
                <span>02. BRANCH</span>
                <span>03. CLUSTER</span>
              </div>

              {/* Connected node cluster illustration */}
              <div className="relative my-auto flex items-center justify-center py-6">
                <div className="w-16 h-16 rounded-full border border-indigo-400/40 bg-indigo-500/10 flex items-center justify-center shadow-[0_0_24px_rgba(99,102,241,0.2)]">
                  <div className="w-3 h-3 rounded-full bg-indigo-400" />
                </div>

                {/* Connecting Rays */}
                <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-60">
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-mono text-neutral-400">
                    DEV
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-mono text-neutral-400">
                    DES
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-mono text-neutral-400">
                    AI
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-4 text-xs font-mono text-neutral-400 text-center tracking-wide">
                Thought ➔ Collaboration ➔ Reality
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
