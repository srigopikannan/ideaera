"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import * as connService from "@/services/connections";
import * as msgService from "@/services/messaging";
import * as notifService from "@/services/notifications";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function requestConnectionAction(targetUserId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await connService.sendConnectionRequest(user.id, targetUserId);

    const targetProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetUserId),
    });

    if (targetProfile) {
      await notifService.notifyConnectionRequest(targetProfile, targetUserId);
    }

    revalidatePath("/people");
    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return { success: false, error: errorMessage };
  }
}

export async function respondToConnectionAction(
  requesterId: string,
  status: "accepted" | "rejected"
) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await connService.respondToConnection(user.id, requesterId, status);

    if (status === "accepted") {
      const receiverProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, user.id),
      });

      if (receiverProfile) {
        await notifService.notifyConnectionAccepted(
          receiverProfile,
          requesterId
        );
      }
    }

    revalidatePath("/people");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return { success: false, error: errorMessage };
  }
}

export async function sendDirectMessageAction(
  receiverId: string,
  content: string
) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await msgService.sendMessage(user.id, receiverId, content);

    const senderProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
    });

    if (senderProfile) {
      await notifService.createNotification(
        receiverId,
        "message",
        `${senderProfile.full_name} sent you a message`,
        senderProfile.id
      );
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return { success: false, error: errorMessage };
  }
}

export async function markReadAction(partnerId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await msgService.markMessagesAsRead(user.id, partnerId);

  return { success: true };
}

export async function removeConnectionAction(targetUserId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    await connService.removeConnection(user.id, targetUserId);

    revalidatePath("/people");

    return { success: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return { success: false, error: errorMessage };
  }
}

export async function getMyConnectionsAction() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await connService.getConnections(user.id);
}

export async function getChatHistoryAction(partnerId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await msgService.getChatMessages(user.id, partnerId);
}

export async function getNotificationsAction() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return await notifService.getUserNotifications(user.id);
}

export async function markNotificationReadAction(notificationId: string) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await notifService.markNotificationAsRead(notificationId);

  return { success: true };
}