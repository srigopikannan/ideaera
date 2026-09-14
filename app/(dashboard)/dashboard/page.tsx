import { getCurrentUserProfile, getAllProfiles } from "@/services/profile";
import { getIdeas } from "@/services/ideas";
import { getHackathons } from "@/services/hackathons";
import { LivingIdeaSpace } from "@/components/dashboard/LivingIdeaSpace";

export default async function DashboardPage() {
  const [currentUser, people, ideas, hackathons] = await Promise.all([
    getCurrentUserProfile(),
    getAllProfiles(),
    getIdeas(undefined, "trending"),
    getHackathons("upcoming"),
  ]);

  const currentUserId = currentUser?.id || "";
  const recommendedPeople = people.filter((p) => p.id !== currentUserId);

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
