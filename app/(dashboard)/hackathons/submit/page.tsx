"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createHackathonAction } from "@/app/(dashboard)/actions/hackathons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Calendar, MapPin, DollarSign, Users, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function SubmitHackathonPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("Global (Online)");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [registrationDeadline, setRegistrationDeadline] = React.useState("");
  const [prizePool, setPrizePool] = React.useState("");
  const [minTeamSize, setMinTeamSize] = React.useState(1);
  const [maxTeamSize, setMaxTeamSize] = React.useState(4);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !startDate || !endDate || !location.trim()) {
      setError("Please fill in all required fields (title, description, location, dates).");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date.");
      return;
    }

    setIsLoading(true);

    try {
      await createHackathonAction({
        title,
        description,
        location,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : new Date(startDate).toISOString(),
        prize_pool: prizePool.trim() || undefined,
        min_team_size: Number(minTeamSize),
        max_team_size: Number(maxTeamSize),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/hackathons");
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to submit hackathon. Make sure you are signed in.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Hackathons
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2 text-warning text-xs font-semibold uppercase tracking-wider mb-1">
          <Trophy className="h-4 w-4" />
          <span>Community Event Registration</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Submit a Real Hackathon.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share an upcoming hackathon, university sprint, or technical challenge with the IdeaEra community.
        </p>
      </div>

      <Card className="border-border shadow-elevated bg-surface">
        <CardHeader>
          <CardTitle className="text-lg">Event Details</CardTitle>
          <CardDescription>
            Provide accurate dates and registration details so builders can participate and assemble teams.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-6 rounded-lg bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 mb-6 rounded-lg bg-success/10 border border-success/20 flex items-start gap-2.5 text-success text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Hackathon submitted successfully! Redirecting to catalog...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Hackathon Title *
              </label>
              <Input
                type="text"
                placeholder="e.g. Google Cloud AI Sprint 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Description & Challenge Tracks *
              </label>
              <Textarea
                placeholder="Explain the hackathon mission, problem statements, eligible technologies, and rules..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Location / Format *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Global (Online), or San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Prize Pool / Grants
                </label>
                <Input
                  type="text"
                  placeholder="e.g. $50,000 in Prizes & Cloud Credits"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  leftIcon={<DollarSign className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Start Date *
                </label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  End Date *
                </label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Registration Deadline
                </label>
                <Input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Min Team Size
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(Number(e.target.value))}
                  leftIcon={<Users className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Max Team Size
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  leftIcon={<Users className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                isLoading={isLoading}
              >
                Publish Hackathon
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
