import { getCurrentUserProfile } from "@/services/profile";
import { getMatchRecommendations } from "@/services/social";
import { CollaboratorMatcher } from "@/components/match/CollaboratorMatcher";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collaborator Matching — IdeaEra",
  description: "Find your next co-founder or technical collaborator through transparent skill and domain alignment.",
};

export default async function MatchPage() {
  const currentUser = await getCurrentUserProfile();
  const recommendations = await getMatchRecommendations(currentUser);

  return <CollaboratorMatcher initialRecommendations={recommendations} />;
}
