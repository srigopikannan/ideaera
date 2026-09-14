import Link from "next/link";
import { getCompanies } from "@/services/companies";
import { CompaniesExplorer } from "@/components/companies/CompaniesExplorer";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";

export const metadata = {
  title: "Company Discovery — IdeaEra",
  description: "Explore innovative technology startups and deep-tech companies.",
};

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" />
            <span>Ecosystem Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Discover Companies.
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Explore pioneering technology organizations, open-source foundations, and high-growth deep-tech ventures shaping the future.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/companies/create">
            <Button variant="default" size="sm" className="shadow-subtle gap-1.5 font-semibold">
              <Plus className="h-4 w-4" /> Register Company
            </Button>
          </Link>
        </div>
      </div>

      <CompaniesExplorer initialCompanies={companies} />
    </div>
  );
}
