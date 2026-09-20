import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/services/social";
import { NotificationsFeed } from "@/components/notifications/NotificationsFeed";

export const metadata: Metadata = {
  title: "Notifications | IdeaEra",
  description: "View connection requests, activity signals, and community alerts.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotifications();

  return (
    <NotificationsFeed
      initialNotifications={notifications}
      currentUserId={user.id}
    />
  );
}
