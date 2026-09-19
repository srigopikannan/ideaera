"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Profile } from "@/types";
import { Users, Sparkles, ArrowUpRight, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingEmptyState } from "@/components/ui/LivingEmptyState";

interface TalentConstellationProps {
  people: Profile[];
  currentUserId?: string;
  searchQuery?: string;
  selectedSkill?: string;
}

export function TalentConstellation({
  people,
  currentUserId,
  searchQuery = "",
  selectedSkill = "All",
}: TalentConstellationProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [mouseOffset, setMouseOffset] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 35;
      const y = (e.clientY / window.innerHeight - 0.5) * 35;
      setMouseOffset({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Filter people
  const filteredPeople = React.useMemo(() => {
    return people.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.headline?.toLowerCase().includes(q) ||
        p.skills?.some((s) => s.toLowerCase().includes(q));

      const matchSkill =
        selectedSkill === "All" ||
        p.skills?.some((s) => s.toLowerCase() === selectedSkill.toLowerCase());

      return matchQ && matchSkill;
    });
  }, [people, searchQuery, selectedSkill]);

  // Spatial node distribution around center (YOU)
  const nodePositions = React.useMemo(() => {
    const total = Math.max(filteredPeople.length, 1);
    return filteredPeople.map((person, idx) => {
      const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
      const dist = isMobile
        ? 18 + (idx % 3) * 6
        : 32 + (idx % 3) * 10; // percentage from center
      const depth = 0.85 + (idx % 4) * 0.15;

      const x = 50 + Math.cos(angle) * dist;
      const y = 50 + Math.sin(angle) * (dist * 0.7);

      return {
        person,
        x: Math.min(Math.max(x, isMobile ? 32 : 10), isMobile ? 68 : 90),
        y: Math.min(Math.max(y, isMobile ? 20 : 15), isMobile ? 80 : 85),
        angle,
        depth,
      };
    });
  }, [filteredPeople, isMobile]);

  const hoveredNode = nodePositions.find((n) => n.person.id === hoveredId);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] overflow-hidden select-none"
    >
      {/* SVG Connecting Filaments from Center YOU to People Nodes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {nodePositions.map((node) => {
          const isHovered = hoveredId === node.person.id;
          return (
            <line
              key={node.person.id}
              x1="50%"
              y1="50%"
              x2={node.x + "%"}
              y2={node.y + "%"}
              stroke={isHovered ? "rgba(99, 102, 241, 0.6)" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth={isHovered ? 1.8 : 1}
              strokeDasharray={isHovered ? "none" : "3 5"}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>

      {/* Central Star: YOU / Observatory */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-full border border-indigo-500/40 bg-[#0a0c13] flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-wider animate-pulse">
            YOU
          </div>
          {/* Gravitational Wave */}
          <div className="absolute -inset-4 rounded-full border border-indigo-500/20 animate-ping pointer-events-none" />
        </div>
      </div>

      {/* Empty State when no talent matches */}
      {filteredPeople.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <LivingEmptyState
            title="NO TALENT NODES DETECTED."
            subtitle="Try broadening your skill filter or search query to align with adjacent innovators."
            actionText="Clear Filter"
            actionHref="/people"
          />
        </div>
      ) : (
        /* The Explorable Talent Constellation */
        <div className="relative w-full h-full">
          {nodePositions.map((node) => {
            const isHovered = hoveredId === node.person.id;
            const px = mouseOffset.x * node.depth;
            const py = mouseOffset.y * node.depth;

            return (
              <div
                key={node.person.id}
                style={{
                  left: "calc(" + node.x + "% + " + px + "px)",
                  top: "calc(" + node.y + "% + " + py + "px)",
                  transform: "translate(-50%, -50%) scale(" + (isHovered ? 1.15 : 1) + ")",
                  zIndex: isHovered ? 40 : Math.round(node.depth * 10),
                  transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), left 0.25s ease-out, top 0.25s ease-out",
                }}
                onMouseEnter={() => setHoveredId(node.person.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => router.push("/people/" + node.person.username)}
                className="absolute cursor-pointer group"
              >
                {/* Node Halo */}
                <div
                  className={cn(
                    "absolute -inset-4 rounded-full transition-all duration-300 pointer-events-none",
                    isHovered
                      ? "opacity-100 scale-125 bg-indigo-500/20 blur-md"
                      : "opacity-0"
                  )}
                />

                {/* Person Card Node */}
                <div
                  className="relative p-3 sm:p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 shadow-2xl flex items-center gap-2.5 sm:gap-3.5 w-[210px] sm:w-[280px] sm:max-w-xs"
                  style={{
                    backgroundColor: isHovered ? "rgba(10, 12, 19, 0.95)" : "rgba(10, 12, 19, 0.75)",
                    borderColor: isHovered ? "rgba(99, 102, 241, 0.8)" : "rgba(255, 255, 255, 0.1)",
                    boxShadow: isHovered
                      ? "0 0 30px rgba(99, 102, 241, 0.35)"
                      : "0 10px 25px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-bold text-xs sm:text-sm overflow-hidden flex-shrink-0">
                    {node.person.avatar_url ? (
                      <img
                        src={node.person.avatar_url}
                        alt={node.person.full_name || "Peer"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (node.person.full_name || "P").charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-sm font-light text-white truncate group-hover:text-indigo-200 transition-colors">
                      {node.person.full_name}
                    </h4>
                    <p className="text-[10px] font-mono text-neutral-400 truncate">
                      @{node.person.username}
                    </p>

                    {/* Skills blooming on hover */}
                    {isHovered && node.person.skills && node.person.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5 animate-fade-in">
                        {node.person.skills.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-white/[0.04] border border-white/10 text-neutral-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
