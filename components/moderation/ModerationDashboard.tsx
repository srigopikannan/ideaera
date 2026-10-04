"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  ArrowRight,
  Clock,
  Layers,
  FileText,
  Loader2,
  X,
  MessageSquare,
  Lock,
} from "lucide-react";
import { cn, formatDate, formatFullDateTime } from "@/lib/utils";
import { IdeaReport, IdeaReportStatus, IdeaReportReason, IdeaReportResolution, Profile } from "@/types";
import { moderateIdeaReportAction, getIdeaReportsAction } from "@/app/(dashboard)/actions/ideas";

interface ModerationDashboardProps {
  initialReports: IdeaReport[];
  currentUser: Profile;
}

export function ModerationDashboard({
  initialReports,
  currentUser,
}: ModerationDashboardProps) {
  const [reports, setReports] = React.useState<IdeaReport[]>(initialReports);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [selectedReason, setSelectedReason] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Side-by-side Comparison Modal state
  const [comparisonReport, setComparisonReport] = React.useState<IdeaReport | null>(null);

  // Moderation Action Modal state
  const [actionTargetReport, setActionTargetReport] = React.useState<IdeaReport | null>(null);
  const [actionType, setActionType] = React.useState<"under_review" | "dismiss" | "restrict" | null>(null);
  const [resolutionNote, setResolutionNote] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Filtered reports
  const filteredReports = React.useMemo(() => {
    return reports.filter((r) => {
      if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
      if (selectedReason !== "all" && r.reason !== selectedReason) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = r.idea?.title?.toLowerCase() || "";
        const desc = r.description?.toLowerCase() || "";
        const reporterName = r.reporter?.full_name?.toLowerCase() || "";
        const creatorName = r.idea?.creator?.full_name?.toLowerCase() || "";
        if (!title.includes(q) && !desc.includes(q) && !reporterName.includes(q) && !creatorName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [reports, selectedStatus, selectedReason, searchQuery]);

  // Metrics
  const metrics = React.useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === "pending").length;
    const underReview = reports.filter((r) => r.status === "under_review").length;
    const resolved = reports.filter((r) => r.status === "resolved").length;
    const dismissed = reports.filter((r) => r.status === "dismissed").length;
    return { total, pending, underReview, resolved, dismissed };
  }, [reports]);

  // Handle Moderation Submission
  const handleExecuteAction = async () => {
    if (!actionTargetReport || !actionType) return;
    setIsProcessing(true);
    setActionError(null);

    let nextStatus: "under_review" | "resolved" | "dismissed" = "under_review";
    let nextResolution: IdeaReportResolution | undefined = undefined;

    if (actionType === "under_review") {
      nextStatus = "under_review";
    } else if (actionType === "dismiss") {
      nextStatus = "dismissed";
      nextResolution = "dismissed";
    } else if (actionType === "restrict") {
      nextStatus = "resolved";
      nextResolution = "content_restricted";
    }

    try {
      const res = await moderateIdeaReportAction({
        reportId: actionTargetReport.id,
        status: nextStatus,
        resolution: nextResolution,
        resolutionNote: resolutionNote.trim() || undefined,
      });

      if (!res.success) {
        setActionError(res.error || "Failed to update moderation state.");
        setIsProcessing(false);
        return;
      }

      // Update state locally
      setReports((prev) =>
        prev.map((r) => (r.id === actionTargetReport.id ? (res.report as IdeaReport) : r))
      );

      setActionTargetReport(null);
      setActionType(null);
      setResolutionNote("");
      setIsProcessing(false);
    } catch (err: any) {
      setActionError(err?.message || "An unexpected error occurred.");
      setIsProcessing(false);
    }
  };

  const reasonLabels: Record<IdeaReportReason, string> = {
    possible_copying: "Possible Copying",
    copyright_ip: "Copyright / IP",
    misleading_ownership: "Attribution Conflict",
    other: "Other Concern",
  };

  return (
    <div className="w-full min-h-screen px-4 sm:px-8 py-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400">
              Administrative Control // Trust & Safety
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Idea Moderation & Copying Reports
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl font-light leading-relaxed">
            Review reported concepts, inspect side-by-side architectural overlap, and enforce ecosystem integrity guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#0d1017] text-xs font-mono text-neutral-300">
            <span className="text-neutral-500">Moderator:</span> {currentUser.full_name || "Admin"}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0e14] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Total Reports</span>
          <p className="text-2xl font-semibold text-white">{metrics.total}</p>
        </div>
        <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90">Pending Review</span>
          <p className="text-2xl font-semibold text-amber-300">{metrics.pending}</p>
        </div>
        <div className="p-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400/90">Under Review</span>
          <p className="text-2xl font-semibold text-indigo-300">{metrics.underReview}</p>
        </div>
        <div className="p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90">Action Taken</span>
          <p className="text-2xl font-semibold text-emerald-300">{metrics.resolved}</p>
        </div>
        <div className="p-4 rounded-2xl border border-neutral-700/50 bg-neutral-900/30 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Dismissed</span>
          <p className="text-2xl font-semibold text-neutral-300">{metrics.dismissed}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-2xl border border-white/[0.08] bg-[#0c0e14]">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "under_review", label: "Under Review" },
            { id: "resolved", label: "Resolved" },
            { id: "dismissed", label: "Dismissed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all",
                selectedStatus === tab.id
                  ? "bg-white/10 text-white font-medium border border-white/15"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reason Filter & Search */}
        <div className="flex items-center gap-2 px-1">
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#12151f] text-xs font-mono text-neutral-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Reasons</option>
            <option value="possible_copying">Possible Copying</option>
            <option value="copyright_ip">Copyright / IP</option>
            <option value="misleading_ownership">Attribution Conflict</option>
            <option value="other">Other</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search reports or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-[#12151f] text-xs font-mono text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-white/[0.06] bg-[#0c0e14] space-y-2">
            <ShieldCheck className="h-8 w-8 text-neutral-500 mx-auto" />
            <h3 className="text-sm font-medium text-neutral-300">No moderation reports found</h3>
            <p className="text-xs text-neutral-500">
              {reports.length === 0
                ? "The IdeaEra ecosystem is currently in healthy standing."
                : "No reports match your selected filters."}
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isPending = report.status === "pending";
            const isUnderReview = report.status === "under_review";
            const isResolved = report.status === "resolved";
            const isDismissed = report.status === "dismissed";

            return (
              <div
                key={report.id}
                className="p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0c0e14] hover:border-white/15 transition-all space-y-4"
              >
                {/* Card Top Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border uppercase tracking-wider",
                        isPending && "bg-amber-500/15 text-amber-300 border-amber-500/30",
                        isUnderReview && "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
                        isResolved && "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
                        isDismissed && "bg-neutral-500/15 text-neutral-400 border-neutral-500/30"
                      )}
                    >
                      {report.status.replace("_", " ")}
                    </span>

                    {/* Reason Badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.05] text-neutral-300 border border-white/[0.08]">
                      {reasonLabels[report.reason] || report.reason}
                    </span>

                    <span className="text-neutral-500 text-xs">•</span>

                    <span className="text-[11px] font-mono text-neutral-400">
                      Submitted {formatDate(report.created_at)}
                    </span>
                  </div>

                  {/* Reporter Info */}
                  <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                    <span className="text-neutral-500">Reported by:</span>
                    <span className="text-neutral-200">
                      {report.reporter?.full_name || "Innovator"}
                    </span>
                    {report.reporter?.username && (
                      <span className="text-neutral-500">(@{report.reporter.username})</span>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Reported Idea Details & Allegation */}
                  <div className="lg:col-span-2 space-y-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">
                        Reported Concept
                      </span>
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/ideas/${report.idea_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-white hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{report.idea?.title || "Untitled Concept"}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 mt-1">
                        <span>ID: {report.idea?.display_id || report.idea_id.substring(0, 8)}</span>
                        <span>•</span>
                        <span>Creator: {report.idea?.creator?.full_name || "Unknown"}</span>
                        <span>•</span>
                        <span>Category: {report.idea?.category || "General"}</span>
                      </div>
                    </div>

                    {/* Reporter's Description / Grounds */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
                        Reporter&apos;s Statement
                      </span>
                      <p className="text-xs text-neutral-300 leading-relaxed font-light">
                        {report.description}
                      </p>
                      {report.evidence_url && (
                        <div className="pt-2 flex items-center gap-1.5 text-xs font-mono">
                          <span className="text-neutral-500">Evidence Link:</span>
                          <a
                            href={report.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:underline inline-flex items-center gap-1 truncate max-w-sm"
                          >
                            <span>{report.evidence_url}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Resolution / Note if resolved */}
                    {report.resolution_note && (
                      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs font-mono text-indigo-300">
                        <span className="text-indigo-400 font-semibold block mb-0.5">
                          Moderation Resolution Note:
                        </span>
                        <span>{report.resolution_note}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Col: Alleged Original & Moderation Actions */}
                  <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-white/[0.06] lg:pl-6 flex flex-col justify-between">
                    {/* Alleged Original Idea Link */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1">
                        Alleged Original Concept
                      </span>
                      {report.original_idea ? (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                          <Link
                            href={`/ideas/${report.original_idea.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-white hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5 line-clamp-1"
                          >
                            <span>{report.original_idea.title}</span>
                            <ExternalLink className="h-3 w-3 text-neutral-500" />
                          </Link>
                          <div className="text-[10px] font-mono text-neutral-400">
                            By {report.original_idea.creator?.full_name || "Innovator"} • Created{" "}
                            {formatDate(report.original_idea.created_at)}
                          </div>
                          <button
                            onClick={() => setComparisonReport(report)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Compare Side-by-Side</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-neutral-500">
                          No direct IdeaEra reference idea linked.
                        </div>
                      )}
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                        Admin Actions
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {report.status === "pending" && (
                          <button
                            onClick={() => {
                              setActionTargetReport(report);
                              setActionType("under_review");
                            }}
                            className="flex-1 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-mono uppercase tracking-wider transition-colors text-center"
                          >
                            Mark Under Review
                          </button>
                        )}

                        {report.status !== "dismissed" && report.status !== "resolved" && (
                          <>
                            <button
                              onClick={() => {
                                setActionTargetReport(report);
                                setActionType("dismiss");
                              }}
                              className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
                            >
                              Dismiss
                            </button>

                            <button
                              onClick={() => {
                                setActionTargetReport(report);
                                setActionType("restrict");
                              }}
                              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            >
                              Restrict Concept
                            </button>
                          </>
                        )}

                        {(report.status === "dismissed" || report.status === "resolved") && (
                          <div className="text-xs font-mono text-neutral-500 italic">
                            Case concluded ({report.status}).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      {comparisonReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="fixed inset-0" onClick={() => setComparisonReport(null)} />
          <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-[#0c0e14] shadow-[0_25px_80px_rgba(0,0,0,0.9)] z-10 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-gradient-to-r from-white/[0.03] to-transparent">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 block mb-1">
                  Side-by-Side Comparative Audit
                </span>
                <h3 className="text-lg font-semibold text-white">
                  Original Concept vs. Reported Concept
                </h3>
              </div>
              <button
                onClick={() => setComparisonReport(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Side by side columns */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
              {/* Left Column: Original Idea */}
              <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.02] space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    [ORIGINAL REFERENCE IDEA]
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {formatDate(comparisonReport.original_idea?.created_at || "")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white">
                    {comparisonReport.original_idea?.title}
                  </h4>
                  <div className="text-xs font-mono text-neutral-400">
                    By {comparisonReport.original_idea?.creator?.full_name || "Unknown"} (
                    {comparisonReport.original_idea?.category})
                  </div>
                </div>

                <div className="space-y-3 text-xs font-light">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Problem Space
                    </span>
                    <p className="text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                      {comparisonReport.original_idea?.problem || "Not articulated"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Proposed Solution / Architecture
                    </span>
                    <p className="text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                      {comparisonReport.original_idea?.solution || "Not articulated"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Full Description
                    </span>
                    <p className="text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04] line-clamp-6">
                      {comparisonReport.original_idea?.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Reported Idea */}
              <div className="p-5 rounded-2xl border border-red-500/25 bg-red-500/[0.02] space-y-4">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold">
                    [REPORTED CONCEPT]
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {formatDate(comparisonReport.idea?.created_at || "")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white">
                    {comparisonReport.idea?.title}
                  </h4>
                  <div className="text-xs font-mono text-neutral-400">
                    By {comparisonReport.idea?.creator?.full_name || "Unknown"} (
                    {comparisonReport.idea?.category})
                  </div>
                </div>

                <div className="space-y-3 text-xs font-light">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Problem Space
                    </span>
                    <p className="text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                      {comparisonReport.idea?.problem || "Not articulated"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Proposed Solution / Architecture
                    </span>
                    <p className="text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                      {comparisonReport.idea?.solution || "Not articulated"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-0.5">
                      Full Description
                    </span>
                    <p className="text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.04] line-clamp-6">
                      {comparisonReport.idea?.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-[#090b10] flex items-center justify-end">
              <button
                onClick={() => setComparisonReport(null)}
                className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-mono uppercase tracking-wider text-white transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Action Modal (Dismiss or Restrict Confirmation) */}
      {actionTargetReport && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (!isProcessing) {
                setActionTargetReport(null);
                setActionType(null);
              }
            }}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0e14] p-6 sm:p-8 shadow-2xl z-10 space-y-5">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "p-2.5 rounded-xl border shrink-0 mt-0.5",
                  actionType === "restrict"
                    ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                )}
              >
                {actionType === "restrict" ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                  Moderator Decision
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {actionType === "restrict"
                    ? "Confirm Violation & Restrict Concept"
                    : actionType === "dismiss"
                    ? "Dismiss Moderation Report"
                    : "Mark Report Under Review"}
                </h3>
                <p className="text-xs text-neutral-400">
                  Target: {actionTargetReport.idea?.title}
                </p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                {actionError}
              </div>
            )}

            {actionType === "restrict" && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1">
                <p className="font-semibold">Important Consequences:</p>
                <ul className="list-disc list-inside space-y-1 text-red-300/80 font-light">
                  <li>This concept will be set to private and removed from discovery feeds.</li>
                  <li>A confidential moderation notice will be sent to the creator.</li>
                  <li>The reporter will receive a confidential resolution notice.</li>
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 block">
                Administrative Notes / Reason
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder={
                  actionType === "restrict"
                    ? "Describe the substantiated violation (e.g., unauthorized reproduction of proprietary code)..."
                    : "Provide rationale for dismissing this report..."
                }
                rows={3}
                className="w-full p-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/60"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionTargetReport(null);
                  setActionType(null);
                }}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-mono uppercase tracking-wider text-neutral-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isProcessing}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50",
                  actionType === "restrict"
                    ? "bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Apply Decision</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
