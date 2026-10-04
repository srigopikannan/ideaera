import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIdeaReports } from "@/services/ideas";
import { ModerationDashboard } from "@/components/moderation/ModerationDashboard";
import { Profile } from "@/types";

export const metadata = {
  title: "Idea Moderation // IdeaEra",
  description: "Administrative moderation and idea copying report resolution.",
};

export default async function ModerationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Strict role-based access control for administrative actions
  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    redirect("/dashboard");
  }

  const initialReports = await getIdeaReports();

  return (
    <ModerationDashboard
      initialReports={initialReports}
      currentUser={profile as Profile}
    />
  );
}
