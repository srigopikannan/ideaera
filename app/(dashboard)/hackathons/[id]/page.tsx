import { notFound } from "next/navigation";
import Link from "next/link";
import { getHackathonById } from "@/services/hackathons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTimeWithTz, formatEventDateRange, formatRegistrationDeadline } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hackathon = await getHackathonById(id);
  if (!hackathon) return { title: "Hackathon Not Found — IdeaEra" };
  return {
    title: `${hackathon.title} — IdeaEra`,
    description: hackathon.description.slice(0, 150),
  };
}

export default async function HackathonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hackathon = await getHackathonById(id);

  if (!hackathon) {
    notFound();
  }

  const isOngoing = hackathon.status === "ongoing";
  const isEnded = hackathon.status === "ended";
  const eventDateRange = formatEventDateRange(hackathon.start_date, hackathon.end_date);
  const regDeadline = formatRegistrationDeadline(hackathon.registration_deadline);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16 px-4 sm:px-0">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hackathons
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {hackathon.region && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {hackathon.region === "Tamil Nadu" ? "⭐ " : ""}{hackathon.region}
            </span>
          )}
          {isOngoing ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-sm">
              🟢 Live Now
            </span>
          ) : isEnded ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-neutral-600 text-white shadow-sm">
              ⚪ Concluded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-sm">
              📅 Upcoming
            </span>
          )}
          <Badge variant="warning">{hackathon.mode}</Badge>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface shadow-card overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-64 sm:h-80 w-full bg-muted">
          <img
            src={
              hackathon.image_url ||
              "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80"
            }
            alt={hackathon.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md">
                🟢 Live Now
              </span>
            ) : isEnded ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-700 text-white shadow-md">
                ⚪ Concluded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-600 text-white shadow-md">
                📅 Upcoming
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-sm">
              {hackathon.mode}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-10 space-y-6 sm:space-y-8">
          {/* Header & Squad Assembly CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border pb-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-semibold text-primary block">
                Organized by {hackathon.organizer}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground break-words">
                {hackathon.title}
              </h1>
            </div>

            <Link
              href={`/people?hackathon=${encodeURIComponent(hackathon.title)}${hackathon.tags?.length ? `&skills=${encodeURIComponent(hackathon.tags.join(","))}` : ""}`}
              className="self-start sm:self-auto"
            >
              <Button size="lg" variant="default" className="shadow-subtle font-semibold gap-2">
                <Users className="h-5 w-5" /> Find Teammates
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Schedule */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-2">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" /> Event Dates
              </span>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  {eventDateRange}
                </p>
                {hackathon.start_date ? (
                  <p className="text-[10px] text-muted-foreground">
                    From {formatDateTimeWithTz(hackathon.start_date, "Asia/Kolkata", "IST")}
                  </p>
                ) : (
                  <p className="text-[10px] text-neutral-400">
                    Date unavailable
                  </p>
                )}
              </div>
            </div>

            {/* Registration Deadline */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-2">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" /> Registration Closes
              </span>
              <div className="space-y-1">
                <p className={`text-xs font-bold ${regDeadline.isClosed ? "text-red-400" : "text-amber-400"}`}>
                  {regDeadline.text}
                </p>
                {hackathon.registration_deadline ? (
                  <p className="text-[10px] text-muted-foreground">
                    {formatDateTimeWithTz(hackathon.registration_deadline, "Asia/Kolkata", "IST")}
                  </p>
                ) : (
                  <p className="text-[10px] text-neutral-400">
                    Open online registration
                  </p>
                )}
              </div>
            </div>

            {/* Venue & Location */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-2">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-warning" /> Venue & Mode
              </span>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground line-clamp-1">
                  {hackathon.location}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Mode: {hackathon.mode}
                </p>
              </div>
            </div>

            {/* Prize Pool */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-2">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500" /> Prize Pool
              </span>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-amber-500 line-clamp-2">
                  {hackathon.prizes || hackathon.prize_pool || "Prizes & Recognition"}
                </p>
              </div>
            </div>

            {/* Squad Requirements */}
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-2">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> Squad Size
              </span>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  Team of {hackathon.min_team_size || 1}–{hackathon.max_team_size || 4} Members
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {hackathon.region || "Global"} Track
                </p>
              </div>
            </div>
          </div>

          {/* Full Description */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">About the Challenge</h2>
            <div className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line space-y-3">
              {hackathon.description}
            </div>
          </div>

          {/* Guidelines & Form Squad CTA */}
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-surface-elevated border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Assembling a squad for this hackathon?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect with designers, frontend & backend engineers, and AI specialists on IdeaEra to form a high-impact team.
              </p>
            </div>
            <Link href={`/people?hackathon=${encodeURIComponent(hackathon.title)}${hackathon.tags?.length ? `&skills=${encodeURIComponent(hackathon.tags.join(","))}` : ""}`}>
              <Button size="lg" variant="default" className="font-semibold shadow-subtle gap-2 whitespace-nowrap">
                <Users className="h-4 w-4" /> Build a Team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
