"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivingEmptyStateProps {
  title?: string;
  subtitle?: string;
  actionText?: string;
  actionHref?: string;
  className?: string;
}

export function LivingEmptyState({
  title = "YOUR IDEA FIELD IS QUIET.",
  subtitle = "Be the first to synthesize a thesis and ignite possibilities.",
  actionText = "Ignite Concept",
  actionHref = "/ideas/create",
  className = "",
}: LivingEmptyStateProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

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

    const dots = [
      { angle: 0, dist: 38, size: 2 },
      { angle: Math.PI / 3, dist: 42, size: 1.5 },
      { angle: (2 * Math.PI) / 3, dist: 35, size: 2 },
      { angle: Math.PI, dist: 40, size: 1.8 },
      { angle: (4 * Math.PI) / 3, dist: 36, size: 1.5 },
      { angle: (5 * Math.PI) / 3, dist: 44, size: 2 },
    ];

    let t = 0;

    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Central dormant spark
      const pulse = 1 + Math.sin(t * 1.5) * 0.2;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24 * pulse);
      coreGrad.addColorStop(0, "rgba(99, 102, 241, 0.4)");
      coreGrad.addColorStop(0.6, "rgba(168, 85, 247, 0.15)");
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 24 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Core tiny bead
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(129, 140, 248, 0.9)";
      ctx.shadowBlur = 10;
      ctx.fill();

      // Constellation dots
      dots.forEach((dot, idx) => {
        const curAngle = dot.angle + t * 0.2;
        const curDist = dot.dist + Math.sin(t * 2 + idx) * 3;
        const x = cx + Math.cos(curAngle) * curDist;
        const y = cy + Math.sin(curAngle) * (curDist * 0.65);

        // Faint tether to center
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "rgba(99, 102, 241, 0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.restore();

        // Dot
        ctx.beginPath();
        ctx.arc(x, y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
        ctx.shadowColor = "rgba(148, 163, 184, 0.5)";
        ctx.shadowBlur = 4;
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative w-full py-20 px-6 flex flex-col items-center justify-center text-center space-y-6 overflow-hidden select-none",
        className
      )}
    >
      {/* Living Constellation Canvas */}
      <div className="relative h-44 w-44 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" />
      </div>

      {/* Poetic Callout */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-base sm:text-lg font-light tracking-[0.24em] text-white uppercase font-mono">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Action Button */}
      {actionHref && (
        <div className="pt-2">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-200 transition-all shadow-xl hover:scale-105"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{actionText}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
