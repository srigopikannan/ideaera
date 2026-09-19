"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createIdeaAction } from "@/app/(dashboard)/actions/ideas";
import { ArrowLeft, Sparkles, Send, Tag, Layers, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "AI & Machine Learning", color: "99, 102, 241" }, // Indigo
  { id: "Developer Tools", color: "56, 189, 248" }, // Cyan
  { id: "Climate & Sustainability", color: "16, 185, 129" }, // Emerald
  { id: "Health & Biotech", color: "52, 211, 153" }, // Mint
  { id: "Security & Cloud", color: "245, 158, 11" }, // Amber
  { id: "Web3 & Open Source", color: "168, 85, 247" }, // Purple
];

export default function CreateIdeaPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORIES[0].id);
  const [tags, setTags] = React.useState("");
  const [problem, setProblem] = React.useState("");
  const [solution, setSolution] = React.useState("");
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

    // Particles system
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

      const hasTitle = title.trim().length > 0;
      const textDensity = Math.min((problem.length + solution.length) / 100, 1);
      const col = activeCategoryConfig.color;

      // 1. Ignition Shockwave on Submit
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

      // 2. Ambient Core Glow
      const glowR = (hasTitle ? 55 + textDensity * 40 : 25) * (isSubmitting ? 1.5 : 1);
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glowGrad.addColorStop(0, "rgba(" + col + ", " + (hasTitle ? 0.4 : 0.15) + ")");
      glowGrad.addColorStop(0.7, "rgba(" + col + ", " + (hasTitle ? 0.12 : 0.03) + ")");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // 3. Stardust Accretion Particles
      particles.forEach((pt, i) => {
        pt.angle += pt.speed * (hasTitle ? 1.4 : 0.5);
        const dist = (pt.baseDist + Math.sin(t * 2 + i) * 6) * (hasTitle ? 1 + textDensity * 0.3 : 0.8);
        const px = cx + Math.cos(pt.angle) * dist;
        const py = cy + Math.sin(pt.angle) * (dist * 0.45);

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + col + ", " + (pt.alpha * (hasTitle ? 0.8 : 0.3)) + ")";
        ctx.shadowColor = "rgba(" + col + ", 0.7)";
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.restore();
      });

      // 4. Gyroscopic Coordinate Rings (Awaken when title exists)
      if (hasTitle) {
        const ringR = 48 + textDensity * 12 + Math.sin(t * 1.5) * 2;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringR, ringR * 0.38, t * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + col + ", 0.5)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 5]);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringR * 1.2, ringR * 0.42, -t * 0.6 + 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Tag Satellites
      tagList.slice(0, 6).forEach((tag, idx) => {
        const satAngle = (idx / Math.min(tagList.length, 6)) * Math.PI * 2 + t * 0.3;
        const satDist = 85 + (idx % 2) * 15;
        const sx = cx + Math.cos(satAngle) * satDist;
        const sy = cy + Math.sin(satAngle) * (satDist * 0.45);

        // Tether line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = "rgba(" + col + ", 0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();

        // Node
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(" + col + ", 0.8)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
      });

      // 6. Central Seed Nucleus (Mass grows with title & description)
      const coreR = (hasTitle ? 16 + textDensity * 10 : 8) * (isSubmitting ? 1.3 : 1);
      const coreGrad = ctx.createRadialGradient(
        cx - coreR * 0.25,
        cy - coreR * 0.25,
        1,
        cx,
        cy,
        coreR
      );
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.35, "rgba(" + col + ", 0.95)");
      coreGrad.addColorStop(0.8, "rgba(" + col + ", 0.5)");
      coreGrad.addColorStop(1, "rgba(10, 12, 19, 0.4)");

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = "rgba(" + col + ", 0.9)";
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.restore();

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
      <form onSubmit={handleSubmit} className="relative z-10 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8 my-auto py-6 sm:py-8">
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
            placeholder="Name your idea..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-center text-2xl sm:text-5xl lg:text-6xl font-extralight text-white bg-transparent placeholder:text-neutral-700 focus:outline-none tracking-tight leading-tight"
            autoFocus
            required
          />
        </div>

        {/* 2. Central Living Idea Seed Canvas Organism */}
        <div className="relative h-60 sm:h-72 w-full flex items-center justify-center pointer-events-none">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* 3. Category Shift Arc */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400 block">
              02 // THE PROBLEM STATEMENT
            </span>
            <textarea
              rows={3}
              placeholder="What friction exists in the world today?"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50 transition-all font-light resize-none"
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
              className="w-full p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50 transition-all font-light resize-none"
            />
          </div>
        </div>

        {/* 5. Satellite Tags Input */}
        <div className="max-w-md mx-auto space-y-2 text-center pt-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-500 block">
            SATELLITE TAGS
          </span>
          <input
            type="text"
            placeholder="e.g. rust, distributed-systems, zero-knowledge"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full text-center px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] text-xs font-mono text-indigo-300 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-400/50"
          />
        </div>

        {/* 6. Ignite Concept Action */}
        <div className="flex items-center justify-center pt-6">
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
