"use client";

import * as React from "react";
import Link from "next/link";
import { Profile } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
import {
  MapPin,
  Globe,
  Users,
  UserPlus,
  Check,
  Clock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Github, Linkedin } from "@/components/ui/brand-icons";
import { cn } from "@/lib/utils";

interface PersonCardProps {
  person: Profile;
  featured?: boolean;
}

export function PersonCard({ person, featured = false }: PersonCardProps) {
  const [status, setStatus] = React.useState(person.connection_status || "none");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (person.connection_status) {
      setStatus(person.connection_status);
    }
  }, [person.connection_status]);

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      const res = await requestConnectionAction(person.id);
      if (res?.connection?.status === "accepted") {
        setStatus("connected");
      } else {
        setStatus("pending_sent");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-200 flex flex-col justify-between hover:shadow-card-hover hover:border-border/90 group",
        featured && "border-primary/30 bg-gradient-to-b from-primary/[0.03] to-surface"
      )}
    >
      <div>
        {/* Header with Avatar & Meta */}
        <div className="flex items-start gap-3.5">
          <Link href={`/people/${person.username}`}>
            <Avatar
              src={person.avatar_url}
              alt={person.full_name}
              size={featured ? "lg" : "md"}
              className="group-hover:scale-105 transition-transform"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <Link
                href={`/people/${person.username}`}
                className="font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors truncate block"
              >
                {person.full_name}
              </Link>
              {featured && (
                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" /> Featured
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">
              @{person.username}
            </p>

            {person.location && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{person.location}</span>
              </div>
            )}

            {person.availability && (
              <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mt-1.5 max-w-full">
                <Clock className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{person.availability}</span>
              </div>
            )}
          </div>
        </div>

        {/* Headline */}
        {person.headline && (
          <p className="mt-3 text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
            {person.headline}
          </p>
        )}

        {/* Short Bio */}
        {person.bio && (
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-normal">
            {person.bio}
          </p>
        )}

        {/* Skills list */}
        {person.skills && person.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {person.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] font-medium py-0 px-2">
                {skill}
              </Badge>
            ))}
            {person.skills.length > 4 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{person.skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Social / Portfolio Links Row */}
        {(person.github_url || person.linkedin_url || person.website || person.portfolio_url) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-border/60">
            {person.github_url && (
              <a
                href={person.github_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/80"
                title="View GitHub Profile"
              >
                <Github className="h-3 w-3" />
                <span>GitHub</span>
              </a>
            )}

            {person.linkedin_url && (
              <a
                href={person.linkedin_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted/60 text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors border border-border/80"
                title="View LinkedIn Profile"
              >
                <Linkedin className="h-3 w-3" />
                <span>LinkedIn</span>
              </a>
            )}

            {(person.website || person.portfolio_url) && (
              <a
                href={person.website || person.portfolio_url || "#"}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted/60 text-primary hover:bg-primary/10 transition-colors border border-border/80"
                title="View Website / Portfolio"
              >
                <Globe className="h-3 w-3" />
                <span>Portfolio</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{person.mutual_connections_count ?? 4} mutual</span>
        </div>

        <div className="flex items-center gap-1.5">
          {status === "connected" ? (
            <>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success px-2 py-1 rounded-md bg-success/10">
                <Check className="h-3 w-3" /> Connected
              </span>
              <Link href={`/messages`}>
                <Button size="icon-sm" variant="outline" title="Send message">
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          ) : status === "pending_sent" ? (
            <Button size="sm" variant="secondary" disabled className="text-xs h-8">
              <Clock className="h-3.5 w-3.5 mr-1" /> Pending
            </Button>
          ) : status === "pending_received" ? (
            <Link href="/connections">
              <Button size="sm" variant="default" className="text-xs h-8">
                Respond
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 hover:border-primary hover:text-primary"
              onClick={handleConnect}
              isLoading={isLoading}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
