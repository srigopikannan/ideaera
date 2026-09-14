import { notFound } from "next/navigation";
import { getProfileByUsername, getCurrentUserProfile } from "@/services/profile";
import { getProjects } from "@/services/projects";
import { getIdeas } from "@/services/ideas";
import { getAllProfiles } from "@/services/profile";
import { ProfileView } from "@/components/profile/ProfileView";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Person Not Found — IdeaEra" };
  return {
    title: `${profile.full_name} (@${profile.username}) — IdeaEra`,
    description: profile.headline || profile.bio || "Innovator on IdeaEra",
  };
}

export default async function PeopleUsernamePage({
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
  const [allProjects, allIdeas, allPeople] = await Promise.all([
    getProjects(),
    getIdeas(),
    getAllProfiles(),
  ]);

  const userProjects = allProjects.filter(
    (p) => p.owner_id === profile.id || p.members?.some((m) => m.user_id === profile.id)
  );
  const userIdeas = allIdeas.filter((i) => i.author_id === profile.id);
  const connections = allPeople.filter((p) => p.id !== profile.id).slice(0, 3);

  return (
    <ProfileView
      profile={profile}
      isCurrentUser={isCurrentUser}
      projects={userProjects}
      ideas={userIdeas}
      connections={connections}
    />
  );
}
