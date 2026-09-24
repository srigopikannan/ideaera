"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCompanyAction } from "@/app/(dashboard)/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Globe, MapPin, Users, ArrowLeft, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";

const INDUSTRIES = [
  "Artificial Intelligence",
  "Developer Tools",
  "Cloud & DevOps",
  "Biotechnology",
  "Robotics & Hardware",
  "ClimateTech & CleanEnergy",
  "Web3 & Blockchain",
  "FinTech",
  "HealthTech",
  "Cybersecurity",
  "EdTech",
  "Consumer Tech",
];

const SIZES = [
  "1-10 People (Early Stage)",
  "11-50 People (Growth)",
  "51-200 People (Scaleup)",
  "201-1000 People (Midsize)",
  "1000+ People (Enterprise)",
];

export default function CreateCompanyPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [industry, setIndustry] = React.useState(INDUSTRIES[0]);
  const [location, setLocation] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [size, setSize] = React.useState(SIZES[0]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !description.trim() || !location.trim()) {
      setError("Please fill in company name, description, and location.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await createCompanyAction({
        name,
        description,
        industry,
        location,
        website_url: websiteUrl.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        size,
      });

      if (!res.success || !res.company) {
        setError(res.error || "Failed to register company.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/companies/${res.company.slug}`);
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to register company. Please make sure you are signed in.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/companies"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Companies Directory
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
          <Building2 className="h-4 w-4" />
          <span>Innovation Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Register a Real Company or Startup.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showcase your startup, lab, or tech company to discover collaborators and connect with innovators.
        </p>
      </div>

      <div className="p-3.5 rounded-lg bg-surface border border-border flex items-start gap-3 text-xs text-muted-foreground">
        <ShieldAlert className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Legal & Directory Notice: </span>
          Listing public company info, technologies, and official websites is protected under Nominative Fair Use and standard public business directory standards.
        </div>
      </div>

      <Card className="border-border shadow-elevated bg-surface">
        <CardHeader>
          <CardTitle className="text-lg">Company Information</CardTitle>
          <CardDescription>
            Enter accurate company details. This profile will be publicly searchable in the IdeaEra ecosystem.
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
              <span>Company registered successfully! Redirecting to company page...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Company Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Supabase, Stripe, or Your Startup Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<Building2 className="h-4 w-4" />}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Description & Mission *
              </label>
              <Textarea
                placeholder="What does your company build? Highlight core innovations, problems solved, and vision..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Industry / Domain *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Team Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  {SIZES.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Headquarters / Location *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Official Website
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  leftIcon={<Globe className="h-4 w-4" />}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Logo / Brand Image URL (Optional)
              </label>
              <Input
                type="url"
                placeholder="https://images.unsplash.com/... or your CDN logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
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
                Register Company
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
