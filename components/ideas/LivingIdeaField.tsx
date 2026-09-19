"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Idea } from "@/types";
import { toggleLikeAction } from "@/app/(dashboard)/actions/ideas";
import { Heart, Sparkles, ArrowUpRight, Plus, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";

interface LivingIdeaFieldProps {
  ideas: Idea[];
  searchQuery: string;
  selectedCategory: string;
}

interface IdeaNodePosition {
  idea: Idea;
  x: number; // percentage (10% to 90%)
  y: number; // percentage (15% to 85%)
  scale: number;
  depth: number; // 0.8 to 1.3
  color: string;
}

export function LivingIdeaField({
  ideas,
  searchQuery,
  selectedCategory,
}: LivingIdeaFieldProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [activeTransitionId, setActiveTransitionId] = React.useState<string | null>(null);
  const [mouseOffset, setMouseOffset] = React.useState({ x: 0, y: 0 });
  const [likesMap, setLikesMap] = React.useState<Record<string, { liked: boolean; count: number }>>({});
  const [isMobile, setIsMobile] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Parallax tracking
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * (isMobile ? 15 : 40);
      const y = (e.clientY / window.innerHeight - 0.5) * (isMobile ? 15 : 40);
      setMouseOffset({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  // Compute deterministic, beautiful organic spatial positions for ideas
  const nodePositions = React.useMemo<IdeaNodePosition[]>(() => {
    const coords = [
      { x: 30, y: 32 },
      { x: 68, y: 28 },
      { x: 50, y: 60 },
      { x: 22, y: 68 },
      { x: 78, y: 64 },
      { x: 42, y: 20 },
      { x: 58, y: 80 },
      { x: 15, y: 44 },
      { x: 84, y: 42 },
      { x: 36, y: 84 },
    ];

    const minX = isMobile ? 30 : 12;
    const maxX = isMobile ? 70 : 86;
    const minY = isMobile ? 24 : 16;
    const maxY = isMobile ? 76 : 84;

    return ideas.map((idea, idx) => {
      const baseCoord = coords[idx % coords.length];
      // Deterministic offset per idea ID hash
      const hash = idea.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const jitterX = isMobile ? ((hash % 9) - 4) : ((hash % 15) - 7);
      const jitterY = isMobile ? (((hash * 3) % 9) - 4) : (((hash * 3) % 15) - 7);

      const resonance = (idea.likes_count || 0) + (idea.comments_count || 0);
      const scale = isMobile ? 0.95 : Math.min(Math.max(0.95 + resonance * 0.05, 0.95), 1.3);
      const depth = 0.85 + (hash % 4) * 0.15;

      let color = "99, 102, 241"; // Indigo
      const cat = (idea.category || "").toLowerCase();
      if (cat.includes("climate") || cat.includes("bio")) color = "16, 185, 129"; // Emerald
      else if (cat.includes("security") || cat.includes("web3")) color = "245, 158, 11"; // Amber
      else if (cat.includes("developer")) color = "56, 189, 248"; // Cyan

      return {
        idea,
        x: Math.min(Math.max(baseCoord.x + jitterX, minX), maxX),
        y: Math.min(Math.max(baseCoord.y + jitterY, minY), maxY),
        scale,
        depth,
        color,
      };
    });
  }, [ideas, isMobile]);

  const handleLike = async (e: React.MouseEvent, idea: Idea) => {
    e.preventDefault();
    e.stopPropagation();

    const current = likesMap[idea.id] || {
      liked: idea.is_liked || false,
      count: idea.likes_count || 0,
    };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(current.count - 1, 0);

    setLikesMap((prev) => ({ ...prev, [idea.id]: { liked: nextLiked, count: nextCount } }));

    try {
      const res = await toggleLikeAction(idea.id);
      setLikesMap((prev) => ({ ...prev, [idea.id]: { liked: res.liked, count: res.likes_count } }));
    } catch {
      setLikesMap((prev) => ({ ...prev, [idea.id]: current }));
    }
  };

  const handleSelectIdea = (e: React.MouseEvent, ideaId: string) => {
    e.preventDefault();
    setActiveTransitionId(ideaId);
    setTimeout(() => {
      router.push("/ideas/" + ideaId);
    }, 420);
  };

  // Filter evaluation
  const isMatching = (idea: Idea) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      idea.title.toLowerCase().includes(q) ||
      idea.description.toLowerCase().includes(q) ||
      (idea.tags && idea.tags.some((t) => t.toLowerCase().includes(q)));
    const matchCat =
      selectedCategory === "All" ||
      idea.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchSearch && matchCat;
  };

  const hoveredNode = nodePositions.find((n) => n.idea.id === hoveredId);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] overflow-hidden select-none"
    >
      {/* Dynamic Laser Filaments Connecting Shared-Domain Ideas */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {hoveredNode &&
          nodePositions.map((other) => {
            if (other.idea.id === hoveredNode.idea.id) return null;
            if (other.idea.category !== hoveredNode.idea.category) return null;

            return (
              <line
                key={other.idea.id}
                x1={hoveredNode.x + "%"}
                y1={hoveredNode.y + "%"}
                x2={other.x + "%"}
                y2={other.y + "%"}
                stroke={"rgba(" + hoveredNode.color + ", 0.45)"}
                strokeWidth="1.5"
                strokeDasharray="4 6"
                className="animate-pulse"
              />
            );
          })}
      </svg>

      {/* Living Empty State if 0 ideas exist */}
      {ideas.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <LivingEmptyState
            title="YOUR IDEA FIELD IS QUIET."
            subtitle="No concepts have been articulated in this sector yet. Be the first to ignite a thesis into orbit."
            actionText="Ignite First Concept"
            actionHref="/ideas/create"
          />
        </div>
      ) : (
        /* The Explorable Spatial Idea Field */
        <div className="relative w-full h-full">
          {nodePositions.map((node) => {
            const matches = isMatching(node.idea);
            const isHovered = hoveredId === node.idea.id;
            const isTransitioning = activeTransitionId === node.idea.id;
            const currentLikes = likesMap[node.idea.id] || {
              liked: node.idea.is_liked || false,
              count: node.idea.likes_count || 0,
            };

            // Calculate repulsion when another node is hovered
            let repelX = 0;
            let repelY = 0;
            if (hoveredNode && hoveredNode.idea.id !== node.idea.id) {
              const dx = node.x - hoveredNode.x;
              const dy = node.y - hoveredNode.y;
              const dist = Math.hypot(dx, dy);
              if (dist < 22 && dist > 0) {
                const force = (22 - dist) / 22;
                repelX = (dx / dist) * force * 18;
                repelY = (dy / dist) * force * 18;
              }
            }

            // Parallax shift based on depth
            const px = mouseOffset.x * node.depth;
            const py = mouseOffset.y * node.depth;

            return (
              <div
                key={node.idea.id}
                style={{
                  left: "calc(" + node.x + "% + " + (px + repelX) + "px)",
                  top: "calc(" + node.y + "% + " + (py + repelY) + "px)",
                  transform: isTransitioning
                    ? "translate(-50%, -50%) scale(2.8)"
                    : "translate(-50%, -50%) scale(" + (isHovered ? node.scale * 1.15 : node.scale) + ")",
                  zIndex: isHovered ? 40 : isTransitioning ? 50 : Math.round(node.depth * 10),
                  opacity: isTransitioning
                    ? 1
                    : matches
                    ? isHovered
                      ? 1
                      : 0.85
                    : 0.15,
                  transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s, left 0.25s ease-out, top 0.25s ease-out",
                }}
                onMouseEnter={() => setHoveredId(node.idea.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => handleSelectIdea(e, node.idea.id)}
                className="absolute cursor-pointer group"
              >
                {/* Radiant Halo */}
                <div
                  className={cn(
                    "absolute -inset-6 rounded-full transition-all duration-500 pointer-events-none",
                    isHovered
                      ? "opacity-100 scale-125"
                      : "opacity-30 scale-100"
                  )}
                  style={{
                    background: "radial-gradient(circle, rgba(" + node.color + ", 0.35) 0%, rgba(" + node.color + ", 0) 70%)",
                  }}
                />

                {/* Celestial Node Core */}
                <div
                  className="relative p-3.5 sm:p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-2xl w-[220px] sm:w-[280px] sm:max-w-xs"
                  style={{
                    backgroundColor: isHovered ? "rgba(10, 12, 19, 0.95)" : "rgba(10, 12, 19, 0.75)",
                    borderColor: isHovered
                      ? "rgba(" + node.color + ", 0.8)"
                      : "rgba(255, 255, 255, 0.1)",
                    boxShadow: isHovered
                      ? "0 0 35px rgba(" + node.color + ", 0.45)"
                      : "0 10px 30px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {/* Category Pill & Likes */}
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono pb-2">
                    <span
                      className="uppercase tracking-[0.2em] font-semibold"
                      style={{ color: "rgb(" + node.color + ")" }}
                    >
                      {node.idea.category}
                    </span>

                    <button
                      onClick={(e) => handleLike(e, node.idea)}
                      className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                      title="Endorse Idea"
                    >
                      <Heart
                        className={cn(
                          "h-3 w-3",
                          currentLikes.liked && "fill-indigo-400 text-indigo-400"
                        )}
                      />
                      <span>{currentLikes.count}</span>
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-light text-white leading-snug tracking-tight group-hover:text-indigo-200 transition-colors">
                    {node.idea.title}
                  </h3>

                  {/* Expanded Description on Hover */}
                  {isHovered && (
                    <p className="text-xs text-neutral-300 font-light pt-2 line-clamp-2 leading-relaxed animate-fade-in">
                      {node.idea.description}
                    </p>
                  )}

                  {/* Action Link Icon */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-2">
                    <span className="text-[10px] font-mono text-neutral-500">
                      by @{node.idea.author?.username || "creator"}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
