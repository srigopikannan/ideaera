import { getCurrentUserProfile } from "@/services/profile";
import { getProjectsByUserId } from "@/services/projects";
import { getIdeasByUserId } from "@/services/ideas";
import { getConnectedUsersForProfile } from "@/services/social";
import { ProfileView } from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your Profile — IdeaEra",
  description: "View and manage your IdeaEra professional profile.",
};

export default async function CurrentUserProfilePage() {
  const currentUser = await getCurrentUserProfile();

  // Fast targeted queries strictly for this user instead of full table scans
  const [userProjects, userIdeas, connections] = await Promise.all([
    getProjectsByUserId(currentUser.id),
    getIdeasByUserId(currentUser.id),
    getConnectedUsersForProfile(currentUser.id),
  ]);

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
