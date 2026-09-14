"use client";

import * as React from "react";

const milestones = [
  { id: "hero", label: "00 / UNIVERSE" },
  { id: "origin", label: "01 / ORIGIN" },
  { id: "discovery", label: "02 / DISCOVERY" },
  { id: "convergence", label: "03 / CONVERGENCE" },
  { id: "manifestation", label: "04 / MANIFEST" },
  { id: "arenas", label: "05 / ARENAS" },
  { id: "arrival", label: "06 / ARRIVAL" },
];

export function ScrollTimelineSpine() {
  const [progress, setProgress] = React.useState(0);
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const totalScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const p = Math.min(Math.max(scrollY / totalScroll, 0), 1);
      setProgress(p);

      const step = Math.min(Math.floor(p * milestones.length), milestones.length - 1);
      setActiveIdx(step);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <aside
      aria-hidden="true"
      className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-5 pointer-events-none select-none"
    >
      {/* Vertical hairline track */}
      <div className="relative w-[1.5px] h-48 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-amber-400 to-indigo-400 transition-all duration-150"
          style={{ height: `${progress * 100}%` }}
        />
      </div>

      {/* Active Milestone Indicator */}
      <div className="space-y-2 text-right">
        {milestones.map((m, idx) => (
          <div
            key={m.id}
            className={`flex items-center justify-end gap-2 text-[9px] font-mono tracking-[0.25em] uppercase transition-all duration-300 ${
              activeIdx === idx
                ? "text-amber-300 font-bold opacity-100 scale-105"
                : "text-neutral-600 opacity-40"
            }`}
          >
            <span>{m.label}</span>
            <span
              className={`h-1 w-1 rounded-full transition-all ${
                activeIdx === idx
                  ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)] scale-150"
                  : "bg-neutral-600"
              }`}
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
