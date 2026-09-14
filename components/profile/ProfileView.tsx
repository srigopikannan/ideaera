"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Profile, Project, Idea } from "@/types";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
import { deleteIdeaAction } from "@/app/(dashboard)/actions/ideas";
import { deleteProjectAction } from "@/app/(dashboard)/actions/projects";
import { Edit3, Check, ArrowUpRight, Trash2, Plus, Sparkles } from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { cn } from "@/lib/utils";

interface ProfileViewProps {
  profile: Profile;
  isCurrentUser: boolean;
  projects?: Project[];
  ideas?: Idea[];
  connections?: Profile[];
}

interface OrbitNode {
  id: string;
  type: "idea" | "project" | "connection";
  title: string;
  subtitle: string;
  url: string;
  statusColor: string;
  angle: number;
  radius: number;
  speed: number;
  rawItem: Idea | Project | Profile;
}

export function ProfileView({
  profile,
  isCurrentUser,
  projects = [],
  ideas = [],
  connections = [],
}: ProfileViewProps) {
  const router = useRouter();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [activeNode, setActiveNode] = React.useState<OrbitNode | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState(profile.connection_status || "none");
  const [isConnecting, setIsConnecting] = React.useState(false);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = React.useState<{ type: "idea" | "project"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Generate orbit nodes
  const nodes = React.useMemo<OrbitNode[]>(() => {
    const list: OrbitNode[] = [];

    // Inner Orbit: Ideas (Radius 135)
    ideas.forEach((idea, idx) => {
      const angle = (idx / Math.max(ideas.length, 1)) * Math.PI * 2;
      list.push({
        id: "idea-" + idea.id,
        type: "idea",
        title: idea.title,
        subtitle: idea.category,
        url: "/ideas/" + idea.id,
        statusColor: "99, 102, 241", // Indigo
        angle,
        radius: 135,
        speed: 0.005,
        rawItem: idea,
      });
    });

    // Middle Orbit: Projects (Radius 215)
    projects.forEach((proj, idx) => {
      const angle = (idx / Math.max(projects.length, 1)) * Math.PI * 2 + 0.6;
      let col = "168, 85, 247"; // Purple
      if (proj.status === "launched") col = "16, 185, 129";
      else if (proj.status === "beta") col = "56, 189, 248";
      else if (proj.status === "idea") col = "245, 158, 11";

      list.push({
        id: "proj-" + proj.id,
        type: "project",
        title: proj.name,
        subtitle: proj.status.replace("_", " ").toUpperCase(),
        url: "/projects/" + proj.id,
        statusColor: col,
        angle,
        radius: 215,
        speed: -0.0035,
        rawItem: proj,
      });
    });

    // Outer Orbit: Connections (Radius 295)
    connections.slice(0, 8).forEach((conn, idx) => {
      const angle = (idx / Math.min(connections.length, 8)) * Math.PI * 2 + 1.2;
      list.push({
        id: "conn-" + conn.id,
        type: "connection",
        title: conn.full_name,
        subtitle: "@" + conn.username,
        url: "/people/" + conn.username,
        statusColor: "56, 189, 248", // Cyan
        angle,
        radius: 295,
        speed: 0.0025,
        rawItem: conn,
      });
    });

    return list;
  }, [ideas, projects, connections]);

  // Canvas orbit rendering
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

    let t = 0;

    const render = () => {
      if (!isPaused) t += 0.016;

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      // Orbit Tracks
      [135, 215, 295].forEach((r, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        const label = idx === 0 ? "IDEAS ORBIT" : idx === 1 ? "PROJECTS ORBIT" : "PEER CONDUITS";
        ctx.fillText(label, cx, cy - r - 4);
        ctx.restore();
      });

      // Ambient Solar Star Glow
      const starGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 85);
      starGlow.addColorStop(0, "rgba(99, 102, 241, 0.35)");
      starGlow.addColorStop(0.6, "rgba(168, 85, 247, 0.12)");
      starGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 85, 0, Math.PI * 2);
      ctx.fill();

      // Render Nodes
      nodes.forEach((node) => {
        if (!isPaused) {
          node.angle += node.speed;
        }

        const nx = cx + Math.cos(node.angle) * node.radius;
        const ny = cy + Math.sin(node.angle) * (node.radius * 0.7);

        const isHovered = activeNode?.id === node.id;
        const col = node.statusColor || "99, 102, 241";

        // Tether to center on hover
        if (isHovered) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = "rgba(" + col + ", 0.55)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.restore();
        }

        // Outer Glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(nx, ny, isHovered ? 14 : 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + col + ", " + (isHovered ? 0.35 : 0.18) + ")";
        ctx.fill();

        // Inner Solid Core
        ctx.beginPath();
        ctx.arc(nx, ny, isHovered ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(" + col + ", 0.95)";
        ctx.shadowColor = "rgba(" + col + ", 0.85)";
        ctx.shadowBlur = isHovered ? 16 : 8;
        ctx.fill();
        ctx.restore();

        // Label
        ctx.save();
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.6)";
        ctx.font = isHovered ? "bold 11px monospace" : "10px monospace";
        ctx.textAlign = "center";
        const short = node.title.length > 18 ? node.title.slice(0, 16) + "…" : node.title;
        ctx.fillText(short, nx, ny + 18);
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [nodes, activeNode, isPaused]);

  // Canvas Hit Detection
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    let found: OrbitNode | null = null;
    for (const node of nodes) {
      const nx = cx + Math.cos(node.angle) * node.radius;
      const ny = cy + Math.sin(node.angle) * (node.radius * 0.7);
      const dist = Math.hypot(mx - nx, my - ny);
      if (dist < 25) {
        found = node;
        break;
      }
    }

    setActiveNode(found);
    setIsPaused(Boolean(found));
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await requestConnectionAction(profile.id);
      setConnectionStatus("pending_sent");
    } catch {}
    setIsConnecting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deleteTarget.type === "idea") {
        const res = await deleteIdeaAction(deleteTarget.id);
        if (res.success) {
          setDeleteTarget(null);
          router.refresh();
        } else {
          setDeleteError(res.error || "Failed to delete idea.");
        }
      } else {
        const res = await deleteProjectAction(deleteTarget.id);
        if (res.success) {
          setDeleteTarget(null);
          router.refresh();
        } else {
          setDeleteError(res.error || "Failed to delete project.");
        }
      }
    } catch (err: any) {
      setDeleteError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden select-none">
      {/* Floating Top HUD */}
      <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        {/* Left User Identity Telemetry Pill */}
        <div className="pointer-events-auto inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl">
          <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.9)] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400">
            PERSONAL UNIVERSE
          </span>
          <span className="text-[10px] font-mono text-neutral-600">/</span>
          <span className="text-xs text-white font-light">
            {profile.full_name || "Innovator"}
          </span>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          {isCurrentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/ideas/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all shadow-xl hover:scale-105"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Orbit Idea</span>
              </Link>
              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/[0.04] text-xs font-mono uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors backdrop-blur-md"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Link>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting || connectionStatus !== "none"}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg",
                connectionStatus === "connected"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : connectionStatus === "pending_sent"
                  ? "bg-white/10 text-neutral-400 border border-white/10"
                  : "bg-white text-black hover:bg-neutral-200"
              )}
            >
              {connectionStatus === "connected" ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Connected</span>
                </>
              ) : connectionStatus === "pending_sent" ? (
                <span>Signal Pending</span>
              ) : (
                <span>Connect Signal</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Celestial Planetary Stage */}
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => {
            setActiveNode(null);
            setIsPaused(false);
          }}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Central Sun: Innovator Identity Core */}
        <div className="absolute inset-0 m-auto h-24 w-24 rounded-full bg-[#0a0c13] border-2 border-indigo-500/50 p-1 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)] pointer-events-none">
          <div className="h-full w-full rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-2xl">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              (profile.full_name || "I").charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Floating Active Node Telemetry Card */}
        {activeNode && (
          <div className="absolute bottom-8 right-8 w-80 p-5 rounded-2xl border border-white/15 bg-[#0a0c13]/95 backdrop-blur-2xl shadow-2xl space-y-3 z-30 animate-fade-in">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              <span className="text-indigo-400 font-semibold">{activeNode.subtitle}</span>
              <span className="text-neutral-500">{activeNode.type.toUpperCase()}</span>
            </div>

            <h3 className="text-sm sm:text-base font-light text-white leading-snug">
              {activeNode.title}
            </h3>

            <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
              <Link
                href={activeNode.url}
                className="inline-flex items-center gap-1 text-xs font-mono text-indigo-300 hover:text-white transition-colors"
              >
                <span>Inspect Dossier</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>

              {isCurrentUser && activeNode.type !== "connection" && (
                <button
                  onClick={() => {
                    setDeleteTarget({
                      type: activeNode.type as "idea" | "project",
                      id: (activeNode.rawItem as any).id,
                      name: activeNode.title,
                    });
                  }}
                  className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Orbit Legend */}
      <div className="absolute bottom-6 left-6 z-20 hidden sm:flex items-center gap-4 text-xs font-mono text-neutral-400 bg-[#0a0c13]/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-400" />
          <span>Ideas ({ideas.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          <span>Projects ({projects.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>Connections ({connections.length})</span>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title={"Delete " + (deleteTarget?.type === "idea" ? "Idea" : "Project")}
        description={'Are you sure you want to permanently delete "' + (deleteTarget?.name || "") + '"? This action cannot be undone.'}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
