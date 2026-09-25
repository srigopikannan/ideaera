"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project, Profile } from "@/types";
import {
  resolveProjectHelpAction,
  getRescueRecommendationsAction,
  inviteRescueTeammateAction,
} from "@/app/(dashboard)/actions/projects";
import {
  AlertCircle,
  LifeBuoy,
  CheckCircle2,
  Send,
  Sparkles,
  MapPin,
  Clock,
  Check,
  UserPlus,
  Loader2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RescueCandidateItem {
  profile: Profile;
  match_score: number;
  matching_skills: string[];
  is_available: boolean;
  already_invited: boolean;
}

interface ProjectRescueBannerProps {
  project: Project;
  currentUser?: Profile | null;
  onResolved?: () => void;
}

export function ProjectRescueBanner({
  project,
  currentUser,
  onResolved,
}: ProjectRescueBannerProps) {
  const router = useRouter();
  const isOwner = Boolean(currentUser?.id && project.owner_id === currentUser.id);

  const [isResolving, setIsResolving] = React.useState(false);
  const [candidates, setCandidates] = React.useState<RescueCandidateItem[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = React.useState(false);
  const [invitedIds, setInvitedIds] = React.useState<Set<string>>(new Set());
  const [invitingId, setInvitingId] = React.useState<string | null>(null);

  // Invite modal with custom message
  const [selectedCandidate, setSelectedCandidate] = React.useState<Profile | null>(null);
  const [inviteMessage, setInviteMessage] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    const fetchCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        const res = await getRescueRecommendationsAction(project.id);
        if (mounted && res.success && res.candidates) {
          setCandidates(res.candidates as any);
          const initialInvited = new Set<string>();
          (res.candidates as any).forEach((c: any) => {
            if (c.already_invited && c.profile?.id) initialInvited.add(c.profile.id);
          });
          setInvitedIds(initialInvited);
        }
      } catch (err) {
        console.error("Failed to load rescue recommendations:", err);
      } finally {
        if (mounted) setIsLoadingCandidates(false);
      }
    };

    fetchCandidates();
    return () => {
      mounted = false;
    };
  }, [project.id]);

  const handleResolve = async () => {
    if (!confirm("Are you sure you want to mark this help request as resolved?")) return;
    setIsResolving(true);
    const res = await resolveProjectHelpAction(project.id);
    setIsResolving(false);
    if (res.success) {
      onResolved?.();
      router.refresh();
    } else {
      alert(res.error || "Failed to resolve help request.");
    }
  };

  const handleSendInvite = async (candidateId: string, customMessage?: string) => {
    setInvitingId(candidateId);
    const res = await inviteRescueTeammateAction(
      project.id,
      candidateId,
      customMessage || inviteMessage
    );
    setInvitingId(null);

    if ("success" in res && res.success) {
      setInvitedIds((prev) => new Set(prev).add(candidateId));
      setSelectedCandidate(null);
      setInviteMessage("");
    } else {
      alert((res as any)?.error || "Failed to send rescue invitation.");
    }
  };

  return (
    <section
      id="rescue"
      className="relative p-6 sm:p-8 rounded-3xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-[#0e1017] to-[#0a0c13] space-y-6 shadow-2xl backdrop-blur-md"
    >
      {/* Banner Top Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-500/20 pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
            <LifeBuoy className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold">
                🚨 PROJECT RESCUE IN PROGRESS
              </span>
              {project.help_category && (
                <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-mono border border-rose-500/30">
                  Needs: {project.help_category}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              &quot;{project.help_description}&quot;
            </p>
          </div>
        </div>

        {/* Owner Action: Mark Resolved */}
        {isOwner && (
          <button
            type="button"
            onClick={handleResolve}
            disabled={isResolving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono hover:bg-emerald-500/20 transition-all self-start md:self-auto shrink-0 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{isResolving ? "Resolving..." : "Mark Help Resolved"}</span>
          </button>
        )}
      </div>

      {/* Suggested Rescuers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Sparkles className="h-3.5 w-3.5 text-rose-400" />
            <span className="uppercase tracking-wider">
              Recommended Rescuers ({candidates.length})
            </span>
          </div>
          <Link
            href={
              project.help_category
                ? `/people?query=${encodeURIComponent(project.help_category)}`
                : "/people"
            }
            className="text-[11px] font-mono text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
          >
            <span>Search More People</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {isLoadingCandidates ? (
          <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#0c0e17] flex items-center justify-center gap-3 text-xs font-mono text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
            <span>Finding matching students with needed skills & availability...</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0c0e17] text-center text-xs font-mono text-neutral-500 space-y-2">
            <p>No exact candidate matches found right now.</p>
            <Link
              href="/people"
              className="inline-flex items-center gap-1.5 text-rose-400 hover:underline"
            >
              Browse People Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidates.slice(0, 6).map((item) => {
              const candidate = item.profile;
              const isInvited = invitedIds.has(candidate.id) || item.already_invited;
              const isInvitingThis = invitingId === candidate.id;
              const sameCollege =
                currentUser?.college &&
                candidate.college &&
                currentUser.college.toLowerCase() === candidate.college.toLowerCase();

              return (
                <div
                  key={candidate.id}
                  className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0e17] hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {candidate.avatar_url ? (
                        <img
                          src={candidate.avatar_url}
                          alt={candidate.full_name || ""}
                          className="h-10 w-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-rose-500/20 text-rose-300 font-mono text-sm flex items-center justify-center shrink-0">
                          {(candidate.full_name || "U")[0]}
                        </div>
                      )}
                      <div className="truncate">
                        <Link
                          href={`/people/${candidate.username}`}
                          className="text-xs font-medium text-white hover:text-rose-300 transition-colors block truncate"
                        >
                          {candidate.full_name}
                        </Link>
                        <p className="text-[11px] font-mono text-neutral-500 truncate">
                          @{candidate.username}
                        </p>
                      </div>
                    </div>

                    {candidate.headline && (
                      <p className="text-[11px] text-neutral-400 line-clamp-1 font-light">
                        {candidate.headline}
                      </p>
                    )}

                    {/* Availability & College Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {candidate.availability && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{candidate.availability}</span>
                        </span>
                      )}
                      {sameCollege && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-mono border border-purple-500/20">
                          <MapPin className="h-2.5 w-2.5" />
                          <span>Same College</span>
                        </span>
                      )}
                    </div>

                    {/* Candidate Matching Skills */}
                    {item.matching_skills && item.matching_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.matching_skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Invite Button */}
                  {isOwner && (
                    <div className="pt-2 border-t border-white/[0.04]">
                      {isInvited ? (
                        <span className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-mono">
                          <Check className="h-3.5 w-3.5" />
                          <span>Rescue Invited</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setInviteMessage(
                              `Hi ${candidate.full_name}, we're working on "${project.name}" and need assistance with ${project.help_category || "our project"}. Would you be interested in jumping in?`
                            );
                          }}
                          disabled={isInvitingThis}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-mono transition-all disabled:opacity-50"
                        >
                          {isInvitingThis ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserPlus className="h-3.5 w-3.5" />
                          )}
                          <span>Invite to Rescue</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Message Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0e111a] p-6 space-y-4 shadow-2xl">
            <h4 className="text-base font-medium text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-rose-400" />
              <span>Invite {selectedCandidate.full_name}</span>
            </h4>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block">
                Personalized Note
              </label>
              <textarea
                rows={3}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-rose-500 resize-none font-sans"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-3 py-1.5 rounded-full border border-white/10 text-neutral-400 hover:text-white text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendInvite(selectedCandidate.id, inviteMessage)}
                className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
