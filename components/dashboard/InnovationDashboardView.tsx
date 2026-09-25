"use client";

import * as React from "react";
import Link from "next/link";
import {
  PersonalInnovationDashboard,
  Profile,
  NextStepRecommendation,
} from "@/types";
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  LifeBuoy,
  Rocket,
  Users,
  Trophy,
  Target,
  Plus,
  Compass,
  FolderGit2,
  Lightbulb,
  ShieldCheck,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InnovationDashboardViewProps {
  currentUser: Profile;
  dashboard: PersonalInnovationDashboard;
}

export function InnovationDashboardView({
  currentUser,
  dashboard,
}: InnovationDashboardViewProps) {
  const firstName = currentUser.full_name
    ? currentUser.full_name.split(" ")[0]
    : "Innovator";

  const { ideas, projects, team, hackathons, skills, badges, next_steps } = dashboard;

  return (
    <div className="space-y-10 pb-16">
      {/* 🎯 SECTION 1: "YOUR NEXT STEP" RECOMMENDATION ENGINE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Autonomous Guidance Engine // Your Next Step</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500">
            {next_steps.length} recommended actions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {next_steps.map((step) => {
            const priorityConfig = {
              high: {
                badge: "bg-rose-500/10 text-rose-300 border-rose-500/30",
                border: "hover:border-rose-500/30",
                icon: AlertCircle,
              },
              medium: {
                badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
                border: "hover:border-amber-500/30",
                icon: Clock,
              },
              low: {
                badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
                border: "hover:border-cyan-500/30",
                icon: Compass,
              },
            }[step.priority];

            const PriorityIcon = priorityConfig.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  "p-5 rounded-3xl border border-white/[0.08] bg-[#0c0e17] flex flex-col justify-between space-y-4 transition-all duration-300 group shadow-lg",
                  priorityConfig.border
                )}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider",
                        priorityConfig.badge
                      )}
                    >
                      <PriorityIcon className="h-3 w-3" />
                      <span>{step.priority} Priority</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      {step.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors leading-snug">
                    {step.title}
                  </h4>

                  <p className="text-xs text-neutral-400 font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <Link
                  href={step.action_url}
                  className="inline-flex items-center justify-between w-full px-4 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-white transition-all group-hover:border-white/20"
                >
                  <span>{step.action_label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 📊 SECTION 2: TOP METRICS OVERVIEW STRIP */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c0e17] space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500">My Ideas</span>
          <p className="text-2xl font-light text-white font-mono">{ideas.total_count}</p>
          <span className="text-[10px] font-mono text-emerald-400">
            {ideas.validated_count} Validated
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c0e17] space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500">Active Ventures</span>
          <p className="text-2xl font-light text-white font-mono">{projects.active.length}</p>
          <span className="text-[10px] font-mono text-indigo-400">
            {projects.completed.length} Launched
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c0e17] space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500">Rescue Alerts</span>
          <p className="text-2xl font-light text-rose-400 font-mono">
            {projects.needs_help.length}
          </p>
          <span className="text-[10px] font-mono text-neutral-500">Need Help</span>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c0e17] space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500">Collaborators</span>
          <p className="text-2xl font-light text-white font-mono">{team.collaborators_count}</p>
          <span className="text-[10px] font-mono text-neutral-500">Network</span>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c0e17] space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500">Badges Earned</span>
          <p className="text-2xl font-light text-amber-300 font-mono">
            {badges?.summary?.total_earned || 0}
          </p>
          <span className="text-[10px] font-mono text-amber-400/80">
            {badges?.summary?.prestige_score || 0} Score
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-white/[0.06] bg-[#0c0e17] space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500">Hackathons</span>
          <p className="text-2xl font-light text-white font-mono">{hackathons.total_count}</p>
          <span className="text-[10px] font-mono text-neutral-500">Participated</span>
        </div>
      </section>

      {/* 💡 SECTION 3: MY IDEAS & VALIDATION STATE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-indigo-400" />
              <span>My Innovation Concepts & Signal Strength</span>
            </h3>
            <p className="text-xs font-mono text-neutral-400">
              Track peer critique, problem verification, and convert validated ideas to projects.
            </p>
          </div>
          <Link
            href="/ideas/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>New Idea</span>
          </Link>
        </div>

        {ideas.created.length === 0 ? (
          <div className="p-8 rounded-3xl border border-white/[0.06] bg-[#0c0e17] text-center space-y-3">
            <Lightbulb className="h-8 w-8 text-neutral-600 mx-auto" />
            <p className="text-xs font-mono text-neutral-400">
              You haven&apos;t published any ideas yet.
            </p>
            <Link
              href="/ideas/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold"
            >
              Plant Your First Idea
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.created.slice(0, 6).map((idea) => {
              const valStatus = idea.validation_status || "not_validated";
              const valBadge = {
                validated: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                testing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                not_validated: "bg-amber-500/10 text-amber-400 border-amber-500/30",
              }[valStatus];

              return (
                <div
                  key={idea.id}
                  className="p-5 rounded-3xl border border-white/[0.08] bg-[#0c0e17] flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        {idea.category}
                      </span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider",
                          valBadge
                        )}
                      >
                        {valStatus.replace("_", " ")}
                      </span>
                    </div>

                    <h4 className="text-base font-light text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                      {idea.title}
                    </h4>

                    <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500">{idea.comments_count} critiques</span>
                    <Link
                      href={`/ideas/${idea.id}`}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                    >
                      <span>Manage Validation</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 🏗️ SECTION 4: MY PROJECTS & WORKSPACE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light text-white flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-emerald-400" />
              <span>My Project Workspaces & Delivery Velocity</span>
            </h3>
            <p className="text-xs font-mono text-neutral-400">
              Active engineering boards, task completion status, and rescue alerts.
            </p>
          </div>
          <Link
            href="/projects/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 hover:border-white/20 text-xs font-mono text-neutral-200 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>New Project</span>
          </Link>
        </div>

        {projects.active.length === 0 && projects.completed.length === 0 ? (
          <div className="p-8 rounded-3xl border border-white/[0.06] bg-[#0c0e17] text-center space-y-3">
            <FolderGit2 className="h-8 w-8 text-neutral-600 mx-auto" />
            <p className="text-xs font-mono text-neutral-400">
              No active project workspaces yet.
            </p>
            <Link
              href="/projects/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold"
            >
              Start a Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...projects.active, ...projects.completed].slice(0, 6).map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-3xl border border-white/[0.08] bg-[#0c0e17] flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                      {proj.status.replace("_", " ")}
                    </span>
                    {proj.needs_help && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30 animate-pulse">
                        🚨 Needs Help
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-light text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {proj.name}
                  </h4>

                  {proj.needs_help && proj.help_description && (
                    <p className="text-xs font-mono text-rose-300/90 line-clamp-1 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                      Blocked: {proj.help_description}
                    </p>
                  )}

                  {/* Real progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                      <span>Delivery Velocity</span>
                      <span className="text-white font-medium">{proj.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${proj.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">
                    {proj.completed_tasks_count || 0}/{proj.tasks_count || 0} tasks
                  </span>
                  <Link
                    href={`/projects/${proj.id}`}
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🧩 SECTION 5: COMPETENCIES & PERFORMANCE BADGES */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Badges Panel */}
        <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h4 className="text-base font-light text-white flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Performance Badges</span>
              </h4>
              <p className="text-xs font-mono text-neutral-400">
                Verified milestones achieved across IdeaEra.
              </p>
            </div>
            <Link
              href="/profile"
              className="text-xs font-mono text-amber-400 hover:underline"
            >
              View All
            </Link>
          </div>

          {badges?.earned && badges.earned.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.earned.slice(0, 6).map((b: any) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl border border-white/[0.06] bg-[#090b12] text-center space-y-1.5"
                >
                  <div className="h-8 w-8 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-xs">
                    ★
                  </div>
                  <span className="text-xs font-medium text-white block truncate">{b.name}</span>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                    {b.tier} Tier
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-white/[0.04] bg-[#090b12] text-center space-y-2">
              <p className="text-xs font-mono text-neutral-500">
                No badges earned yet. Publish ideas, complete tasks, and collaborate to unlock badges.
              </p>
            </div>
          )}
        </div>

        {/* Skills & Capability Radar */}
        <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h4 className="text-base font-light text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-cyan-400" />
                <span>Skills & Venture Alignment</span>
              </h4>
              <p className="text-xs font-mono text-neutral-400">
                Competency inventory vs venture requirements.
              </p>
            </div>
            <Link
              href="/profile/edit"
              className="text-xs font-mono text-cyan-400 hover:underline"
            >
              Edit Skills
            </Link>
          </div>

          <div className="space-y-4">
            {/* My Skills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-neutral-500">
                My Skills ({skills.profile_skills.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skills.profile_skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Gap Skills in Active Projects */}
            {skills.gap_skills && skills.gap_skills.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                <span className="text-[10px] font-mono uppercase text-rose-400">
                  Missing Skill Gaps in Active Projects ({skills.gap_skills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.gap_skills.map((gap) => (
                    <Link
                      key={gap}
                      href={`/people?skill=${encodeURIComponent(gap)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono hover:bg-rose-500/20 transition-colors"
                    >
                      <span>{gap}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
