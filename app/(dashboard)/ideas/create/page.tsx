"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createIdeaAction } from "@/app/(dashboard)/actions/ideas";
import { getProblemByIdOrSlugAction } from "@/app/(dashboard)/actions/problems";
import { CompanyProblem } from "@/types";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Tag,
  Layers,
  Compass,
  Target,
  ShieldCheck,
  Eye,
  Lock,
  Globe,
  Users,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "AI & Machine Learning", color: "99, 102, 241" }, // Indigo
  { id: "Developer Tools", color: "56, 189, 248" }, // Cyan
  { id: "Climate & Sustainability", color: "16, 185, 129" }, // Emerald
  { id: "Health & Biotech", color: "52, 211, 153" }, // Mint
  { id: "Security & Cloud", color: "245, 158, 11" }, // Amber
  { id: "Web3 & Open Source", color: "168, 85, 247" }, // Purple
];

const VISIBILITIES: {
  id: "public" | "community" | "selected" | "private";
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: "public",
    label: "Public",
    desc: "Visible in open ecosystem directory & problem showcase",
    icon: Globe,
  },
  {
    id: "community",
    label: "Community",
    desc: "Visible to verified IdeaEra innovators",
    icon: Users,
  },
  {
    id: "selected",
    label: "Selected Access",
    desc: "Visible only to invited collaborators & teammates",
    icon: Eye,
  },
  {
    id: "private",
    label: "Private",
    desc: "Strictly confidential — visible only to you",
    icon: Lock,
  },
];

function CreateIdeaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramProblemId = searchParams.get("problem_id");
  const paramCompanyId = searchParams.get("company_id");

  const [linkedProblem, setLinkedProblem] = React.useState<CompanyProblem | null>(null);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0].id);
  const [tags, setTags] = React.useState("");
  const [problem, setProblem] = React.useState("");
  const [solution, setSolution] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "community" | "selected" | "private">("public");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // If problem_id is in query params, fetch problem details to pre-seed form
  React.useEffect(() => {
    if (paramProblemId) {
      getProblemByIdOrSlugAction(paramProblemId).then((res) => {
        if (res) {
          setLinkedProblem(res);
          if (res.industry) {
            const matchingCat = CATEGORIES.find(
              (c) => c.id.toLowerCase() === res.industry.toLowerCase()
            );
            if (matchingCat) setCategory(matchingCat.id);
          }
          if (res.required_skills && res.required_skills.length > 0) {
            setTags(res.required_skills.slice(0, 4).join(", "));
          }
          if (res.summary) {
            setProblem(res.summary);
          }
        }
      });
    }
  }, [paramProblemId]);

  const activeCategoryConfig = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const tagList = React.useMemo(() => {
    return tags
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
  }, [tags]);

  // Idea Seed Animation Canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      angle: (i / particleCount) * Math.PI * 2,
      dist: 28 + Math.random() * 80,
      baseDist: 28 + Math.random() * 80,
      speed: 0.006 + Math.random() * 0.01,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.6,
    }));

    let t = 0;

    const render = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const col = activeCategoryConfig.color;

      if (isSubmitting) {
        const wave = ((t * 80) % 180) + 10;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, wave, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + col + ", " + (1 - wave / 180) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      particles.forEach((p) => {
        p.angle += p.speed;
        const x = cx + Math.cos(p.angle) * p.dist;
        const y = cy + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + col + ", " + p.alpha + ")";
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [title, problem, solution, activeCategoryConfig, tagList, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || (!problem.trim() && !solution.trim())) {
      setError("Please provide a title and describe your idea.");
      return;
    }

    const effectiveProblem = problem.trim() || "Emergent architectural opportunity.";
    const effectiveSolution = solution.trim() || "Proposed system model.";
    const effectiveDescription = effectiveProblem + "\n\n" + effectiveSolution;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("tags", tags.trim());
    formData.append("problem", effectiveProblem);
    formData.append("solution", effectiveSolution);
    formData.append("description", effectiveDescription);
    formData.append("visibility", visibility);
    if (paramProblemId) {
      formData.append("problem_id", paramProblemId);
    }
    if (paramCompanyId || linkedProblem?.company_id) {
      formData.append("company_id", paramCompanyId || linkedProblem?.company_id || "");
    }
    if (tags.trim()) {
      formData.append("skills_needed", tags.trim());
    }

    try {
      const res = await createIdeaAction(formData);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }
      setTimeout(() => {
        if (paramProblemId && linkedProblem) {
          router.push(`/problems/${linkedProblem.slug || paramProblemId}`);
        } else {
          router.push("/ideas");
        }
      }, 450);
    } catch (err: any) {
      setError(err?.message || "Failed to ignite concept.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sm:p-8 lg:p-12 select-none overflow-x-hidden">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between z-20">
        <Link
          href={paramProblemId ? `/problems/${paramProblemId}` : "/ideas"}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{paramProblemId ? "Back to Problem" : "Exit Idea Lab"}</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full border border-white/10 bg-[#0a0c13]/80 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] sm:tracking-[0.22em] text-neutral-400">
            INCUBATION CHAMBER
          </span>
        </div>
      </div>

      {/* Main Idea Lab Studio Form */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8 my-auto py-6 sm:py-8"
      >
        {/* Linked Problem Banner */}
        {linkedProblem && (
          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
                  Solving Real-World Challenge
                </span>
                <span className="text-white font-medium line-clamp-1">
                  {linkedProblem.title}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-cyan-300/80 shrink-0">
              {linkedProblem.company?.name}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* 1. Colossal Fluid Title Input */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500 block">
            01 // IDEA PROPOSITION
          </span>
          <input
            type="text"
            placeholder="Name your solution idea..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-center text-2xl sm:text-5xl lg:text-6xl font-extralight text-white bg-transparent placeholder:text-neutral-700 focus:outline-none tracking-tight leading-tight"
            autoFocus
            required
          />
        </div>

        {/* 2. Central Living Idea Seed Canvas Organism */}
        <div className="relative h-44 sm:h-56 w-full flex items-center justify-center pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* 3. Category Shift Arc */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all border",
                category === cat.id
                  ? "bg-white text-black font-semibold border-white shadow-xl scale-105"
                  : "bg-white/[0.03] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
              )}
            >
              {cat.id}
            </button>
          ))}
        </div>

        {/* 4. Integrated Editorial Blueprint Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400 block">
              02 // THE PROBLEM STATEMENT
            </span>
            <textarea
              rows={3}
              placeholder="What friction exists in the world today?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50 transition-all font-light resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400 block">
              03 // ARCHITECTURAL BLUEPRINT
            </span>
            <textarea
              rows={3}
              placeholder="How does your proposed architecture solve it?"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50 transition-all font-light resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* 5. Satellite Skills & Tags Input */}
        <div className="max-w-md mx-auto space-y-2 text-center pt-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-500 block">
            REQUIRED SKILLS & TECHNOLOGIES
          </span>
          <input
            type="text"
            placeholder="e.g. Python, CRDTs, Rust, GraphQL"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full text-center px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] text-xs font-mono text-indigo-300 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
          />
        </div>

        {/* 6. Visibility & Idea Protection System */}
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>IDEA PROTECTION & ACCESS VISIBILITY</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {VISIBILITIES.map((v) => {
              const Icon = v.icon;
              const isSelected = visibility === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVisibility(v.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all space-y-1",
                    isSelected
                      ? "border-primary bg-primary/10 text-white shadow-subtle"
                      : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span>{v.label}</span>
                  </div>
                  <p className="text-[10px] leading-tight text-neutral-400">
                    {v.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-mono text-neutral-400 italic pt-1">
            🔒 IdeaEra records platform activity, ownership information, timestamps, and version history. Private ideas remain strictly confidential.
          </p>
        </div>

        {/* 7. Ignite Concept Action */}
        <div className="flex items-center justify-center pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all shadow-2xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSubmitting ? "Igniting Concept..." : "Ignite Idea Into Orbit"}</span>
          </button>
        </div>
      </form>

      {/* Footer Philosophy Note */}
      <div className="text-center text-[10px] font-mono text-neutral-600 uppercase tracking-widest z-10">
        IDEA ERA // SYNTHESIS LAB • WHERE IDEAS BECOME POSSIBILITIES
      </div>
    </div>
  );
}

export default function CreateIdeaPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <CreateIdeaContent />
    </React.Suspense>
  );
}
