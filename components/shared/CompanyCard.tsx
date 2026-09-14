import Link from "next/link";
import { Company } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, ExternalLink } from "lucide-react";

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-border/90 flex flex-col justify-between group">
      <div>
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
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
            <Link
              href={`/companies/${company.slug}`}
              className="font-bold text-base text-foreground hover:text-primary transition-colors truncate block"
            >
              {company.name}
            </Link>
            <Badge variant="secondary" className="text-[10px] font-medium mt-1">
              {company.industry}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {company.description}
        </p>

        {/* Location & Size */}
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{company.location}</span>
          </div>
          {company.size && (
            <div className="text-[11px] text-muted-foreground/80">
              Team: {company.size}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between">
        <Link
          href={`/companies/${company.slug}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Company Profile →
        </Link>

        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            title="Visit Website"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
