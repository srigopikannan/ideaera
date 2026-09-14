"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function CinematicHero() {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll exit parallax: typography glides gracefully upward and fades smoothly
  const translateY = Math.min(scrollY * 0.28, 300);
  const opacity = Math.max(1 - scrollY / 650, 0);

  return (
    <section className="relative h-screen min-h-[680px] w-full flex flex-col justify-between pt-28 sm:pt-36 pb-10 sm:pb-14 px-8 sm:px-14 lg:px-20 z-10 select-none">
      <div />

      {/* Main Content with Parallax Exit */}
      <div
        className="w-full max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center will-change-transform"
        style={{
          transform: `translate3d(0, -${translateY}px, 0)`,
          opacity,
        }}
      >
        <div className="lg:col-span-8 xl:col-span-7 space-y-6 sm:space-y-8 text-left">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-3">
            <p className="text-[11px] sm:text-xs font-mono tracking-[0.38em] text-neutral-300/90 uppercase">
              IDEAS &nbsp;•&nbsp; PEOPLE &nbsp;•&nbsp; POSSIBILITIES
            </p>
          </div>

          {/* Colossal Headline matching reference image */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.2rem] xl:text-[6.0rem] tracking-[-0.025em] leading-[0.96] uppercase text-white">
            <span className="font-extralight block text-neutral-100">
              EVERY GREAT THING
            </span>
            <span className="font-bold block text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.22)]">
              STARTS AS AN IDEA.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-300 font-light max-w-xl leading-relaxed">
            Discover ideas. Find your people. Build what comes next.
          </p>

          {/* Pill CTAs matching reference image */}
          <div className="pt-4 sm:pt-6 flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              href="/ideas"
              className="group inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_35px_rgba(255,255,255,0.25)] hover:bg-neutral-200 hover:scale-[1.03] transition-all duration-300"
            >
              <span>EXPLORE IDEAS</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 stroke-[2.5]" />
            </Link>

            <Link
              href="/ideas/create"
              className="group inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full border border-white/30 bg-black/40 text-white font-medium text-xs uppercase tracking-[0.2em] backdrop-blur-md hover:bg-white/10 hover:border-white/60 hover:scale-[1.02] transition-all duration-300"
            >
              <span>SHARE YOUR IDEA</span>
              <ArrowUpRight className="h-4 w-4 opacity-80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 stroke-[2]" />
            </Link>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-4 xl:col-span-5 pointer-events-none" />
      </div>

      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between text-[10px] font-mono tracking-[0.3em] uppercase text-neutral-500">
        <div>IDEA ERA // 2026</div>
        <div className="hidden sm:block animate-pulse">SCROLL TO DISCOVER ↓</div>
      </div>
    </section>
  );
}
