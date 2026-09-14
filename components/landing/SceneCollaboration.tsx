"use client";

import * as React from "react";

export function SceneCollaboration() {
  const stages = [
    { step: "01", name: "IDEA", desc: "A raw thesis articulated into the digital void." },
    { step: "02", name: "DISCOVER", desc: "Domain researchers identify and validate the premise." },
    { step: "03", name: "CONNECT", desc: "Engineers and designers lock into team alignment." },
    { step: "04", name: "DISCUSS", desc: "System schemas and architectural sprints solidify." },
    { step: "05", name: "COLLABORATE", desc: "Code, tokens, and hardware prototypes ship daily." },
    { step: "06", name: "CREATE", desc: "The thesis transforms into an operational breakthrough." },
  ];

  const [activeIdx, setActiveIdx] = React.useState(0);
  const [offsetY, setOffsetY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * 0.06);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 z-10 border-t border-white/[0.04] overflow-hidden">
      {/* Background Architectural Watermark */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 select-none pointer-events-none text-[15vw] font-black text-white/[0.015] tracking-tighter will-change-transform"
        style={{ transform: `translate3d(0, -${offsetY}px, 0)` }}
      >
        PIPELINE
      </div>

      <div className="max-w-6xl mx-auto w-full space-y-12 relative z-10">
        <div className="space-y-4 text-left">
          <div className="inline-flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <p className="text-[11px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
              04 / MANIFESTATION PIPELINE
            </p>
            <div className="w-12 h-[1px] bg-white/10" />
          </div>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-[1.08] uppercase">
            Don&apos;t just imagine it. <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400">
              Build it.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-neutral-400 font-light max-w-xl leading-relaxed">
            The fragments align. The structure locks into place. A continuous pipeline turns thoughts into reality.
          </p>
        </div>

        {/* 6-Stage Interactive Sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {stages.map((st, i) => (
            <button
              key={st.name}
              onClick={() => setActiveIdx(i)}
              className={`p-6 rounded-2xl text-left transition-all duration-300 backdrop-blur-xl border ${
                activeIdx === i
                  ? "bg-white/[0.12] border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.12)] scale-105"
                  : "bg-[#070913]/40 border-white/[0.08] hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 mb-3">
                <span>PHASE</span>
                <span>{st.step}</span>
              </div>
              <div className="text-lg font-bold tracking-[0.18em] uppercase text-white mb-2">
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
