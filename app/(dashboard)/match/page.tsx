"use client";

import React, { useState, useEffect, useCallback } from "react";
import { searchPeopleAction } from "@/app/(dashboard)/actions/discovery";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  location?: string;
  remote_preference?: string;
  availability?: string;
}

export default function MatchmakingPage() {
  const [results, setResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: "",
    availability: "",
    remotePreference: "",
    location: "",
  });

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchPeopleAction(filters);

      if (response.success) {
        setResults(
  (response.results || []).map(({ profile }) => ({
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url ?? undefined,
    headline: profile.headline ?? undefined,
    location: profile.location ?? undefined,
    remote_preference: profile.remote_preference ?? undefined,
    availability: profile.availability ?? undefined,
  }))
);
      } else {
        setError(
          response.error || "An error occurred while searching."
        );
      }
    } catch (e) {
      console.error("Match search error:", e);
      setError("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <span className="text-primary">✨</span>
            Co-founder Matching
          </h1>

          <p className="text-muted-foreground">
            AI-powered matching to find your perfect professional counterpart.
          </p>
        </div>

        <Button
          onClick={performSearch}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? "Refreshing..." : "Refresh Matches"}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader className="p-6 pb-0">
              <CardTitle className="text-lg">Match Filters</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Search
                </label>

                <Input
                  placeholder="e.g. TypeScript"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Location
                </label>

                <Input
                  placeholder="e.g. Chennai"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={performSearch}
                disabled={isLoading}
              >
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-3">
          {error && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border bg-background p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="h-4 w-32 rounded bg-muted" />
                  </div>

                  <div className="mb-4 h-4 w-20 rounded bg-muted" />
                  <div className="h-10 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h2 className="text-lg font-semibold">
                  No matches found
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Try changing your filters to discover more potential
                  connections.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {results.map((profile) => (
                <div
                  key={profile.id}
                  className="rounded-2xl border bg-background p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-semibold">
                            {profile.full_name?.[0]?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {profile.full_name}
                        </p>

                        {profile.headline && (
                          <p className="truncate text-sm text-muted-foreground">
                            {profile.headline}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-primary font-bold">
                      Match
                    </p>
                  </div>

                  {profile.location && (
                    <p className="mb-2 text-sm text-muted-foreground">
                      📍 {profile.location}
                    </p>
                  )}

                  {profile.availability && (
                    <p className="mb-4 text-sm text-muted-foreground">
                      Availability: {profile.availability}
                    </p>
                  )}

                  <Button className="w-full">
                    Connect Now
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}