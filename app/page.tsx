import { CinematicCanvas } from "@/components/3d/CinematicCanvas";
import { LandingNav } from "@/components/landing/LandingNav";
import { LivingIdeaBeacon } from "@/components/landing/LivingIdeaBeacon";
import { ScrollTimelineSpine } from "@/components/landing/ScrollTimelineSpine";
import { CinematicHero } from "@/components/landing/CinematicHero";
import { SceneOrigin } from "@/components/landing/SceneOrigin";
import { SceneDiscovery } from "@/components/landing/SceneDiscovery";
import { SceneConnection } from "@/components/landing/SceneConnection";
import { SceneCollaboration } from "@/components/landing/SceneCollaboration";
import { SceneShowcase } from "@/components/landing/SceneShowcase";
import { SceneFinalCTA } from "@/components/landing/SceneFinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#050608] text-white selection:bg-amber-500/30 selection:text-white overflow-x-hidden">
      {/* Persistent Multi-Layer Parallax 3D WebGL Canvas */}
      <CinematicCanvas />

      {/* The Traveling Living Idea Beacon (Continuity Element) */}
      <LivingIdeaBeacon />

      {/* Editorial Timeline Spine Milestone Indicator */}
      <ScrollTimelineSpine />

      {/* Navigation Layer */}
      <LandingNav />

      {/* Editorial Content Layers */}
      <main className="relative z-10 flex flex-col">
        <CinematicHero />
        <SceneOrigin />
        <SceneDiscovery />
        <SceneConnection />
        <SceneCollaboration />
        <SceneShowcase />
        <SceneFinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
