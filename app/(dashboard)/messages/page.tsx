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

export const metadata = {
  title: "Messages — IdeaEra",
  description: "Direct communications with collaborators, innovators, and creators.",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ user?: string }>;
}) {
  const currentUser = await getCurrentUserProfile();
  if (!currentUser || currentUser.id === "guest") {
    redirect("/login");
  }

  const [conversations, people] = await Promise.all([
    getConversations(),
    getAllMessageableUsers(currentUser.id),
  ]);

  const resolvedParams = searchParams ? await searchParams : undefined;
  const userParam = resolvedParams?.user;

  let activeUser = null;
  let activeUserId: string | undefined = undefined;

  if (userParam) {
    const resolvedUser = await getUserForMessaging(userParam);
    if (resolvedUser && resolvedUser.id !== currentUser.id) {
      activeUser = resolvedUser;
      activeUserId = resolvedUser.id;
    }
  }

  if (!activeUserId && conversations.length > 0) {
    activeUserId = conversations[0].other_user.id;
    activeUser = conversations[0].other_user;
  }

  const initialMessages = activeUserId ? await getMessages(activeUserId) : [];

  return (
    <div className="space-y-4">
      <MessagingInterface
        conversations={conversations}
        people={people}
        currentUserId={currentUser.id}
        activeUserId={activeUserId}
        activeUser={activeUser}
        initialMessages={initialMessages}
      />
    </div>
  );
}
