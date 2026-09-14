import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyBySlug } from "@/services/companies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, MapPin, Building2, ExternalLink, Code2, Users } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) return { title: "Company Not Found — IdeaEra" };
  return {
    title: `${company.name} — IdeaEra Company Profile`,
    description: company.description.slice(0, 150),
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>
        <Badge variant="outline">{company.industry}</Badge>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-card space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {company.name[0]}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.location}
                </span>
                {company.size && <span>• Team: {company.size}</span>}
              </div>
            </div>
          </div>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="self-start sm:self-auto"
            >
              <Button variant="default" className="shadow-subtle font-semibold">
                Visit Website <ExternalLink className="h-4 w-4 ml-1.5" />
              </Button>
            </a>
          )}
        </div>

        {/* Mission & Overview */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Mission & Overview</h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {company.description}
          </p>
        </div>

        {/* Tech Stack */}
        {company.tech_stack && company.tech_stack.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              Core Technologies Used
            </h3>
            <div className="flex flex-wrap gap-2">
              {company.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 rounded-xl border border-border bg-muted/60 text-xs font-semibold text-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
