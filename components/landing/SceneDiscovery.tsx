"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface IdeaItem {
  id: string;
  title: string;
  category: string;
  description: string;
  stage: string;
}

export function SceneDiscovery() {
  const [ideas, setIdeas] = React.useState<IdeaItem[]>([]);
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    async function fetchIdeas() {
      try {
        const res = await fetch("/api/ideas?limit=3");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setIdeas(data);
          }
        }
      } catch (e) {
        console.error("Error fetching ideas:", e);
      }
    }
    fetchIdeas();

    const handleScroll = () => {
      setOffsetY(window.scrollY * 0.06);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const featured = ideas[0] || {
    id: "d652f472-591d-4848-9f4e-5f11d74934f2",
    title: "Autonomous Agricultural Vision for Smallholder Farms",
    category: "AI & Machine Learning",
    description: "Decentralized drone-based leaf disease diagnosis with edge AI inference, empowering regional farmers with zero cloud latency.",
    stage: "Concept Validation",
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 z-10 border-t border-white/[0.04] overflow-hidden">
      {/* Background Architectural Watermark */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 select-none pointer-events-none text-[18vw] font-black text-white/[0.015] tracking-tighter will-change-transform"
        style={{ transform: `translate3d(0, -${offsetY}px, 0)` }}
      >
        DISCOVER
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
              <p className="text-[11px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
                02 / DISCOVERY
              </p>
              <div className="w-12 h-[1px] bg-white/10" />
            </div>
            <h2 className="text-4xl sm:text-6xl font-extralight tracking-tight text-white uppercase">
              Discover what&apos;s next.
            </h2>
          </div>

          <Link
            href="/ideas"
            className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
          >
            <span>Explore All Ideas</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Featured Idea Card with Luminous Atmosphere */}
        <Link
          href={`/ideas/${featured.id}`}
          className="group block relative p-8 sm:p-12 rounded-3xl border border-white/[0.08] bg-[#070913]/60 backdrop-blur-2xl hover:border-white/25 transition-all duration-500 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-400 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
              <Sparkles className="h-3 w-3" />
              <span>{featured.category}</span>
            </div>
            <span className="text-neutral-500">STAGE: {featured.stage}</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-light text-white group-hover:text-indigo-200 transition-colors mb-4">
            {featured.title}
          </h3>

          <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed max-w-2xl line-clamp-3">
            {featured.description}
          </p>

          <div className="mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-white">
            <span>Read Concept & Blueprint</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </Link>
      </div>
    </section>
  );
}
