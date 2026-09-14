import { getCurrentUserProfile } from "@/services/profile";
import { getProjects } from "@/services/projects";
import { getIdeas } from "@/services/ideas";
import { getAllProfiles } from "@/services/profile";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata = {
  title: "Your Profile — IdeaEra",
  description: "View and manage your IdeaEra professional profile.",
};

export default async function CurrentUserProfilePage() {
  const currentUser = await getCurrentUserProfile();
  const [allProjects, allIdeas, allPeople] = await Promise.all([
    getProjects(),
    getIdeas(),
    getAllProfiles(),
  ]);

  const userProjects = allProjects.filter(
    (p) => p.owner_id === currentUser.id || p.members?.some((m) => m.user_id === currentUser.id)
  );
  const userIdeas = allIdeas.filter((i) => i.author_id === currentUser.id);
  const connections = allPeople.filter(
    (p) => p.id !== currentUser.id && p.connection_status === "connected"
  );

  return (
    <ProfileView
      profile={currentUser}
      isCurrentUser={true}
      projects={userProjects}
      ideas={userIdeas}
      connections={connections}
    />
  );
}
