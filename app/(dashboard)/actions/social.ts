"use server";

import {
  sendConnectionRequest,
  updateConnectionStatus,
  removeConnection,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createIdeaSuggestionNotification,
  createPeopleSuggestionNotification,
} from "@/services/social";
import {
  sendMessage,
  getMessages,
  markMessagesDelivered,
  markConversationAsRead,
} from "@/services/messaging";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction() {
  return await getNotifications();
}

export async function requestConnectionAction(targetUserId: string, connectionType: "public" | "private" = "private") {
  const result = await sendConnectionRequest(targetUserId, connectionType);
  revalidatePath("/people");
  revalidatePath("/connections");
  revalidatePath("/match");
  revalidatePath("/notifications");
  return { success: true, connection: result };
}

export async function updateConnectionAction(connectionId: string, status: "accepted" | "rejected") {
  await updateConnectionStatus(connectionId, status);
  revalidatePath("/connections");
  revalidatePath("/people");
  revalidatePath("/notifications");
  revalidatePath("/messages");
  return { success: true };
}

export async function removeConnectionAction(connectionId: string) {
  await removeConnection(connectionId);
  revalidatePath("/connections");
  revalidatePath("/people");
  return { success: true };
}

export async function sendMessageAction(receiverId: string, content: string) {
  if (!content || content.trim().length === 0) {
    return { error: "Message cannot be empty." };
  }

  const msg = await sendMessage(receiverId, content.trim());
  revalidatePath("/messages");
  revalidatePath(`/messages/${receiverId}`);
  return { success: true, message: msg };
}

export async function getMessagesAction(userId: string) {
  const msgs = await getMessages(userId);
  return { success: true, messages: msgs };
}

export async function markMessagesDeliveredAction(messageIds?: string[]) {
  const success = await markMessagesDelivered(messageIds);
  return { success };
}

export async function markConversationReadAction(otherUserId: string) {
  const success = await markConversationAsRead(otherUserId);
  return { success };
}

export async function markNotificationReadAction(notificationId: string) {
  await markNotificationAsRead(notificationId);
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  await markAllNotificationsAsRead();
  revalidatePath("/notifications");
  return { success: true };
}

export async function createIdeaSuggestionAction(userId: string, ideaId: string) {
  await createIdeaSuggestionNotification(userId, ideaId);
  revalidatePath("/notifications");
  return { success: true };
}

export async function createPeopleSuggestionAction(userId: string, targetUserId: string, reason?: string) {
  await createPeopleSuggestionNotification(userId, targetUserId, reason);
  revalidatePath("/notifications");
  return { success: true };
}
