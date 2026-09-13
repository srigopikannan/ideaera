import {
  MapPin,
  Globe,
  Calendar,
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import {
  profiles,
  user_skills,
  experience,
  certifications,
  achievements,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PersonProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, params.username),
  });

  if (!profile) {
    notFound();
  }

  const userSkills = await db.query.user_skills.findMany({
    where: eq(user_skills.user_id, profile.id),
    with: {
      skill: true,
    },
  });

  const userExperience = await db.query.experience.findMany({
    where: eq(experience.user_id, profile.id),
  });

  const userCertifications = await db.query.certifications.findMany({
    where: eq(certifications.user_id, profile.id),
  });

  const userAchievements = await db.query.achievements.findMany({
    where: eq(achievements.user_id, profile.id),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl border bg-background shadow-sm">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />

        <div className="px-8 pb-8">
          <div className="relative -mt-12 flex flex-col items-start gap-6 md:flex-row md:items-end">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-sm">
                <img
                  src={
                    profile.avatar_url ||
                    "https://github.com/shadcn.png"
                  }
                  alt={profile.full_name || "Profile"}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Name / Actions */}
            <div className="flex-1 space-y-1">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {profile.full_name}
                  </h1>

                  <p className="text-lg text-muted-foreground">
                    {profile.headline || "No headline provided"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button className="gap-2" type="button">
                    <UsersIcon className="h-4 w-4" />
                    Request Connection
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    asChild
                  >
                    <Link href={`/messages/${profile.id}`}>
                      <MessageSquareIcon className="h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Meta */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {profile.location || "Location not set"}
            </div>

            <div className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              {profile.remote_preference || "Not specified"}
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {profile.availability || "Not specified"}
            </div>

            <div className="ml-auto flex items-center gap-3">
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                  aria-label="GitHub"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                  aria-label="LinkedIn"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                  aria-label="Portfolio"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-8">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {profile.bio || "No bio provided yet."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8 md:col-span-2">
          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>

            <CardContent>
              {userSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((us) => (
                    <Badge
                      key={`${us.user_id}-${us.skill_id}`}
                      variant="secondary"
                      className="px-3 py-1 text-xs font-medium"
                    >
                      {us.skill.name}
                      <span className="ml-1 opacity-50">
                        ({us.level})
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No skills added yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Professional Experience
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {userExperience.length > 0 ? (
                userExperience.map((exp, i) => (
                  <div key={exp.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-muted-foreground">
                        {exp.company?.[0]?.toUpperCase() || "C"}
                      </div>

                      {i !== userExperience.length - 1 && (
                        <div className="my-2 w-px flex-1 bg-border" />
                      )}
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-semibold">
                          {exp.role} at {exp.company}
                        </h4>

                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {exp.start_date
                            ? new Date(
                                exp.start_date
                              ).toLocaleDateString()
                            : ""}
                          {" "}
                          {exp.end_date
                            ? `- ${new Date(
                                exp.end_date
                              ).toLocaleDateString()}`
                            : "- Present"}
                        </span>
                      </div>

                      {exp.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No professional experience added yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certifications + Achievements */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-primary" />
                  Certifications
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {userCertifications.length > 0 ? (
                  userCertifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <p className="text-sm font-medium">
                        {cert.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {cert.issuer}
                        {cert.issue_date
                          ? ` • ${new Date(
                              cert.issue_date
                            ).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No certifications added yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrophyIcon className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {userAchievements.length > 0 ? (
                  userAchievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <p className="text-sm font-medium">
                        {ach.title}
                      </p>

                      {ach.date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            ach.date
                          ).toLocaleDateString()}
                        </p>
                      )}

                      {ach.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ach.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No achievements added yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small local icons so this file doesn't depend on unavailable
   lucide-react exports in the installed version. */

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14c0 2 2 4 2 4s2-2 2-4" />
      <path d="M12 18v4" />
      <path d="M12 8a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z" />
    </svg>
  );
}