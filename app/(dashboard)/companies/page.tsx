import { getCompaniesAction } from "@/app/(dashboard)/actions/companies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { Building2, Search, Globe, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const filters = {
    search: searchParams.q,
    industry: searchParams.industry,
  };

  const companies = await getCompaniesAction(filters);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Company Directory</h1>
          <p className="text-muted-foreground">Connect with industry leaders and find professional project opportunities.</p>
        </div>
        <Button asChild className="w-fit">
          <NextLink href="/companies/create">
            Register Company
          </NextLink>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            defaultValue={filters.search}
            name="q"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Industry..."
            className="w-40"
            defaultValue={filters.industry}
            name="industry"
          />
          <Button variant="outline">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {companies.length === 0 ? (
          <div className="col-span-full text-center py-20 border-2 border-dashed rounded-3xl">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No companies found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          companies.map((company) => (
            <Card key={company.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    {company.industry || "General"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {company.size || "Unknown Size"}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {company.name}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <MapPin className="h-3 w-3" />
                  <span>{company.location || "Remote"}</span>
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-6 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <span className="text-xs truncate max-w-[150px]">{company.website_url || "No website"}</span>
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1">
                  <NextLink href={`/companies/${company.slug}`}>
                    View Profile
                  </NextLink>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
