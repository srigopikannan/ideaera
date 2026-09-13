import {
  MapPin,
  Globe,
  Calendar,
  Award,
  Briefcase,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetchProfileAction } from "@/app/(dashboard)/actions/profile";
export const dynamic = "force-dynamic";
export default async function ProfilePage() {
  const { profile, completion } = await fetchProfileAction();

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Profile not found</h2>
          <p className="text-muted-foreground">
            Please set up your profile in settings.
          </p>
          <Button asChild className="mt-4">
            <Link href="/profile/edit">Create Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border bg-background shadow-sm">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />

        <div className="px-8 pb-8">
          <div className="relative -mt-12 flex flex-col items-start gap-6 md:flex-row md:items-end">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-sm">
                <img
                  src={profile.avatar_url || "https://github.com/shadcn.png"}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {profile.full_name}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {profile.headline}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/profile/edit">Edit Profile</Link>
                  </Button>

                  <Button className="gap-2">
                    <Users className="h-4 w-4" />
                    Request Connection
                  </Button>
                </div>
              </div>
            </div>
          </div>

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
                  rel="noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-8">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Completion</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold">{completion}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {completion < 100
                  ? "Complete your profile to increase visibility."
                  : "Your profile is fully complete!"}
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
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <Badge
                      key={skill.name}
                      variant="secondary"
                      className="px-3 py-1 text-xs font-medium"
                    >
                      {skill.name}
                      <span className="ml-1 opacity-50">
                        ({skill.level})
                      </span>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skills added yet.
                  </p>
                )}
              </div>
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
              {profile.experience && profile.experience.length > 0 ? (
                profile.experience.map((exp, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-muted-foreground">
                        {exp.company?.[0] || "E"}
                      </div>

                      {i !== profile.experience.length - 1 && (
                        <div className="my-2 w-px flex-1 bg-border" />
                      )}
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">
                          {exp.role} at {exp.company}
                        </h4>

                        <span className="text-xs text-muted-foreground">
                          {formatDate(exp.start_date)}
                          {exp.end_date
                            ? ` - ${formatDate(exp.end_date)}`
                            : " - Present"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {exp.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No experience listed.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certifications & Achievements */}
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-primary" />
                  Certifications
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {profile.certifications &&
                profile.certifications.length > 0 ? (
                  profile.certifications.map((cert, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <p className="text-sm font-medium">{cert.name}</p>

                      <p className="text-xs text-muted-foreground">
                        {cert.issuer} • {formatDate(cert.issue_date)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No certifications listed.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {profile.achievements &&
                profile.achievements.length > 0 ? (
                  profile.achievements.map((ach, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <p className="text-sm font-medium">{ach.title}</p>

                      <p className="text-xs text-muted-foreground">
                        {formatDate(ach.date)}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {ach.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No achievements listed.
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

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}

function Users({ className }: { className?: string }) {
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

function Trophy({ className }: { className?: string }) {
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
      <path d="M10 14c0 0 2 4 2 4s2-4 2-4" />
      <path d="M12 18v4" />
      <path d="M12 8a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4z" />
    </svg>
  );
}