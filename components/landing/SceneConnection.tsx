"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SceneConnection() {
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * 0.05);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pillars = [
    { title: "SYSTEMS ARCHITECTURE", desc: "Distributed runtimes, low-latency backends, high-throughput cloud engines.", tag: "NODE_01" },
    { title: "NEURAL INTELLIGENCE", desc: "Fine-tuned foundational models, agentic workflows, multi-modal perception.", tag: "NODE_02" },
    { title: "INTERFACE DESIGN", desc: "Tactile typography, fluid WebGL shaders, seamless human ergonomics.", tag: "NODE_03" },
    { title: "STRATEGIC VISION", desc: "Ecosystem product-market fit, token economics, technical documentation.", tag: "NODE_04" },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 z-10 border-t border-white/[0.04] overflow-hidden">
      {/* Background Architectural Watermark */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none text-[16vw] font-black text-white/[0.015] tracking-tighter will-change-transform"
        style={{ transform: `translate3d(0, -${offsetY}px, 0)` }}
      >
        RESONANCE
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-12 relative z-10">
        <div className="space-y-4 text-left">
          <div className="inline-flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,1)] animate-ping" />
            <p className="text-[11px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
              03 / CONVERGENCE & RESONANCE
            </p>
            <div className="w-12 h-[1px] bg-white/10" />
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-[1.08] uppercase">
            Great ideas need <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-200">
              the right people.
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-neutral-300 font-light max-w-2xl leading-relaxed">
            Thousands of possibilities float in darkness. As resonance strikes, complementary minds are pulled into orbit around the thesis.
          </p>
        </div>

        {/* 4 Pillars of Craft with Luminous Interactive Frames */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="group relative p-8 rounded-2xl bg-[#070913]/60 border border-white/[0.08] hover:border-amber-400/40 hover:bg-[#0c0e1c]/80 backdrop-blur-xl space-y-3 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.25em] text-neutral-500 group-hover:text-amber-300 transition-colors">
                <span>{p.tag}</span>
                <span className="h-1 w-1 rounded-full bg-amber-400/60" />
              </div>
              <h3 className="text-sm font-semibold tracking-[0.2em] text-white uppercase group-hover:text-amber-100 transition-colors">
                {p.title}
              </h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <Link
            href="/people"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full border border-white/20 bg-white/[0.04] text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.08)]"
          >
            <span>Find Collaborators</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
