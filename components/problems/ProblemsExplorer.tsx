"use client";

import * as React from "react";
import Link from "next/link";
import { CompanyProblem } from "@/types";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  Target,
  Filter,
  ShieldCheck,
  Sparkles,
  Plus,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemsExplorerProps {
  initialProblems: CompanyProblem[];
}

const INDUSTRIES = [
  "All",
  "Software & SaaS",
  "Developer Tools",
  "Fintech",
  "Consumer Tech",
  "Web3 & Cloud",
];

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

const STATUSES = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Solved", value: "solved" },
];

const SOURCES = [
  { label: "All Sources", value: "all" },
  { label: "✓ Official Company", value: "official_company" },
  { label: "Community", value: "community" },
];

export function ProblemsExplorer({ initialProblems }: ProblemsExplorerProps) {
  const [problems] = React.useState<CompanyProblem[]>(initialProblems);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndustry, setSelectedIndustry] = React.useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState("All");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedSource, setSelectedSource] = React.useState("all");

  const filteredProblems = React.useMemo(() => {
    return problems.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.industry.toLowerCase().includes(q) ||
        (p.company?.name || "").toLowerCase().includes(q) ||
        p.required_skills.some((s) => s.toLowerCase().includes(q));

      const matchesIndustry =
        selectedIndustry === "All" ||
        p.industry.toLowerCase() === selectedIndustry.toLowerCase();

      const matchesDifficulty =
        selectedDifficulty === "All" ||
        p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" ||
        p.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesSource =
        selectedSource === "all" || p.source_type === selectedSource;

      return (
        matchesSearch &&
        matchesIndustry &&
        matchesDifficulty &&
        matchesStatus &&
        matchesSource
      );
    });
  }, [
    problems,
    searchQuery,
    selectedIndustry,
    selectedDifficulty,
    selectedStatus,
    selectedSource,
  ]);

  const hasActiveFilters =
    searchQuery ||
    selectedIndustry !== "All" ||
    selectedDifficulty !== "All" ||
    selectedStatus !== "all" ||
    selectedSource !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("All");
    setSelectedDifficulty("All");
    setSelectedStatus("all");
    setSelectedSource("all");
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-lg">
          <Input
            type="text"
            placeholder="Search problems by title, company, skills, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            className="h-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link href="/problems/submit">
            <Button size="sm" className="font-semibold gap-1.5 shadow-subtle">
              <Plus className="h-4 w-4" /> Submit a Problem
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface/80 backdrop-blur-sm space-y-4">
        {/* Source Type Pills (Official vs Community) */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Source:
          </span>
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSelectedSource(s.value)}
              className={cn(
                "text-xs px-3 py-1 rounded-full font-medium transition-all border",
                selectedSource === s.value
                  ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                  : "bg-surface text-muted-foreground border-border hover:border-border/90 hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Industry Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Industry:
          </span>
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={cn(
                "text-xs px-3 py-1 rounded-full font-medium transition-all border",
                selectedIndustry === ind
                  ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                  : "bg-surface text-muted-foreground border-border hover:border-border/90 hover:text-foreground"
              )}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Secondary Row: Difficulty & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-4">
            {/* Difficulty */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Difficulty:
              </span>
              <div className="flex items-center gap-1">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-lg font-mono transition-all border",
                      selectedDifficulty === diff
                        ? "bg-muted text-foreground border-border font-bold shadow-subtle"
                        : "bg-transparent text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Status:
              </span>
              <div className="flex items-center gap-1">
                {STATUSES.map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setSelectedStatus(st.value)}
                    className={cn(
                      "text-[11px] px-2.5 py-0.5 rounded-lg font-mono transition-all border",
                      selectedStatus === st.value
                        ? "bg-muted text-foreground border-border font-bold shadow-subtle"
                        : "bg-transparent text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>
          Showing {filteredProblems.length} real-world problem
          {filteredProblems.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Grid */}
      {filteredProblems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title={
            problems.length === 0
              ? "No problems submitted yet"
              : "No challenges match your filters"
          }
          description={
            problems.length === 0
              ? "Be the first innovator to contribute a real-world problem or challenge from your industry experience!"
              : "Try relaxing some filters, searching for broader terms, or viewing all industries."
          }
          actionLabel={problems.length === 0 ? "Submit a Problem" : "Reset Filters"}
          actionHref={problems.length === 0 ? "/problems/submit" : undefined}
          onAction={problems.length === 0 ? undefined : handleResetFilters}
        />
      )}
    </div>
  );
}
