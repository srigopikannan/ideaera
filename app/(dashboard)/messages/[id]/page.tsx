import {
  getConversations,
  getMessages,
  getAllMessageableUsers,
  getUserForMessaging,
} from "@/services/messaging";
import { getCurrentUserProfile } from "@/services/profile";
import { MessagingInterface } from "@/components/messages/MessagingInterface";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserForMessaging(id);
  if (!user) {
    return { title: "Conversation — IdeaEra" };
  }
  return {
    title: `Chat with ${user.full_name} — IdeaEra`,
    description: `Direct messaging thread with ${user.full_name} on IdeaEra.`,
  };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUserProfile();
  if (!currentUser || currentUser.id === "guest") {
    redirect("/login");
  }

  const { id } = await params;
  const targetUser = await getUserForMessaging(id);

  if (!targetUser || targetUser.id === currentUser.id) {
    redirect("/messages");
  }

  const [conversations, people, initialMessages] = await Promise.all([
    getConversations(),
    getAllMessageableUsers(currentUser.id),
    getMessages(targetUser.id),
  ]);

  return (
    <div className="space-y-4">
      <MessagingInterface
        conversations={conversations}
        people={people}
        currentUserId={currentUser.id}
        activeUserId={targetUser.id}
        activeUser={targetUser}
        initialMessages={initialMessages}
      />
    </div>
  );
}
