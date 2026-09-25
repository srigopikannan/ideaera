"use client";

import * as React from "react";
import Link from "next/link";
import { Profile } from "@/types";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
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
    let list = people.filter((p) => p.id !== currentUser?.id);

    if (discoveryMode === "nearby") {
      const userCity = currentUser?.city?.toLowerCase().trim();
      const userState = currentUser?.state?.toLowerCase().trim();
      const userCollege = currentUser?.college?.toLowerCase().trim();

      if (nearbyFilter === "city" && userCity) {
        list = list.filter((p) => p.city?.toLowerCase().trim() === userCity);
      } else if (nearbyFilter === "state" && userState) {
        list = list.filter((p) => p.state?.toLowerCase().trim() === userState);
      } else if (nearbyFilter === "college" && userCollege) {
        list = list.filter((p) => p.college?.toLowerCase().trim() === userCollege);
      } else {
        // Proximity sort
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
    } else {
      // Custom Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.full_name?.toLowerCase().includes(q) ||
            p.username?.toLowerCase().includes(q) ||
            p.headline?.toLowerCase().includes(q) ||
            p.bio?.toLowerCase().includes(q)
        );
      }

      if (selectedSkills.length > 0) {
        list = list.filter((p) =>
          selectedSkills.some((reqSkill) =>
            p.skills?.some((s) => s.toLowerCase().includes(reqSkill.toLowerCase()))
          )
        );
      }

      if (collegeFilter.trim()) {
        const c = collegeFilter.toLowerCase().trim();
        list = list.filter((p) => p.college?.toLowerCase().includes(c));
      }

      if (cityFilter.trim()) {
        const ct = cityFilter.toLowerCase().trim();
        list = list.filter((p) => p.city?.toLowerCase().includes(ct) || p.location?.toLowerCase().includes(ct));
      }

      if (stateFilter.trim()) {
        const st = stateFilter.toLowerCase().trim();
        list = list.filter((p) => p.state?.toLowerCase().includes(st) || p.location?.toLowerCase().includes(st));
      }

      if (availabilityFilter !== "All") {
        list = list.filter(
          (p) => p.availability?.toLowerCase() === availabilityFilter.toLowerCase()
        );
      }

      // Prioritize available innovators
      list = [...list].sort((a, b) => {
        const aAvail = a.availability && a.availability !== "Not currently available" ? 1 : 0;
        const bAvail = b.availability && b.availability !== "Not currently available" ? 1 : 0;
        return bAvail - aAvail;
      });
    }

    return list;
  }, [
    people,
    currentUser,
    discoveryMode,
    nearbyFilter,
    searchQuery,
    selectedSkills,
    collegeFilter,
    cityFilter,
    stateFilter,
    availabilityFilter,
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

        <div className="text-xs font-mono text-neutral-400 px-3">
          <span>Found {filteredPeople.length} potential teammates</span>
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
    </div>
  );
}
