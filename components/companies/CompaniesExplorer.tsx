"use client";

import * as React from "react";
import { Company } from "@/types";
import { CompanyCard } from "@/components/shared/CompanyCard";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Building2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompaniesExplorerProps {
  initialCompanies: Company[];
}

const INDUSTRIES = [
  "All",
  "Artificial Intelligence",
  "Biotechnology",
  "Web3 & Cloud",
  "Robotics & Hardware",
  "Developer Tools",
];

export function CompaniesExplorer({ initialCompanies }: CompaniesExplorerProps) {
  const [companies] = React.useState<Company[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndustry, setSelectedIndustry] = React.useState("All");

  const filteredCompanies = React.useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q);

      const matchesInd =
        selectedIndustry === "All" ||
        c.industry.toLowerCase() === selectedIndustry.toLowerCase();

      return matchesSearch && matchesInd;
    });
  }, [companies, searchQuery, selectedIndustry]);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Input
            type="text"
            placeholder="Search innovative tech companies by name, mission, or stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Industry Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Filter className="h-3 w-3" /> Filter by Industry
        </div>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150 border",
                selectedIndustry === ind
                  ? "bg-primary text-primary-foreground border-primary shadow-subtle"
                  : "bg-surface text-muted-foreground border-border hover:border-border/80 hover:text-foreground"
              )}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
        <span>Showing {filteredCompanies.length} technology companies</span>
        {(searchQuery || selectedIndustry !== "All") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedIndustry("All");
            }}
            className="text-primary hover:underline"
          >
            Reset filters
          </button>
        )}
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
          title={companies.length === 0 ? "No companies registered yet" : "No companies match your search"}
          description={
            companies.length === 0
              ? "Be the first innovator to register your tech company, startup, or open-source foundation in the ecosystem directory!"
              : "Try selecting 'All' industries or searching for a different keyword."
          }
          actionLabel={companies.length === 0 ? "Register Company" : "Clear Filters"}
          actionHref={companies.length === 0 ? "/companies/create" : undefined}
          onAction={
            companies.length === 0
              ? undefined
              : () => {
                  setSearchQuery("");
                  setSelectedIndustry("All");
                }
          }
        />
      )}
    </div>
  );
}
