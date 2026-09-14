import { getConversations, getMessages } from "@/services/messaging";
import { MessagingInterface } from "@/components/messages/MessagingInterface";

export const metadata = {
  title: "Messages — IdeaEra",
  description: "Direct communications with collaborators and creators.",
};

export default async function MessagesPage() {
  const conversations = await getConversations();
  const initialUserId = conversations[0]?.other_user.id;
  const initialMessages = initialUserId ? await getMessages(initialUserId) : [];

  return (
    <div className="space-y-4">
      <MessagingInterface
        conversations={conversations}
        activeUserId={initialUserId}
        initialMessages={initialMessages}
      />
    </div>
  );
}
