import { getCurrentUserProfile, getRecommendedPeople } from "@/services/profile";
import { getIdeas } from "@/services/ideas";
import { getHackathons } from "@/services/hackathons";
import { LivingIdeaSpace } from "@/components/dashboard/LivingIdeaSpace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentUserProfile();
  const currentUserId = currentUser?.id || "";

  // Parallel fetching of only the data required for the dashboard
  const [recommendedPeople, ideas, hackathons] = await Promise.all([
    getRecommendedPeople(6, currentUserId),
    getIdeas(undefined, "trending"),
    getHackathons("upcoming"),
  ]);

  return (
    <LivingIdeaSpace
      currentUser={currentUser}
      trendingIdeas={ideas}
      recommendedPeople={recommendedPeople}
      upcomingHackathons={hackathons}
      totalIdeasCount={ideas.length}
      totalPeopleCount={recommendedPeople.length}
      totalHackathonsCount={hackathons.length}
    />
  );
}
