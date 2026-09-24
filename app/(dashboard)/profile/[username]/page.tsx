import { notFound } from "next/navigation";
import { getProfileByUsername, getCurrentUserProfile } from "@/services/profile";
import { getProjectsByUserId } from "@/services/projects";
import { getIdeasByUserId } from "@/services/ideas";
import { getConnectedUsersForProfile } from "@/services/social";
import { getUserBadgesWithProgress } from "@/services/badges";
import { ProfileView } from "@/components/profile/ProfileView";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile Not Found — IdeaEra" };
  return {
    title: `${profile.full_name} (@${profile.username}) — IdeaEra`,
    description: profile.headline || profile.bio || "IdeaEra Member",
  };
}

export default async function ProfileByUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, currentUser] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUserProfile(),
  ]);

  if (!profile) {
    notFound();
  }

  const isCurrentUser = currentUser.username.toLowerCase() === profile.username.toLowerCase();

  // Fast targeted queries strictly for this profile
  const [userProjects, userIdeas, connections, badgesResult] = await Promise.all([
    getProjectsByUserId(profile.id),
    getIdeasByUserId(profile.id),
    getConnectedUsersForProfile(profile.id),
    getUserBadgesWithProgress(profile.id, isCurrentUser),
  ]);

  return (
    <ProfileView
      profile={profile}
      isCurrentUser={isCurrentUser}
      projects={userProjects}
      ideas={userIdeas}
      connections={connections.slice(0, 3)}
      badgesResult={badgesResult}
    />
  );
}
