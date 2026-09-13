import { db } from "@/db";
import { notifications, profiles } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function createNotification(userId: string, type: string, message: string, entityId?: string) {
  await db.insert(notifications).values({
    user_id: userId,
    type,
    message,
    entity_id: entityId,
  });
}

export async function getUserNotifications(userId: string) {
  return await db.query.notifications.findMany({
    where: eq(notifications.user_id, userId),
    orderBy: [desc(notifications.created_at)],
  });
}

export async function markNotificationAsRead(notificationId: string) {
  await db.update(notifications)
    .set({ is_read: true })
    .where(eq(notifications.id, notificationId));

  return { success: true };
}

export async function markAllNotificationsAsRead(userId: string) {
  await db.update(notifications)
    .set({ is_read: true })
    .where(eq(notifications.user_id, userId));

  return { success: true };
}

// Helper to wrap connection requests with notifications
export async function notifyConnectionRequest(requester: { full_name: string; id: string }, receiverId: string) {
  await createNotification(receiverId, "connection_request", `${requester.full_name} sent you a connection request`, requester.id);
}

export async function notifyConnectionAccepted(receiver: { full_name: string; id: string }, requesterId: string) {
  await createNotification(requesterId, "connection_accepted", `${receiver.full_name} accepted your connection request`, receiver.id);
}
