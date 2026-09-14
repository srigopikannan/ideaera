"use client";

import * as React from "react";

export function CollaborateSection() {
  const stages = [
    { step: "01", name: "IDEA", desc: "A singular spark formulated and put into the open." },
    { step: "02", name: "DISCOVER", desc: "Curators and builders explore and evaluate the vision." },
    { step: "03", name: "CONNECT", desc: "Complementary skillsets match through direct resonance." },
    { step: "04", name: "DISCUSS", desc: "Architectural blueprints and sprint scope take shape." },
    { step: "05", name: "COLLABORATE", desc: "Repository commits, design tokens, and prototypes flow." },
    { step: "06", name: "CREATE", desc: "The concept transforms into a launched, working reality." },
  ];

  const [activeStage, setActiveStage] = React.useState(0);

  return (
    <section className="relative py-28 sm:py-36 bg-[#07080c] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <p className="text-[11px] font-mono tracking-[0.28em] text-neutral-500 uppercase">
            04 • THE JOURNEY
          </p>
        </div>

        <div className="space-y-4 max-w-2xl mb-16">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Don&apos;t just imagine it. <br />
            <span className="font-semibold text-neutral-300">Build it.</span>
          </h2>
          <p className="text-base text-neutral-400 font-light leading-relaxed">
            The progression from raw intuition to tangible product follows a structured, community-backed continuum.
          </p>
        </div>

        {/* 6-Stage Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {stages.map((st, idx) => (
            <button
              key={st.name}
              onClick={() => setActiveStage(idx)}
              className={`p-6 rounded-2xl border text-left transition-all duration-300 ${
                activeStage === idx
                  ? "bg-white/[0.08] border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.08)]"
                  : "bg-white/[0.02] border-white/[0.07] hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 mb-4">
                <span>STAGE</span>
                <span>{st.step}</span>
              </div>
              <div className="text-lg font-bold tracking-[0.16em] uppercase text-white mb-2">
                {st.name}
              </div>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                {st.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
