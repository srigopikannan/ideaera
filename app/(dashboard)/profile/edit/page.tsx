import { getCurrentUserProfile } from "@/services/profile";
import { EditProfileForm } from "@/components/profile/EditProfileForm";

export const metadata = {
  title: "Edit Profile — IdeaEra",
  description: "Update your public profile, skills, and links.",
};

export default async function EditProfilePage() {
  const profile = await getCurrentUserProfile();

  return <EditProfileForm initialProfile={profile} />;
}
