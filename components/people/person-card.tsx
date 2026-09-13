"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Zap, MessageSquare, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FullProfile } from "@/db/types";
import Link from "next/link";

interface PersonCardProps {
  profile: FullProfile;
  score?: number;
  reasons?: string[];
  onConnect?: (id: string) => void;
}

export function PersonCard({ profile, score, reasons, onConnect }: PersonCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 border-border/60 bg-background">
      <CardHeader className="p-6 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/10">
              <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
              <AvatarFallback>{profile.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-bold text-lg leading-none group-hover:text-primary transition-colors">
                {profile.full_name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{profile.headline}</p>
            </div>
          </div>
          {score !== undefined && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-primary font-bold">
                <Zap className="h-3 w-3 fill-primary" />
                <span>{score}% Match</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Compatibility</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          {profile.skills.slice(0, 3).map(skill => (
            <Badge key={skill.name} variant="secondary" className="text-[10px] py-0 px-2">
              {skill.name} ({skill.level})
            </Badge>
          ))}
          {profile.skills.length > 3 && (
            <Badge variant="outline" className="text-[10px] py-0 px-2">
              +{profile.skills.length - 3} more
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{profile.location || "Remote"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            <span>{profile.remote_preference}</span>
          </div>
        </div>

        {reasons && reasons.length > 0 && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
            <p className="text-[11px] font-semibold text-primary">Why they match:</p>
            <ul className="text-[11px] text-muted-foreground space-y-1">
              {reasons.slice(0, 2).map((reason, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-primary">•</span> {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Button variant="outline" className="flex-1 h-9 text-xs gap-2" asChild>
          <Link href={`/people/${profile.username}`}>
            View Profile
          </Link>
        </Button>
        <Button className="flex-1 h-9 text-xs gap-2" onClick={() => onConnect?.(profile.id)}>
          <UserPlus className="h-3 w-3" />
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
}
