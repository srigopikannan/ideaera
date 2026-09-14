"use client";

import * as React from "react";

export function SceneOrigin() {
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * 0.08);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="about" className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 z-10 border-t border-white/[0.04] overflow-hidden">
      {/* Background Architectural Watermark moving at subtle parallax speed */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none text-[18vw] font-black text-white/[0.015] tracking-tighter will-change-transform"
        style={{ transform: `translate3d(0, -${offsetY}px, 0)` }}
      >
        ORIGIN
      </div>

      <div className="max-w-4xl mx-auto text-left space-y-8 relative z-10">
        <div className="inline-flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
          <p className="text-[11px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
            01 / THE ORIGIN
          </p>
          <div className="w-12 h-[1px] bg-white/10" />
        </div>

        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-[1.08] uppercase">
          An idea is only <br />
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400">
            the beginning.
          </span>
        </h2>

        <p className="text-xl sm:text-2xl text-neutral-300 font-light leading-relaxed max-w-2xl">
          Every project starts as a thought. The right people can turn that thought into something real.
        </p>

        <p className="text-sm sm:text-base text-neutral-500 font-light leading-relaxed max-w-xl">
          Observe the universe as you scroll. A single isolated point of intuition expands into radiating facets, unlocking latent vectors of technical possibility and human alignment.
        </p>
      </div>
    </section>
  );
}
