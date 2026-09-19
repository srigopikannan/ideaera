"use client";

import * as React from "react";
import Link from "next/link";
import { Idea } from "@/types";
import { LivingIdeaField } from "@/components/ideas/LivingIdeaField";
import { Search, Plus, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface IdeasExplorerProps {
  initialIdeas: Idea[];
}

const CATEGORIES = [
  "All",
  "AI & Machine Learning",
  "Developer Tools",
  "Climate & Sustainability",
  "Health & Biotech",
  "Security & Cloud",
];

export function IdeasExplorer({ initialIdeas }: IdeasExplorerProps) {
  const [ideas, setIdeas] = React.useState<Idea[]>(initialIdeas);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [showFilters, setShowFilters] = React.useState(false);

  React.useEffect(() => {
    if (initialIdeas && initialIdeas.length > 0) {
      setIdeas(initialIdeas);
    } else {
      fetch("/api/ideas")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setIdeas(data);
        })
        .catch(() => {});
    }
  }, [initialIdeas]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Floating HUD Top Bar */}
      <div className="absolute top-4 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Left Telemetry Pill */}
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl shrink-0">
          <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.9)] animate-pulse shrink-0" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.24em] text-neutral-400">
            <span className="hidden xs:inline">LIVING </span>FIELD
          </span>
          <span className="text-[10px] font-mono text-neutral-600">/</span>
          <span className="text-[10px] font-mono text-white font-semibold">
            {ideas.length} <span className="hidden sm:inline">SPARKS</span>
          </span>
        </div>

        {/* Center Floating Search Capsule */}
        <div className="pointer-events-auto relative flex flex-col items-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl focus-within:border-indigo-400/50 transition-all max-w-full">
            <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none w-24 xs:w-36 sm:w-64 font-light"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-neutral-400 hover:text-white shrink-0">
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-1 rounded-full text-neutral-400 hover:text-white transition-colors shrink-0",
                showFilters && "text-indigo-300 bg-indigo-500/20"
              )}
              title="Toggle Categories"
            >
              <Filter className="h-3 w-3" />
            </button>
          </div>

          {/* Floating Category Filter Dropdown */}
          {showFilters && (
            <div className="absolute top-12 mt-2 p-2 rounded-2xl border border-white/10 bg-[#0a0c13]/95 backdrop-blur-2xl shadow-2xl flex flex-wrap gap-1.5 w-[calc(100vw-2rem)] max-w-md animate-fade-in z-40">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowFilters(false);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all border",
                    selectedCategory === cat
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.03] text-neutral-400 border-white/10 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action: Ignite Idea */}
        <div className="pointer-events-auto shrink-0">
          <Link
            href="/ideas/create"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all shadow-2xl hover:scale-105"
            title="Ignite Concept"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ignite Concept</span>
          </Link>
        </div>
      </div>

      {/* Main Spatial Idea Field Canvas */}
      <LivingIdeaField
        ideas={ideas}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}
