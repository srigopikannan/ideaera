"use client";

import Link from "next/link";
import { ArrowUpRight, Users, Code2, Palette, Cpu, Compass } from "lucide-react";
import { Card3D } from "@/components/3d/Card3D";

export function ConnectSection() {
  const roles = [
    { label: "Systems & Cloud", icon: Code2, desc: "Architecting scalable infrastructure and resilient APIs" },
    { label: "AI & Machine Intelligence", icon: Cpu, desc: "Fine-tuning models, computer vision, and neural reasoning" },
    { label: "Product & Interface", icon: Palette, desc: "Crafting minimalist, tactile, and unforgettable user flows" },
    { label: "Strategy & Operations", icon: Compass, desc: "Validating market fit, user acquisition, and competition briefs" },
  ];

  return (
    <section className="relative py-28 sm:py-36 bg-[#090a0f] border-t border-white/[0.06] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <p className="text-[11px] font-mono tracking-[0.28em] text-neutral-500 uppercase">
            03 • TALENT CONVERGENCE
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
              Great ideas need <br />
              <span className="font-semibold text-neutral-300">the right people.</span>
            </h2>

            <p className="text-base sm:text-lg text-neutral-400 font-light leading-relaxed">
              No single mind holds every discipline. Idea Era unites visionary thinkers with specialized craftsmen to form high-velocity squads ready to ship.
            </p>

            <div className="pt-4">
              <Link
                href="/people"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 bg-white/[0.04] text-xs font-mono uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                <span>Find Collaborators</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Skill Cluster Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card3D key={role.label} maxTilt={6} scale={1.02} className="p-6 rounded-2xl bg-[#0d0f17] border border-white/[0.07]">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-4">
                    <Icon className="h-5 w-5 text-indigo-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                    {role.label}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-light">
                    {role.desc}
                  </p>
                </Card3D>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
