"use client";

import * as React from "react";
import Link from "next/link";
import { Profile } from "@/types";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
import { searchProfilesAction } from "@/app/(dashboard)/actions/profile";
import {
  Search,
  MapPin,
  GraduationCap,
  Sparkles,
  Users,
  Compass,
  Check,
  UserPlus,
  UserCheck,
  Clock,
  ArrowUpRight,
  Filter,
  X,
  Building,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  getStatesAction,
  getCitiesAction,
  getCollegesAction,
} from "@/app/(dashboard)/actions/reference-data";

interface TeammateDiscoveryProps {
  people: Profile[];
  currentUser?: Profile | null;
  initialHackathon?: string;
  initialSkills?: string[];
}

export function TeammateDiscovery({
  people,
  currentUser,
  initialHackathon,
  initialSkills = [],
}: TeammateDiscoveryProps) {
  // Discovery mode: 'nearby' vs 'custom'
  const [discoveryMode, setDiscoveryMode] = React.useState<"nearby" | "custom">("nearby");

  // Nearby sub-filter
  const [nearbyFilter, setNearbyFilter] = React.useState<"all" | "city" | "state" | "college">("all");

  // Custom search filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(initialSkills);
  const [skillInput, setSkillInput] = React.useState("");
  const [collegeFilter, setCollegeFilter] = React.useState("");
  const [cityFilter, setCityFilter] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState("");
  const [hackathonFilter, setHackathonFilter] = React.useState(initialHackathon || "");
  const [availabilityFilter, setAvailabilityFilter] = React.useState<string>("All");

  // Server-side paginated state
  const [serverPeople, setServerPeople] = React.useState<Profile[]>(people);
  const [totalCount, setTotalCount] = React.useState<number>(people.length);
  const [page, setPage] = React.useState<number>(1);
  const pageSize = 24;
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Sync initial people when props update
  React.useEffect(() => {
    if (discoveryMode === "nearby" && nearbyFilter === "all") {
      setServerPeople(people);
      setTotalCount(people.length);
    }
  }, [people, discoveryMode, nearbyFilter]);

  // Reset page to 1 whenever any filter changes
  React.useEffect(() => {
    setPage(1);
  }, [
    discoveryMode,
    nearbyFilter,
    searchQuery,
    selectedSkills,
    collegeFilter,
    cityFilter,
    stateFilter,
    availabilityFilter,
  ]);

  // Debounced server search effect for 10K scalability
  React.useEffect(() => {
    // If nearby mode with "all", use local proximity list
    if (discoveryMode === "nearby" && nearbyFilter === "all") {
      setServerPeople(people);
      setTotalCount(people.length);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        let city: string | undefined = undefined;
        let state: string | undefined = undefined;
        let college: string | undefined = undefined;
        let query: string | undefined = undefined;
        let skill: string | undefined = undefined;
        let avail: string | undefined = undefined;

        if (discoveryMode === "nearby") {
          if (nearbyFilter === "city") city = currentUser?.city || undefined;
          else if (nearbyFilter === "state") state = currentUser?.state || undefined;
          else if (nearbyFilter === "college") college = currentUser?.college || undefined;
        } else {
          query = searchQuery.trim() || undefined;
          skill = selectedSkills.length > 0 ? selectedSkills[0] : undefined;
          college = collegeFilter.trim() || undefined;
          city = cityFilter.trim() || undefined;
          state = stateFilter.trim() || undefined;
          avail = availabilityFilter !== "All" ? availabilityFilter : undefined;
        }

        const res = await searchProfilesAction({
          query,
          skillFilter: skill,
          collegeFilter: college,
          cityFilter: city,
          stateFilter: state,
          availabilityFilter: avail,
          page,
          limit: pageSize,
        });

        setServerPeople(res.profiles);
        setTotalCount(res.total);
      } catch (err) {
        console.error("Error searching profiles:", err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    discoveryMode,
    nearbyFilter,
    searchQuery,
    selectedSkills,
    collegeFilter,
    cityFilter,
    stateFilter,
    availabilityFilter,
    page,
    pageSize,
    currentUser,
    people,
  ]);

  // Connection states map: userId -> status
  const [connectionStates, setConnectionStates] = React.useState<Record<string, string>>({});
  const [connectingId, setConnectingId] = React.useState<string | null>(null);

  const handleConnect = async (userId: string) => {
    setConnectingId(userId);
    try {
      const res = await requestConnectionAction(userId);
      setConnectionStates((prev) => ({
        ...prev,
        [userId]: res?.connection?.status === "accepted" ? "connected" : "pending_sent",
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingId(null);
    }
  };

  const addSkillFilter = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (!selectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkillFilter = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  // Filter and rank people
  const filteredPeople = React.useMemo(() => {
    // Exclude current user from teammates list
    let list = serverPeople.filter((p) => p.id !== currentUser?.id);

    if (discoveryMode === "nearby" && nearbyFilter === "all") {
      const userCity = currentUser?.city?.toLowerCase().trim();
      const userState = currentUser?.state?.toLowerCase().trim();
      const userCollege = currentUser?.college?.toLowerCase().trim();

      // Proximity sort for nearby 'all'
      list = [...list].sort((a, b) => {
        const aCityMatch = userCity && a.city?.toLowerCase().trim() === userCity ? 4 : 0;
        const bCityMatch = userCity && b.city?.toLowerCase().trim() === userCity ? 4 : 0;

        const aCollegeMatch = userCollege && a.college?.toLowerCase().trim() === userCollege ? 3 : 0;
        const bCollegeMatch = userCollege && b.college?.toLowerCase().trim() === userCollege ? 3 : 0;

        const aStateMatch = userState && a.state?.toLowerCase().trim() === userState ? 2 : 0;
        const bStateMatch = userState && b.state?.toLowerCase().trim() === userState ? 2 : 0;

        const scoreA = aCityMatch + aCollegeMatch + aStateMatch;
        const scoreB = bCityMatch + bCollegeMatch + bStateMatch;

        return scoreB - scoreA;
      });
    }

    return list;
  }, [
    serverPeople,
    currentUser,
    discoveryMode,
    nearbyFilter,
  ]);

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2 rounded-2xl border border-white/10 bg-[#0a0c13]">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setDiscoveryMode("nearby")}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all",
              discoveryMode === "nearby"
                ? "bg-white text-black font-semibold shadow-lg"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Nearby Builders</span>
          </button>

          <button
            onClick={() => setDiscoveryMode("custom")}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all",
              discoveryMode === "custom"
                ? "bg-white text-black font-semibold shadow-lg"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Custom Search</span>
            {selectedSkills.length > 0 && (
              <span className="h-4 w-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center">
                {selectedSkills.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs font-mono text-neutral-400 px-3 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-3 w-3 text-indigo-400 animate-spin shrink-0" />
          )}
          <span>Found {totalCount} potential teammates</span>
        </div>
      </div>

      {/* Mode A: Nearby Filter Sub-Bar */}
      {discoveryMode === "nearby" && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-white/10 bg-[#0a0c13]/60">
          <span className="text-[11px] font-mono text-neutral-400 mr-2 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-cyan-400" /> Proximity Scope:
          </span>
          {[
            { id: "all", label: "Smart Proximity" },
            { id: "city", label: currentUser?.city ? `Same City (${currentUser.city})` : "Same City" },
            { id: "state", label: currentUser?.state ? `Same State (${currentUser.state})` : "Same State" },
            { id: "college", label: currentUser?.college ? "Same College" : "College Peers" },
          ].map((scope) => (
            <button
              key={scope.id}
              onClick={() => setNearbyFilter(scope.id as any)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-mono transition-all border",
                nearbyFilter === scope.id
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-medium"
                  : "bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
              )}
            >
              {scope.label}
            </button>
          ))}
        </div>
      )}

      {/* Mode B: Custom Search Form */}
      {discoveryMode === "custom" && (
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0a0c13] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* General Query */}
            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5 block">
                Keyword / Builder
              </label>
              <div className="relative flex items-center w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                <Search className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name, handle, role..."
                  className="w-full bg-transparent text-xs text-white placeholder:text-neutral-600 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-muted-foreground hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* State Filter */}
            <div>
              <SearchableSelect
                label="State"
                placeholder="All States..."
                value={stateFilter}
                leftIcon={<Building className="h-3.5 w-3.5 text-cyan-400" />}
                onSearch={(q) => getStatesAction(q)}
                onSelect={(item) => {
                  setStateFilter(item.name);
                  setCityFilter("");
                }}
                onClear={() => {
                  setStateFilter("");
                  setCityFilter("");
                }}
                emptyMessage="No matching state found."
              />
            </div>

            {/* City Filter — State Dependent */}
            <div>
              <SearchableSelect
                label="City"
                placeholder="All Cities..."
                value={cityFilter}
                disabled={!stateFilter.trim()}
                disabledMessage="Select state first"
                leftIcon={<MapPin className="h-3.5 w-3.5 text-cyan-400" />}
                onSearch={(q) => getCitiesAction(stateFilter, q)}
                onSelect={(item) => setCityFilter(item.name)}
                onClear={() => setCityFilter("")}
                emptyMessage={
                  stateFilter
                    ? `No cities found in ${stateFilter}.`
                    : "Select a state first."
                }
              />
            </div>

            {/* College Filter */}
            <div>
              <SearchableSelect
                label="College / Institute"
                placeholder="All Institutions..."
                value={collegeFilter}
                leftIcon={<GraduationCap className="h-3.5 w-3.5 text-indigo-400" />}
                onSearch={(q) => getCollegesAction(q)}
                onSelect={(item) => setCollegeFilter(item.name)}
                onClear={() => setCollegeFilter("")}
                emptyMessage="No matching colleges found."
              />
            </div>

            {/* Availability Filter */}
            <div>
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5 block">
                Availability
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full h-[38px] rounded-xl border border-white/10 bg-[#0a0c13] px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Availabilities</option>
                <option value="Available">Available</option>
                <option value="Available evenings">Available evenings</option>
                <option value="Available weekends">Available weekends</option>
                <option value="Limited availability">Limited availability</option>
                <option value="Not currently available">Not currently available</option>
              </select>
            </div>
          </div>

          {/* Skill Filter Tags & Input */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-neutral-500">Skills Needed:</span>
              {selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono border border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                >
                  <span>{skill}</span>
                  <button onClick={() => removeSkillFilter(skill)} className="hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addSkillFilter(skillInput);
                }}
                className="inline-flex items-center"
              >
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="+ Add skill (Enter)"
                  className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/[0.02] text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50 w-32"
                />
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Teammate Cards Grid */}
      {filteredPeople.length === 0 ? (
        <div className="p-12 rounded-3xl border border-white/10 bg-[#0a0c13] text-center space-y-3">
          <Users className="h-8 w-8 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-medium text-white">No teammates match your current criteria</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Try expanding your search parameters or selecting &apos;Smart Proximity&apos; to view all available innovators.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPeople.map((person) => {
            const currentStatus = connectionStates[person.id] || person.connection_status || "none";
            const isConnecting = connectingId === person.id;

            const isSameCity =
              currentUser?.city &&
              person.city &&
              currentUser.city.toLowerCase().trim() === person.city.toLowerCase().trim();

            const isSameCollege =
              currentUser?.college &&
              person.college &&
              currentUser.college.toLowerCase().trim() === person.college.toLowerCase().trim();

            return (
              <div
                key={person.id}
                className="p-5 rounded-3xl border border-white/10 bg-[#0a0c13] hover:border-white/20 transition-all flex flex-col justify-between space-y-4 group shadow-lg"
              >
                <div className="space-y-3">
                  {/* Top Row: Avatar + Proximity Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/people/${person.username}`} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-indigo-300 overflow-hidden shrink-0">
                        {person.avatar_url ? (
                          <img
                            src={person.avatar_url}
                            alt={person.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (person.full_name || "I").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors truncate">
                          {person.full_name}
                        </h4>
                        <p className="text-xs font-mono text-neutral-400 truncate">
                          @{person.username}
                        </p>
                      </div>
                    </Link>

                    {/* Proximity Pill */}
                    {isSameCity ? (
                      <span className="px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px] font-mono shrink-0">
                        Same City
                      </span>
                    ) : isSameCollege ? (
                      <span className="px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] font-mono shrink-0">
                        Same College
                      </span>
                    ) : null}
                  </div>

                  {/* Bio / Description */}
                  <div className="min-h-[2.5rem] flex items-center">
                    {person.bio ? (
                      <p className="text-xs text-neutral-300 font-light line-clamp-2 leading-relaxed">
                        {person.bio}
                      </p>
                    ) : person.headline ? (
                      <p className="text-xs text-neutral-300 font-light line-clamp-2 leading-relaxed">
                        {person.headline}
                      </p>
                    ) : (
                      <p className="text-[11px] font-mono text-neutral-500 italic">
                        Bio not added yet
                      </p>
                    )}
                  </div>

                  {/* Badges: Availability, College & Location */}
                  <div className="space-y-1.5 text-[11px] font-mono text-neutral-400">
                    {person.availability && (
                      <div className="flex items-center gap-1.5 truncate text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px]">
                        <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{person.availability}</span>
                        {person.availability_hours && (
                          <span className="text-emerald-500/80 truncate">· {person.availability_hours}</span>
                        )}
                      </div>
                    )}
                    {person.college && (
                      <div className="flex items-center gap-1.5 truncate text-neutral-300">
                        <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{person.college}</span>
                      </div>
                    )}
                    {(person.city || person.state || person.location) && (
                      <div className="flex items-center gap-1.5 truncate text-neutral-400">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">
                          {[person.city, person.state].filter(Boolean).join(", ") || person.location}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills Chips */}
                  {person.skills && person.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {person.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-white/5 bg-white/[0.03] text-neutral-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {person.skills.length > 4 && (
                        <span className="text-[10px] font-mono text-neutral-500 self-center">
                          +{person.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Interests Chips */}
                  {person.interests && person.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {person.interests.slice(0, 3).map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full text-[9px] font-mono border border-purple-500/20 bg-purple-500/5 text-purple-300"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <Link
                    href={`/people/${person.username}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
                  >
                    <span>View Profile</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>

                  {currentStatus === "connected" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] font-mono">
                      <UserCheck className="h-3 w-3" />
                      <span>Connected</span>
                    </span>
                  ) : currentStatus === "pending_sent" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-mono">
                      <Clock className="h-3 w-3" />
                      <span>Pending</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(person.id)}
                      disabled={isConnecting}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>{isConnecting ? "..." : "Connect"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server Pagination Bar */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-white/10 bg-[#0a0c13] mt-6">
          <button
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page <= 1 || isLoading}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono border border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-neutral-400">
            Page {page} of {Math.max(1, Math.ceil(totalCount / pageSize))}
          </span>

          <button
            onClick={() => {
              setPage((p) => p + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={page * pageSize >= totalCount || isLoading}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono border border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
