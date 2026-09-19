"use client";

import * as React from "react";
import { Profile } from "@/types";
import { TeammateDiscovery } from "@/components/people/TeammateDiscovery";
import { TalentConstellation } from "@/components/people/TalentConstellation";
import { Users, Network, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeopleDirectoryProps {
  initialPeople: Profile[];
  currentUser?: Profile | null;
  initialHackathon?: string;
  initialSkills?: string[];
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

export function PeopleDirectory({
  initialPeople,
  currentUser,
  initialHackathon,
  initialSkills = [],
}: PeopleDirectoryProps) {
  const [people] = React.useState<Profile[]>(initialPeople);
  const [activeTab, setActiveTab] = React.useState<"teammates" | "constellation">("teammates");

  // Constellation filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSkill, setSelectedSkill] = React.useState("All");
  const [showSkillDropdown, setShowSkillDropdown] = React.useState(false);

  return (
    <div className="space-y-6">
      {/* View Selector Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="inline-flex items-center p-1 rounded-2xl border border-white/10 bg-[#0a0c13]">
          <button
            onClick={() => setActiveTab("teammates")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all",
              activeTab === "teammates"
                ? "bg-white text-black font-semibold shadow-md"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Find Teammates</span>
          </button>
          <button
            onClick={() => setActiveTab("constellation")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all",
              activeTab === "constellation"
                ? "bg-white text-black font-semibold shadow-md"
                : "text-neutral-400 hover:text-white"
            )}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Constellation Network</span>
          </button>
        </div>

        <span className="text-xs font-mono text-neutral-500 hidden sm:inline">
          {people.length} Verified Innovators
        </span>
      </div>

      {/* Main View Display */}
      {activeTab === "teammates" ? (
        <TeammateDiscovery
          people={people}
          currentUser={currentUser}
          initialHackathon={initialHackathon}
          initialSkills={initialSkills}
        />
      ) : (
        <div className="relative w-full h-[calc(100vh-10rem)] rounded-3xl border border-white/10 overflow-hidden bg-[#07090e]">
          {/* Floating Top HUD for Constellation */}
          <div className="absolute top-4 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 z-30 flex items-center justify-between gap-2 pointer-events-none">
            {/* Left Telemetry Pill */}
            <div className="pointer-events-auto inline-flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl shrink-0">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] sm:tracking-[0.24em] text-neutral-400 hidden xs:inline">
                TALENT CONSTELLATION
              </span>
              <span className="text-[10px] font-mono text-neutral-600 hidden xs:inline">/</span>
              <span className="text-[10px] font-mono text-white font-semibold">
                {people.length} <span className="hidden xs:inline">BUILDERS</span>
              </span>
            </div>

            {/* Center Floating Search Capsule */}
            <div className="pointer-events-auto relative flex flex-col items-center">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl focus-within:border-cyan-400/50 transition-all">
                <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search talent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-white placeholder:text-neutral-500 focus:outline-none w-24 xs:w-36 sm:w-72 font-light"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-neutral-400 hover:text-white shrink-0">
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                  className={cn(
                    "p-1 rounded-full text-neutral-400 hover:text-white transition-colors shrink-0",
                    showSkillDropdown && "text-cyan-300 bg-cyan-500/20"
                  )}
                  title="Filter by Skill"
                >
                  <Filter className="h-3 w-3" />
                </button>
              </div>

              {/* Floating Skill Filter Dropdown */}
              {showSkillDropdown && (
                <div className="absolute top-12 mt-2 right-0 sm:right-auto p-2 rounded-2xl border border-white/10 bg-[#0a0c13]/95 backdrop-blur-2xl shadow-2xl flex flex-wrap gap-1.5 max-w-[calc(100vw-2rem)] sm:max-w-md animate-fade-in z-40">
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
              <span>Click node to view profile</span>
            </div>
          </div>

          <TalentConstellation
            people={people}
            searchQuery={searchQuery}
            selectedSkill={selectedSkill}
          />
        </div>
      )}
    </div>
  );
}
