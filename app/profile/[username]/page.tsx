import { getProfile } from "@/services/profile";
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
import { Globe, Mail, MapPin } from "lucide-react";
import NextLink from "next/link";
import { notFound } from "next/navigation";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // The current getProfile service expects a user ID.
  // For now, the username route parameter is treated as the user ID.
  const profile = await getProfile(params.username);

  if (!profile) {
    notFound();
  }

  const initials =
    profile.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-12">
      {/* Header */}
      <div className="relative h-48 w-full rounded-3xl bg-gradient-to-r from-primary/20 to-blue-500/20 border">
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.full_name ?? "Profile"}
            />
            <AvatarFallback className="text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="mb-2 space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.full_name || "Unnamed User"}
            </h1>

            <p className="text-lg text-muted-foreground">
              {profile.headline || "No headline provided"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3 mt-16">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Contact & Socials */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Socials</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{profile.location || "Remote"}</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                {profile.github_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <NextLink
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                    </NextLink>
                  </Button>
                )}

                {profile.linkedin_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <NextLink
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                    </NextLink>
                  </Button>
                )}

                {profile.portfolio_url && (
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <NextLink
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                    </NextLink>
                  </Button>
                )}
              </div>

              <Button className="w-full gap-2 mt-4">
                <Mail className="h-4 w-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-2">
              {profile.skills?.map(
                (
                  skill: {
                    name: string;
                    level: string;
                  },
                  index: number
                ) => (
                  <Badge
                    key={`${skill.name}-${index}`}
                    variant="secondary"
                  >
                    {skill.name}
                    {skill.level ? ` • ${skill.level}` : ""}
                  </Badge>
                )
              )}

              {(!profile.skills ||
                profile.skills.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  No skills listed.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">
              About Me
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              {profile.bio || "No bio provided."}
            </p>
          </section>

          <Separator />

          {/* Experience */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">
              Experience
            </h2>

            <div className="space-y-6">
              {profile.experience?.map((exp) => (
                <div
                  key={exp.id}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {exp.company?.[0] || "C"}
                    </div>

                    <div className="w-px flex-1 bg-border my-2" />
                  </div>

                  <div className="pb-6 flex-1">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className="font-semibold text-lg">
                        {exp.role}
                      </h3>

                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(
                          exp.start_date
                        ).getFullYear()}{" "}
                        -{" "}
                        {exp.end_date
                          ? new Date(
                              exp.end_date
                            ).getFullYear()
                          : "Present"}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-primary mb-2">
                      {exp.company}
                    </p>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {exp.description ||
                        "No description provided."}
                    </p>
                  </div>
                </div>
              ))}

              {(!profile.experience ||
                profile.experience.length === 0) && (
                <p className="text-muted-foreground">
                  No experience listed.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}