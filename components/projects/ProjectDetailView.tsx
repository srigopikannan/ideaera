"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Project,
  Profile,
  ProjectTask,
  ProjectMilestone,
  ProjectMember,
  ProjectFile,
  ProjectDiscussion,
  ProjectActivity,
  SkillGapAnalysis,
} from "@/types";
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
  LifeBuoy,
} from "lucide-react";
import { Github } from "@/components/ui/brand-icons";
import {
  deleteProjectAction,
  joinProjectAction,
  leaveProjectAction,
} from "@/app/(dashboard)/actions/projects";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import { ProjectRescueBanner } from "@/components/projects/ProjectRescueBanner";
import { ProjectRescueModal } from "@/components/projects/ProjectRescueModal";
import { SkillGapFinder } from "@/components/projects/SkillGapFinder";
import { ProjectWorkspace } from "@/components/projects/ProjectWorkspace";
import { cn } from "@/lib/utils";

interface ProjectDetailViewProps {
  project: Project;
  currentUser?: Profile | null;
  workspaceData?: {
    project: Project;
    tasks: ProjectTask[];
    milestones: ProjectMilestone[];
    members: ProjectMember[];
    files: ProjectFile[];
    discussions: ProjectDiscussion[];
    activity: ProjectActivity[];
    skill_gaps: SkillGapAnalysis;
    progress: number;
  };
}

export function ProjectDetailView({
  project,
  currentUser,
  workspaceData,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [currentProject, setCurrentProject] = React.useState<Project>(project);
  const isOwner = Boolean(currentUser?.id && currentProject.owner_id === currentUser.id);
  const isMember = Boolean(
    currentUser?.id &&
      (currentProject.members?.some((m) => m.user_id === currentUser.id) ||
        workspaceData?.members?.some((m) => m.user_id === currentUser.id))
  );

  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isRescueModalOpen, setIsRescueModalOpen] = React.useState(false);
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
    {
      id: "02",
      name: "ARCHITECTURE",
      subtitle: "Spec & Modules",
      done: isLaunched || isBeta || isBuilding,
    },
    { id: "03", name: "BUILD & BETA", subtitle: "Active Codebase", done: isLaunched || isBeta },
    { id: "04", name: "LAUNCH", subtitle: "Live System Deployment", done: isLaunched },
  ];

  return (
    <div className="relative w-full min-h-screen pb-32 select-none overflow-x-hidden">
      {/* Sticky Progression HUD */}
      <div className="sticky top-4 z-40 px-3.5 sm:px-6 max-w-6xl mx-auto flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl shadow-2xl">
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
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {currentProject.website_url && (
            <a
              href={currentProject.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-all shadow-xl"
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
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-mono text-neutral-300 hover:text-white border border-white/10 bg-[#0a0c13]/80 backdrop-blur-xl shadow-lg transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Code</span>
            </a>
          )}

          {/* Project Rescue Button for Owner */}
          {isOwner && (
            <>
              {currentProject.needs_help ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono text-rose-300 bg-rose-500/20 border border-rose-500/30">
                  <LifeBuoy className="h-3.5 w-3.5 animate-pulse text-rose-400" />
                  <span>Rescue Active</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRescueModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-rose-300 hover:text-white border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 backdrop-blur-xl shadow-lg transition-colors"
                >
                  <LifeBuoy className="h-3.5 w-3.5 text-rose-400" />
                  <span>Needs Help</span>
                </button>
              )}
            </>
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono text-red-400 hover:text-red-300 border border-red-500/20 bg-[#0a0c13]/80 backdrop-blur-xl shadow-lg transition-colors"
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
      <section className="relative min-h-[40vh] sm:min-h-[50vh] flex flex-col justify-center px-4 sm:px-12 max-w-6xl mx-auto space-y-6 sm:space-y-8 pt-8">
        <div className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="px-3.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono uppercase tracking-[0.24em]">
              VENTURE // {currentProject.status.replace("_", " ")}
            </span>
            {currentProject.needs_help && (
              <span className="px-3 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-mono font-bold tracking-wide shadow-lg shadow-rose-600/30 animate-pulse">
                🚨 Needs Help: {currentProject.help_category || "Assistance"}
              </span>
            )}
            <span className="text-xs font-mono text-neutral-500">
              Forged {formatDate(currentProject.created_at)}
            </span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-extralight tracking-tight text-white leading-[1.05] break-words">
            {currentProject.name}
          </h1>

          <p className="text-sm sm:text-lg text-neutral-300 font-light leading-relaxed whitespace-pre-line break-words">
            {currentProject.description}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="h-9 w-9 rounded-full bg-indigo-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-bold text-sm overflow-hidden shrink-0">
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
            <div className="min-w-0">
              <Link
                href={`/people/${currentProject.owner?.username || "creator"}`}
                className="text-sm font-light text-white hover:text-emerald-300 transition-colors block truncate"
              >
                {currentProject.owner?.full_name || "Lead Architect"}
              </Link>
              <span className="text-[11px] font-mono text-neutral-500 truncate block">
                @{currentProject.owner?.username || "creator"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 🚨 FEATURE 1: PROJECT RESCUE BANNER */}
      {currentProject.needs_help && (
        <div className="px-4 sm:px-12 max-w-6xl mx-auto pt-6">
          <ProjectRescueBanner
            project={currentProject}
            currentUser={currentUser}
            onResolved={() => {
              setCurrentProject((prev) => ({ ...prev, needs_help: false }));
              router.refresh();
            }}
          />
        </div>
      )}

      {/* 🧩 FEATURE 2: SKILL GAP FINDER */}
      {workspaceData?.skill_gaps && (
        <div className="px-4 sm:px-12 max-w-6xl mx-auto pt-8">
          <SkillGapFinder
            projectId={currentProject.id}
            initialAnalysis={workspaceData.skill_gaps}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* 🏗️ FEATURE 5: PROJECT WORKSPACE */}
      <div className="px-4 sm:px-12 max-w-6xl mx-auto pt-10">
        <ProjectWorkspace
          project={currentProject}
          tasks={workspaceData?.tasks || []}
          milestones={workspaceData?.milestones || []}
          members={workspaceData?.members || currentProject.members || []}
          files={workspaceData?.files || []}
          discussions={workspaceData?.discussions || []}
          activity={workspaceData?.activity || []}
          currentUser={currentUser}
        />
      </div>

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

      {/* Project Rescue Request Modal */}
      <ProjectRescueModal
        projectId={currentProject.id}
        projectName={currentProject.name}
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
        onSuccess={() => {
          setCurrentProject((prev) => ({ ...prev, needs_help: true }));
          router.refresh();
        }}
      />
    </div>
  );
}
