"use client";

import * as React from "react";
import Link from "next/link";
import { MatchRecommendation } from "@/types";
import { Zap, UserPlus, Check, ArrowUpRight, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivingSynergyNetworkProps {
  recommendations: MatchRecommendation[];
  onConnect: (userId: string) => Promise<void>;
  connectingMap: Record<string, boolean>;
  connectedMap: Record<string, boolean>;
}

export function LivingSynergyNetwork({
  recommendations,
  onConnect,
  connectingMap,
  connectedMap,
}: LivingSynergyNetworkProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [activeRec, setActiveRec] = React.useState<MatchRecommendation | null>(
    recommendations.length > 0 ? recommendations[0] : null
  );

  // Position nodes radially around the center with varying orbital radius and angular speed
  const nodePositions = React.useMemo(() => {
    const total = Math.max(recommendations.length, 1);
    return recommendations.map((rec, idx) => {
      const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
      // Score-based distance: higher score = closer to center!
      const score = rec.matchScore || 50;
      const baseDist = 320 - (score / 100) * 160 + (idx % 2) * 20;
      return {
        rec,
        angle,
        baseDist,
        speed: 0.0015 + ((idx % 3) * 0.001),
      };
    });
  }, [recommendations]);

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

    let t = 0;

    const render = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw harmonic orbital resonance rings
      [90, 160, 240, 320].forEach((r, ringIdx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ringIdx === 0 ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      });

      // Central Harmonic Sun
      const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      sunGrad.addColorStop(0, "rgba(99, 102, 241, 0.3)");
      sunGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.1)");
      sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      // Render Nodes & Filaments
      nodePositions.forEach((node) => {
        const currentAngle = node.angle + t * node.speed;
        const nx = cx + Math.cos(currentAngle) * node.baseDist;
        const ny = cy + Math.sin(currentAngle) * (node.baseDist * 0.75);

        const isHovered = activeRec?.profile.id === node.rec.profile.id;
        const isConnected =
          connectedMap[node.rec.profile.id] ||
          node.rec.profile.connection_status === "connected";

        const filamentCol = isConnected
          ? "52, 211, 153" // Emerald
          : isHovered
          ? "56, 189, 248" // Cyan
          : "129, 140, 248"; // Indigo

        // Laser Filament
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = "rgba(" + filamentCol + ", " + (isHovered ? 0.8 : 0.22) + ")";
        ctx.lineWidth = isHovered ? 2 : 1;
        if (!isHovered) {
          ctx.setLineDash([2, 5]);
        }
        ctx.stroke();

        // Traveling pulse particle along filament
        const pulseProg = (t * 0.7 + node.angle) % 1;
        const px = cx + (nx - cx) * pulseProg;
        const py = cy + (ny - cy) * pulseProg;
        ctx.beginPath();
        ctx.arc(px, py, isHovered ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + filamentCol + ", 0.95)";
        ctx.shadowColor = "rgba(" + filamentCol + ", 0.9)";
        ctx.shadowBlur = isHovered ? 8 : 4;
        ctx.fill();
        ctx.restore();

        // Node Glow Halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(nx, ny, isHovered ? 24 : 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + filamentCol + ", " + (isHovered ? 0.25 : 0.1) + ")";
        ctx.fill();

        // Node Core
        ctx.beginPath();
        ctx.arc(nx, ny, isHovered ? 9 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(" + filamentCol + ", 0.95)";
        ctx.shadowColor = "rgba(" + filamentCol + ", 0.9)";
        ctx.shadowBlur = isHovered ? 16 : 8;
        ctx.fill();
        ctx.restore();

        // Node Label
        ctx.save();
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.6)";
        ctx.font = isHovered ? "bold 11px monospace" : "10px monospace";
        ctx.textAlign = "center";
        const name = node.rec.profile.full_name || node.rec.profile.username || "Innovator";
        ctx.fillText(name, nx, ny + (isHovered ? 26 : 20));
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodePositions, activeRec, connectedMap]);

  // Handle interaction on canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    let closest: MatchRecommendation | null = null;
    let minDist = 34;

    for (const node of nodePositions) {
      const nx = cx + Math.cos(node.angle) * node.baseDist;
      const ny = cy + Math.sin(node.angle) * (node.baseDist * 0.75);
      const dist = Math.hypot(mx - nx, my - ny);
      if (dist < minDist) {
        minDist = dist;
        closest = node.rec;
      }
    }
    if (closest) {
      setActiveRec(closest);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-3xl border border-white/[0.08] bg-[#07090e] overflow-hidden shadow-2xl flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Center Core Marker */}
      <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-[#0a0c13]/90 border-2 border-indigo-500/40 p-1 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] pointer-events-none">
        <div className="h-full w-full rounded-full bg-indigo-500/15 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-400">YOU</span>
          <span className="text-[8px] font-mono text-neutral-400">ORIGIN</span>
        </div>
      </div>

      {/* Floating Holographic Synergy Telemetry Card */}
      {activeRec && (
        <div className="absolute bottom-6 right-6 w-88 max-w-[calc(100vw-3rem)] p-6 rounded-3xl border border-white/15 bg-[#0a0c13]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4 z-30 transition-all">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              <Zap className="h-3 w-3" />
              <span>{activeRec.matchScore}% Resonance</span>
            </div>

            <Link
              href={"/people/" + activeRec.profile.username}
              className="text-xs font-mono text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>Dossier</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div>
            <h4 className="text-lg font-light text-white">
              {activeRec.profile.full_name}
            </h4>
            <p className="text-xs text-neutral-400 font-mono">
              @{activeRec.profile.username}
            </p>
            {activeRec.profile.headline && (
              <p className="text-xs text-neutral-300 font-light pt-2 line-clamp-2">
                {activeRec.profile.headline}
              </p>
            )}
          </div>

          {/* Shared Skills */}
          {activeRec.sharedSkills && activeRec.sharedSkills.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                Synchronized Capabilities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeRec.sharedSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rationale */}
          {activeRec.matchReason && (
            <div className="space-y-1 pt-2 border-t border-white/[0.08]">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                Synergy Matrix
              </span>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                {activeRec.matchReason}
              </p>
            </div>
          )}

          {/* Connection Action */}
          <div className="pt-2">
            {connectedMap[activeRec.profile.id] ||
            activeRec.profile.connection_status === "connected" ? (
              <div className="w-full py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                <span>Quantum Bond Established</span>
              </div>
            ) : activeRec.profile.connection_status === "pending_sent" ? (
              <div className="w-full py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 text-xs font-mono text-center">
                Signal Transmitted
              </div>
            ) : (
              <button
                onClick={() => onConnect(activeRec.profile.id)}
                disabled={connectingMap[activeRec.profile.id]}
                className="w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 hover:scale-[1.02]"
              >
                <UserPlus className="h-4 w-4" />
                <span>{connectingMap[activeRec.profile.id] ? "Transmitting..." : "Initiate Signal"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
