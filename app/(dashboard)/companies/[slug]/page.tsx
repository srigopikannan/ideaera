import { getCompanyDetailAction } from "@/app/(dashboard)/actions/companies";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Globe, MapPin, Briefcase, Send } from "lucide-react";
import NextLink from "next/link";
import { notFound } from "next/navigation";

export default async function CompanyDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const company = await getCompanyDetailAction(params.slug);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <NextLink
          href="/companies"
          className="hover:text-primary transition-colors"
        >
          Companies
        </NextLink>
        <span>/</span>
        <span className="text-foreground font-medium">{company.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">{company.industry}</Badge>
                  <Badge variant="outline">{company.size}</Badge>
                </div>

                <h1 className="text-4xl font-bold tracking-tight">
                  {company.name}
                </h1>
              </div>

              <Button size="lg" className="gap-2">
                <Send className="h-4 w-4" />
                Apply to Company
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {company.location}
                </span>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border">
                <Globe className="h-5 w-5 text-primary" />

                <a
                  href={company.website_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                >
                  Visit Website
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">
                About {company.name}
              </h2>

              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {company.description}
              </p>
            </section>

            <Separator />

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  Active Projects
                </h2>
              </div>

              <div className="grid gap-4">
                {company.projects.length === 0 ? (
                  <p className="text-muted-foreground">
                    No active public projects listed.
                  </p>
                ) : (
                  company.projects.map(
                    (project: Record<string, unknown>) => (
                      <Card
                        key={String(project.id)}
                        className="p-4 flex items-center justify-between group hover:border-primary/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold group-hover:text-primary transition-colors">
                            {project.name as string}
                          </p>

                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {project.description as string}
                          </p>
                        </div>

                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                        >
                          <NextLink
                            href={`/projects/${String(project.id)}`}
                          >
                            View Workspace
                          </NextLink>
                        </Button>
                      </Card>
                    )
                  )
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Company Info
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Industry
                </p>
                <p>{company.industry || "Not specified"}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Company Size
                </p>
                <p>{company.size || "Not specified"}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Founded
                </p>
                <p>
                  {new Date(company.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">
                Join the Team
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm opacity-90">
                Interested in working with {company.name}? Submit your
                application and portfolio to get noticed by their hiring team.
              </p>

              <Button
                variant="secondary"
                className="w-full font-semibold"
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}