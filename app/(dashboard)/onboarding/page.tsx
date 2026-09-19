import { redirect } from "next/navigation";
import { getCurrentUserProfile, getColleges } from "@/services/profile";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Setup Your Profile — IdeaEra",
  description: "Complete your innovator profile setup on IdeaEra.",
};

export default async function OnboardingPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const colleges = await getColleges();

  return <OnboardingWizard initialProfile={profile} initialColleges={colleges} />;
}
