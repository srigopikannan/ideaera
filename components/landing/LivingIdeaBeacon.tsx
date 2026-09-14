"use client";

import * as React from "react";

export function LivingIdeaBeacon() {
  const [coords, setCoords] = React.useState({ x: 68, y: 46 });
  const [activeSection, setActiveSection] = React.useState(0);
  const [nexusActive, setNexusActive] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    let targetX = 68;
    let targetY = 46;
    let currentX = 68;
    let currentY = 46;
    let mX = 0;
    let mY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mX = (e.clientX / window.innerWidth) * 100;
      mY = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let rafId: number;

    const updateLoop = () => {
      const scrollY = window.scrollY;
      const totalScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const progress = Math.min(Math.max(scrollY / totalScroll, 0), 1);

      // Trajectory across sections:
      // 0.00 - 0.12 (Hero): at the orb core (x: 68, y: 46)
      // 0.12 - 0.28 (01 Origin): drifts toward left-center thesis (x: 34, y: 50)
      // 0.28 - 0.45 (02 Discovery): glides to right-side preview (x: 70, y: 54)
      // 0.45 - 0.62 (03 Convergence - The WOW Moment): dead center (x: 50, y: 45)
      // 0.62 - 0.78 (04 Manifestation): drifts over pipeline (x: 32, y: 58)
      // 0.78 - 0.90 (05 Arenas): glides to right arena (x: 66, y: 50)
      // 0.90 - 1.00 (06 Final CTA): locks into final core (x: 50, y: 40)

      let sec = 0;
      let isNexus = false;

      if (progress < 0.12) {
        sec = 0;
        const p = progress / 0.12;
        targetX = 68 + p * -4;
        targetY = 46 + p * 2;
      } else if (progress < 0.28) {
        sec = 1;
        const p = (progress - 0.12) / 0.16;
        targetX = 64 - p * 30; // 64 -> 34
        targetY = 48 + p * 4;  // 48 -> 52
      } else if (progress < 0.45) {
        sec = 2;
        const p = (progress - 0.28) / 0.17;
        targetX = 34 + p * 36; // 34 -> 70
        targetY = 52 + p * 2;  // 52 -> 54
      } else if (progress < 0.62) {
        sec = 3;
        isNexus = true; // Trigger the WOW nexus moment!
        const p = (progress - 0.45) / 0.17;
        targetX = 70 - p * 20; // 70 -> 50 (dead center)
        targetY = 54 - p * 9;  // 54 -> 45
      } else if (progress < 0.78) {
        sec = 4;
        const p = (progress - 0.62) / 0.16;
        targetX = 50 - p * 18; // 50 -> 32
        targetY = 45 + p * 13; // 45 -> 58
      } else if (progress < 0.90) {
        sec = 5;
        const p = (progress - 0.78) / 0.12;
        targetX = 32 + p * 34; // 32 -> 66
        targetY = 58 - p * 8;  // 58 -> 50
      } else {
        sec = 6;
        const p = (progress - 0.90) / 0.10;
        targetX = 66 - p * 16; // 66 -> 50
        targetY = 50 - p * 10; // 50 -> 40
      }

      // Subtle magnetic attraction toward cursor (desktop only)
      const distToMouse = Math.hypot(mX - targetX, mY - targetY);
      let magnetOffsetX = 0;
      let magnetOffsetY = 0;
      if (distToMouse < 22 && distToMouse > 0.1) {
        const pull = (1 - distToMouse / 22) * 2.8;
        magnetOffsetX = ((mX - targetX) / distToMouse) * pull;
        magnetOffsetY = ((mY - targetY) / distToMouse) * pull;
      }

      // Lerp smoothing
      currentX += (targetX + magnetOffsetX - currentX) * 0.08;
      currentY += (targetY + magnetOffsetY - currentY) * 0.08;

      setCoords({ x: currentX, y: currentY });
      setActiveSection(sec);
      setNexusActive(isNexus);

      rafId = requestAnimationFrame(updateLoop);
    };

    rafId = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* Dynamic SVG Connection Constellation Lines (Active in Section 03 Convergence) */}
      {nexusActive && (
        <svg className="absolute inset-0 w-full h-full opacity-75 transition-opacity duration-700">
          <defs>
            <linearGradient id="nexusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Laser connection lines from beacon out to 4 cardinal directions */}
          <line
            x1={`${coords.x}%`}
            y1={`${coords.y}%`}
            x2="25%"
            y2="30%"
            stroke="url(#nexusGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
          <line
            x1={`${coords.x}%`}
            y1={`${coords.y}%`}
            x2="75%"
            y2="30%"
            stroke="url(#nexusGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
          <line
            x1={`${coords.x}%`}
            y1={`${coords.y}%`}
            x2="25%"
            y2="65%"
            stroke="url(#nexusGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
          <line
            x1={`${coords.x}%`}
            y1={`${coords.y}%`}
            x2="75%"
            y2="65%"
            stroke="url(#nexusGrad)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* The Living Idea Light Beacon Container */}
      <div
        className="absolute transition-transform duration-75 will-change-transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${coords.x}%`,
          top: `${coords.y}%`,
        }}
      >
        {/* Ambient radial glow halo */}
        <div className="absolute -inset-8 rounded-full bg-amber-500/20 blur-xl animate-pulse" />

        {/* Outer orbital wire ring */}
        <div className="relative flex items-center justify-center h-10 w-10">
          <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-1 rounded-full border border-amber-300/15 animate-[spin_12s_linear_infinite_reverse]" />

          {/* Glowing particle core */}
          <div className="relative h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,1),0_0_30px_rgba(245,158,11,0.9)]" />

          {/* Orbiting micro-satellite speck */}
          <div className="absolute -top-1 h-1 w-1 rounded-full bg-amber-300 shadow-[0_0_6px_rgba(245,158,11,1)]" />
        </div>

        {/* Subtle section watermark tag following the beacon */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono tracking-[0.3em] uppercase text-amber-300/60 transition-all">
          {activeSection === 0 && "VECTOR // INTENT"}
          {activeSection === 1 && "VECTOR // THESIS"}
          {activeSection === 2 && "VECTOR // DISCOVERY"}
          {activeSection === 3 && "VECTOR // RESONANCE"}
          {activeSection === 4 && "VECTOR // PIPELINE"}
          {activeSection === 5 && "VECTOR // ARENA"}
          {activeSection === 6 && "VECTOR // CONVERGENCE"}
        </div>
      </div>
    </div>
  );
}
