"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Profile, Project, Idea } from "@/types";
import { requestConnectionAction } from "@/app/(dashboard)/actions/social";
import { deleteIdeaAction } from "@/app/(dashboard)/actions/ideas";
import { deleteProjectAction } from "@/app/(dashboard)/actions/projects";
import { formatDate } from "@/lib/utils";
import {
  Edit3,
  Check,
  ArrowUpRight,
  Trash2,
  Plus,
  Sparkles,
  MapPin,
  GraduationCap,
  Calendar,
  Globe,
  Share2,
  MessageSquare,
  UserPlus,
  UserCheck,
  Clock,
  Lightbulb,
  FolderGit2,
  Users,
  Hash,
  ExternalLink,
} from "lucide-react";
import { Github, Linkedin } from "@/components/ui/brand-icons";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { cn } from "@/lib/utils";

interface ProfileViewProps {
  profile: Profile;
  isCurrentUser: boolean;
  projects?: Project[];
  ideas?: Idea[];
  connections?: Profile[];
}

export function ProfileView({
  profile,
  isCurrentUser,
  projects = [],
  ideas = [],
  connections = [],
}: ProfileViewProps) {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = React.useState(profile.connection_status || "none");
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (profile.connection_status) {
      setConnectionStatus(profile.connection_status);
    }
  }, [profile.connection_status]);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = React.useState<{ type: "idea" | "project"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleConnect = async (type: "public" | "private" = "private") => {
    setIsConnecting(true);
    try {
      const res = await requestConnectionAction(profile.id, type);
      if (res?.connection?.status === "accepted") {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("pending_sent");
      }
    } catch (err) {
      console.error("Connection request error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (deleteTarget.type === "idea") {
        const res = await deleteIdeaAction(deleteTarget.id);
        if (res.success) {
          setDeleteTarget(null);
          router.refresh();
        } else {
          setDeleteError(res.error || "Failed to delete idea.");
        }
      } else {
        const res = await deleteProjectAction(deleteTarget.id);
        if (res.success) {
          setDeleteTarget(null);
          router.refresh();
        } else {
          setDeleteError(res.error || "Failed to delete project.");
        }
      }
    } catch (err: any) {
      setDeleteError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Location display resolution
  const locationString = React.useMemo(() => {
    if (profile.city || profile.state || profile.country) {
      return [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
    }
    return profile.location || null;
  }, [profile.city, profile.state, profile.country, profile.location]);

  // Synergy calculation (subtle secondary pill)
  const synergyScore = React.useMemo(() => {
    const base = 75;
    const skillBonus = Math.min((profile.skills?.length || 0) * 4, 20);
    return Math.min(base + skillBonus, 96);
  }, [profile.skills]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 select-text">
      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0c13] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left Avatar + Core Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl border-2 border-white/10 bg-indigo-500/10 flex items-center justify-center text-3xl font-extralight text-indigo-300 shadow-xl overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                (profile.full_name || "I").charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                  {profile.full_name || "Innovator"}
                </h1>
                <span className="text-xs sm:text-sm font-mono text-neutral-400">
                  @{profile.username}
                </span>

                {/* Subtle Secondary Match Synergy Badge (Non-disruptive) */}
                {!isCurrentUser && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono tracking-wider">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    <span>{synergyScore}% SYNERGY</span>
                  </span>
                )}
              </div>

              {/* Headline */}
              {profile.headline && (
                <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
                  {profile.headline}
                </p>
              )}

              {/* Metadata Badges (College, Location, Age) */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-neutral-400">
                {profile.college && (
                  <div className="flex items-center gap-1.5 text-neutral-300 bg-white/[0.03] border border-white/10 px-3 py-1 rounded-full">
                    <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate max-w-[240px] sm:max-w-[320px]">{profile.college}</span>
                    {profile.college_location && (
                      <span className="text-[10px] text-neutral-400 border-l border-white/10 pl-1.5">
                        {profile.college_location}
                      </span>
                    )}
                  </div>
                )}

                {locationString && (
                  <div className="flex items-center gap-1.5 text-neutral-300 bg-white/[0.03] border border-white/10 px-3 py-1 rounded-full">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>{locationString}</span>
                  </div>
                )}

                {profile.show_age && profile.age && (
                  <div className="flex items-center gap-1.5 text-neutral-300 bg-white/[0.03] border border-white/10 px-3 py-1 rounded-full">
                    <Calendar className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>{profile.age} years old</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
            {isCurrentUser ? (
              <>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] text-xs font-mono uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all shadow-md"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </Link>
                <Link
                  href="/ideas/create"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-lg"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Post Idea</span>
                </Link>
              </>
            ) : (
              <>
                {connectionStatus === "connected" ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono uppercase tracking-wider">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                    <Link
                      href={`/messages?user=${profile.username}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] text-xs font-mono uppercase tracking-wider text-neutral-200 hover:text-white hover:border-white/30 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Message</span>
                    </Link>
                  </>
                ) : connectionStatus === "pending_sent" ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Request Pending</span>
                  </div>
                ) : connectionStatus === "pending_received" ? (
                  <Link
                    href="/connections"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-mono uppercase tracking-wider hover:bg-cyan-500/20 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Respond to Request</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => handleConnect("private")}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-lg disabled:opacity-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{isConnecting ? "Connecting..." : "Connect"}</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono text-neutral-300 hover:text-white hover:border-white/25 transition-colors"
              title="Share profile link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: About, Skills, Interests, Social Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* About / Bio Card */}
          <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
              ABOUT
            </span>
            {profile.bio ? (
              <p className="text-sm text-neutral-300 font-light leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs font-mono text-neutral-500 italic">
                {isCurrentUser
                  ? "You haven't written a biography yet. Click 'Edit Profile' to introduce yourself."
                  : "No biography provided."}
              </p>
            )}
          </div>

          {/* Skills Card */}
          <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                SKILLS ({profile.skills?.length || 0})
              </span>
            </div>
            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-mono border border-white/10 bg-white/[0.03] text-neutral-300 hover:border-indigo-500/40 hover:text-white transition-all"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-neutral-500 italic">
                No skills listed yet.
              </p>
            )}
          </div>

          {/* Interests & Domains Card */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
                INTERESTS & FOCUS DOMAINS
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-mono border border-purple-500/20 bg-purple-500/5 text-purple-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {(profile.website || profile.portfolio_url || profile.github_url || profile.linkedin_url) && (
            <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13] space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
                LINKS & NETWORK
              </span>
              <div className="space-y-2 pt-1">
                {(profile.website || profile.portfolio_url) && (
                  <a
                    href={(profile.website || profile.portfolio_url) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs font-mono text-neutral-300 hover:text-white hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{profile.website || profile.portfolio_url}</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-neutral-500 shrink-0 ml-2" />
                  </a>
                )}

                {profile.github_url && (
                  <a
                    href={profile.github_url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs font-mono text-neutral-300 hover:text-white hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Github className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">GitHub Profile</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-neutral-500 shrink-0 ml-2" />
                  </a>
                )}

                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs font-mono text-neutral-300 hover:text-white hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Linkedin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">LinkedIn Profile</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-neutral-500 shrink-0 ml-2" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Connections Preview */}
          {connections.length > 0 && (
            <div className="p-6 rounded-3xl border border-white/10 bg-[#0a0c13] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  CONNECTIONS ({connections.length})
                </span>
              </div>
              <div className="space-y-2 pt-1">
                {connections.slice(0, 5).map((conn) => (
                  <Link
                    key={conn.id}
                    href={`/people/${conn.username}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-white/10 flex items-center justify-center text-xs font-medium text-indigo-300 overflow-hidden shrink-0">
                      {conn.avatar_url ? (
                        <img src={conn.avatar_url} alt={conn.full_name} className="h-full w-full object-cover" />
                      ) : (
                        (conn.full_name || "C").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white group-hover:text-indigo-300 transition-colors truncate">
                        {conn.full_name}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-500 truncate">
                        @{conn.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Main Column: Ideas Posted & Projects */}
        <div className="lg:col-span-8 space-y-8">
          {/* Ideas Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-indigo-400" />
                <h2 className="text-base sm:text-lg font-light text-white tracking-wide">
                  Ideas Posted ({ideas.length})
                </h2>
              </div>
              {isCurrentUser && (
                <Link
                  href="/ideas/create"
                  className="text-xs font-mono text-indigo-300 hover:text-white transition-colors"
                >
                  + Post New Idea
                </Link>
              )}
            </div>

            {ideas.length === 0 ? (
              <div className="p-8 rounded-3xl border border-white/[0.06] bg-[#0a0c13] text-center space-y-3">
                <p className="text-sm text-neutral-400 font-light">
                  {isCurrentUser
                    ? "You have not published any ideas yet. Start building your portfolio by sharing an idea."
                    : "No ideas posted by this innovator yet."}
                </p>
                {isCurrentUser && (
                  <Link
                    href="/ideas/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Your First Idea</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideas.map((idea) => {
                  const displayId = idea.display_id || `IDEA-${idea.id.substring(0, 8).toUpperCase()}`;
                  return (
                    <div
                      key={idea.id}
                      className="p-5 rounded-2xl border border-white/10 bg-[#0a0c13] hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono uppercase tracking-wider">
                            {idea.category}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            <Hash className="h-2.5 w-2.5 inline mr-0.5 text-neutral-600" />
                            {displayId}
                          </span>
                        </div>

                        <Link href={`/ideas/${idea.id}`} className="block">
                          <h3 className="text-base font-light text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                            {idea.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                          {idea.problem || idea.description || "No description provided."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-500">
                        <span>{formatDate(idea.created_at)}</span>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/ideas/${idea.id}`}
                            className="text-neutral-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                          >
                            <span>View</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>

                          {isCurrentUser && (
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  type: "idea",
                                  id: idea.id,
                                  name: idea.title,
                                });
                              }}
                              className="text-neutral-600 hover:text-red-400 transition-colors"
                              title="Delete idea"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-purple-400" />
                <h2 className="text-base sm:text-lg font-light text-white tracking-wide">
                  Projects ({projects.length})
                </h2>
              </div>
              {isCurrentUser && (
                <Link
                  href="/projects"
                  className="text-xs font-mono text-purple-300 hover:text-white transition-colors"
                >
                  Explore Projects
                </Link>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="p-8 rounded-3xl border border-white/[0.06] bg-[#0a0c13] text-center space-y-2">
                <p className="text-sm text-neutral-400 font-light">
                  {isCurrentUser
                    ? "No projects attached to your profile yet."
                    : "No active projects listed for this innovator."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl border border-white/10 bg-[#0a0c13] hover:border-white/20 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-[10px] font-mono uppercase tracking-wider">
                          {proj.status?.replace("_", " ") || "ACTIVE"}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {proj.members?.length || 1} {proj.members?.length === 1 ? "contributor" : "contributors"}
                        </span>
                      </div>

                      <Link href={`/projects/${proj.id}`} className="block">
                        <h3 className="text-base font-light text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {proj.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                        {proj.description || "Project in development."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-neutral-500">
                      <span>Updated {formatDate(proj.updated_at || proj.created_at)}</span>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/projects/${proj.id}`}
                          className="text-neutral-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Explore</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>

                        {isCurrentUser && (
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: "project",
                                id: proj.id,
                                name: proj.name,
                              });
                            }}
                            className="text-neutral-600 hover:text-red-400 transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title={"Delete " + (deleteTarget?.type === "idea" ? "Idea" : "Project")}
        description={`Are you sure you want to permanently delete "${deleteTarget?.name || ""}"? This action cannot be undone.`}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
