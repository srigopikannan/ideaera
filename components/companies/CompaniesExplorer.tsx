"use client";

import * as React from "react";
import Link from "next/link";
import { Company } from "@/types";
import { CompanyCard } from "@/components/shared/CompanyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  Building2,
  Filter,
  ShieldCheck,
  Target,
  Code2,
  RotateCcw,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompaniesExplorerProps {
  initialCompanies: Company[];
}

const INDUSTRIES = [
  "All",
  "Software & SaaS",
  "Developer Tools",
  "Fintech",
  "Consumer Tech",
  "Web3 & Cloud",
];

const POPULAR_STACKS = [
  "All",
  "PostgreSQL",
  "Python",
  "Go",
  "TypeScript",
  "Rust",
  "React",
  "Kafka",
];

export function CompaniesExplorer({ initialCompanies }: CompaniesExplorerProps) {
  const [companies] = React.useState<Company[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndustry, setSelectedIndustry] = React.useState("All");
  const [selectedStack, setSelectedStack] = React.useState("All");
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);

  const filteredCompanies = React.useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.tech_stack && c.tech_stack.some((t) => t.toLowerCase().includes(q)));

      const matchesInd =
        selectedIndustry === "All" ||
        c.industry.toLowerCase() === selectedIndustry.toLowerCase();

      const matchesStack =
        selectedStack === "All" ||
        (c.tech_stack && c.tech_stack.some((t) => t.toLowerCase() === selectedStack.toLowerCase()));

      const matchesVerified = !verifiedOnly || c.is_verified || c.verification_status === "verified";

      return matchesSearch && matchesInd && matchesStack && matchesVerified;
    });
  }, [companies, searchQuery, selectedIndustry, selectedStack, verifiedOnly]);

  const totalChallenges = React.useMemo(() => {
    return companies.reduce((acc, c) => acc + (c.challenges_count || 0), 0);
  }, [companies]);

  const hasActiveFilters =
    searchQuery ||
    selectedIndustry !== "All" ||
    selectedStack !== "All" ||
    verifiedOnly;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedIndustry("All");
    setSelectedStack("All");
    setVerifiedOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Input & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-lg">
          <Input
            type="text"
            placeholder="Search verified tech companies by name, mission, location, or stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            className="h-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link href="/problems">
            <Button variant="outline" size="sm" className="font-semibold text-xs gap-1.5 border-border">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span>Explore All {totalChallenges} Challenges</span>
            </Button>
          </Link>
          <Link href="/companies/create">
            <Button size="sm" className="font-semibold text-xs gap-1.5 shadow-subtle">
              <Plus className="h-3.5 w-3.5" /> Register Company
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Surface */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface/80 backdrop-blur-sm space-y-4">
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

        {/* Tech Stack Pills & Verification Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Code2 className="h-3.5 w-3.5 text-primary" /> Stack:
            </span>
            {POPULAR_STACKS.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStack(st)}
                className={cn(
                  "text-[11px] px-2.5 py-0.5 rounded-lg font-mono transition-all border",
                  selectedStack === st
                    ? "bg-muted text-foreground border-border font-bold shadow-subtle"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={cn(
                "text-xs px-3 py-1 rounded-full font-semibold border flex items-center gap-1.5 transition-all",
                verifiedOnly
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                  : "bg-surface text-muted-foreground border-border hover:text-foreground"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Only</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Counter Header */}
      <div className="text-xs text-muted-foreground font-mono flex items-center justify-between">
        <span>
          Showing {filteredCompanies.length} verified technology compan
          {filteredCompanies.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title={companies.length === 0 ? "No companies registered yet" : "No companies match your filters"}
          description={
            companies.length === 0
              ? "Be the first innovator to register your tech company, startup, or open-source foundation in the ecosystem directory!"
              : "Try selecting 'All' industries or clearing your filters."
          }
          actionLabel={companies.length === 0 ? "Register Company" : "Reset Filters"}
          actionHref={companies.length === 0 ? "/companies/create" : undefined}
          onAction={companies.length === 0 ? undefined : handleResetFilters}
        />
      )}
    </div>
  );
}
