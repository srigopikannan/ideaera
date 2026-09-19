"use client";

import * as React from "react";
import Link from "next/link";
import { MatchRecommendation } from "@/types";
import { Zap, UserPlus, Check, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface LivingSynergyNetworkProps {
  recommendations: MatchRecommendation[];
  onConnect: (userId: string) => Promise<void>;
  connectingMap: Record<string, boolean>;
  connectedMap: Record<string, boolean>;
  pendingMap?: Record<string, boolean>;
}

export function LivingSynergyNetwork({
  recommendations,
  onConnect,
  connectingMap,
  connectedMap,
  pendingMap = {},
}: LivingSynergyNetworkProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const currentTimeRef = React.useRef<number>(0);
  const [activeRec, setActiveRec] = React.useState<MatchRecommendation | null>(
    recommendations.length > 0 ? recommendations[0] : null
  );

  const avatarImagesRef = React.useRef<Map<string, HTMLImageElement>>(new Map());

  React.useEffect(() => {
    if (recommendations.length > 0) {
      if (!activeRec || !recommendations.some((r) => r.profile.id === activeRec.profile.id)) {
        setActiveRec(recommendations[0]);
      }
    } else {
      setActiveRec(null);
    }
  }, [recommendations]);

  // Preload avatars for smooth canvas rendering
  React.useEffect(() => {
    recommendations.forEach((rec) => {
      if (rec.profile.avatar_url && !avatarImagesRef.current.has(rec.profile.id)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = rec.profile.avatar_url;
        img.onload = () => {
          avatarImagesRef.current.set(rec.profile.id, img);
        };
      }
    });
  }, [recommendations]);

  // Position nodes radially around the center with harmonic spacing
  const nodePositions = React.useMemo(() => {
    const total = Math.max(recommendations.length, 1);
    return recommendations.map((rec, idx) => {
      const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
      // Score-based distance: higher score = closer to origin!
      const score = rec.matchScore || 50;
      const baseDist = 310 - (score / 100) * 150 + (idx % 2) * 16;
      return {
        rec,
        angle,
        baseDist,
        speed: 0.0012 + (idx % 3) * 0.0008,
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
      currentTimeRef.current = t;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseScale = Math.min(1, (Math.min(width, height) * 0.44) / 320);
      const scale = Math.max(0.42, baseScale);

      // Orbital resonance dashed rings
      [90, 160, 240, 320].forEach((baseR, ringIdx) => {
        const r = baseR * scale;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = ringIdx === 0 ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.restore();
      });

      // Central Harmonic Aura
      const sunR = Math.max(38, 85 * scale);
      const sunGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR);
      sunGrad.addColorStop(0, "rgba(99, 102, 241, 0.35)");
      sunGrad.addColorStop(0.4, "rgba(56, 189, 248, 0.12)");
      sunGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Laser Filaments & Candidate Nodes
      nodePositions.forEach((node) => {
        const currentAngle = node.angle + t * node.speed;
        const dist = node.baseDist * scale;
        const nx = cx + Math.cos(currentAngle) * dist;
        const ny = cy + Math.sin(currentAngle) * (dist * 0.78);

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
        ctx.strokeStyle = "rgba(" + filamentCol + ", " + (isHovered ? 0.85 : 0.22) + ")";
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
        const haloR = isHovered ? 26 : 14;
        ctx.arc(nx, ny, haloR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + filamentCol + ", " + (isHovered ? 0.25 : 0.1) + ")";
        ctx.fill();

        // Node Core / Avatar
        const coreR = isHovered ? 15 : 10;
        const cachedImg = avatarImagesRef.current.get(node.rec.profile.id);

        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(nx, ny, coreR, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(cachedImg, nx - coreR, ny - coreR, coreR * 2, coreR * 2);
          ctx.restore();

          // Border ring around avatar
          ctx.beginPath();
          ctx.arc(nx, ny, coreR, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? "#ffffff" : "rgba(" + filamentCol + ", 0.9)";
          ctx.lineWidth = isHovered ? 2 : 1.5;
          ctx.stroke();
        } else {
          // Circular monogram core
          ctx.beginPath();
          ctx.arc(nx, ny, coreR, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? "#0e1322" : "rgba(10, 12, 19, 0.95)";
          ctx.fill();
          ctx.strokeStyle = isHovered ? "#38bdf8" : "rgba(" + filamentCol + ", 0.8)";
          ctx.lineWidth = isHovered ? 2 : 1.5;
          ctx.stroke();

          // Initials inside core
          ctx.fillStyle = "#ffffff";
          ctx.font = isHovered ? "bold 10px sans-serif" : "9px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const initials = (node.rec.profile.full_name || node.rec.profile.username || "U")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          ctx.fillText(initials, nx, ny);
        }

        ctx.restore();

        // Node Name Label
        ctx.save();
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
        ctx.font = isHovered ? "bold 11px monospace" : "10px monospace";
        ctx.textAlign = "center";
        const name = node.rec.profile.full_name || node.rec.profile.username || "Innovator";
        ctx.fillText(name, nx, ny + (isHovered ? 28 : 22));

        // Node Match Percentage Pill
        ctx.fillStyle = isHovered ? "#38bdf8" : "rgba(56, 189, 248, 0.8)";
        ctx.font = "9px monospace";
        ctx.fillText(`${node.rec.matchScore}%`, nx, ny + (isHovered ? 40 : 33));
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
  const handleInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const baseScale = Math.min(1, (Math.min(rect.width, rect.height) * 0.44) / 320);
    const scale = Math.max(0.42, baseScale);
    const t = currentTimeRef.current;

    let closest: MatchRecommendation | null = null;
    let minDist = 40;

    for (const node of nodePositions) {
      const currentAngle = node.angle + t * node.speed;
      const dist = node.baseDist * scale;
      const nx = cx + Math.cos(currentAngle) * dist;
      const ny = cy + Math.sin(currentAngle) * (dist * 0.78);
      const d = Math.hypot(mx - nx, my - ny);
      if (d < minDist) {
        minDist = d;
        closest = node.rec;
      }
    }
    if (closest) {
      setActiveRec(closest);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInteraction(e.clientX, e.clientY);
  };

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!e.touches[0]) return;
    handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };

  const renderDossierCard = (rec: MatchRecommendation) => {
    const isConnected =
      connectedMap[rec.profile.id] ||
      rec.profile.connection_status === "connected";
    const isPending =
      pendingMap[rec.profile.id] ||
      rec.profile.connection_status === "pending_sent";
    const isConnecting = connectingMap[rec.profile.id];

    return (
      <div className="space-y-4">
        {/* Top Header: Resonance Pill & Link */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
            <Zap className="h-3 w-3" />
            <span>{rec.matchScore}% Resonance</span>
          </div>

          <Link
            href={"/people/" + rec.profile.username}
            className="text-xs font-mono text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Dossier</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Identity with Avatar */}
        <div className="flex items-start gap-3.5 pt-1">
          <Avatar
            src={rec.profile.avatar_url}
            alt={rec.profile.full_name || rec.profile.username}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={"/people/" + rec.profile.username}
              className="text-base sm:text-lg font-light text-white hover:text-cyan-200 transition-colors block truncate"
            >
              {rec.profile.full_name}
            </Link>
            <p className="text-xs text-neutral-400 font-mono">
              @{rec.profile.username}
            </p>
            {rec.profile.headline && (
              <p className="text-xs text-neutral-300 font-light pt-1 line-clamp-2 leading-relaxed">
                {rec.profile.headline}
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        {rec.profile.skills && rec.profile.skills.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Skills:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto no-scrollbar">
              {rec.profile.skills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-neutral-300 border border-white/10"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shared Skills */}
        {rec.sharedSkills && rec.sharedSkills.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
              Shared:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rec.sharedSkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Complementary Skills */}
        {rec.complementarySkills && rec.complementarySkills.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
              Complementary:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rec.complementarySkills.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {rec.profile.interests && rec.profile.interests.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Interests:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rec.profile.interests.map((i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
                >
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Active Projects */}
        {rec.projects && rec.projects.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              Projects:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rec.projects.map((p) => (
                <Link
                  key={p.id}
                  href={"/projects/" + p.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:border-emerald-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>{p.name}</span>
                  <ArrowUpRight className="h-2.5 w-2.5" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Rationale */}
        {rec.matchReason && (
          <div className="pt-2 border-t border-white/[0.08]">
            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
              {rec.matchReason}
            </p>
          </div>
        )}

        {/* Connection Action */}
        <div className="pt-2">
          {isConnected ? (
            <div className="w-full py-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono font-semibold text-center flex items-center justify-center gap-2">
              <Check className="h-3.5 w-3.5" />
              <span>CONNECTED</span>
            </div>
          ) : isPending ? (
            <div className="w-full py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-neutral-400 text-xs font-mono font-semibold text-center">
              REQUEST SENT
            </div>
          ) : (
            <button
              onClick={() => onConnect(rec.profile.id)}
              disabled={isConnecting}
              className="w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 hover:scale-[1.01]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isConnecting ? "CONNECTING..." : "CONNECT"}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative w-full h-[460px] sm:h-[620px] rounded-3xl border border-white/[0.08] bg-[#07090e] overflow-hidden shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onClick={(e) => handleInteraction(e.clientX, e.clientY)}
          className="w-full h-full block cursor-crosshair touch-none"
        />

        {/* Center Core Marker */}
        <div className="absolute inset-0 m-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#0a0c13]/90 border-2 border-indigo-500/40 p-1 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.35)] pointer-events-none">
          <div className="h-full w-full rounded-full bg-indigo-500/15 flex flex-col items-center justify-center text-center">
            <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
              YOU
            </span>
            <span className="text-[7px] sm:text-[8px] font-mono text-neutral-400 tracking-wider">
              ORIGIN
            </span>
          </div>
        </div>

        {/* Floating Holographic Synergy Telemetry Card (Desktop / Tablet) */}
        {activeRec && (
          <div className="hidden sm:block absolute bottom-6 right-6 w-96 max-w-sm max-h-[calc(100%-3rem)] overflow-y-auto no-scrollbar p-5 rounded-3xl border border-white/15 bg-[#0a0c13]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-30 transition-all">
            {renderDossierCard(activeRec)}
          </div>
        )}
      </div>

      {/* Mobile Telemetry Dossier Section (Clean, non-clipping dock) */}
      {activeRec && (
        <div className="sm:hidden w-full p-5 rounded-3xl border border-white/10 bg-[#0a0c13]/90 backdrop-blur-xl shadow-xl">
          {renderDossierCard(activeRec)}
        </div>
      )}
    </div>
  );
}
