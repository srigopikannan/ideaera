"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SkillGapAnalysis, Profile } from "@/types";
import { setProjectRequiredSkillsAction } from "@/app/(dashboard)/actions/projects";
import {
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Edit2,
  Check,
  X,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillGapFinderProps {
  projectId: string;
  initialAnalysis: SkillGapAnalysis;
  isOwner: boolean;
}

export function SkillGapFinder({
  projectId,
  initialAnalysis,
  isOwner,
}: SkillGapFinderProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = React.useState<SkillGapAnalysis>(initialAnalysis);
  const [isEditingSkills, setIsEditingSkills] = React.useState(false);
  const [skillList, setSkillList] = React.useState<string[]>(initialAnalysis.required_skills);
  const [newSkillInput, setNewSkillInput] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setAnalysis(initialAnalysis);
    setSkillList(initialAnalysis.required_skills);
  }, [initialAnalysis]);

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const clean = newSkillInput.trim();
    if (!skillList.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSkillList([...skillList, clean]);
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillList(skillList.filter((s) => s !== skillToRemove));
  };

  const handleSaveRequiredSkills = async () => {
    setIsSaving(true);
    const res = await setProjectRequiredSkillsAction(projectId, skillList);
    setIsSaving(false);

    if (res.success) {
      setIsEditingSkills(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to update required skills.");
    }
  };

  const coverage = analysis.coverage_percentage;
  const coverageColor =
    coverage >= 80
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : coverage >= 50
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  const progressBg =
    coverage >= 80 ? "bg-emerald-400" : coverage >= 50 ? "bg-amber-400" : "bg-rose-400";

  return (
    <section className="relative p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#0c0e17] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400">
            <span className="text-cyan-400 font-bold">COMPETENCY MATRIX //</span>
            <span>SKILL GAP FINDER</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-light text-white tracking-tight">
            Team Capability vs. System Requirements
          </h3>
          <p className="text-xs text-neutral-400 font-mono">
            Automatically calculates covered competencies vs missing talent.
          </p>
        </div>

        {/* Coverage Percentage Meter & Edit Button */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "px-4 py-2 rounded-2xl border text-xs font-mono font-medium flex items-center gap-2.5",
              coverageColor
            )}
          >
            <span>Team Coverage:</span>
            <span className="text-sm font-bold">{coverage}%</span>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditingSkills(!isEditingSkills)}
              className="px-3.5 py-2 rounded-2xl border border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isEditingSkills ? "Close" : "Define Skills"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden p-0.5 border border-white/[0.04]">
          <div
            className={cn("h-full rounded-full transition-all duration-500", progressBg)}
            style={{ width: `${coverage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-neutral-500">
          <span>{analysis.team_skills.length} covered competencies</span>
          <span>{analysis.skill_gaps.length} missing skill gaps</span>
        </div>
      </div>

      {/* Owner Skill Editor Modal/Inline Panel */}
      {isEditingSkills && (
        <div className="p-5 rounded-2xl border border-cyan-500/20 bg-cyan-950/15 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-4 w-4" />
              <span>Configure Project Requirements</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {skillList.length} skills selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {skillList.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 text-xs font-mono"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Next.js, PyTorch, Figma, PostgreSQL..."
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-mono transition-colors"
            >
              Add Skill
            </button>
            <button
              type="button"
              onClick={handleSaveRequiredSkills}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-40"
            >
              {isSaving ? "Saving..." : "Save Required Skills"}
            </button>
          </div>
        </div>
      )}

      {/* 2 COLUMNS: COVERED SKILLS VS SKILL GAPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLUMN 1: COVERED SKILLS */}
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Covered by Team ({analysis.team_skills.length})</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">In-house strength</span>
          </div>

          {analysis.team_skills.length === 0 ? (
            <p className="text-xs text-neutral-500 font-mono italic p-3">
              No matching team skills detected.
            </p>
          ) : (
            <div className="space-y-2.5">
              {analysis.team_skills.map(({ skill, members }) => (
                <div
                  key={skill}
                  className="p-3 rounded-xl border border-white/[0.05] bg-[#0c0e17] flex items-center justify-between gap-3"
                >
                  <span className="text-xs font-mono text-emerald-300 font-medium">{skill}</span>

                  <div className="flex items-center gap-1.5">
                    {members.map((m) => (
                      <Link
                        key={m.id}
                        href={`/people/${m.username}`}
                        title={`${m.name} (@${m.username})`}
                        className="transition-transform hover:scale-110"
                      >
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt={m.name}
                            className="h-6 w-6 rounded-full object-cover ring-1 ring-emerald-500/30"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] flex items-center justify-center ring-1 ring-emerald-500/30">
                            {(m.name || "U")[0]}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLUMN 2: SKILL GAPS (MISSING TALENT) */}
        <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Missing Skill Gaps ({analysis.skill_gaps.length})</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Recruitment priority</span>
          </div>

          {analysis.skill_gaps.length === 0 ? (
            <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-center space-y-1">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-mono text-emerald-300">100% Skill Coverage Achieved!</p>
              <p className="text-[11px] text-neutral-400">
                Your team has covered all specified project requirements.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {analysis.skill_gaps.map((gap) => (
                <div
                  key={gap}
                  className="p-3 rounded-xl border border-rose-500/20 bg-[#0c0e17] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono text-rose-300 font-medium block">
                      {gap}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      No team member specializes in this yet
                    </span>
                  </div>

                  {/* Direct Find People Button */}
                  <Link
                    href={`/people?skill=${encodeURIComponent(gap)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono transition-colors shrink-0"
                  >
                    <Search className="h-3 w-3" />
                    <span>Find People</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
