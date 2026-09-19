"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Profile } from "@/types";
import { completeOnboardingAction } from "@/app/(dashboard)/actions/onboarding";
import {
  getStatesAction,
  getCitiesAction,
  getCollegesAction,
  addCustomCollegeAction,
} from "@/app/(dashboard)/actions/reference-data";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  User,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  MapPin,
  Calendar,
  Lock,
  Globe,
  Plus,
  X,
  Search,
  CheckCircle2,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  initialProfile: Profile;
  initialColleges: string[];
}

const POPULAR_SKILL_CATEGORIES = [
  {
    name: "AI & Machine Learning",
    skills: ["Python", "PyTorch", "LLMs", "LangChain", "Computer Vision", "NLP", "TensorFlow"],
  },
  {
    name: "Frontend & Web",
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Vue.js", "GraphQL"],
  },
  {
    name: "Backend & Systems",
    skills: ["Node.js", "Go", "Rust", "PostgreSQL", "Docker", "Supabase", "AWS", "Redis"],
  },
  {
    name: "Mobile & Hardware",
    skills: ["React Native", "Flutter", "Swift", "Kotlin", "Embedded Systems", "IoT", "C++"],
  },
  {
    name: "Design & Product",
    skills: ["UI/UX Design", "Figma", "Product Strategy", "System Architecture"],
  },
];

const SUGGESTED_HEADLINES = [
  "Full-Stack Engineer & AI Builder",
  "AI / ML Researcher & Developer",
  "Distributed Systems & Backend Architect",
  "Frontend Engineer & UI Specialist",
  "Hardware & Embedded Systems Innovator",
  "Product Designer & Prototyper",
];

const SUGGESTED_INTERESTS = [
  "Autonomous Agents",
  "Clean Energy & ClimateTech",
  "Robotics & Automation",
  "Decentralized Systems",
  "HealthTech & Bio",
  "Developer Tooling",
  "Spatial Computing",
];

export function OnboardingWizard({ initialProfile, initialColleges }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const totalSteps = 6;

  // Step 1: Identity & Focus
  const [fullName, setFullName] = React.useState(initialProfile.full_name || "");
  const [headline, setHeadline] = React.useState(
    initialProfile.headline && !initialProfile.headline.toLowerCase().includes("innovator & creator")
      ? initialProfile.headline
      : ""
  );
  const [bio, setBio] = React.useState(initialProfile.bio || "");

  // Step 2 & 3: Skills
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(initialProfile.skills || []);
  const [customSkillInput, setCustomSkillInput] = React.useState("");

  // Step 4: Age & Privacy
  const [age, setAge] = React.useState(initialProfile.age ? String(initialProfile.age) : "");
  const [showAge, setShowAge] = React.useState(initialProfile.show_age ?? true);

  // Step 5: College
  const [collegesList, setCollegesList] = React.useState<string[]>(initialColleges);
  const [selectedCollege, setSelectedCollege] = React.useState(initialProfile.college || "");
  const [collegeSearch, setCollegeSearch] = React.useState("");
  const [showCustomCollegeForm, setShowCustomCollegeForm] = React.useState(false);
  const [customCollegeName, setCustomCollegeName] = React.useState("");
  const [customCollegeCity, setCustomCollegeCity] = React.useState("");
  const [customCollegeState, setCustomCollegeState] = React.useState("");
  const [isAddingCollege, setIsAddingCollege] = React.useState(false);

  // Step 6: Location, Privacy & Interests
  const [city, setCity] = React.useState(initialProfile.city || "");
  const [state, setState] = React.useState(initialProfile.state || "");
  const [country, setCountry] = React.useState(initialProfile.country || "India");
  const [showLocation, setShowLocation] = React.useState(initialProfile.show_location ?? true);
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>(initialProfile.interests || []);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Skill toggling
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Custom skill adding with normalization
  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;

    // Normalize: check case-insensitive match in selected
    const existing = selectedSkills.find((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setCustomSkillInput("");
      return;
    }

    // Capitalize first letter of each word if not all uppercase acronym
    const formatted =
      trimmed.length <= 4 && trimmed === trimmed.toUpperCase()
        ? trimmed
        : trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    setSelectedSkills((prev) => [...prev, formatted]);
    setCustomSkillInput("");
  };

  // Toggle interest
  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Custom college addition
  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCollegeName.trim()) return;
    setIsAddingCollege(true);

    try {
      const added = await addCustomCollegeAction(
        customCollegeName.trim(),
        customCollegeCity.trim() || city || undefined,
        customCollegeState.trim() || state || undefined
      );
      if (added) {
        setSelectedCollege(added.name);
        setShowCustomCollegeForm(false);
        setCustomCollegeName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingCollege(false);
    }
  };

  // Filter colleges
  const filteredColleges = React.useMemo(() => {
    if (!collegeSearch.trim()) return collegesList.slice(0, 10);
    const q = collegeSearch.toLowerCase();
    return collegesList.filter((c) => c.toLowerCase().includes(q)).slice(0, 12);
  }, [collegesList, collegeSearch]);

  // Final submission
  const handleComplete = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const numericAge = age.trim() ? parseInt(age.trim(), 10) : undefined;

    const payload = {
      full_name: fullName.trim() || initialProfile.full_name,
      headline: headline.trim() || undefined,
      bio: bio.trim() || undefined,
      skills: selectedSkills,
      age: numericAge,
      show_age: showAge,
      college: selectedCollege.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      country: country.trim() || "India",
      show_location: showLocation,
      interests: selectedInterests,
    };

    const res = await completeOnboardingAction(payload);
    if (res.success) {
      router.push("/profile");
      router.refresh();
    } else {
      setErrorMsg(res.error || "Failed to save profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 max-w-2xl mx-auto select-none">
      {/* Top Brand Header */}
      <div className="w-full text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-xs font-mono uppercase tracking-[0.2em]">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Innovator Profile Setup</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
          Welcome to IdeaEra
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 font-light">
          Set up your actual profile so peers can find and build with you.
        </p>
      </div>

      {/* Main Wizard Card */}
      <div className="w-full rounded-3xl border border-white/10 bg-[#0a0c13] shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Step Progress Bar */}
        <div className="w-full h-1 bg-white/5 relative">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Card Header with Step Title */}
        <div className="p-6 sm:p-8 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block mb-1">
              STEP 0{currentStep} OF 0{totalSteps}
            </span>
            <h2 className="text-lg sm:text-xl font-medium text-white">
              {currentStep === 1 && "Identity & Role Focus"}
              {currentStep === 2 && "Select Core Skills"}
              {currentStep === 3 && "Custom Skills & Expertise"}
              {currentStep === 4 && "Age & Profile Privacy"}
              {currentStep === 5 && "College / University"}
              {currentStep === 6 && "Location & Focus Domains"}
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {progressPercentage}% Completed
          </span>
        </div>

        {/* Step Content */}
        <div className="p-6 sm:p-8 min-h-[340px]">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: IDENTITY & FOCUS */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your legal or preferred name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
                  Professional Headline / Focus
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Full-Stack Engineer & AI Builder"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
                />
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="text-[10px] font-mono text-neutral-500 self-center mr-1">Suggestions:</span>
                  {SUGGESTED_HEADLINES.slice(0, 3).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeadline(item)}
                      className="px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.02] text-[11px] text-neutral-400 hover:text-white hover:border-white/20 transition-all text-left"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
                  Biography (About You)
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share what you enjoy engineering, projects you're proud of, and who you want to team up with..."
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SELECT CORE SKILLS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <span>Pick your core competencies ({selectedSkills.length} chosen)</span>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {POPULAR_SKILL_CATEGORIES.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                      {cat.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {cat.skills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-mono transition-all border flex items-center gap-1.5",
                              isSelected
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_12px_rgba(129,140,248,0.25)]"
                                : "bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-indigo-400" />}
                            <span>{skill}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CUSTOM SKILLS & SEARCH */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
                  Add Custom Skills or Specialized Frameworks
                </label>
                <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      placeholder="e.g. Solidity, Prisma, WebSockets, CUDA..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!customSkillInput.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Current Active Skills */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider block">
                  Your Active Skills ({selectedSkills.length})
                </span>
                {selectedSkills.length === 0 ? (
                  <p className="text-xs font-mono text-neutral-600 italic">
                    No skills selected yet. Add custom skills above or go back to select core skills.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: AGE & PRIVACY */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
                  Your Age (Years)
                </label>
                <div className="relative max-w-xs">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="number"
                    min="13"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 21"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5 font-light">
                  Optional. Used for college and hackathon student team matching.
                </p>
              </div>

              {/* Privacy Setting Card */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-purple-400" />
                    <div>
                      <h4 className="text-xs font-medium text-white">Display Age Publicly</h4>
                      <p className="text-[11px] text-neutral-400 font-light">
                        Allow peers to see your age on your profile and search cards.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAge}
                      onChange={(e) => setShowAge(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                  </label>
                </div>
                <p className="text-[10px] font-mono text-neutral-500">
                  {showAge
                    ? "✓ Age is public on your profile."
                    : "🔒 Age is strictly hidden from other users."}
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: COLLEGE / UNIVERSITY */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              {!showCustomCollegeForm ? (
                <div className="space-y-4">
                  <SearchableSelect
                    label="Search Your College or University"
                    placeholder="Type college name or acronym (e.g. PSG, CIT, Anna, IIT)..."
                    value={selectedCollege}
                    leftIcon={<GraduationCap className="h-4 w-4 text-indigo-400" />}
                    onSearch={(q) => getCollegesAction(q, state, city)}
                    onSelect={(item) => setSelectedCollege(item.name)}
                    onClear={() => setSelectedCollege("")}
                    emptyMessage="No colleges found matching your search."
                    customActionSlot={
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400 font-mono">
                          Can&apos;t find your college?
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCustomCollegeForm(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs font-mono text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add College</span>
                        </button>
                      </div>
                    }
                  />

                  {selectedCollege && (
                    <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between text-xs font-mono text-indigo-300">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                        <span className="font-medium">Selected: {selectedCollege}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCollege("")}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCreateCollege} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                      Add New College / University
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomCollegeForm(false)}
                      className="text-xs font-mono text-neutral-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <input
                    type="text"
                    value={customCollegeName}
                    onChange={(e) => setCustomCollegeName(e.target.value)}
                    placeholder="College / University Full Name *"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={customCollegeCity || city}
                      onChange={(e) => setCustomCollegeCity(e.target.value)}
                      placeholder="City (e.g. Coimbatore)"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
                    />
                    <input
                      type="text"
                      value={customCollegeState || state}
                      onChange={(e) => setCustomCollegeState(e.target.value)}
                      placeholder="State (e.g. Tamil Nadu)"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingCollege || !customCollegeName.trim()}
                    className="w-full py-2.5 rounded-xl bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {isAddingCollege ? "Adding College..." : "Save and Select College"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 6: LOCATION, PRIVACY & INTERESTS */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fade-in">
              {/* Location notice */}
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                  IdeaEra only records City, State, and Country for team discovery. We never request or store your exact street address.
                </p>
              </div>

              {/* State & Dependent City Autocomplete Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State Searchable Select */}
                <div>
                  <SearchableSelect
                    label="Search your state"
                    placeholder="Search state (e.g. Tamil Nadu)..."
                    value={state}
                    leftIcon={<Building className="h-4 w-4 text-cyan-400" />}
                    onSearch={(q) => getStatesAction(q)}
                    onSelect={(item) => {
                      setState(item.name);
                      // Reset city when state changes
                      setCity("");
                    }}
                    onClear={() => {
                      setState("");
                      setCity("");
                    }}
                    emptyMessage="No matching state found."
                  />
                </div>

                {/* City Searchable Select — State Dependent */}
                <div>
                  <SearchableSelect
                    label="Search your city"
                    placeholder="Search city (e.g. Coimbatore)..."
                    value={city}
                    disabled={!state.trim()}
                    disabledMessage="Select a state first"
                    leftIcon={<MapPin className="h-4 w-4 text-cyan-400" />}
                    onSearch={(q) => getCitiesAction(state, q)}
                    onSelect={(item) => setCity(item.name)}
                    onClear={() => setCity("")}
                    emptyMessage={`No cities found in ${state || "selected state"}.`}
                  />
                </div>
              </div>

              {/* Location Privacy */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs text-neutral-300">Show location publicly on profile</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600" />
                </label>
              </div>

              {/* Focus Domains */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                  Select Innovation Domains of Interest
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_INTERESTS.map((int) => {
                    const isSelected = selectedInterests.includes(int);
                    return (
                      <button
                        key={int}
                        type="button"
                        onClick={() => toggleInterest(int)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-mono transition-all border",
                          isSelected
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.25)]"
                            : "bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 inline mr-1 text-purple-400" />}
                        <span>{int}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-6 sm:p-8 border-t border-white/[0.06] flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono text-neutral-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, totalSteps))}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-lg"
              >
                <span>Continue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? "Finishing..." : "Complete Setup & Enter"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
