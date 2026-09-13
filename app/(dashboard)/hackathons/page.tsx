import { getHackathonsAction } from "@/app/(dashboard)/actions/hackathons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { Trophy, Calendar, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const filters = {
    search: searchParams.q,
    location: searchParams.location,
  };

  const hackathons = await getHackathonsAction(filters);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Hackathons</h1>
          <p className="text-muted-foreground">Find your next challenge and team up to build something amazing.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hackathons..."
            className="pl-9"
            defaultValue={filters.search}
            name="q"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Location..."
            className="w-40"
            defaultValue={filters.location}
            name="location"
          />
          <Button variant="outline">Filter</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hackathons.length === 0 ? (
          <div className="col-span-full text-center py-20 border-2 border-dashed rounded-3xl">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hackathons found</h3>
            <p className="text-muted-foreground">Try different search terms or check back later.</p>
          </div>
        ) : (
          hackathons.map((h) => (
            <Card key={h.id} className="group hover:shadow-lg transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {h.location}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                    Prize: {h.prize_pool || "TBD"}
                  </Badge>
                </div>
                <CardTitle className="text-xl line-clamp-1">{h.title}</CardTitle>
                <CardDescription className="line-clamp-2">{h.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-6 border-t space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(h.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{h.location}</span>
                  </div>
                </div>
                <Button asChild className="w-full gap-2">
                  <NextLink href={`/hackathons/${h.id}`}>
                    View Details
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
