"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Idea,
  IdeaValidationData,
  IdeaValidationFeedback,
  Profile,
} from "@/types";
import {
  submitIdeaValidationFeedbackAction,
  updateIdeaValidationAction,
  convertIdeaToProjectAction,
} from "@/app/(dashboard)/actions/ideas";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Users,
  Sparkles,
  ArrowRight,
  Send,
  ThumbsUp,
  AlertTriangle,
  XCircle,
  Edit3,
  Rocket,
  Plus,
  Trash2,
  X,
  Target,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface IdeaValidationSectionProps {
  idea: Idea;
  validationData: IdeaValidationData;
  currentUser?: Profile | null;
  onValidationUpdated?: (updated: Partial<Idea>) => void;
}

export function IdeaValidationSection({
  idea,
  validationData: initialData,
  currentUser,
  onValidationUpdated,
}: IdeaValidationSectionProps) {
  const router = useRouter();
  const [data, setData] = React.useState<IdeaValidationData>(initialData);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // Voting & Feedback Form State
  const [selectedVote, setSelectedVote] = React.useState<
    "valid" | "needs_work" | "impractical" | null
  >(null);
  const [feedbackText, setFeedbackText] = React.useState("");
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = React.useState<string | null>(null);

  // Converting to project state
  const [isConverting, setIsConverting] = React.useState(false);
  const [convertError, setConvertError] = React.useState<string | null>(null);

  // Edit Modal Form State
  const [editStatus, setEditStatus] = React.useState<"not_validated" | "testing" | "validated">(
    data.status || "not_validated"
  );
  const [editTargetUsers, setEditTargetUsers] = React.useState(data.target_users || "");
  const [editWhyItMatters, setEditWhyItMatters] = React.useState(data.why_it_matters || "");
  const [editAlternatives, setEditAlternatives] = React.useState(data.alternatives || "");
  const [editExpectedBenefits, setEditExpectedBenefits] = React.useState(
    data.expected_benefits || ""
  );
  const [editQuestions, setEditQuestions] = React.useState<string[]>(
    data.questions?.length > 0
      ? data.questions
      : [
          "Would you use this product/solution?",
          "What critical feature or consideration is missing?",
          "What are the biggest operational or technical risks?",
        ]
  );
  const [newQuestionInput, setNewQuestionInput] = React.useState("");
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  const isOwner = currentUser?.id === (idea.author_id || (idea as any).creator_id);

  // Check if current user already voted
  const userExistingFeedback = React.useMemo(() => {
    if (!currentUser) return null;
    return data.feedback?.find((f) => f.user_id === currentUser.id) || null;
  }, [data.feedback, currentUser]);

  React.useEffect(() => {
    if (userExistingFeedback) {
      setSelectedVote(userExistingFeedback.vote);
      setFeedbackText(userExistingFeedback.feedback);
      if (userExistingFeedback.answers) {
        setAnswers(userExistingFeedback.answers);
      }
    }
  }, [userExistingFeedback]);

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in to vote and provide feedback.");
      return;
    }
    if (!selectedVote) {
      alert("Please select a vote rating.");
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackSuccessMsg(null);

    const res = await submitIdeaValidationFeedbackAction(idea.id, {
      vote: selectedVote,
      feedback: feedbackText.trim(),
      answers,
    });

    setIsSubmittingFeedback(false);

    if (res.success && res.feedback) {
      setFeedbackSuccessMsg("Your validation critique has been recorded!");
      // Update local feedback
      const updatedList = [
        res.feedback,
        ...data.feedback.filter((f) => f.id !== res.feedback!.id),
      ];
      const validCount = updatedList.filter((f) => f.vote === "valid").length;
      const needsWorkCount = updatedList.filter((f) => f.vote === "needs_work").length;
      const impracticalCount = updatedList.filter((f) => f.vote === "impractical").length;
      const positive =
        updatedList.length > 0 ? Math.round((validCount / updatedList.length) * 100) : 0;

      setData((prev) => ({
        ...prev,
        feedback: updatedList,
        summary: {
          total: updatedList.length,
          valid_count: validCount,
          needs_work_count: needsWorkCount,
          impractical_count: impracticalCount,
          positive_percentage: positive,
        },
      }));
      setTimeout(() => setFeedbackSuccessMsg(null), 4000);
    } else {
      alert(res.error || "Failed to record feedback.");
    }
  };

  const handleSaveValidationSettings = async () => {
    setIsSavingEdit(true);
    const res = await updateIdeaValidationAction(idea.id, {
      status: editStatus,
      target_users: editTargetUsers,
      why_it_matters: editWhyItMatters,
      alternatives: editAlternatives,
      expected_benefits: editExpectedBenefits,
      questions: editQuestions.filter((q) => q.trim().length > 0),
    });
    setIsSavingEdit(false);

    if (res.success) {
      setData((prev) => ({
        ...prev,
        status: editStatus,
        target_users: editTargetUsers,
        why_it_matters: editWhyItMatters,
        alternatives: editAlternatives,
        expected_benefits: editExpectedBenefits,
        questions: editQuestions.filter((q) => q.trim().length > 0),
      }));
      setIsEditModalOpen(false);
      onValidationUpdated?.({
        validation_status: editStatus,
        validation_target_users: editTargetUsers,
        validation_why_it_matters: editWhyItMatters,
        validation_alternatives: editAlternatives,
        validation_expected_benefits: editExpectedBenefits,
        validation_questions: editQuestions.filter((q) => q.trim().length > 0),
      });
      router.refresh();
    } else {
      alert(res.error || "Failed to update validation settings.");
    }
  };

  const handleConvertToProject = async () => {
    if (!confirm(`Ready to launch "${idea.title}" into an active Project Workspace?`)) return;
    setIsConverting(true);
    setConvertError(null);

    const res = await convertIdeaToProjectAction(idea.id);
    setIsConverting(false);

    if (res.success && res.project) {
      router.push(`/projects/${res.project.id}`);
    } else {
      setConvertError(res.error || "Failed to convert idea to project.");
    }
  };

  const statusConfig = {
    validated: {
      label: "Validated Concept",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      dotColor: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]",
      icon: CheckCircle2,
      desc: "Strong peer signal and verified problem-market resonance.",
    },
    testing: {
      label: "Testing & Validation",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      dotColor: "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]",
      icon: Clock,
      desc: "Currently gathering community feedback, critique, and proof points.",
    },
    not_validated: {
      label: "Not Validated",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      dotColor: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]",
      icon: AlertCircle,
      desc: "Early spark. Fill the validation canvas to gather peer validation.",
    },
  }[data.status || "not_validated"];

  const StatusIcon = statusConfig.icon;

  return (
    <section
      id="validation"
      className="relative py-16 px-6 sm:px-12 max-w-5xl mx-auto space-y-12 border-t border-white/[0.06]"
    >
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
            <span className="text-indigo-400 font-bold">SECTION 04 //</span>
            <span>IDEA VALIDATION & SIGNAL PROTOCOL</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
            Proof of Need & Target Market Signal
          </h3>
          <p className="text-sm text-neutral-400 font-light max-w-2xl">
            Real peer critique, problem verification, and community sentiment to validate
            viability before building.
          </p>
        </div>

        {/* STATUS BADGE & CREATOR ACTIONS */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-mono font-medium backdrop-blur-md",
              statusConfig.badgeColor
            )}
          >
            <span className={cn("h-2 w-2 rounded-full animate-pulse", statusConfig.dotColor)} />
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{statusConfig.label}</span>
          </div>

          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-neutral-200 text-xs font-mono transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Edit Validation</span>
              </button>

              <button
                type="button"
                onClick={handleConvertToProject}
                disabled={isConverting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                <Rocket className="h-3.5 w-3.5" />
                <span>{isConverting ? "Launching..." : "Launch Project Workspace"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {convertError && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{convertError}</span>
        </div>
      )}

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#0c0e17]/80 backdrop-blur-sm space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Total Critiques
          </span>
          <p className="text-2xl font-light text-white font-mono">{data.summary.total}</p>
        </div>
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-sm space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            Would Use / Valid
          </span>
          <p className="text-2xl font-light text-emerald-400 font-mono">
            {data.summary.valid_count}{" "}
            <span className="text-xs text-emerald-500 font-normal">
              ({data.summary.positive_percentage}%)
            </span>
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 backdrop-blur-sm space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
            Needs Work
          </span>
          <p className="text-2xl font-light text-amber-400 font-mono">
            {data.summary.needs_work_count}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 backdrop-blur-sm space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400">
            Impractical / High Risk
          </span>
          <p className="text-2xl font-light text-rose-400 font-mono">
            {data.summary.impractical_count}
          </p>
        </div>
      </div>

      {/* 4 CORE VALIDATION DIMENSIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target Users */}
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0c13] space-y-3 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-indigo-400">
            <Users className="h-4 w-4" />
            <span>Target Users & Beachhead</span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed font-light">
            {data.target_users?.trim() || (
              <span className="text-neutral-500 italic font-mono text-xs">
                No specific target user group defined yet.
              </span>
            )}
          </p>
        </div>

        {/* Why It Matters */}
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0c13] space-y-3 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <Target className="h-4 w-4" />
            <span>Why It Matters & Urgency</span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed font-light">
            {data.why_it_matters?.trim() || (
              <span className="text-neutral-500 italic font-mono text-xs">
                Why this friction is urgent has not been specified yet.
              </span>
            )}
          </p>
        </div>

        {/* Alternatives */}
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0c13] space-y-3 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span>Existing Alternatives & Workarounds</span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed font-light">
            {data.alternatives?.trim() || (
              <span className="text-neutral-500 italic font-mono text-xs">
                No competing workarounds documented.
              </span>
            )}
          </p>
        </div>

        {/* Expected Benefits */}
        <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0a0c13] space-y-3 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400">
            <TrendingUp className="h-4 w-4" />
            <span>Expected 10x Benefits & Impact</span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed font-light">
            {data.expected_benefits?.trim() || (
              <span className="text-neutral-500 italic font-mono text-xs">
                Measurable benefits not articulated yet.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* COMMUNITY VOTING & FEEDBACK FORM */}
      <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#0a0c14] space-y-6">
        <div className="space-y-1">
          <h4 className="text-lg font-light text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <span>Cast Your Validation Verdict</span>
          </h4>
          <p className="text-xs text-neutral-400 font-mono">
            Help the creator stress-test this hypothesis. Be candid and constructive.
          </p>
        </div>

        <form onSubmit={handleVoteSubmit} className="space-y-6">
          {/* Vote Rating Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedVote("valid")}
              className={cn(
                "p-4 rounded-xl border text-left transition-all flex items-start gap-3",
                selectedVote === "valid"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/50"
                  : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white"
              )}
            >
              <ThumbsUp
                className={cn(
                  "h-5 w-5 shrink-0 mt-0.5",
                  selectedVote === "valid" ? "text-emerald-400" : "text-neutral-500"
                )}
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-medium block">Would Use This</span>
                <span className="text-[11px] text-neutral-500 font-light block">
                  Problem is real, solution is compelling.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedVote("needs_work")}
              className={cn(
                "p-4 rounded-xl border text-left transition-all flex items-start gap-3",
                selectedVote === "needs_work"
                  ? "border-amber-500 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/50"
                  : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5 shrink-0 mt-0.5",
                  selectedVote === "needs_work" ? "text-amber-400" : "text-neutral-500"
                )}
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-medium block">Needs Work</span>
                <span className="text-[11px] text-neutral-500 font-light block">
                  Concept has potential, but missing key pieces.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedVote("impractical")}
              className={cn(
                "p-4 rounded-xl border text-left transition-all flex items-start gap-3",
                selectedVote === "impractical"
                  ? "border-rose-500 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/50"
                  : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white"
              )}
            >
              <XCircle
                className={cn(
                  "h-5 w-5 shrink-0 mt-0.5",
                  selectedVote === "impractical" ? "text-rose-400" : "text-neutral-500"
                )}
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-medium block">Impractical / Not Interested</span>
                <span className="text-[11px] text-neutral-500 font-light block">
                  High friction, low demand, or unfeasible.
                </span>
              </div>
            </button>
          </div>

          {/* Validation Questions from Creator */}
          {data.questions && data.questions.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                <span>Creator Questions ({data.questions.length})</span>
              </span>
              <div className="space-y-3">
                {data.questions.map((question, qIdx) => (
                  <div key={qIdx} className="space-y-1.5">
                    <label className="text-xs text-neutral-300 font-mono">
                      Q{qIdx + 1}: {question}
                    </label>
                    <input
                      type="text"
                      placeholder="Your thoughts or answer..."
                      value={answers[question] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [question]: e.target.value }))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Written Feedback */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Suggestions & Critical Observations
            </label>
            <textarea
              rows={3}
              placeholder="What could make this idea 10x better? What risks should the team prepare for?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
          </div>

          {/* Submit Button & Confirmation */}
          <div className="flex items-center justify-between pt-2">
            {feedbackSuccessMsg ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {feedbackSuccessMsg}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-neutral-500">
                Peer validation improves the IdeaEra knowledge graph.
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmittingFeedback || !selectedVote}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              <Send className="h-3 w-3" />
              <span>{isSubmittingFeedback ? "Submitting..." : "Submit Verdict"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* VALIDATION FEEDBACK FEED */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="uppercase tracking-wider">
              Validation Feedback Stream ({data.feedback.length})
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            {data.summary.positive_percentage}% approval rating
          </span>
        </div>

        {data.feedback.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#0a0c13] text-center text-xs font-mono text-neutral-500">
            No validation critiques submitted yet. Cast the first verdict above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.feedback.map((item) => {
              const voteMeta = {
                valid: {
                  label: "Would Use / Valid",
                  color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  icon: ThumbsUp,
                },
                needs_work: {
                  label: "Needs Work",
                  color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  icon: AlertTriangle,
                },
                impractical: {
                  label: "Impractical",
                  color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                  icon: XCircle,
                },
              }[item.vote];

              const VoteIcon = voteMeta.icon;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-white/[0.07] bg-[#0c0e17] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.user?.avatar_url ? (
                          <img
                            src={item.user.avatar_url}
                            alt={item.user.full_name || ""}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] flex items-center justify-center">
                            {(item.user?.full_name || "U")[0]}
                          </div>
                        )}
                        <span className="text-xs font-medium text-white truncate max-w-[140px]">
                          {item.user?.full_name || "Anonymous"}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono",
                          voteMeta.color
                        )}
                      >
                        <VoteIcon className="h-3 w-3" />
                        <span>{voteMeta.label}</span>
                      </div>
                    </div>

                    {item.feedback && (
                      <p className="text-xs text-neutral-300 font-light leading-relaxed whitespace-pre-line">
                        "{item.feedback}"
                      </p>
                    )}

                    {item.answers && Object.keys(item.answers).length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                        {Object.entries(item.answers).map(([q, a], aIdx) => (
                          <div key={aIdx} className="text-[11px] font-mono">
                            <span className="text-neutral-500">{q}: </span>
                            <span className="text-neutral-300">{a}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-neutral-600 block">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT VALIDATION MODAL FOR OWNER */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0e111a] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-lg font-light text-white">Edit Validation Framework</h3>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">
                  Update problem canvas and questions to gather sharper signals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Validation Status Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Validation Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["not_validated", "testing", "validated"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-mono text-center capitalize transition-all",
                        editStatus === st
                          ? "border-indigo-500 bg-indigo-500/10 text-white font-medium"
                          : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white"
                      )}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Users */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Target Users
                </label>
                <input
                  type="text"
                  placeholder="e.g. Engineering students living in campus hostels..."
                  value={editTargetUsers}
                  onChange={(e) => setEditTargetUsers(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Why It Matters */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Why It Matters
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Students waste 30+ minutes finding meal options, leading to missed study sessions..."
                  value={editWhyItMatters}
                  onChange={(e) => setEditWhyItMatters(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Alternatives */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Existing Alternatives
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clunky WhatsApp group chats and informal notice boards..."
                  value={editAlternatives}
                  onChange={(e) => setEditAlternatives(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Expected Benefits */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Expected 10x Benefits
                </label>
                <input
                  type="text"
                  placeholder="e.g. Real-time availability updates with 90% faster checkout..."
                  value={editExpectedBenefits}
                  onChange={(e) => setEditExpectedBenefits(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Validation Questions */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Validation Questions for Peers
                </label>
                <div className="space-y-2">
                  {editQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={q}
                        onChange={(e) => {
                          const updated = [...editQuestions];
                          updated[idx] = e.target.value;
                          setEditQuestions(updated);
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditQuestions(editQuestions.filter((_, i) => i !== idx));
                        }}
                        className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a new question..."
                      value={newQuestionInput}
                      onChange={(e) => setNewQuestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newQuestionInput.trim()) {
                            setEditQuestions([...editQuestions, newQuestionInput.trim()]);
                            setNewQuestionInput("");
                          }
                        }
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newQuestionInput.trim()) {
                          setEditQuestions([...editQuestions, newQuestionInput.trim()]);
                          setNewQuestionInput("");
                        }
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-full border border-white/10 text-neutral-400 hover:text-white text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveValidationSettings}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
              >
                {isSavingEdit ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
