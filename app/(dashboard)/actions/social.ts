"use server";

import {
  sendConnectionRequest,
  updateConnectionStatus,
  removeConnection,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/social";
import { sendMessage } from "@/services/messaging";
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

export async function markNotificationReadAction(notificationId: string) {
  await markNotificationAsRead(notificationId);
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  await markAllNotificationsAsRead();
  return { success: true };
}
