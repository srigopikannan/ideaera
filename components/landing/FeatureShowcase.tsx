"use client";

import Link from "next/link";
import { Users, Lightbulb, Trophy, ArrowRight, CheckCircle2, Sparkles, Code2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card3D } from "@/components/3d/Card3D";

export function FeatureShowcase() {
  return (
    <div className="py-20 space-y-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. Discover People & Form Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Users className="h-3.5 w-3.5" />
            <span>Talent Discovery</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Find people who complement your technical gaps.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Stop searching across disjointed forum threads. Discover designers, distributed systems engineers, AI builders, and founders with verified collegiate background, GitHub code, and live project contributions.
          </p>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Multi-skill filtering across Next.js, PyTorch, Rust, and UI/UX</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Dedicated Tamil Nadu and Pan-India collegiate innovator circuits</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Direct hackathon squad invites without recruiter spam</span>
            </li>
          </ul>
          <div className="pt-2">
            <Link href="/people">
              <Button variant="default" className="shadow-subtle">
                Browse Directory <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Visual Preview Box - Innovator Squad Card (No Mock Name) */}
        <Card3D maxTilt={7} scale={1.02} glare={true} className="rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-xl p-6 shadow-elevated space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Verified Innovator Profile
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">
              Available for Squad
            </span>
          </div>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Code2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-foreground">Student Innovator & Builder</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">⭐ TN</span>
              </div>
              <p className="text-xs font-semibold text-primary mt-0.5">Final Year CSE • CEG Anna University</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-warning" /> Chennai, Tamil Nadu
              </p>
            </div>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed bg-muted/40 p-3 rounded-xl border border-border/50">
            &ldquo;Building distributed AI agent runtimes and low-latency systems. Forming a 4-member squad for upcoming Tamil Nadu and National hackathons.&rdquo;
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border font-semibold text-foreground">Next.js</span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border font-semibold text-foreground">PyTorch</span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border font-semibold text-foreground">Rust</span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border font-semibold text-foreground">Docker</span>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border font-semibold text-foreground">PostgreSQL</span>
          </div>
        </Card3D>
      </div>

      {/* 2. Share Ideas & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
        <div className="lg:order-2 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Idea Incubation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Ideas worth building, validated before coding.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Got an ambitious product concept? Share concepts with the community to collect peer feedback, stress-test feasibility, and assemble teammates who want to build the MVP with you.
          </p>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Categorized discovery across AI, Web3, FinTech, and DevTools</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Community upvotes, structured reviews, and direct creator messaging</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span>Seamlessly transition validated ideas into Hackathon entries</span>
            </li>
          </ul>
          <div className="pt-2">
            <Link href="/ideas">
              <Button variant="default" className="shadow-subtle">
                Explore Trending Ideas <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Visual Idea Box (No Mock Author Name) */}
        <Card3D maxTilt={7} scale={1.02} glare={true} className="lg:order-1 rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-xl p-6 shadow-elevated space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
              AI & Developer Systems
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Trending #1</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            CanvasFlow: Spatial Board for Distributed System Architecture
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A real-time infinite collaborative canvas for collegiate software engineers. Transform architecture diagrams into OpenAPI specs and code manifests with live latency simulation.
          </p>
          <div className="p-3 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-black">
                IE
              </div>
              <span className="text-xs font-semibold text-foreground">IdeaEra Builder Community</span>
            </div>
            <span className="text-xs font-bold text-primary">215 upvotes • 42 reviews</span>
          </div>
        </Card3D>
      </div>

      {/* 3. Build Projects & Hackathons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold">
            <Trophy className="h-3.5 w-3.5" />
            <span>Hackathons & Projects</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Build together in public. Compete globally.
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Showcase deployed projects with live demo links and GitHub repositories. Form teams to register for premier collegiate hackathons across Tamil Nadu and Pan-India.
          </p>
          <div className="flex gap-3 pt-2">
            <Link href="/projects">
              <Button variant="default">View Projects</Button>
            </Link>
            <Link href="/hackathons">
              <Button variant="outline">Browse 195+ Hackathons</Button>
            </Link>
          </div>
        </div>

        {/* Flagship Hackathon Preview */}
        <Card3D maxTilt={7} scale={1.02} glare={true} className="rounded-2xl border border-border/80 bg-surface/80 backdrop-blur-xl p-6 shadow-elevated space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase flex items-center gap-1">
              ⭐ Tamil Nadu Circuit
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">
              🟢 Registration Open
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Anna University CEG Kurukshetra Hackathon 2026
          </h3>
          <p className="text-xs text-muted-foreground">
            CEG Anna University, Guindy, Chennai • In-Person Collegiate Battle
          </p>
          <div className="p-3.5 rounded-xl bg-muted/60 border border-border/80 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Prize Pool</span>
            <span className="text-sm font-black text-amber-500">₹3,50,000 Cash + Fellowships</span>
          </div>
        </Card3D>
      </div>
    </div>
  );
}
