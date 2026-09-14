import { getIdeaDetailAction } from "@/app/(dashboard)/actions/ideas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Lightbulb,
  MessageSquare,
  Users,
  Target,
} from "lucide-react";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import BookmarkClientButton from "@/components/ideas/bookmark-button";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getIdeaDetailAction(params.id);

  if (!result.success || !result.idea) {
    notFound();
  }

  const { idea, isBookmarked } = result;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <NextLink
          href="/ideas"
          className="transition-colors hover:text-primary"
        >
          Ideas
        </NextLink>

        <span>/</span>

        <span className="font-medium text-foreground">
          {idea.title}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {idea.category}
                  </Badge>

                  <Badge variant="outline">
                    {idea.stage}
                  </Badge>
                </div>

                <h1 className="text-4xl font-bold tracking-tight">
                  {idea.title}
                </h1>
              </div>

              <div className="flex gap-2">
                <BookmarkClientButton
                  isBookmarked={isBookmarked}
                  ideaId={idea.id}
                />

                <Button asChild>
                  <NextLink
                    href={`/messages/new?receiver=${idea.creator_id}`}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message Creator
                  </NextLink>
                </Button>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={idea.creator?.avatar_url ?? undefined}
                  alt={idea.creator?.full_name || "Creator"}
                />

                <AvatarFallback>
                  {idea.creator?.full_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm font-semibold">
                  {idea.creator?.full_name || "Unknown Creator"}
                </p>

                <p className="text-xs text-muted-foreground">
                  Posted on{" "}
                  {new Date(idea.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Idea Content */}
          <div className="space-y-8">
            {/* Problem */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Target className="h-6 w-6 text-primary" />
                The Problem
              </h2>

              <p className="text-lg leading-relaxed text-muted-foreground">
                {idea.problem}
              </p>
            </section>

            <Separator />

            {/* Solution */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Lightbulb className="h-6 w-6 text-primary" />
                The Solution
              </h2>

              <p className="text-lg leading-relaxed text-muted-foreground">
                {idea.solution}
              </p>
            </section>

            <Separator />

            {/* Description */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">
                Detailed Vision
              </h2>

              <div className="prose prose-muted max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {idea.description}
                </p>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Teammates Needed
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {!idea.requirements ||
              idea.requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No specific requirements listed.
                </p>
              ) : (
                <div className="space-y-3">
                  {idea.requirements.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-xl border bg-muted/50 p-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">
                          {req.skill?.name || "Skill"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Min: {req.min_level}
                        </p>
                      </div>

                      <Badge
                        variant={
                          req.priority.toLowerCase() === "high"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {req.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <Button
                asChild
                className="mt-4 w-full"
                variant="outline"
              >
                <NextLink href="/people">
                  Find Matching Talent
                </NextLink>
              </Button>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">
                Ready to contribute?
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm opacity-90">
                If you have the skills mentioned above, reach
                out to the creator to discuss a potential
                collaboration.
              </p>

              <Button
                asChild
                variant="secondary"
                className="w-full font-semibold"
              >
                <NextLink
                  href={`/messages/new?receiver=${idea.creator_id}`}
                >
                  Connect Now
                </NextLink>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}