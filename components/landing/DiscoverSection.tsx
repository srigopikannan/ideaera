"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Tag, Eye } from "lucide-react";
import { Card3D } from "@/components/3d/Card3D";

interface IdeaItem {
  id: string;
  title: string;
  category: string;
  description: string;
  stage: string;
  created_at: string;
}

export function DiscoverSection() {
  const [ideas, setIdeas] = React.useState<IdeaItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchIdeas() {
      try {
        const res = await fetch("/api/ideas?limit=4");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setIdeas(data);
          }
        }
      } catch (err) {
        console.error("Error loading ideas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchIdeas();
  }, []);

  // Featured idea fallback or first real idea
  const featured = ideas[0] || {
    id: "d652f472-591d-4848-9f4e-5f11d74934f2",
    title: "Autonomous Agricultural Vision for Smallholder Farms",
    category: "AI & Machine Learning",
    description: "Decentralized drone-based leaf disease diagnosis with edge AI inference, empowering regional farmers with zero cloud latency.",
    stage: "Concept Validation",
    created_at: new Date().toISOString(),
  };

  const secondaryIdeas = ideas.slice(1);

  return (
    <section className="relative py-28 sm:py-36 bg-[#07080c] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <p className="text-[11px] font-mono tracking-[0.28em] text-neutral-500 uppercase">
                02 • CURATED SPOTLIGHT
              </p>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
              Discover what&apos;s next.
            </h2>
          </div>

          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
          >
            <span>Explore All Ideas</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Editorial Layout: Large Featured Spotlight + Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Featured Idea */}
          <div className="lg:col-span-7">
            <Card3D maxTilt={4} scale={1.01} className="h-full">
              <Link
                href={`/ideas/${featured.id}`}
                className="group block h-full p-8 sm:p-12 rounded-3xl bg-[#0d0f17] border border-white/[0.09] hover:border-white/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-6 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" />
                        {featured.category || "Technology"}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">
                        {featured.stage || "Idea Stage"}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-4xl font-light tracking-tight text-white group-hover:text-indigo-200 transition-colors leading-snug">
                      {featured.title}
                    </h3>

                    <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed line-clamp-3">
                      {featured.description}
                    </p>
                  </div>

                  <div className="pt-8 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-500">
                      Click to review & collaborate
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white group-hover:translate-x-1 transition-transform">
                      View Dossier <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Card3D>
          </div>

          {/* Secondary Ideas Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {secondaryIdeas.length > 0 ? (
              secondaryIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="group p-6 sm:p-8 rounded-2xl bg-[#0a0c13] border border-white/[0.07] hover:border-white/20 transition-all duration-200 block"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {idea.category}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-lg font-normal text-white group-hover:text-indigo-200 transition-colors">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 font-light">
                    {idea.description}
                  </p>
                </Link>
              ))
            ) : (
              <div className="h-full p-8 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col justify-center items-start space-y-4">
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                  Opportunity
                </span>
                <h4 className="text-xl font-light text-white">
                  Have a vision for what comes next?
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-light">
                  Publish your concept to the global Idea Era circuit and attract co-founders, engineers, and domain researchers.
                </p>
                <Link
                  href="/ideas/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                >
                  <span>Put Your Idea Into The World</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
