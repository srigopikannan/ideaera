"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project, Profile } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Globe,
  Users,
  Calendar,
  Code2,
  Trash2,
  ArrowUpRight,
  Check,
  CircleDot,
  Rocket,
  Edit3,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Github } from "@/components/ui/brand-icons";
import {
  deleteProjectAction,
  joinProjectAction,
  leaveProjectAction,
} from "@/app/(dashboard)/actions/projects";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import { cn } from "@/lib/utils";

interface ProjectDetailViewProps {
  project: Project;
  currentUser: Profile;
}

export function ProjectDetailView({ project, currentUser }: ProjectDetailViewProps) {
  const router = useRouter();
  const [currentProject, setCurrentProject] = React.useState<Project>(project);
  const isOwner = Boolean(currentUser?.id && currentProject.owner_id === currentUser.id);
  const isMember = Boolean(
    currentUser?.id && currentProject.members?.some((m) => m.user_id === currentUser.id)
  );

  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [isJoining, setIsJoining] = React.useState(false);
  const [joinMessage, setJoinMessage] = React.useState<string | null>(null);

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

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteProjectAction(currentProject.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        router.push("/projects");
        router.refresh();
      } else {
        setDeleteError(res.error || "Failed to delete project.");
      }
    } catch (err: any) {
      setDeleteError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUser?.id) {
      router.push(`/login?redirectedFrom=/projects/${currentProject.id}`);
      return;
    }
    setIsJoining(true);
    setJoinMessage(null);
    try {
      const res = await joinProjectAction(currentProject.id);
      if (res.success) {
        setCurrentProject((prev) => ({
          ...prev,
          members: [
            ...(prev.members || []),
            {
              project_id: prev.id,
              user_id: currentUser.id,
              role: "Collaborator",
              joined_at: new Date().toISOString(),
              user: currentUser,
            },
          ],
        }));
        setJoinMessage("Successfully joined this venture team!");
        setTimeout(() => setJoinMessage(null), 3000);
        router.refresh();
      } else {
        setJoinMessage(res.error || "Failed to join project.");
      }
    } catch (err: any) {
      setJoinMessage(err?.message || "Failed to join project.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsJoining(true);
    setJoinMessage(null);
    try {
      const res = await leaveProjectAction(currentProject.id);
      if (res.success) {
        setCurrentProject((prev) => ({
          ...prev,
          members: (prev.members || []).filter((m) => m.user_id !== currentUser?.id),
        }));
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  };

  const isLaunched = currentProject.status === "launched";
  const isBeta = currentProject.status === "beta";
  const isBuilding = currentProject.status === "in_development";

  const stages = [
    { id: "01", name: "GENESIS", subtitle: "Conceptual Thesis", done: true },
    { id: "02", name: "ARCHITECTURE", subtitle: "Spec & Modules", done: isLaunched || isBeta || isBuilding },
    { id: "03", name: "BUILD & BETA", subtitle: "Active Codebase", done: isLaunched || isBeta },
    { id: "04", name: "LAUNCH", subtitle: "Live System Deployment", done: isLaunched },
  ];

  return (
    <div className="relative w-full min-h-screen pb-32 select-none">
      {/* Sticky Progression HUD */}
      <div className="sticky top-4 z-40 px-6 max-w-6xl mx-auto flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Systems Landscape</span>
          </Link>

          <div className="h-3 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider text-emerald-300 uppercase">
              PROJECT EVOLUTION
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          {currentProject.website_url && (
            <a
              href={currentProject.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-xl"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Live System</span>
            </a>
          )}

          {currentProject.repository_url && (
            <a
              href={currentProject.repository_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-neutral-300 hover:text-white border border-white/10 bg-[#0a0c13]/80 backdrop-blur-xl shadow-lg transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Code</span>
            </a>
          )}

          {isOwner ? (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-300 hover:text-white border border-emerald-500/30 bg-[#0a0c13]/80 backdrop-blur-xl shadow-lg transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-red-400 hover:text-red-300 border border-red-500/20 bg-[#0a0c13]/80 backdrop-blur-xl shadow-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : isMember ? (
            <button
              onClick={handleLeave}
              disabled={isJoining}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-neutral-300 hover:text-red-300 border border-white/10 hover:border-red-500/30 bg-[#0a0c13]/80 backdrop-blur-xl shadow-lg transition-colors disabled:opacity-50"
            >
              {isJoining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>Collaborating (Leave)</span>
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono text-white bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50"
            >
              {isJoining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              <span>Join Venture</span>
            </button>
          )}
        </div>
      </div>

      {joinMessage && (
        <div className="fixed top-20 right-6 z-50 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono shadow-2xl animate-fade-in backdrop-blur-xl">
          {joinMessage}
        </div>
      )}

      {/* Project Hero Dimension */}
      <section className="relative min-h-[75vh] flex flex-col justify-center px-6 sm:px-12 max-w-6xl mx-auto space-y-8">
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono uppercase tracking-[0.24em]">
              VENTURE // {currentProject.status.replace("_", " ")}
            </span>
            <span className="text-xs font-mono text-neutral-500">
              Forged {formatDate(currentProject.created_at)}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extralight tracking-tight text-white leading-[1.05]">
            {currentProject.name}
          </h1>

          <p className="text-base sm:text-xl text-neutral-300 font-light leading-relaxed whitespace-pre-line">
            {currentProject.description}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-bold text-sm overflow-hidden">
              {currentProject.owner?.avatar_url ? (
                <img
                  src={currentProject.owner.avatar_url}
                  alt={currentProject.owner.full_name || "Owner"}
                  className="h-full w-full object-cover"
                />
              ) : (
                (currentProject.owner?.full_name || "O").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <Link
                href={`/people/${currentProject.owner?.username || "creator"}`}
                className="text-sm font-light text-white hover:text-emerald-300 transition-colors block"
              >
                {currentProject.owner?.full_name || "Lead Architect"}
              </Link>
              <span className="text-[11px] font-mono text-neutral-500">
                @{currentProject.owner?.username || "creator"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* VISUAL EVOLUTION TIMELINE SPINE */}
      <section className="py-12 px-6 sm:px-12 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl border border-white/[0.08] bg-[#0a0c13] space-y-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono uppercase tracking-[0.26em] text-white">
                THE EVOLUTION SPINE
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              START ●────────●────────●────────● LAUNCH
            </span>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 relative">
            {stages.map((stage) => (
              <div key={stage.id} className="space-y-3 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center border text-xs font-mono transition-all",
                      stage.done
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                        : "border-white/10 bg-white/[0.02] text-neutral-600"
                    )}
                  >
                    {stage.done ? <Check className="h-4 w-4" /> : stage.id}
                  </div>
                  <span className="text-xs font-mono text-white font-medium">{stage.name}</span>
                </div>
                <p className="text-[11px] font-light text-neutral-400 pl-10">
                  {stage.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Framework Modules */}
      {currentProject.technologies && currentProject.technologies.length > 0 && (
        <section className="py-8 px-6 sm:px-12 max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
            <Code2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>TECHNOLOGY ARTIFACTS</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {currentProject.technologies.map((t) => (
              <span
                key={t}
                className="px-4 py-2 rounded-2xl border border-white/10 bg-white/[0.02] text-xs font-mono text-neutral-300"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Venture Team & Collaborators */}
      <section className="py-8 px-6 sm:px-12 max-w-6xl mx-auto space-y-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span>CORE CREW & COLLABORATORS</span>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {1 + (currentProject.members?.length || 0)} Crew Members
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {/* Owner Card */}
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold overflow-hidden">
                {currentProject.owner?.avatar_url ? (
                  <img
                    src={currentProject.owner.avatar_url}
                    alt={currentProject.owner.full_name || "Lead"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (currentProject.owner?.full_name || "L").charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <Link
                  href={`/people/${currentProject.owner?.username || "creator"}`}
                  className="text-sm font-medium text-white hover:text-emerald-300 transition-colors"
                >
                  {currentProject.owner?.full_name || "Lead Architect"}
                </Link>
                <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Lead Architect</span>
                </p>
              </div>
            </div>
          </div>

          {/* Members */}
          {currentProject.members &&
            currentProject.members.map((m) => (
              <div
                key={m.user_id}
                className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-bold overflow-hidden">
                    {m.user?.avatar_url ? (
                      <img
                        src={m.user.avatar_url}
                        alt={m.user.full_name || "Member"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (m.user?.full_name || "M").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/people/${m.user?.username || "builder"}`}
                      className="text-sm font-medium text-white hover:text-indigo-300 transition-colors"
                    >
                      {m.user?.full_name || "Builder"}
                    </Link>
                    <p className="text-[11px] font-mono text-neutral-400">
                      {m.role || "Collaborator"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Venture"
        description={'Are you sure you want to permanently delete "' + currentProject.name + '"? This action cannot be undone.'}
        isDeleting={isDeleting}
        error={deleteError}
      />

      {/* Edit Venture Modal */}
      <EditProjectModal
        project={currentProject}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={(updated) => {
          setCurrentProject((prev) => ({ ...prev, ...updated }));
          router.refresh();
        }}
      />
    </div>
  );
}
