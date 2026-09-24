"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createIdeaAction } from "@/app/(dashboard)/actions/ideas";
import {
  ArrowLeft,
  Sparkles,
  Send,
  Tag,
  Layers,
  Compass,
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
    desc: "Visible in open ecosystem directory & discovery feeds",
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

  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0].id);
  const [tags, setTags] = React.useState("");
  const [problem, setProblem] = React.useState("");
  const [solution, setSolution] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "community" | "selected" | "private">("public");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

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

    let animationFrameId: number;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = canvas.parentElement?.clientHeight || 250;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Pulse Radius depends on filled content
      const contentRatio = Math.min(
        (title.length * 1.5 + problem.length * 0.5 + solution.length * 0.5) / 100,
        2
      );
      const baseRadius = 25 + contentRatio * 15;
      const pulse = Math.sin(angle * 2) * 4;
      const currentRadius = Math.max(baseRadius + pulse, 15);

      // Color based on active category
      const [r, g, b] = activeCategoryConfig.color.split(",").map((s) => s.trim());

      // Outer ethereal halo
      const gradOuter = ctx.createRadialGradient(cx, cy, 5, cx, cy, currentRadius * 3.5);
      gradOuter.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
      gradOuter.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.08)`);
      gradOuter.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = gradOuter;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Kinetic orbit rings
      const rings = 3;
      for (let i = 0; i < rings; i++) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.25 - i * 0.06})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const rx = currentRadius * (1.6 + i * 0.5);
        const ry = currentRadius * (0.8 + i * 0.3);
        ctx.ellipse(cx, cy, rx, ry, angle * (i % 2 === 0 ? 0.7 : -0.7), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Center core star
      const gradCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentRadius);
      gradCore.addColorStop(0, "#ffffff");
      gradCore.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.9)`);
      gradCore.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = gradCore;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // Satellite sparkles based on tags
      tagList.forEach((_, idx) => {
        const satAngle = angle * (1.2 + idx * 0.3) + (idx * Math.PI * 2) / Math.max(tagList.length, 1);
        const dist = currentRadius * (1.8 + (idx % 2) * 0.4);
        const sx = cx + Math.cos(satAngle) * dist;
        const sy = cy + Math.sin(satAngle) * (dist * 0.6);

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 1)`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      angle += 0.015;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [title, problem, solution, category, activeCategoryConfig, tagList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a name for your concept.");
      return;
    }

    const effectiveProblem = problem.trim();
    const effectiveSolution = solution.trim();
    const effectiveDescription =
      effectiveProblem && effectiveSolution
        ? `${effectiveProblem}\n\n${effectiveSolution}`
        : effectiveProblem || effectiveSolution || title.trim();

    if (!effectiveDescription) {
      setError("Please articulate the problem space or your proposed solution.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("tags", tags.trim());
    formData.append("problem", effectiveProblem);
    formData.append("solution", effectiveSolution);
    formData.append("description", effectiveDescription);
    formData.append("visibility", visibility);
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
        router.push("/ideas");
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
          href="/ideas"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit Idea Lab</span>
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
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono text-center">
            {error}
          </div>
        )}

        {/* 1. Fluid Title Input */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-neutral-500 block">
            01 // IDEA PROPOSITION
          </span>
          <input
            type="text"
            placeholder="Name your breakthrough idea..."
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
                "px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 border",
                category === cat.id
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105 font-medium"
                  : "bg-white/[0.03] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
              )}
            >
              {cat.id}
            </button>
          ))}
        </div>

        {/* 4. Deep Articulation Cards (Problem Space vs Solution Horizon) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {/* Problem Dimension */}
          <div className="rounded-3xl border border-white/10 bg-[#0d0f18]/80 backdrop-blur-xl p-5 sm:p-6 space-y-3 hover:border-white/20 transition-colors group">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="uppercase tracking-[0.2em] text-[10px] text-amber-400 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                THE PROBLEM SPACE
              </span>
              <span>{problem.length} chars</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-light">
              What friction, bottleneck, or unsolved dilemma does this address?
            </p>
            <textarea
              rows={4}
              placeholder="Describe the real-world frustration or limitation that exists today..."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400/40 transition-colors resize-none font-light leading-relaxed"
            />
          </div>

          {/* Solution Dimension */}
          <div className="rounded-3xl border border-white/10 bg-[#0d0f18]/80 backdrop-blur-xl p-5 sm:p-6 space-y-3 hover:border-white/20 transition-colors group">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="uppercase tracking-[0.2em] text-[10px] text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                THE SOLUTION HORIZON
              </span>
              <span>{solution.length} chars</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-light">
              How does your product, algorithm, or methodology resolve this?
            </p>
            <textarea
              rows={4}
              placeholder="Outline the mechanism, architectural thesis, or user experience..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/40 transition-colors resize-none font-light leading-relaxed"
            />
          </div>
        </div>

        {/* 5. Capability Resonance & Tags */}
        <div className="rounded-3xl border border-white/10 bg-[#0d0f18]/80 backdrop-blur-xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-cyan-400" />
              CAPABILITIES & SKILLS REQUIRED
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Comma separated</span>
          </div>
          <input
            type="text"
            placeholder="e.g. Next.js, Rust, Distributed Systems, UI/UX Design, LLMs"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400/40 transition-colors font-light"
          />

          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tagList.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-mono text-cyan-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 6. Idea Protection & Visibility Architecture */}
        <div className="rounded-3xl border border-white/10 bg-[#0d0f18]/80 backdrop-blur-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white">
                IDEAERA IP SAFEGUARD & VISIBILITY
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              SHA-256 Timestamp Protection Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {VISIBILITIES.map((v) => {
              const Icon = v.icon;
              const isSelected = visibility === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVisibility(v.id)}
                  className={cn(
                    "p-3.5 rounded-2xl text-left border transition-all relative flex flex-col justify-between",
                    isSelected
                      ? "bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                      : "bg-white/[0.02] border-white/5 hover:border-white/15"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-4 w-4", isSelected ? "text-white" : "text-neutral-400")} />
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">{v.label}</span>
                    <span className="text-[10px] text-neutral-400 font-light block mt-0.5 leading-tight">
                      {v.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-neutral-500 font-light flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-neutral-400 shrink-0" />
            Your idea is cryptographically registered with immutable versioning. You can modify visibility or invite specific collaborators at any time.
          </p>
        </div>

        {/* Submit Action */}
        <div className="pt-4 flex items-center justify-center">
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
