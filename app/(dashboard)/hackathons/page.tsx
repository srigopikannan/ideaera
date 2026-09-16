import { getHackathons } from "@/services/hackathons";
import { HackathonsExplorer } from "@/components/hackathons/HackathonsExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hackathons & Sprints — IdeaEra",
  description: "Discover global hackathons, form squads, and compete for grants and prizes.",
};

export default async function HackathonsPage() {
  const hackathons = await getHackathons();

  return <HackathonsExplorer initialHackathons={hackathons} />;
}
