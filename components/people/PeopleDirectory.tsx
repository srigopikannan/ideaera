"use client";

import * as React from "react";
import { Profile } from "@/types";
import { TalentConstellation } from "@/components/people/TalentConstellation";
import { Search, Filter, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeopleDirectoryProps {
  initialPeople: Profile[];
}

const SKILL_FILTERS = [
  "All",
  "AI / LLMs",
  "TypeScript",
  "React",
  "Rust",
  "Distributed Systems",
  "UI/UX Design",
  "Python",
];

export function PeopleDirectory({ initialPeople }: PeopleDirectoryProps) {
  const [people] = React.useState<Profile[]>(initialPeople);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSkill, setSelectedSkill] = React.useState("All");
  const [showSkillDropdown, setShowSkillDropdown] = React.useState(false);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Floating Top HUD */}
      <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        {/* Left Telemetry Pill */}
        <div className="pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400">
            TALENT CONSTELLATION
          </span>
          <span className="text-[10px] font-mono text-neutral-600">/</span>
          <span className="text-[10px] font-mono text-white font-semibold">
            {people.length} BUILDERS
          </span>
        </div>

        {/* Center Floating Search Capsule */}
        <div className="pointer-events-auto relative flex flex-col items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl focus-within:border-cyan-400/50 transition-all">
            <Search className="h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search talent by name, discipline, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none w-48 sm:w-72 font-light"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-neutral-400 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => setShowSkillDropdown(!showSkillDropdown)}
              className={cn(
                "p-1 rounded-full text-neutral-400 hover:text-white transition-colors",
                showSkillDropdown && "text-cyan-300 bg-cyan-500/20"
              )}
              title="Filter by Skill"
            >
              <Filter className="h-3 w-3" />
            </button>
          </div>

          {/* Floating Skill Filter Dropdown */}
          {showSkillDropdown && (
            <div className="absolute top-12 mt-2 p-2 rounded-2xl border border-white/10 bg-[#0a0c13]/95 backdrop-blur-2xl shadow-2xl flex flex-wrap gap-1.5 max-w-md animate-fade-in z-40">
              {SKILL_FILTERS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    setSelectedSkill(skill);
                    setShowSkillDropdown(false);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all border",
                    selectedSkill === skill
                      ? "bg-white text-black font-semibold border-white"
                      : "bg-white/[0.03] text-neutral-400 border-white/10 hover:text-white"
                  )}
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Info Note */}
        <div className="pointer-events-auto hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-[#0a0c13]/80 text-[10px] font-mono text-neutral-400 backdrop-blur-md">
          <span>Click node to view dossier</span>
        </div>
      </div>

      {/* Main Talent Constellation Network Stage */}
      <TalentConstellation
        people={people}
        searchQuery={searchQuery}
        selectedSkill={selectedSkill}
      />
    </div>
  );
}
