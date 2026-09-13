import { db } from "@/db";
import { messages, profiles } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

type Message = typeof messages.$inferSelect;

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
) {
  await db.insert(messages).values({
    sender_id: senderId,
    receiver_id: receiverId,
    content,
  });

  return { success: true };
}

export async function getConversations(userId: string) {
  const allMessages: Message[] = await db.query.messages.findMany({
    where: or(
      eq(messages.sender_id, userId),
      eq(messages.receiver_id, userId)
    ),
    orderBy: [desc(messages.created_at)],
    limit: 100,
  });

  const conversations = new Map<
    string,
    {
      lastMessage: Message;
      messages: Message[];
    }
  >();

  allMessages.forEach((msg: Message) => {
    const partnerId =
      msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        lastMessage: msg,
        messages: [],
      });
    }

    conversations.get(partnerId)!.messages.push(msg);
  });

  const results: {
    partner: typeof profiles.$inferSelect | undefined;
    lastMessage: Message;
    unreadCount: number;
  }[] = [];

  for (const [partnerId, data] of conversations.entries()) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, partnerId),
    });

    results.push({
      partner: profile,
      lastMessage: data.lastMessage,
      unreadCount: data.messages.filter(
        (m: Message) =>
          m.receiver_id === userId && !m.is_read
      ).length,
    });
  }

  return results.sort(
    (a, b) =>
      b.lastMessage.created_at.getTime() -
      a.lastMessage.created_at.getTime()
  );
}

export async function getChatMessages(
  userId: string,
  partnerId: string
) {
  return await db.query.messages.findMany({
    where: and(
      or(
        and(
          eq(messages.sender_id, userId),
          eq(messages.receiver_id, partnerId)
        ),
        and(
          eq(messages.sender_id, partnerId),
          eq(messages.receiver_id, userId)
        )
      )
    ),
    orderBy: [desc(messages.created_at)],
  });
}

export async function markMessagesAsRead(
  userId: string,
  partnerId: string
) {
  await db
    .update(messages)
    .set({ is_read: true })
    .where(
      and(
        eq(messages.receiver_id, userId),
        eq(messages.sender_id, partnerId),
        eq(messages.is_read, false)
      )
    );

  return { success: true };
}