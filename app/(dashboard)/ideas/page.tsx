import { getIdeas } from "@/services/ideas";
import { IdeasExplorer } from "@/components/ideas/IdeasExplorer";
import { IdeaFieldAtmosphere } from "@/components/ideas/IdeaFieldAtmosphere";

export const metadata = {
  title: "Discover Ideas — Idea Era",
  description: "Explore the living idea universe and observe resonance in 3D coordinate space.",
};

export default async function IdeasPage() {
  const ideas = await getIdeas();

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background Starfield Canvas */}
      <IdeaFieldAtmosphere />

      {/* Full-Viewport Living Idea Field */}
      <IdeasExplorer initialIdeas={ideas} />
    </div>
  );
}
