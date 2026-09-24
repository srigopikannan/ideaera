"use client";

import * as React from "react";
import Link from "next/link";
import { Company } from "@/types";
import { ProblemCard } from "@/components/problems/ProblemCard";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { requestCompanyVerificationAction } from "@/app/(dashboard)/actions/companies";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  ShieldCheck,
  Code2,
  Users,
  Target,
  Lightbulb,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyProfileViewProps {
  company: Company;
  currentUserId?: string;
}

export function CompanyProfileView({ company, currentUserId }: CompanyProfileViewProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "problems" | "solutions">("overview");

  // Verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = React.useState(false);
  const [workEmail, setWorkEmail] = React.useState("");
  const [roleTitle, setRoleTitle] = React.useState("");
  const [isSubmittingVerify, setIsSubmittingVerify] = React.useState(false);
  const [verifySuccess, setVerifySuccess] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);

  const problems = company.problems || [];
  const solutions = company.solutions || [];
  const isVerified = company.is_verified || company.verification_status === "verified";
  const isPending = company.verification_status === "pending_verification";

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setIsSubmittingVerify(true);

    try {
      const res = await requestCompanyVerificationAction({
        company_id: company.id,
        work_email: workEmail.trim(),
        role_title: roleTitle.trim(),
      });

      if (!res.success) {
        setVerifyError(res.error || "Failed to submit verification request.");
        setIsSubmittingVerify(false);
        return;
      }

      setVerifySuccess(true);
      setTimeout(() => {
        setIsVerifyModalOpen(false);
        setVerifySuccess(false);
      }, 2000);
    } catch (err: any) {
      setVerifyError(err?.message || "Failed to submit verification request.");
      setIsSubmittingVerify(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 select-none">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Companies</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isVerified && !isPending && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsVerifyModalOpen(true)}
              className="text-xs h-8 gap-1.5 font-medium border-border"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Claim Company Profile</span>
            </Button>
          )}

          <Link href={`/problems/submit?company_id=${company.id}`}>
            <Button size="sm" variant="default" className="text-xs h-8 gap-1.5 font-semibold shadow-subtle">
              <Plus className="h-3.5 w-3.5" />
              <span>Submit Challenge</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-border pb-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-muted border border-border shrink-0 shadow-subtle">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl font-extrabold text-muted-foreground">
                  {company.name[0]}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {company.name}
                </h1>

                {isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>✓ Verified Company</span>
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Pending Verification</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-xs font-medium">
                    <span>Unverified</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {company.location}
                </span>
                <span>•</span>
                <span className="font-medium text-foreground">{company.industry}</span>
                {company.size && (
                  <>
                    <span>•</span>
                    <span>Team: {company.size}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="self-start sm:self-auto shrink-0"
            >
              <Button variant="default" className="shadow-subtle font-semibold gap-1.5">
                <span>Official Website</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>

        {/* Quick Ecosystem Metrics / CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab("problems")}
            className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Challenges
              </span>
              <Target className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{problems.length}</p>
            <span className="text-[11px] text-muted-foreground">Real-world problems</span>
          </button>

          <button
            onClick={() => setActiveTab("solutions")}
            className="p-4 rounded-2xl border border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                Solutions
              </span>
              <Lightbulb className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{solutions.length}</p>
            <span className="text-[11px] text-muted-foreground">Innovator solution ideas</span>
          </button>

          <Link
            href={`/ideas/create?company_id=${company.id}`}
            className="p-4 rounded-2xl border border-primary/30 bg-primary/10 hover:bg-primary/15 transition-all text-left group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
                Collaborate
              </span>
              <Plus className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform" />
            </div>
            <p className="text-sm font-bold text-foreground">Propose Architecture</p>
            <span className="text-[11px] text-muted-foreground">Create solution idea →</span>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-6 pt-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>Overview & Tech</span>
          </button>

          <button
            onClick={() => setActiveTab("problems")}
            className={cn(
              "pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "problems"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Target className="h-4 w-4" />
            <span>Real-World Problems ({problems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("solutions")}
            className={cn(
              "pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === "solutions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Solutions & Ideas ({solutions.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-8 pt-2">
            {/* Mission & Overview */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground">Mission & Overview</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {company.description}
              </p>
            </div>

            {/* Core Technologies Used */}
            {company.tech_stack && company.tech_stack.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span>Core Technologies & Stack</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.tech_stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1.5 rounded-xl border border-border bg-muted/60 text-xs font-semibold text-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Problems Preview */}
            {problems.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span>Active Engineering Challenges</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("problems")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View All ({problems.length}) →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {problems.slice(0, 2).map((p) => (
                    <ProblemCard key={p.id} problem={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Problems */}
        {activeTab === "problems" && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Problems & Engineering Challenges
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real friction points and architectural challenges related to {company.name}.
                </p>
              </div>

              <Link href={`/problems/submit?company_id=${company.id}`}>
                <Button size="sm" className="font-semibold text-xs gap-1.5 shadow-subtle">
                  <Plus className="h-3.5 w-3.5" /> Submit Challenge
                </Button>
              </Link>
            </div>

            {problems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {problems.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl space-y-3">
                <Target className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="text-base font-bold text-foreground">No open challenges registered yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Be the first engineer to identify a real-world problem or architectural challenge for {company.name}.
                </p>
                <Link href={`/problems/submit?company_id=${company.id}`}>
                  <Button size="sm" variant="default" className="text-xs font-semibold gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Submit First Challenge
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Solutions */}
        {activeTab === "solutions" && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Solutions & Ideas Related to {company.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Architectural concepts and working prototypes proposed by IdeaEra innovators. Respects privacy settings.
                </p>
              </div>

              <Link href={`/ideas/create?company_id=${company.id}`}>
                <Button size="sm" className="font-semibold text-xs gap-1.5 shadow-subtle">
                  <Lightbulb className="h-3.5 w-3.5" /> Propose Solution
                </Button>
              </Link>
            </div>

            {solutions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solutions.map((sol) => (
                  <div
                    key={sol.id}
                    className="p-5 rounded-2xl border border-border bg-surface shadow-card hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          {sol.display_id || `IDEA-${sol.id.substring(0, 8).toUpperCase()}`}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                          {sol.status}
                        </span>
                      </div>

                      <Link
                        href={`/ideas/${sol.id}`}
                        className="text-base font-bold text-foreground hover:text-primary transition-colors block line-clamp-2"
                      >
                        {sol.title}
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {sol.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={sol.author?.avatar_url}
                          alt={sol.author?.full_name || "Innovator"}
                          size="sm"
                          className="h-6 w-6"
                        />
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                          {sol.author?.full_name || "Innovator"}
                        </span>
                      </div>

                      <Link
                        href={`/ideas/${sol.id}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View Idea →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl space-y-3">
                <Lightbulb className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <h3 className="text-base font-bold text-foreground">No public solutions published yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Architect a solution addressing challenges in {company.name}&apos;s ecosystem. All submissions are timestamped and protected.
                </p>
                <Link href={`/ideas/create?company_id=${company.id}`}>
                  <Button size="sm" variant="default" className="text-xs font-semibold gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" /> Submit Solution Idea
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Claim Modal */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="text-sm font-bold text-foreground">Request Company Verification</h3>
              </div>
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {verifySuccess ? (
              <div className="py-8 text-center space-y-2 text-emerald-400">
                <CheckCircle2 className="h-10 w-10 mx-auto" />
                <p className="text-sm font-semibold">Verification Request Sent</p>
                <p className="text-xs text-muted-foreground">
                  Our team will verify your corporate domain email. Once approved, you can publish official challenges.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestVerification} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you an authorized representative of <strong>{company.name}</strong>? Verify with your corporate email to publish official challenges and manage ecosystem solutions.
                </p>

                {verifyError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {verifyError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-border bg-muted p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Your Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Architect, Developer Relations, CTO"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-border bg-muted p-2.5 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsVerifyModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingVerify}
                    className="font-semibold shadow-subtle"
                  >
                    {isSubmittingVerify ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Request</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
