"use client";

import { useState } from "react";
import { Search, MapPin, Filter, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PersonCard } from "@/components/people/person-card";
import { getMyConnectionsAction } from "@/app/(dashboard)/actions/social";

export default function PeoplePage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const searchPeople = async () => {
    setLoading(true);
    setSearched(true);

    try {
      const people = await getMyConnectionsAction();

      const filtered = (people?.connections ?? []).filter((person: any) => {
        const searchText = query.trim().toLowerCase();

        const matchesQuery =
          !searchText ||
          person.full_name?.toLowerCase().includes(searchText) ||
          person.username?.toLowerCase().includes(searchText) ||
          person.headline?.toLowerCase().includes(searchText) ||
          person.skills?.some((skill: string) =>
            skill.toLowerCase().includes(searchText)
          );

        const matchesLocation =
          !location.trim() ||
          person.location?.toLowerCase().includes(location.trim().toLowerCase());

        const matchesRemote =
          !remoteOnly ||
          person.remote_only === true ||
          person.remoteOnly === true;

        return matchesQuery && matchesLocation && matchesRemote;
      });

      setResults(filtered);
    } catch (error) {
      console.error("Failed to search people:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setLocation("");
    setAvailability("");
    setRemoteOnly(false);
    setExperience("");
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discover People</h1>
        <p className="mt-1 text-muted-foreground">
          Find talented people, collaborators, mentors, and potential
          teammates.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void searchPeople();
                    }
                  }}
                  placeholder="Search by name, skills, interests..."
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Location"
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="open">Open to opportunities</SelectItem>
              </SelectContent>
            </Select>

            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="entry">Entry level</SelectItem>
                <SelectItem value="mid">Mid level</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(event) => setRemoteOnly(event.target.checked)}
              />
              Remote only
            </label>

            <div className="flex gap-2 md:col-span-2 lg:col-span-2">
              <Button
                onClick={() => void searchPeople()}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={loading}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Finding people...
          </div>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <Card>
          <CardContent className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <Users className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No people found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing your search terms or removing some filters.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((person) => (
            <PersonCard
              key={person.id}
              profile={person}
            />
          ))}
        </div>
      )}

      {!loading && !searched && (
        <Card>
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              Find your next collaborator
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Search for people based on their skills, interests, location,
              and availability.
            </p>
            <Button
              className="mt-5"
              onClick={() => void searchPeople()}
            >
              <Search className="mr-2 h-4 w-4" />
              Discover People
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}