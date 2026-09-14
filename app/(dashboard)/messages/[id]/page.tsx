import { getConversations, getMessages } from "@/services/messaging";
import { MessagingInterface } from "@/components/messages/MessagingInterface";

export const metadata = {
  title: "Conversation — IdeaEra",
  description: "Direct messaging thread on IdeaEra.",
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [conversations, initialMessages] = await Promise.all([
    getConversations(),
    getMessages(id),
  ]);

  return (
    <div className="space-y-4">
      <MessagingInterface
        conversations={conversations}
        activeUserId={id}
        initialMessages={initialMessages}
      />
    </div>
  );
}
