"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Lightbulb,
  FolderGit2,
  Trophy,
  Zap,
  Heart,
  MessageSquare,
  GitBranch,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card3D } from "@/components/3d/Card3D";

export function EcosystemVisualizer() {
  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Ecosystem Canvas Container */}
      <div className="relative rounded-3xl border border-border/80 bg-surface/60 backdrop-blur-2xl p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Decorative Grid Mesh & Ambient Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Section Headline */}
        <div className="text-center mb-10 relative z-10">
          <Badge variant="default" className="mb-2.5 font-bold shadow-subtle">
            The Complete Innovation Lifecycle
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            From initial brainstorm to deployed reality
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
            Everything connects seamlessly in 3D depth. Discover teammates, validate concepts, build together, and compete in hackathons.
          </p>
        </div>

        {/* Interactive 3D Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10 items-stretch">
          {/* Step 1: People */}
          <Card3D maxTilt={9} scale={1.03} className="h-full">
            <div className="h-full rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl p-4 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground tracking-wider uppercase">
                    Step 1
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">Discover People</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Filter by verified skills, collegiate background, and domain interests.
                </p>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-muted/60 border border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">Student Innovator</p>
                    <p className="text-[10px] text-muted-foreground truncate">Anna University • Final Year</p>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border font-semibold">
                    Next.js
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border font-semibold">
                    PyTorch
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border font-semibold">
                    Docker
                  </span>
                </div>
              </div>
            </div>
          </Card3D>

          {/* Step 2: Ideas */}
          <Card3D maxTilt={9} scale={1.03} className="h-full">
            <div className="h-full rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl p-4 shadow-card hover:border-amber-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shadow-sm">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground tracking-wider uppercase">
                    Step 2
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">Share Ideas</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Publish concepts, gather structured feedback, and gauge traction.
                </p>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-muted/60 border border-border/60">
                <p className="text-xs font-medium text-foreground line-clamp-2">
                  SynapseMesh: Autonomous Code Review Agents
                </p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-rose-500 font-bold">
                    <Heart className="h-3 w-3 fill-rose-500/20" /> 142
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <MessageSquare className="h-3 w-3" /> 28
                  </span>
                </div>
              </div>
            </div>
          </Card3D>

          {/* Step 3: Projects */}
          <Card3D maxTilt={9} scale={1.03} className="h-full">
            <div className="h-full rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl p-4 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
                    <FolderGit2 className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground tracking-wider uppercase">
                    Step 3
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">Build Projects</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Assemble multidisciplinary squads and showcase GitHub code.
                </p>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-muted/60 border border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">IdeaEra</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold">
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  <span>3 maintainers</span>
                </div>
              </div>
            </div>
          </Card3D>

          {/* Step 4: Hackathons */}
          <Card3D maxTilt={9} scale={1.03} className="h-full">
            <div className="h-full rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl p-4 shadow-card hover:border-amber-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shadow-sm">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground tracking-wider uppercase">
                    Step 4
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">Hackathons</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Compete in 195+ collegiate cups across Tamil Nadu & India.
                </p>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-muted/60 border border-border/60">
                <p className="text-xs font-bold text-foreground truncate">
                  Anna Univ Kurukshetra
                </p>
                <p className="text-[10px] text-amber-500 font-bold mt-0.5">₹3,50,000 in Prizes</p>
                <div className="mt-2 text-[10px] font-extrabold text-emerald-500 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Registration
                </div>
              </div>
            </div>
          </Card3D>

          {/* Step 5: Collaboration */}
          <Card3D maxTilt={9} scale={1.03} className="h-full">
            <div className="h-full rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl p-4 shadow-card hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shadow-sm">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground tracking-wider uppercase">
                    Step 5
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">Smart Matching</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  Transparent compatibility scores based on verified skills.
                </p>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-muted/60 border border-border/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Synergy Score</span>
                  <span className="text-xs font-extrabold text-emerald-500">96%</span>
                </div>
                <div className="w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full w-[96%]" />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1.5 truncate">
                  AI, Systems & UI alignment
                </p>
              </div>
            </div>
          </Card3D>
        </div>

        {/* Live CTA Strip inside Visualizer */}
        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">195 verified collegiate hackathons actively tracked</span>
          </div>
          <Link
            href="/match"
            className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
          >
            Find your match in 60 seconds <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
