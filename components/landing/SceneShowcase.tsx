"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Trophy, MapPin, Calendar } from "lucide-react";

export function SceneShowcase() {
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * 0.05);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const arenas = [
    {
      title: "IIT Madras Shaastra Hackathon 2026",
      host: "IIT Madras Tech Team",
      location: "Chennai, Tamil Nadu",
      prize: "₹5,00,000 Incubation & Cash",
      date: "Oct 10 - 12, 2026",
    },
    {
      title: "NIT Trichy Pragyan Hackathon 2026",
      host: "NIT Trichy Technical Council",
      location: "Tiruchirappalli, Tamil Nadu",
      prize: "₹3,00,000 Cash & Fellowships",
      date: "Dec 10 - 12, 2026",
    },
    {
      title: "Anna Univ Kurukshetra Hackathon 2026",
      host: "CEG Guindy Tech Association",
      location: "Chennai, Tamil Nadu",
      prize: "₹3,50,000 Cash Prizes",
      date: "Jan 15 - 17, 2027",
    },
  ];

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 z-10 border-t border-white/[0.04] overflow-hidden">
      {/* Background Architectural Watermark */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none text-[16vw] font-black text-white/[0.015] tracking-tighter will-change-transform"
        style={{ transform: `translate3d(0, -${offsetY}px, 0)` }}
      >
        ARENAS
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              <p className="text-[11px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
                05 / ARENAS
              </p>
              <div className="w-12 h-[1px] bg-white/10" />
            </div>
            <h2 className="text-4xl sm:text-6xl font-extralight tracking-tight text-white uppercase">
              Where teams compete.
            </h2>
          </div>

          <Link
            href="/hackathons"
            className="group inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
          >
            <span>View All 195+ Sprints</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Arenas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {arenas.map((ar) => (
            <Link
              key={ar.title}
              href="/hackathons"
              className="group p-8 rounded-2xl bg-[#070913]/50 border border-white/[0.08] backdrop-blur-xl hover:border-white/30 transition-all duration-300 space-y-6 block shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Trophy className="h-3.5 w-3.5" />
                  {ar.prize}
                </span>
                <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
              </div>

              <div>
                <h3 className="text-lg font-light text-white group-hover:text-indigo-200 transition-colors mb-2">
                  {ar.title}
                </h3>
                <p className="text-xs text-neutral-400 font-light">{ar.host}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {ar.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {ar.date}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
