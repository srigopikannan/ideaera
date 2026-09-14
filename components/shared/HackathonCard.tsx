"use client";

import Link from "next/link";
import { Hackathon } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Card3D } from "@/components/3d/Card3D";

interface HackathonCardProps {
  hackathon: Hackathon;
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const getModeBadge = (mode: Hackathon["mode"]) => {
    switch (mode) {
      case "Online":
        return <Badge variant="success">Online</Badge>;
      case "In-Person":
        return <Badge variant="warning">In-Person</Badge>;
      case "Hybrid":
        return <Badge variant="accent">Hybrid</Badge>;
      default:
        return <Badge variant="outline">{mode}</Badge>;
    }
  };

  const getRegionBadge = (region?: string) => {
    switch (region) {
      case "Tamil Nadu":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-md">
            ⭐ Tamil Nadu
          </span>
        );
      case "India":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-md">
            🇮🇳 India
          </span>
        );
      case "Asia":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-600 text-white shadow-md">
            🌏 Asia
          </span>
        );
      case "Global":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-md">
            🌐 Global
          </span>
        );
    }
  };

  return (
    <Card3D
      maxTilt={6}
      scale={1.02}
      glare={true}
      className="h-full rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-xl overflow-hidden shadow-card transition-all duration-300 hover:shadow-[0_16px_40px_rgba(99,102,241,0.2)] hover:border-primary/50 flex flex-col justify-between group"
    >
      <div>
        {/* Banner with 3D Depth */}
        <div className="relative h-44 w-full bg-muted overflow-hidden">
          <img
            src={
              hackathon.image_url ||
              "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80"
            }
            alt={hackathon.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            {getRegionBadge(hackathon.region)}
            {hackathon.status === "ongoing" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white shadow-md">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live Now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600/95 text-white shadow-md">
                📅 Upcoming
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3 z-10">{getModeBadge(hackathon.mode)}</div>

          {/* Floating 3D Prize Pill on Image */}
          <div className="absolute bottom-2.5 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-black/70 text-amber-400 backdrop-blur-md border border-white/10 shadow-lg">
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              {hackathon.prizes || hackathon.prize_pool || "Prizes & Grants"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-1.5 truncate">
            <span>By {hackathon.organizer}</span>
          </div>

          <Link
            href={`/hackathons/${hackathon.id}`}
            className="font-bold text-base sm:text-lg text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {hackathon.title}
          </Link>

          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {hackathon.description}
          </p>

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            {/* Date & Time */}
            <div className="flex items-start gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-foreground text-[11px] block">
                  {formatDateTime(hackathon.start_date)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  To {formatDateTime(hackathon.end_date)}
                </span>
              </div>
            </div>

            {/* Venue & Mode */}
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1 text-[11px]">{hackathon.location} ({hackathon.mode})</span>
            </div>

            {/* Squad / Team Size */}
            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <Users className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span>Squad: Team of {hackathon.min_team_size || 1}–{hackathon.max_team_size || 4} Members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-0">
        <div className="pt-3 border-t border-border/80 flex items-center justify-between gap-2">
          <Link
            href={`/hackathons/${hackathon.id}`}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            View Details →
          </Link>

          <Link href={`/people?hackathon=${encodeURIComponent(hackathon.title)}`}>
            <Button size="sm" variant="default" className="text-xs h-8 font-semibold shadow-subtle gap-1.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all">
              <Users className="h-3.5 w-3.5" /> Form Team Members
            </Button>
          </Link>
        </div>
      </div>
    </Card3D>
  );
}
