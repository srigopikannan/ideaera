"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Idea, IdeaComment, Profile } from "@/types";
import { toggleLikeAction, addCommentAction, deleteIdeaAction } from "@/app/(dashboard)/actions/ideas";
import { formatDate, formatFullDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Heart,
  Send,
  MoreHorizontal,
  Trash2,
  Share2,
  Sparkles,
  Users,
  Compass,
  MessageSquare,
  Check,
  ArrowUpRight,
  Edit3,
  ShieldCheck,
  History,
  Copy,
  Calendar,
  Lock,
  Globe,
  Tag,
  GraduationCap,
  MapPin,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { EditIdeaModal } from "@/components/ideas/EditIdeaModal";
import { CelestialIdeaCore } from "@/components/ideas/CelestialIdeaCore";

interface IdeaDetailViewProps {
  idea: Idea;
  initialComments: IdeaComment[];
  currentUser: Profile;
}

const DIMENSIONS = [
  { id: "01", name: "THE IDEA", desc: "Core spark & initial concept" },
  { id: "02", name: "THE PROBLEM", desc: "Contextual friction & bottleneck" },
  { id: "03", name: "THE POSSIBILITY", desc: "Architectural blueprint & stack" },
  { id: "04", name: "RECORD & OWNERSHIP", desc: "Platform record & version history" },
  { id: "05", name: "COLLABORATE", desc: "Peer critique & participation" },
];

export function IdeaDetailView({
  idea,
  initialComments,
  currentUser,
}: IdeaDetailViewProps) {
  const router = useRouter();
  const [currentIdea, setCurrentIdea] = React.useState<Idea>(idea);
  const [isLiked, setIsLiked] = React.useState(idea.is_liked || false);
  const [likesCount, setLikesCount] = React.useState(idea.likes_count || 0);
  const [comments, setComments] = React.useState<IdeaComment[]>(initialComments);
  const [commentInput, setCommentInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [idCopied, setIdCopied] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const displayId = currentIdea.display_id || ("IDEA-" + currentIdea.id.substring(0, 8).toUpperCase());

  const handleCopyId = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(displayId);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  // Section 2 & 3 distinct content resolution
  const problemContent = React.useMemo(() => {
    if (currentIdea.problem?.trim()) return currentIdea.problem.trim();
    if (!currentIdea.description) return "Problem statement not articulated.";
    const parts = currentIdea.description.split(/\r?\n\r?\n/).map((p) => p.trim()).filter(Boolean);
    return parts[0] || currentIdea.description;
  }, [currentIdea.problem, currentIdea.description]);

  const solutionContent = React.useMemo(() => {
    if (currentIdea.solution?.trim()) return currentIdea.solution.trim();
    if (!currentIdea.description) return "Proposed architectural blueprint under synthesis.";
    const parts = currentIdea.description.split(/\r?\n\r?\n/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.slice(1).join("\n\n");
    }
    // If description has only 1 part and no explicit solution, do NOT repeat problemContent!
    return "Proposed architectural blueprint under synthesis.";
  }, [currentIdea.solution, currentIdea.description]);

  // Scroll tracking for 6-dimensional narrative
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      setScrollProgress(Math.min(Math.max(window.scrollY / maxScroll, 0), 1));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeDimIndex = Math.min(Math.floor(scrollProgress * DIMENSIONS.length), DIMENSIONS.length - 1);
  const activeDim = DIMENSIONS[activeDimIndex];

  // Deletion and Editing state
  const isOwner = Boolean(currentUser?.id && currentIdea.author_id === currentUser.id);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleLike = async () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(prev - 1, 0)));

    try {
      const res = await toggleLikeAction(idea.id);
      setIsLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch {
      setIsLiked(!newLiked);
      setLikesCount((prev) => (!newLiked ? prev + 1 : Math.max(prev - 1, 0)));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmitting) return;

    const content = commentInput.trim();
    setCommentInput("");
    setIsSubmitting(true);

    try {
      const res = await addCommentAction(idea.id, content);
      if (res.success && res.comment) {
        setComments((prev) => [...prev, res.comment!]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteIdeaAction(idea.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/ideas");
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete idea.");
      }
    } catch (err: any) {
      setDeleteError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full min-h-screen pb-32 select-none">
      {/* Fixed Sticky Narrative Progression HUD */}
      <div className="sticky top-4 z-40 px-3 sm:px-6 max-w-6xl mx-auto flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl shrink-0">
          <Link
            href="/ideas"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Idea Field</span>
          </Link>

          <div className="h-3 w-[1px] bg-white/10" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-mono tracking-wider text-indigo-300 uppercase">
              {activeDim.id} // <span className="hidden xs:inline">{activeDim.name}</span>
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleLike}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border backdrop-blur-xl shadow-lg",
              isLiked
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(129,140,248,0.4)]"
                : "bg-[#0a0c13]/80 text-neutral-300 border-white/10 hover:border-white/30"
            )}
            title="Endorsements"
          >
            <Heart className={cn("h-3 w-3", isLiked && "fill-indigo-400 text-indigo-400")} />
            <span>{likesCount} <span className="hidden sm:inline">Endorsements</span></span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-mono bg-[#0a0c13]/80 text-neutral-300 border border-white/10 hover:border-white/30 transition-colors backdrop-blur-xl shadow-lg"
            title="Share"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </button>

          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-[#0a0c13]/80 text-neutral-400 hover:text-white backdrop-blur-xl shadow-lg"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#0d1017] p-1.5 shadow-2xl z-50">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Edit Concept</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Concept</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DIMENSION 01: THE IDEA (Hero Composition) */}
      <section className="relative min-h-[85vh] flex flex-col justify-center px-5 sm:px-12 max-w-6xl mx-auto">
        {/* Background Celestial Idea Core Organism */}
        <div className="absolute right-0 sm:right-12 top-1/2 -translate-y-1/2 w-full max-w-[280px] sm:max-w-[500px] h-[280px] sm:h-[500px] pointer-events-none opacity-80 z-0">
          <CelestialIdeaCore
            scrollProgress={scrollProgress}
            category={currentIdea.category}
            className="w-full h-full"
          />
        </div>

        {/* Foreground Editorial Proposition */}
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono uppercase tracking-[0.24em]">
              IDEA // {currentIdea.category}
            </span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-neutral-300 text-[11px] font-mono hover:border-white/25 hover:text-white transition-all cursor-pointer"
              title="Click to copy permanent Idea ID"
            >
              <Hash className="h-3 w-3 text-indigo-400" />
              <span>{displayId}</span>
              {idCopied ? <Check className="h-3 w-3 text-emerald-400 ml-0.5" /> : <Copy className="h-3 w-3 text-neutral-500 ml-0.5" />}
            </button>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
              <Globe className="h-2.5 w-2.5" />
              {currentIdea.visibility || "PUBLIC"}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-300 text-[10px] font-mono">
              v{currentIdea.version || 1}.0
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
            <span>Recorded {formatFullDateTime(currentIdea.created_at)}</span>
          </div>

          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-[1.08] sm:leading-[1.05] break-words">
            {currentIdea.title}
          </h1>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-4">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-bold overflow-hidden">
              {currentIdea.author?.avatar_url ? (
                <img
                  src={currentIdea.author.avatar_url}
                  alt={currentIdea.author.full_name || "Author"}
                  className="h-full w-full object-cover"
                />
              ) : (
                (currentIdea.author?.full_name || "I").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <Link
                href={"/people/" + (currentIdea.author?.username || "creator")}
                className="text-sm font-medium text-white hover:text-indigo-300 transition-colors"
              >
                {currentIdea.author?.full_name || "Innovator"}
              </Link>
              <p className="text-[11px] font-mono text-neutral-500">
                {currentIdea.author?.headline || ("@" + (currentIdea.author?.username || "creator"))}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DIMENSION 02: THE PROBLEM (Entropy & Friction) */}
      <section className="relative py-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-6 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
          <span className="text-indigo-400 font-bold">SECTION 02 //</span>
          <span>THE PROBLEM SPACE</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extralight text-white leading-tight">
            The Structural Friction
          </h2>
          <div className="text-neutral-300 text-base sm:text-lg font-light leading-relaxed whitespace-pre-line max-w-3xl">
            {problemContent}
          </div>
        </div>
      </section>

      {/* DIMENSION 03: THE POSSIBILITY (Blueprint & Architecture) */}
      <section className="relative py-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-8 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
          <span className="text-purple-400 font-bold">SECTION 03 //</span>
          <span>THE ARCHITECTURAL POSSIBILITY</span>
        </div>

        <div className="space-y-6 max-w-3xl">
          <h2 className="text-2xl sm:text-4xl font-extralight text-white leading-tight">
            Proposed Model & Synthesis
          </h2>
          <div className="text-neutral-300 text-base sm:text-lg font-light leading-relaxed whitespace-pre-line">
            {solutionContent}
          </div>

          {/* Tags */}
          {currentIdea.tags && currentIdea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {currentIdea.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-mono border border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-white/20 transition-all"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DIMENSION 04: OWNERSHIP & PLATFORM RECORD */}
      <section className="relative py-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-8 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
          <span className="text-cyan-400 font-bold">SECTION 04 //</span>
          <span>OWNERSHIP & PLATFORM RECORD</span>
        </div>

        {/* Platform Attestation Notice */}
        <div className="p-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-sm max-w-3xl flex items-start gap-4">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-cyan-200 uppercase tracking-wider font-mono">
              Platform Attestation
            </h4>
            <p className="text-xs sm:text-sm text-cyan-300/80 font-light leading-relaxed">
              IdeaEra records this idea&apos;s creation and version history to help document its history on the platform.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {/* Permanent Identifier & Platform Record Card */}
          <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0a0c13] space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              PERMANENT IDENTIFIER & METRICS
            </span>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">Permanent Idea ID</span>
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02]">
                  <span className="font-mono text-xs font-medium text-indigo-300 tracking-wider">
                    {displayId}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    {idCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono text-neutral-400 block mb-1">Server Creation Timestamp</span>
                <p className="text-xs font-mono text-neutral-200">
                  {formatFullDateTime(currentIdea.created_at)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Current Version</span>
                  <span className="text-sm font-mono text-white">v{currentIdea.version || 1}.0</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Visibility</span>
                  <span className="text-sm font-mono text-emerald-400 uppercase">{currentIdea.visibility || "PUBLIC"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Originator Card */}
          <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0a0c13] space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  ORIGINATOR
                </span>
                <span className="text-[10px] font-mono text-indigo-400">AUTHOR</span>
              </div>

              <Link
                href={"/people/" + (currentIdea.author?.username || "creator")}
                className="flex items-center gap-3.5 group/author hover:opacity-90 transition-opacity"
              >
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-bold text-lg overflow-hidden shrink-0">
                  {currentIdea.author?.avatar_url ? (
                    <img
                      src={currentIdea.author.avatar_url}
                      alt={currentIdea.author.full_name || "Author"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (currentIdea.author?.full_name || "I").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-medium text-white group-hover/author:text-indigo-300 transition-colors truncate">
                    {currentIdea.author?.full_name || "Innovator"}
                  </h4>
                  <p className="text-xs font-mono text-neutral-400 truncate">
                    @{currentIdea.author?.username || "creator"}
                  </p>
                  {currentIdea.author?.headline && (
                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {currentIdea.author.headline}
                    </p>
                  )}
                </div>
              </Link>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400">Community Gravity</span>
              <span className="text-xs font-mono text-white font-medium">{likesCount} Endorsements</span>
            </div>
          </div>
        </div>

        {/* Version History Log */}
        {currentIdea.version_history && currentIdea.version_history.length > 0 && (
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <History className="h-3.5 w-3.5 text-purple-400" />
              <span className="uppercase tracking-wider">Version History ({currentIdea.version_history.length})</span>
            </div>
            <div className="space-y-2">
              {currentIdea.version_history.map((ver, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-white/[0.06] bg-[#0a0c13] flex items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-purple-300 text-[10px]">
                      v{ver.version}.0
                    </span>
                    <span className="text-neutral-300">{ver.changes_summary || "Idea updated"}</span>
                  </div>
                  <span className="text-neutral-500 text-[11px] shrink-0">
                    {formatDate(ver.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* DIMENSION 05: COLLABORATE & CRITIQUE */}
      <section className="relative py-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-8 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
            <span className="text-emerald-400 font-bold">SECTION 05 //</span>
            <span>DIALOGUE & PEER CRITIQUE ({comments.length})</span>
          </div>
          <span className="text-xs font-mono text-neutral-500">Live Synthesis Stream</span>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleAddComment} className="space-y-3 max-w-3xl">
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] focus-within:border-indigo-400/50 transition-all p-1">
            <textarea
              rows={3}
              placeholder="Offer technical perspective, suggest protocol alternatives, or propose collaboration..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="w-full p-4 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none"
            />
            <div className="flex justify-between items-center px-4 py-2 border-t border-white/[0.05]">
              <span className="text-[10px] font-mono text-neutral-500">Peer Synthesis Notes</span>
              <button
                type="submit"
                disabled={isSubmitting || !commentInput.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
              >
                <Send className="h-3 w-3" />
                <span>{isSubmitting ? "Transmitting..." : "Post Note"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Comments Stream */}
        <div className="space-y-3 max-w-3xl pt-2">
          {comments.length === 0 ? (
            <div className="p-8 rounded-2xl border border-white/[0.06] bg-[#0a0c13] text-center text-xs font-mono text-neutral-500">
              No critique notes recorded yet. Be the first to analyze this idea.
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl border border-white/[0.07] bg-[#0a0c13] space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span className="text-white font-medium">{c.user?.full_name || "Peer"}</span>
                  <span className="text-[10px] text-neutral-500">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-neutral-300 text-sm font-light leading-relaxed whitespace-pre-line">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Concept"
        description={'Are you sure you want to permanently delete "' + currentIdea.title + '"? This action cannot be undone.'}
        isDeleting={isDeleting}
        error={deleteError}
      />

      {/* Edit Idea Modal */}
      <EditIdeaModal
        idea={currentIdea}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updated) => {
          setCurrentIdea((prev) => ({ ...prev, ...updated }));
          router.refresh();
        }}
      />
    </div>
  );
}
