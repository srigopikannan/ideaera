import Link from "next/link";
import { CompanyProblem } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Users,
  Lightbulb,
  ArrowRight,
  Target,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemCardProps {
  problem: CompanyProblem;
}

export function ProblemCard({ problem }: ProblemCardProps) {
  const isOfficial = problem.source_type === "official_company";
  const company = problem.company;

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-card hover:shadow-card-hover hover:border-border/90 transition-all duration-200 flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Top Badges & Company Context */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-9 w-9 rounded-xl object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0">
                {company?.name ? company.name[0] : "C"}
              </div>
            )}
            <div className="min-w-0">
              <Link
                href={`/companies/${company?.slug || problem.company_id}`}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors truncate block"
              >
                {company?.name || "Tech Ecosystem"}
              </Link>
              <span className="text-[11px] text-muted-foreground truncate block">
                {problem.industry}
              </span>
            </div>
          </div>

          {/* Difficulty & Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border",
                problem.difficulty === "Beginner" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                problem.difficulty === "Intermediate" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                problem.difficulty === "Advanced" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
              )}
            >
              {problem.difficulty}
            </span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-semibold border",
                problem.status === "open" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                problem.status === "in_progress" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                problem.status === "solved" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                problem.status === "closed" && "bg-muted text-muted-foreground border-border"
              )}
            >
              {problem.status === "open" ? "Open" : problem.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Source Type Indicator */}
        <div>
          {isOfficial ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>✓ Official Company Challenge</span>
            </div>
          ) : (
            <div className="inline-flex flex-col">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface border border-border text-muted-foreground text-[10px] font-mono">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Community Challenge</span>
              </span>
              <span className="text-[10px] text-muted-foreground/75 mt-0.5 pl-1 italic">
                Not officially affiliated with company
              </span>
            </div>
          )}
        </div>

        {/* Title & Summary */}
        <div>
          <Link
            href={`/problems/${problem.slug || problem.id}`}
            className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug group-hover:text-primary"
          >
            {problem.title}
          </Link>
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {problem.summary}
          </p>
        </div>

        {/* Required Skills */}
        {problem.required_skills && problem.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {problem.required_skills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20"
              >
                {skill}
              </span>
            ))}
            {problem.required_skills.length > 4 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border">
                +{problem.required_skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics & Actions */}
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            <span>{problem.solutions_count || 0} solutions</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/ideas/create?problem_id=${problem.id}`}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 transition-colors hidden sm:inline-flex items-center gap-1"
          >
            <Lightbulb className="h-3 w-3" />
            <span>Solve</span>
          </Link>
          <Link
            href={`/problems/${problem.slug || problem.id}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-1 shadow-subtle"
          >
            <span>View Problem</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
