import {
  getHackathonDetailAction,
  registerHackathonAction,
} from "@/app/(dashboard)/actions/hackathons";
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
  Calendar,
  MapPin,
  Trophy,
  Users,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import NextLink from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HackathonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const hackathon = await getHackathonDetailAction(params.id);

  if (!hackathon) {
    notFound();
  }

  const organizerName =
    hackathon.organizer?.full_name || "Organizer";

  const organizerInitial =
    organizerName.charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <NextLink
          href="/hackathons"
          className="transition-colors hover:text-primary"
        >
          Hackathons
        </NextLink>

        <span>/</span>

        <span className="font-medium text-foreground">
          {hackathon.title}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {hackathon.title}
                </h1>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {hackathon.location || "Online"}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-primary/20 text-primary"
                  >
                    <Trophy className="h-3 w-3" />
                    Prize: {hackathon.prize_pool || "TBD"}
                  </Badge>
                </div>
              </div>

              <Button size="lg" className="gap-2">
                Register Now
              </Button>
            </div>

            {/* Hackathon Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Starts
                  </p>

                  <p className="text-sm font-medium">
                    {new Date(
                      hackathon.start_date
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Deadline
                  </p>

                  <p className="text-sm font-medium">
                    {new Date(
                      hackathon.registration_deadline
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Team Size
                  </p>

                  <p className="text-sm font-medium">
                    {hackathon.min_team_size} -{" "}
                    {hackathon.max_team_size} members
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">
                About the Hackathon
              </h2>

              <p className="whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
                {hackathon.description ||
                  "No description available."}
              </p>
            </section>

            <Separator />

            {/* Team Discovery */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Team Discovery
                </h2>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Find Teammates
                </Button>
              </div>

              <div className="rounded-3xl border-2 border-dashed py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

                <h3 className="text-lg font-medium">
                  No teams listed yet
                </h3>

                <p className="mb-6 text-muted-foreground">
                  Be the first to create a team and invite
                  others to join!
                </p>

                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Organizer
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={
                      hackathon.organizer?.avatar_url ??
                      undefined
                    }
                    alt={organizerName}
                  />

                  <AvatarFallback>
                    {organizerInitial}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold">
                    {organizerName}
                  </p>

                  {hackathon.organizer?.headline && (
                    <p className="truncate text-xs text-muted-foreground">
                      {hackathon.organizer.headline}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {hackathon.organizer?.id ? (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                >
                  <NextLink
                    href={`/profiles/${hackathon.organizer.id}`}
                  >
                    View Profile
                  </NextLink>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  View Profile
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">
                Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start gap-2"
              >
                <Calendar className="h-4 w-4" />
                Add to Calendar
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-start gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Official Website
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}