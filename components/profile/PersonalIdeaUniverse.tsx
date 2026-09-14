"use client";

import * as React from "react";
import Link from "next/link";
import { Profile, Project, Idea } from "@/types";
import { Sparkles, FolderGit2, Lightbulb, Users, ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonalIdeaUniverseProps {
  profile: Profile;
  ideas: Idea[];
  projects: Project[];
  connections: Profile[];
  isCurrentUser: boolean;
  onDeleteIdea?: (idea: Idea) => void;
  onDeleteProject?: (project: Project) => void;
}

interface OrbitNode {
  id: string;
  type: "idea" | "project" | "skill";
  title: string;
  subtitle: string;
  url?: string;
  statusColor?: string;
  angle: number;
  radius: number;
  speed: number;
  item?: Idea | Project;
}

export function PersonalIdeaUniverse({
  profile,
  ideas,
  projects,
  connections,
  isCurrentUser,
  onDeleteIdea,
  onDeleteProject,
}: PersonalIdeaUniverseProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [activeNode, setActiveNode] = React.useState<OrbitNode | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  // Prepare orbit nodes
  const nodes = React.useMemo<OrbitNode[]>(() => {
    const list: OrbitNode[] = [];

    // Inner Orbit: Ideas (Radius 120)
    ideas.forEach((idea, idx) => {
      const angle = (idx / Math.max(ideas.length, 1)) * Math.PI * 2;
      list.push({
        id: "idea-" + idea.id,
        type: "idea",
        title: idea.title,
        subtitle: idea.category || "Concept",
        url: "/ideas/" + idea.id,
        statusColor: "99, 102, 241", // Indigo
        angle,
        radius: 125,
        speed: 0.005,
        item: idea,
      });
    });

    // Middle Orbit: Projects (Radius 195)
    projects.forEach((proj, idx) => {
      const angle = (idx / Math.max(projects.length, 1)) * Math.PI * 2 + 0.5;
      let statusCol = "168, 85, 247"; // Purple
      if (proj.status === "launched") statusCol = "16, 185, 129";
      else if (proj.status === "beta") statusCol = "56, 189, 248";
      else if (proj.status === "idea") statusCol = "245, 158, 11";

      list.push({
        id: "proj-" + proj.id,
        type: "project",
        title: proj.name,
        subtitle: proj.status.replace("_", " ").toUpperCase(),
        url: "/projects/" + proj.id,
        statusColor: statusCol,
        angle,
        radius: 195,
        speed: -0.0035,
        item: proj,
      });
    });

    // Outer Orbit: Skills (Radius 265)
    const skills = profile.skills || ["Innovation", "Architecture", "Engineering"];
    skills.slice(0, 6).forEach((skill, idx) => {
      const angle = (idx / Math.min(skills.length, 6)) * Math.PI * 2 + 1;
      list.push({
        id: "skill-" + idx,
        type: "skill",
        title: skill,
        subtitle: "Proficiency",
        statusColor: "148, 163, 184", // Slate
        angle,
        radius: 265,
        speed: 0.002,
      });
    });

    return list;
  }, [ideas, projects, profile.skills]);

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
      if (!isPaused) {
        t += 0.016;
      }

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      // Draw Orbit Tracks
      [125, 195, 265].forEach((r, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();

        // Faint orbit title
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        const label = idx === 0 ? "IDEAS ORBIT" : idx === 1 ? "PROJECTS ORBIT" : "CAPABILITIES";
        ctx.fillText(label, cx, cy - r - 4);
        ctx.restore();
      });

      // Ambient Central Star Glow
      const starGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
      starGlow.addColorStop(0, "rgba(99, 102, 241, 0.3)");
      starGlow.addColorStop(0.6, "rgba(168, 85, 247, 0.1)");
      starGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = starGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fill();

      // Render Orbit Nodes
      nodes.forEach((node) => {
        if (!isPaused) {
          node.angle += node.speed;
        }

        const nx = cx + Math.cos(node.angle) * node.radius;
        const ny = cy + Math.sin(node.angle) * node.radius;

        const isHovered = activeNode?.id === node.id;
        const nodeColor = node.statusColor || "99, 102, 241";

        // Tether to center when hovered
        if (isHovered) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = "rgba(" + nodeColor + ", 0.5)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.restore();
        }

        // Outer glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(nx, ny, isHovered ? 12 : 7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + nodeColor + ", " + (isHovered ? 0.35 : 0.18) + ")";
        ctx.fill();

        // Inner solid core
        ctx.beginPath();
        ctx.arc(nx, ny, isHovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(" + nodeColor + ", 0.95)";
        ctx.shadowColor = "rgba(" + nodeColor + ", 0.8)";
        ctx.shadowBlur = isHovered ? 16 : 8;
        ctx.fill();
        ctx.restore();

        // Node Label
        ctx.save();
        ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.6)";
        ctx.font = isHovered ? "bold 11px monospace" : "10px monospace";
        ctx.textAlign = "center";
        const shortTitle = node.title.length > 18 ? node.title.slice(0, 16) + "…" : node.title;
        ctx.fillText(shortTitle, nx, ny + 18);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes, activeNode, isPaused]);

  // Click & Hover hit detection
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
      const ny = cy + Math.sin(node.angle) * node.radius;
      const dist = Math.hypot(mx - nx, my - ny);
      if (dist < 22) {
        found = node;
        break;
      }
    }

    setActiveNode(found);
    setIsPaused(Boolean(found));
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl border border-white/[0.08] bg-[#07090e] p-6 sm:p-10 overflow-hidden shadow-2xl space-y-6"
    >
      {/* Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-500">
              PERSONAL IDEA UNIVERSE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-white uppercase tracking-tight">
            Orbital System
          </h2>
        </div>

        {/* Orbit Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span>Ideas ({ideas.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span>Projects ({projects.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span>Skills ({profile.skills?.length || 0})</span>
          </div>
        </div>
      </div>

      {/* Orbit Visualization Canvas Stage */}
      <div className="relative h-[480px] sm:h-[540px] w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => {
            setActiveNode(null);
            setIsPaused(false);
          }}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Central Sun: Profile Core */}
        <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-[#0a0c13] border-2 border-indigo-500/40 p-1 flex items-center justify-center shadow-2xl pointer-events-none">
          <div className="h-full w-full rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xl">
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

        {/* Active Node Floating Preview HUD */}
        {activeNode && (
          <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 p-5 rounded-2xl border border-white/15 bg-[#0a0c13]/95 backdrop-blur-xl shadow-2xl space-y-3 z-30 animate-fade-in">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              <span className="text-indigo-400 font-semibold">{activeNode.subtitle}</span>
              <span className="text-neutral-500">{activeNode.type.toUpperCase()}</span>
            </div>

            <h3 className="text-sm sm:text-base font-light text-white leading-snug">
              {activeNode.title}
            </h3>

            {activeNode.url && (
              <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
                <Link
                  href={activeNode.url}
                  className="inline-flex items-center gap-1 text-xs font-mono text-indigo-300 hover:text-white transition-colors"
                >
                  <span>Open Details</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>

                {isCurrentUser && activeNode.item && (
                  <button
                    onClick={() => {
                      if (activeNode.type === "idea" && onDeleteIdea) {
                        onDeleteIdea(activeNode.item as Idea);
                      } else if (activeNode.type === "project" && onDeleteProject) {
                        onDeleteProject(activeNode.item as Project);
                      }
                    }}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer prompt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs font-mono text-neutral-400">
        <span>Hover celestial bodies to inspect resonance and inspect active conduits.</span>
        {isCurrentUser && (
          <div className="flex items-center gap-3">
            <Link
              href="/ideas/create"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white hover:text-black transition-all"
            >
              <Plus className="h-3 w-3" />
              <span>Orbit New Idea</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
