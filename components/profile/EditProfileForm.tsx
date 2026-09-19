"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Profile } from "@/types";
import { updateProfileAction } from "@/app/(dashboard)/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, CheckCircle2, User, Globe, MapPin, GraduationCap, Calendar, Lock } from "lucide-react";
import { Github, Linkedin } from "@/components/ui/brand-icons";

interface EditProfileFormProps {
  initialProfile: Profile;
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(initialProfile.full_name || "");
  const [headline, setHeadline] = React.useState(initialProfile.headline || "");
  const [bio, setBio] = React.useState(initialProfile.bio || "");
  const [college, setCollege] = React.useState(initialProfile.college || "");
  const [age, setAge] = React.useState(initialProfile.age ? String(initialProfile.age) : "");
  const [showAge, setShowAge] = React.useState(initialProfile.show_age ?? true);
  const [city, setCity] = React.useState(initialProfile.city || "");
  const [state, setState] = React.useState(initialProfile.state || "");
  const [country, setCountry] = React.useState(initialProfile.country || "India");
  const [showLocation, setShowLocation] = React.useState(initialProfile.show_location ?? true);
  const [location, setLocation] = React.useState(initialProfile.location || "");
  const [website, setWebsite] = React.useState(initialProfile.website || initialProfile.portfolio_url || "");
  const [githubUrl, setGithubUrl] = React.useState(initialProfile.github_url || "");
  const [linkedinUrl, setLinkedinUrl] = React.useState(initialProfile.linkedin_url || "");
  const [skills, setSkills] = React.useState(initialProfile.skills?.join(", ") || "");
  const [interests, setInterests] = React.useState(initialProfile.interests?.join(", ") || "");

  const [isLoading, setIsLoading] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    const fullLocation = [city, state, country].filter(Boolean).join(", ") || location;

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("headline", headline);
    formData.append("bio", bio);
    formData.append("college", college);
    if (age) formData.append("age", age);
    formData.append("show_age", showAge ? "true" : "false");
    formData.append("city", city);
    formData.append("state", state);
    formData.append("country", country);
    formData.append("show_location", showLocation ? "true" : "false");
    formData.append("location", fullLocation);
    formData.append("website", website);
    formData.append("github_url", githubUrl);
    formData.append("linkedin_url", linkedinUrl);
    formData.append("skills", skills);
    formData.append("interests", interests);

    try {
      const res = await updateProfileAction(formData);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => {
          router.push("/profile");
          router.refresh();
        }, 800);
      } else {
        setErrorMsg("Failed to save changes.");
      }
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setErrorMsg(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 px-4 sm:px-0">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>
      </div>

      <Card className="border-border shadow-card bg-surface">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-xl">Edit Public Profile</CardTitle>
          <CardDescription>
            Update your innovator name, headline, location, and professional links.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {savedSuccess && (
            <div className="mb-6 p-3.5 rounded-xl bg-success/10 border border-success/20 flex items-center gap-2.5 text-success text-sm animate-fade-in">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Profile updated successfully! Redirecting to your live profile...</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Full Name
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Srigopi kannan"
                leftIcon={<User className="h-4 w-4" />}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Professional Headline
              </label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Full-Stack Engineer & AI Systems Architect | Building IdeaEra"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                A concise summary of your focus, role, or current projects.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Biography
              </label>
              <Textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell innovators about your background, projects you love building, and what you're looking for in collaborators..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  College / University
                </label>
                <Input
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. PSG College of Technology, Coimbatore"
                  leftIcon={<GraduationCap className="h-4 w-4" />}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Age
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAge}
                      onChange={(e) => setShowAge(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span>Show publicly</span>
                  </label>
                </div>
                <Input
                  type="number"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 21"
                  leftIcon={<Calendar className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-surface/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Location (City, State, Country)
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Show publicly</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g. Coimbatore)"
                />
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State (e.g. Tamil Nadu)"
                />
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country (e.g. India)"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Skills (Comma-separated)
              </label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Next.js, React, TypeScript, Python, AI / LLMs, PostgreSQL"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                These skills power your collaborator matching and search recommendations.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Interests & Focus Domains (Comma-separated)
              </label>
              <Input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Autonomous Agents, Clean Energy, Web3, Distributed Systems"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Website / Portfolio URL
                </label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourportfolio.dev"
                  leftIcon={<Globe className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  GitHub Profile URL
                </label>
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/yourhandle"
                  leftIcon={<Github className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  LinkedIn Profile URL
                </label>
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourhandle"
                  leftIcon={<Linkedin className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Link href="/profile">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="default" isLoading={isLoading}>
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
