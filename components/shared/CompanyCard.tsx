import Link from "next/link";
import { Company } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, ExternalLink, ShieldCheck, Target, Code2 } from "lucide-react";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const isVerified = company.is_verified || company.verification_status === "verified";
  const challengesCount = company.challenges_count || 0;

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-border/90 flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-bold text-sm text-muted-foreground">
                {company.name[0]}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/companies/${company.slug}`}
                className="font-bold text-base text-foreground hover:text-primary transition-colors truncate block"
              >
                {company.name}
              </Link>
              {isVerified && (
                <span
                  title="Verified Company"
                  className="inline-flex items-center text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 shrink-0"
                >
                  ✓ Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] font-medium">
                {company.industry}
              </Badge>
              {challengesCount > 0 && (
                <span className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  <span>{challengesCount} {challengesCount === 1 ? "problem" : "problems"}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {company.description}
        </p>

        {/* Tech Stack Pills */}
        {company.tech_stack && company.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {company.tech_stack.slice(0, 3).map((tech, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border"
              >
                {tech}
              </span>
            ))}
            {company.tech_stack.length > 3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-lg bg-muted/60 text-muted-foreground">
                +{company.tech_stack.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Location & Size */}
        <div className="space-y-1 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{company.location}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <Link
          href={`/companies/${company.slug}`}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>Explore Challenges</span>
          <span className="text-[10px]">→</span>
        </Link>

        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border/80"
            title="Visit Official Website"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
