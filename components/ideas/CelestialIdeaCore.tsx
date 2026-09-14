"use client";

import * as React from "react";

interface CelestialIdeaCoreProps {
  scrollProgress: number; // 0 to 1
  category?: string;
  className?: string;
}

export function CelestialIdeaCore({
  scrollProgress,
  category = "Technology",
  className = "",
}: CelestialIdeaCoreProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mouseRef = React.useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const progressRef = React.useRef(scrollProgress);

  React.useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current.targetY = (e.clientY - rect.top) / rect.height - 0.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Dynamic satellites for Dimensions 4 & 5
    const satellites = [
      { angle: 0, radius: 110, speed: 0.015, color: "rgba(99, 102, 241, 0.9)", label: "Innovator" },
      { angle: (Math.PI * 2) / 3, radius: 135, speed: 0.012, color: "rgba(168, 85, 247, 0.9)", label: "Architect" },
      { angle: (Math.PI * 4) / 3, radius: 120, speed: -0.014, color: "rgba(56, 189, 248, 0.9)", label: "Collaborator" },
    ];

    let t = 0;

    const render = () => {
      t += 0.016;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const p = progressRef.current; // 0 to 1
      const cx = width / 2 + mouseRef.current.x * 25;
      const cy = height / 2 + mouseRef.current.y * 25;

      ctx.clearRect(0, 0, width, height);

      let pCol = "99, 102, 241"; // Indigo
      let sCol = "168, 85, 247"; // Purple
      let aCol = "56, 189, 248"; // Cyan

      if (category.toLowerCase().includes("climate") || category.toLowerCase().includes("bio")) {
        pCol = "16, 185, 129";
        sCol = "52, 211, 153";
        aCol = "45, 212, 191";
      } else if (category.toLowerCase().includes("security") || category.toLowerCase().includes("web3")) {
        pCol = "245, 158, 11";
        sCol = "251, 191, 36";
        aCol = "239, 68, 68";
      }

      // DIMENSION 06: Full Resonance Bloom Wave (p > 0.85)
      if (p > 0.8) {
        const bloomFactor = (p - 0.8) / 0.2;
        const wave = ((t * 40) % 200) + 30;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, wave, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + pCol + ", " + (1 - wave / 200) * 0.3 * bloomFactor + ")";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // Background Ambient Glow (Expands as scroll deepens)
      const glowR = 70 + p * 80 + Math.sin(t * 1.5) * 6;
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      bgGrad.addColorStop(0, "rgba(" + pCol + ", " + (0.2 + p * 0.25) + ")");
      bgGrad.addColorStop(0.6, "rgba(" + sCol + ", " + (0.08 + p * 0.12) + ")");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // DIMENSION 02 & 03: Gyroscopic Coordinate & Crystalline Rings (p > 0.2)
      if (p > 0.15) {
        const ringProgress = Math.min((p - 0.15) / 0.4, 1);
        const r1 = (55 + p * 35) * ringProgress;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, r1, r1 * 0.35, t * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + pCol + ", " + (0.45 * ringProgress) + ")";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, r1 * 1.2, r1 * 0.45, -t * 0.35 + 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + sCol + ", " + (0.35 * ringProgress) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // DIMENSION 03: Crystalline Hexagon Lattice (p > 0.4)
        if (p > 0.35) {
          const crystalFactor = Math.min((p - 0.35) / 0.3, 1);
          const sides = 6;
          const polyR = 36 + Math.sin(t * 2) * 3;
          ctx.save();
          ctx.beginPath();
          for (let i = 0; i <= sides; i++) {
            const angle = (i / sides) * Math.PI * 2 + t * 0.5;
            const x = cx + Math.cos(angle) * polyR;
            const y = cy + Math.sin(angle) * (polyR * 0.65);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = "rgba(255, 255, 255, " + (0.3 * crystalFactor) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Central Celestial Sphere Core
      const coreR = 24 + Math.sin(t * 2) * 2 + p * 10;
      const coreGrad = ctx.createRadialGradient(
        cx - coreR * 0.25,
        cy - coreR * 0.25,
        coreR * 0.1,
        cx,
        cy,
        coreR
      );
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.3, "rgba(" + pCol + ", 0.95)");
      coreGrad.addColorStop(0.8, "rgba(" + sCol + ", 0.7)");
      coreGrad.addColorStop(1, "rgba(10, 12, 19, 0.4)");

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = "rgba(" + pCol + ", 0.9)";
      ctx.shadowBlur = 24 + p * 16;
      ctx.fill();
      ctx.restore();

      // DIMENSION 04 & 05: People Satellites & Laser Filaments (p > 0.55)
      if (p > 0.55) {
        const satExpansion = Math.min((p - 0.55) / 0.25, 1);
        satellites.forEach((sat) => {
          sat.angle += sat.speed;
          const r = sat.radius * satExpansion;
          const sx = cx + Math.cos(sat.angle) * r;
          const sy = cy + Math.sin(sat.angle) * (r * 0.45);

          // Filament
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = "rgba(" + pCol + ", " + (0.28 * satExpansion) + ")";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.stroke();

          // Satellite Node
          ctx.beginPath();
          ctx.arc(sx, sy, 4, 0, Math.PI * 2);
          ctx.fillStyle = sat.color;
          ctx.shadowColor = sat.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.restore();
        });
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [category]);

  return (
    <div className={"relative pointer-events-none " + className}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
