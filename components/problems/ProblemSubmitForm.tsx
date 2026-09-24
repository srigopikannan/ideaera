"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Company, ProblemDifficulty, ProblemSourceType, ProblemType } from "@/types";
import { createProblemAction } from "@/app/(dashboard)/actions/problems";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Target,
  Building2,
  ShieldCheck,
  Sparkles,
  Layers,
  Send,
  Loader2,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemSubmitFormProps {
  companies: Company[];
}

const INDUSTRIES = [
  "Software & SaaS",
  "Developer Tools",
  "Fintech",
  "Consumer Tech",
  "Web3 & Cloud",
  "Artificial Intelligence",
  "Biotechnology",
  "Hardware & Robotics",
];

const DIFFICULTIES: ProblemDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

const PROBLEM_TYPES: { label: string; value: ProblemType }[] = [
  { label: "Real-World Problem", value: "real_world_problem" },
  { label: "Technical Challenge", value: "technical_challenge" },
  { label: "Innovation Challenge", value: "innovation_challenge" },
  { label: "Hackathon Challenge", value: "hackathon_challenge" },
];

export function ProblemSubmitForm({ companies }: ProblemSubmitFormProps) {
  const router = useRouter();

  const [companyId, setCompanyId] = React.useState(companies[0]?.id || "");
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [industry, setIndustry] = React.useState(INDUSTRIES[0]);
  const [difficulty, setDifficulty] = React.useState<ProblemDifficulty>("Intermediate");
  const [problemType, setProblemType] = React.useState<ProblemType>("real_world_problem");
  const [sourceType] = React.useState<ProblemSourceType>("community");
  const [sourceTitle, setSourceTitle] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [skillsInput, setSkillsInput] = React.useState("");
  const [skillsList, setSkillsList] = React.useState<string[]>([
    "TypeScript",
    "PostgreSQL",
    "Distributed Systems",
  ]);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
      setSkillsInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill(skillsInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !summary.trim() || !description.trim() || !companyId) {
      setError("Please provide a title, summary, description, and company.");
      return;
    }

    if (skillsList.length === 0) {
      setError("Please add at least one required skill.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createProblemAction({
        company_id: companyId,
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim(),
        industry,
        difficulty,
        problem_type: problemType,
        source_type: sourceType,
        source_title: sourceTitle.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
        required_skills: skillsList,
      });

      if (res.error || !res.problem) {
        setError(res.error || "Failed to submit problem.");
        setIsSubmitting(false);
        return;
      }

      router.push(`/problems/${res.problem.slug || res.problem.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to submit problem.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Problems</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-card space-y-8">
        <div className="space-y-2 border-b border-border pb-6">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Target className="h-4 w-4" />
            <span>Contribute Friction Points</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Submit a Real-World Problem
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Highlight an engineering challenge, architectural bottleneck, or customer friction point. Your problem will be published as a Community Challenge for innovators to solve.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Target Company / Ecosystem</span>
              <Link href="/companies/create" className="text-primary hover:underline text-[11px]">
                + Register New Company
              </Link>
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full text-sm rounded-xl border border-border bg-muted/60 p-3 text-foreground focus:outline-none focus:border-primary"
              required
            >
              {companies.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} ({comp.industry} • {comp.location})
                </option>
              ))}
            </select>
          </div>

          {/* Problem Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Problem Title</label>
            <Input
              type="text"
              placeholder="e.g. Edge Function Cold Starts Under Bursty Global Workloads"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 text-sm"
              required
            />
          </div>

          {/* Industry & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-muted/60 p-3 text-foreground focus:outline-none"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as ProblemDifficulty)}
                className="w-full text-xs rounded-xl border border-border bg-muted/60 p-3 text-foreground focus:outline-none"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Challenge Type</label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value as ProblemType)}
                className="w-full text-xs rounded-xl border border-border bg-muted/60 p-3 text-foreground focus:outline-none"
              >
                {PROBLEM_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Executive Summary (1-2 sentences)
            </label>
            <Input
              type="text"
              placeholder="A concise summary of what makes this challenge worth solving..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="h-11 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Detailed Problem Description & Technical Scope
            </label>
            <textarea
              rows={6}
              placeholder="Describe the real-world friction point, technical constraints, existing attempts, and target outcomes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-border bg-muted/60 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none leading-relaxed"
              required
            />
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Required Capabilities & Skills
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Type a skill and hit Enter (e.g. Python, CRDTs, Rust, GraphQL)..."
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={handleKeyDownSkill}
                className="h-10 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddSkill(skillsInput)}
                className="h-10 text-xs font-semibold shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-mono flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-foreground text-primary/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Source Attribution & Disclaimer */}
          <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-foreground">
                Community Challenge Attribution
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This submission will be marked with the disclaimer:{" "}
              <span className="italic">
                &ldquo;Community Challenge — Not officially affiliated with this company.&rdquo;
              </span>{" "}
              Please provide the public engineering blog post, bug bounty page, or conference talk URL where you encountered this problem.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                type="text"
                placeholder="Source Title (e.g. Zoho Tech Blog / Whitepaper)"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                className="h-9 text-xs"
              />
              <Input
                type="url"
                placeholder="Source URL (e.g. https://...)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Link href="/problems">
              <Button type="button" variant="ghost" size="sm" className="text-xs">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="gap-2 font-semibold shadow-subtle"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing Challenge...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Publish Problem</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
