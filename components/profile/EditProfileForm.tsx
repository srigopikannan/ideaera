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
import { ArrowLeft, Save, CheckCircle2, User, Globe, MapPin } from "lucide-react";
import { Github, Linkedin } from "@/components/ui/brand-icons";

interface EditProfileFormProps {
  initialProfile: Profile;
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(initialProfile.full_name || "");
  const [headline, setHeadline] = React.useState(initialProfile.headline || "");
  const [bio, setBio] = React.useState(initialProfile.bio || "");
  const [location, setLocation] = React.useState(initialProfile.location || "");
  const [website, setWebsite] = React.useState(initialProfile.website || initialProfile.portfolio_url || "");
  const [githubUrl, setGithubUrl] = React.useState(initialProfile.github_url || "");
  const [linkedinUrl, setLinkedinUrl] = React.useState(initialProfile.linkedin_url || "");
  const [skills, setSkills] = React.useState(initialProfile.skills?.join(", ") || "");

  const [isLoading, setIsLoading] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("headline", headline);
    formData.append("bio", bio);
    formData.append("location", location);
    formData.append("website", website);
    formData.append("github_url", githubUrl);
    formData.append("linkedin_url", linkedinUrl);
    formData.append("skills", skills);

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
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Location
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Chennai, Tamil Nadu"
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>

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
