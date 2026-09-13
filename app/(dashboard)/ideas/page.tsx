import { getIdeasAction } from "@/app/(dashboard)/actions/ideas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import NextLink from "next/link";
import { Lightbulb, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
export const dynamic = "force-dynamic";
export default async function IdeasPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const filters = {
    category: searchParams.category,
    stage: searchParams.stage,
    search: searchParams.q,
  };

  const ideas = await getIdeasAction(filters);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Explore Ideas
          </h1>
          <p className="text-muted-foreground">
            Find inspiring projects and collaborate with visionaries.
          </p>
        </div>

        <Button asChild className="w-fit">
          <NextLink href="/ideas/create">
            <Lightbulb className="mr-2 h-4 w-4" />
            Post an Idea
          </NextLink>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            className="pl-9"
            defaultValue={filters.search ?? ""}
            name="q"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ideas.length === 0 ? (
          <div className="col-span-full rounded-3xl border-2 border-dashed py-20 text-center">
            <Lightbulb className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

            <h3 className="text-lg font-medium">
              No ideas found
            </h3>

            <p className="text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          ideas.map((idea) => (
            <Card
              key={idea.id}
              className="group flex flex-col transition-all duration-300 hover:shadow-lg"
            >
              <CardHeader>
                <div className="mb-2 flex items-start justify-between">
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {idea.category}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="text-[10px]"
                  >
                    {idea.stage}
                  </Badge>
                </div>

                <CardTitle className="line-clamp-2 text-xl transition-colors group-hover:text-primary">
                  {idea.title}
                </CardTitle>

                <CardDescription className="line-clamp-3">
                  {idea.problem}
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-auto flex items-center justify-between border-t pt-6">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={idea.creator?.avatar_url ?? undefined}
                      alt={idea.creator?.full_name ?? "Creator"}
                    />
                    <AvatarFallback>
                      {idea.creator?.full_name
                        ?.charAt(0)
                        ?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <span className="text-xs font-medium">
                    {idea.creator?.full_name ?? "Unknown creator"}
                  </span>
                </div>

                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                >
                  <NextLink href={"/ideas/" + idea.id}>
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