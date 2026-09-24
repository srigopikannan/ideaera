"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CompanyProblem, MatchRecommendation, ProblemStatus } from "@/types";
import {
  toggleSaveProblemAction,
  reportProblemAction,
  updateProblemStatusAction,
  getProblemTeammatesAction,
} from "@/app/(dashboard)/actions/problems";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Users,
  Lightbulb,
  Bookmark,
  Share2,
  Flag,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  Check,
  UserPlus,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemDetailViewProps {
  problem: CompanyProblem;
  currentUserId?: string;
}

export function ProblemDetailView({ problem: initialProblem, currentUserId }: ProblemDetailViewProps) {
  const router = useRouter();
  const [problem, setProblem] = React.useState<CompanyProblem>(initialProblem);
  const [isSaved, setIsSaved] = React.useState<boolean>(Boolean(initialProblem.is_saved));
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [copiedShare, setCopiedShare] = React.useState<boolean>(false);

  // Teammates state
  const [teammates, setTeammates] = React.useState<MatchRecommendation[]>([]);
  const [isLoadingTeammates, setIsLoadingTeammates] = React.useState<boolean>(false);
  const [connectingMap, setConnectingMap] = React.useState<Record<string, boolean>>({});
  const [connectedMap, setConnectedMap] = React.useState<Record<string, boolean>>({});

  // Report modal state
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("incorrect_information");
  const [reportDetails, setReportDetails] = React.useState("");
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false);
  const [reportSuccess, setReportSuccess] = React.useState(false);

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const isOfficial = problem.source_type === "official_company";
  const company = problem.company;
  const isCreatorOrOwner =
    Boolean(currentUserId) &&
    (problem.created_by === currentUserId || (company as any)?.owner_id === currentUserId);

  // Load teammates on mount
  React.useEffect(() => {
    let isMounted = true;
    setIsLoadingTeammates(true);
    getProblemTeammatesAction(problem.id)
      .then((res) => {
        if (isMounted) setTeammates(res || []);
      })
      .catch((err) => console.error("Error loading teammates:", err))
      .finally(() => {
        if (isMounted) setIsLoadingTeammates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [problem.id]);

  const handleToggleSave = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    setIsSaving(true);
    try {
      const res = await toggleSaveProblemAction(problem.id);
      if (res.success && res.isSaved !== undefined) {
        setIsSaved(res.isSaved);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch {}
  };

  const handleConnect = async (targetUserId: string) => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    setConnectingMap((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await requestConnectionAction(targetUserId);
      setConnectedMap((prev) => ({ ...prev, [targetUserId]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingMap((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleStatusChange = async (newStatus: ProblemStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateProblemStatusAction(problem.id, newStatus);
      if (res.success) {
        setProblem((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const res = await reportProblemAction({
        problem_id: problem.id,
        reason: reportReason,
        details: reportDetails,
      });
      if (res.success) {
        setReportSuccess(true);
        setTimeout(() => {
          setIsReportOpen(false);
          setReportSuccess(false);
          setReportDetails("");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 select-none">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Problems</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleSave}
            disabled={isSaving}
            className={cn(
              "h-8 text-xs gap-1.5 font-medium transition-colors",
              isSaved && "text-primary border-primary/40 bg-primary/10"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-primary")} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="h-8 text-xs gap-1.5 font-medium"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copiedShare ? "Link Copied!" : "Share"}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsReportOpen(true)}
            className="h-8 text-xs gap-1.5 font-medium text-muted-foreground hover:text-rose-400"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Report</span>
          </Button>
        </div>
      </div>

      {/* Main Problem Hero Card */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-card space-y-8">
        {/* Header Block */}
        <div className="space-y-4 border-b border-border pb-8">
          {/* Source Type Banner */}
          <div>
            {isOfficial ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold shadow-subtle">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>✓ Official Company Challenge</span>
                <span className="text-[11px] text-cyan-300/80 font-normal hidden sm:inline">
                  • Verified by IdeaEra & Company
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border text-xs font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Community Challenge</span>
                </div>
                <p className="text-xs text-muted-foreground/80 italic pl-1">
                  Community Challenge — Not officially affiliated with this company. Identified by IdeaEra innovators from publicly available engineering documentation.
                </p>
              </div>
            )}
          </div>

          {/* Title & Metadata Badges */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {problem.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {/* Difficulty */}
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full font-mono font-medium border text-[11px]",
                  problem.difficulty === "Beginner" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  problem.difficulty === "Intermediate" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  problem.difficulty === "Advanced" && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                )}
              >
                {problem.difficulty}
              </span>

              {/* Status */}
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold border text-[11px]",
                  problem.status === "open" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  problem.status === "in_progress" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  problem.status === "solved" && "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                  problem.status === "closed" && "bg-muted text-muted-foreground border-border"
                )}
              >
                {problem.status === "open" ? "Open Challenge" : problem.status.replace("_", " ")}
              </span>

              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{problem.industry}</span>

              {/* Admin / Creator Status Control */}
              {isCreatorOrOwner && (
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-mono">Manage:</span>
                  <select
                    value={problem.status}
                    disabled={isUpdatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as ProblemStatus)}
                    className="text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="solved">Mark as Solved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Company Card Strip */}
          {company && (
            <div className="p-4 rounded-2xl border border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0">
                    {company.name[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/companies/${company.slug || company.id}`}
                      className="text-sm font-bold text-foreground hover:text-primary transition-colors"
                    >
                      {company.name}
                    </Link>
                    {company.is_verified && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {company.location}
                    </span>
                    <span>•</span>
                    <span>{company.industry}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/companies/${company.slug || company.id}`}>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    View Company Profile
                  </Button>
                </Link>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border"
                    title="Visit Official Website"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Callouts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/ideas/create?problem_id=${problem.id}&company_id=${problem.company_id}`}
            className="p-5 rounded-2xl border border-primary/40 bg-primary/10 hover:bg-primary/15 transition-all group flex items-start gap-4 shadow-subtle"
          >
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                <span>Create Solution Idea</span>
                <span className="text-xs">→</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Architect an innovative approach to solve this friction point. Protected under IdeaEra version history.
              </p>
            </div>
          </Link>

          <a
            href="#teammates"
            className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all group flex items-start gap-4"
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                <span>Find Teammates</span>
                <span className="text-xs">↓</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Connect with {teammates.length} innovators proficient in the skills required for this problem.
              </p>
            </div>
          </a>
        </div>

        {/* Problem Statement & Description */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>Problem Statement & Technical Scope</span>
          </h2>
          <div className="prose prose-invert max-w-none text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line space-y-4">
            {problem.description}
          </div>
        </div>

        {/* Required Capabilities / Skills Needed */}
        {problem.required_skills && problem.required_skills.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Required Capabilities & Technologies</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {problem.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-xs font-mono font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source Attribution & Freshness Guarantee */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-muted/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Source Attribution & Freshness</span>
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Last reviewed: {problem.last_reviewed_at ? new Date(problem.last_reviewed_at).toLocaleDateString() : "Active"}
            </span>
          </div>

          <p className="text-muted-foreground">
            {problem.source_title || "Public technical documentation & engineering blog"}:
            {problem.source_url && (
              <a
                href={problem.source_url}
                target="_blank"
                rel="noreferrer"
                className="ml-1.5 text-primary hover:underline font-mono inline-flex items-center gap-1"
              >
                <span>{problem.source_url}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </p>

          <p className="text-[11px] text-muted-foreground/80 italic pt-1">
            &ldquo;Source information may change as companies update architectures. IdeaEra records platform activity, ownership timestamps, and version histories for all linked ideas.&rdquo;
          </p>
        </div>
      </div>

      {/* Solutions & Ideas Ecosystem Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span>Solutions & Ideas ({problem.solutions_count || 0})</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Architectural concepts and working prototypes proposed by IdeaEra innovators for this challenge.
            </p>
          </div>

          <Link href={`/ideas/create?problem_id=${problem.id}&company_id=${problem.company_id}`}>
            <Button size="sm" className="font-semibold text-xs gap-1.5 shadow-subtle">
              <Lightbulb className="h-3.5 w-3.5" /> Propose Solution
            </Button>
          </Link>
        </div>

        {problem.solutions && problem.solutions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problem.solutions.map((sol) => (
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
          <div className="p-8 rounded-2xl border border-dashed border-border bg-surface/50 text-center space-y-3">
            <Lightbulb className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">No public solutions published yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Be the first engineer to craft a solution for this challenge. Your idea will be timestamped and protected under IdeaEra version history.
            </p>
            <Link href={`/ideas/create?problem_id=${problem.id}&company_id=${problem.company_id}`}>
              <Button size="sm" variant="default" className="text-xs font-semibold gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Submit First Solution
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Recommended Teammates Section */}
      <div id="teammates" className="space-y-4 pt-6 border-t border-border">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span>Recommended Teammates ({teammates.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Innovators with proven proficiency in {problem.required_skills.slice(0, 3).join(", ")}. Form a team to solve this challenge.
          </p>
        </div>

        {isLoadingTeammates ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : teammates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teammates.slice(0, 6).map((rec) => {
              const isConnecting = connectingMap[rec.profile.id];
              const isConnected = connectedMap[rec.profile.id] || rec.profile.connection_status === "connected";

              return (
                <div
                  key={rec.profile.id}
                  className="p-5 rounded-2xl border border-border bg-surface shadow-card hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={rec.profile.avatar_url}
                          alt={rec.profile.full_name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/people/${rec.profile.username}`}
                            className="text-sm font-bold text-foreground hover:text-primary transition-colors block truncate"
                          >
                            {rec.profile.full_name}
                          </Link>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            @{rec.profile.username}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                        {rec.matchScore}% Match
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {rec.matchReason}
                    </p>

                    {/* Shared Skills */}
                    {rec.sharedSkills && rec.sharedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {rec.sharedSkills.slice(0, 3).map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <Link href={`/messages/${rec.profile.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>Message</span>
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      variant={isConnected ? "secondary" : "default"}
                      disabled={isConnecting || isConnected}
                      onClick={() => handleConnect(rec.profile.id)}
                      className="text-xs h-8 px-3 gap-1 shrink-0"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isConnected ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          <span>Connect</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
            No matching collaborators found currently. Check back soon as more innovators join IdeaEra!
          </div>
        )}
      </div>

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-sm font-bold text-foreground">Report Problem</h3>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-2 text-emerald-400">
                <CheckCircle2 className="h-8 w-8 mx-auto" />
                <p className="text-sm font-semibold">Report Submitted</p>
                <p className="text-xs text-muted-foreground">
                  Our moderation team will review this challenge against community guidelines.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-xs rounded-xl border border-border bg-muted p-2.5 text-foreground focus:outline-none"
                  >
                    <option value="incorrect_information">Incorrect technical information</option>
                    <option value="not_affiliated">Not associated with company</option>
                    <option value="copyright_concern">Copyright or proprietary content concern</option>
                    <option value="misleading">Misleading problem statement</option>
                    <option value="spam">Spam or low-quality submission</option>
                    <option value="outdated">Outdated problem / Already resolved</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Details (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide additional context or links to official sources..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full text-xs rounded-xl border border-border bg-muted p-2.5 text-foreground focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsReportOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingReport}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                  >
                    {isSubmittingReport ? "Submitting..." : "Submit Report"}
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
