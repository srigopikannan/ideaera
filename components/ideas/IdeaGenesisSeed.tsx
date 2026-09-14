"use client";

import * as React from "react";
import { Sparkles, Activity, Layers, Tag } from "lucide-react";

interface IdeaGenesisSeedProps {
  title: string;
  problem: string;
  solution: string;
  category: string;
  tags: string;
  isSubmitting?: boolean;
}

export function IdeaGenesisSeed({
  title,
  problem,
  solution,
  category,
  tags,
  isSubmitting = false,
}: IdeaGenesisSeedProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Parse tags list
  const tagList = React.useMemo(() => {
    return tags
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
  }, [tags]);

  // Calculate resonance metrics
  const metrics = React.useMemo(() => {
    let score = 0;
    if (title.trim().length > 3) score += 25;
    if (problem.trim().length > 15) score += 25;
    if (solution.trim().length > 15) score += 25;
    if (tagList.length >= 1) score += 25;

    let stage = "Nascent Spark";
    let statusColor = "text-neutral-400";
    if (score >= 25 && score < 50) {
      stage = "Forming Thesis";
      statusColor = "text-indigo-400";
    } else if (score >= 50 && score < 75) {
      stage = "Articulated Model";
      statusColor = "text-purple-400";
    } else if (score >= 75) {
      stage = "Orbit Ready";
      statusColor = "text-cyan-400";
    }

    return { score, stage, statusColor };
  }, [title, problem, solution, tagList]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
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

    // Particles system
    const maxParticles = 60;
    const particles = Array.from({ length: maxParticles }, (_, i) => ({
      angle: Math.random() * Math.PI * 2,
      dist: 30 + Math.random() * 90,
      baseDist: 30 + Math.random() * 90,
      speed: 0.006 + Math.random() * 0.012,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.6,
      orbitElevation: (Math.random() - 0.5) * 40,
    }));

    let t = 0;

    const render = () => {
      t += 0.018;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Category color mapping
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

      const hasTitle = title.trim().length > 0;
      const textDensity = Math.min((problem.length + solution.length) / 100, 1);
      const submitPulse = isSubmitting ? Math.sin(t * 10) * 0.3 + 1.2 : 1;

      // 1. Ignition shockwave during submission
      if (isSubmitting) {
        const shockRadius = ((t * 80) % 200) + 20;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + pCol + ", " + (1 - shockRadius / 200) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Ambient background glow
      const baseGlow = hasTitle ? 50 + textDensity * 40 : 25;
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseGlow * submitPulse);
      glowGrad.addColorStop(0, "rgba(" + pCol + ", " + (hasTitle ? 0.35 : 0.12) + ")");
      glowGrad.addColorStop(0.6, "rgba(" + sCol + ", " + (hasTitle ? 0.15 : 0.05) + ")");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseGlow * submitPulse, 0, Math.PI * 2);
      ctx.fill();

      // 3. Stardust particles (Density driven by description & problem)
      const activeParticleCount = hasTitle ? Math.floor(18 + textDensity * 42) : 10;
      for (let i = 0; i < activeParticleCount; i++) {
        const pt = particles[i];
        pt.angle += pt.speed * (hasTitle ? 1.4 : 0.6);
        const distOffset = Math.sin(t * 2 + i) * 6;
        const currentDist = (pt.baseDist + distOffset) * (hasTitle ? 1 : 0.65);
        const px = cx + Math.cos(pt.angle) * currentDist;
        const py = cy + Math.sin(pt.angle) * (currentDist * 0.45) + pt.orbitElevation;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + aCol + ", " + (pt.alpha * (hasTitle ? 0.8 : 0.3)) + ")";
        ctx.shadowColor = "rgba(" + aCol + ", 0.6)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      }

      // 4. Primary Orbital Awakening Ring (Appears when title is entered)
      if (hasTitle) {
        const ringRadius = 46 + Math.sin(t * 1.5) * 3;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringRadius, ringRadius * 0.38, t * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + pCol + ", 0.55)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();

        // Secondary counter-spinning ring
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringRadius * 1.25, ringRadius * 0.42, -t * 0.6 + 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + sCol + ", 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Tag Satellites
      tagList.slice(0, 6).forEach((tag, idx) => {
        const angle = (idx / Math.min(tagList.length, 6)) * Math.PI * 2 + t * 0.4;
        const satDist = 80 + (idx % 2) * 15;
        const sx = cx + Math.cos(angle) * satDist;
        const sy = cy + Math.sin(angle) * (satDist * 0.45);

        // Tether line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = "rgba(" + pCol + ", 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.restore();

        // Satellite node
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + aCol + ", 0.9)";
        ctx.shadowColor = "rgba(" + aCol + ", 0.8)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // 6. Living Central Seed Nucleus
      const coreSize = (hasTitle ? 18 + textDensity * 8 : 10) * submitPulse;
      const coreGrad = ctx.createRadialGradient(
        cx - coreSize * 0.25,
        cy - coreSize * 0.25,
        1,
        cx,
        cy,
        coreSize
      );
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.35, "rgba(" + pCol + ", 0.95)");
      coreGrad.addColorStop(0.8, "rgba(" + sCol + ", 0.7)");
      coreGrad.addColorStop(1, "rgba(10, 12, 19, 0.4)");

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = "rgba(" + pCol + ", 0.85)";
      ctx.shadowBlur = 18 * submitPulse;
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [title, problem, solution, category, tagList, isSubmitting]);

  return (
    <div className="relative rounded-3xl border border-white/[0.08] bg-[#0a0c13] p-6 sm:p-8 overflow-hidden space-y-6 shadow-2xl">
      {/* Visual Canvas Stage */}
      <div className="relative h-56 sm:h-64 w-full flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Empty dormant prompt */}
        {!title.trim() && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-600">
              Dormant Concept Spark
            </span>
          </div>
        )}
      </div>

      {/* Realtime Resonance HUD */}
      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-500 block">
              IDEA RESONANCE
            </span>
            <span className={"text-xs font-mono font-medium " + metrics.statusColor}>
              {metrics.stage}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xl font-mono font-light text-white">
              {metrics.score}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300 ease-out"
            style={{ width: metrics.score + "%" }}
          />
        </div>

        {/* Dynamic Telemetry Checklist */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (title.trim().length > 3 ? "bg-emerald-400" : "bg-neutral-600")
              }
            />
            <span>Thesis Title</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (problem.trim().length > 15 ? "bg-emerald-400" : "bg-neutral-600")
              }
            />
            <span>Problem Domain</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (solution.trim().length > 15 ? "bg-emerald-400" : "bg-neutral-600")
              }
            />
            <span>Solution Blueprint</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (tagList.length >= 1 ? "bg-emerald-400" : "bg-neutral-600")
              }
            />
            <span>Satellite Tags ({tagList.length})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
