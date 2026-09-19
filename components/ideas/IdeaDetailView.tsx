"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Idea, IdeaComment, Profile } from "@/types";
import { toggleLikeAction, addCommentAction, deleteIdeaAction } from "@/app/(dashboard)/actions/ideas";
import { formatDate } from "@/lib/utils";
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
  { id: "01", name: "THE IDEA", desc: "Core spark & initial thesis" },
  { id: "02", name: "THE PROBLEM", desc: "Contextual friction & bottleneck" },
  { id: "03", name: "THE POSSIBILITY", desc: "Architectural blueprint & stack" },
  { id: "04", name: "PEOPLE", desc: "Creator & resonance network" },
  { id: "05", name: "RELATED SPARKS", desc: "Adjacent domain nodes" },
  { id: "06", name: "COLLABORATE", desc: "Peer critique & participation" },
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
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

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
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono uppercase tracking-[0.24em]">
              IDEA // {currentIdea.category}
            </span>
            <span className="text-xs font-mono text-neutral-500">
              Published {formatDate(currentIdea.created_at)}
            </span>
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
            {currentIdea.problem || currentIdea.description.split("\n\n")[0] || currentIdea.description}
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
            {currentIdea.solution || currentIdea.description.split("\n\n")[1] || currentIdea.description}
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

      {/* DIMENSION 04: PEOPLE & RESONANCE */}
      <section className="relative py-24 px-6 sm:px-12 max-w-5xl mx-auto space-y-8 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-400">
          <span className="text-cyan-400 font-bold">SECTION 04 //</span>
          <span>INNOVATORS & RESONANCE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
          <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0a0c13] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              ORIGINATOR
            </span>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-bold text-lg">
                {(idea.author?.full_name || "I").charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-base font-light text-white">{idea.author?.full_name || "Innovator"}</h4>
                <p className="text-xs font-mono text-neutral-400">@{idea.author?.username || "creator"}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0a0c13] space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              COMMUNITY GRAVITY
            </span>
            <div className="space-y-1">
              <span className="text-3xl font-mono font-light text-white">{likesCount}</span>
              <p className="text-xs text-neutral-400 font-light">Innovators endorsed this proposition</p>
            </div>
          </div>
        </div>
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
              No critique notes recorded yet. Be the first to analyze this thesis.
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
