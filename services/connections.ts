import { db } from "@/db";
import { connections, profiles } from "@/db/schema";
import { eq, and, or, ne } from "drizzle-orm";

export async function sendConnectionRequest(requesterId: string, receiverId: string) {
  if (requesterId === receiverId) throw new Error("You cannot connect with yourself");

  const existing = await db.query.connections.findFirst({
    where: or(
      and(eq(connections.requester_id, requesterId), eq(connections.receiver_id, receiverId)),
      and(eq(connections.requester_id, receiverId), eq(connections.receiver_id, requesterId))
    ),
  });

  if (existing) {
    if (existing.status === "accepted") return { success: true, message: "Already connected" };
    throw new Error("Connection request already exists");
  }

  await db.insert(connections).values({
    requester_id: requesterId,
    receiver_id: receiverId,
    status: "pending",
  });

  return { success: true };
}

export async function respondToConnection(userId: string, requesterId: string, status: "accepted" | "rejected") {
  await db.update(connections)
    .set({ status, updated_at: new Date() })
    .where(and(
      eq(connections.receiver_id, userId),
      eq(connections.requester_id, requesterId)
    ));

  return { success: true };
}

export async function removeConnection(userId: string, targetUserId: string) {
  await db.delete(connections).where(
    or(
      and(eq(connections.requester_id, userId), eq(connections.receiver_id, targetUserId)),
      and(eq(connections.requester_id, targetUserId), eq(connections.receiver_id, userId))
    )
  );

  return { success: true };
}

export async function getConnections(userId: string) {
  const allConnections = await db.query.connections.findMany({
    where: or(
      eq(connections.requester_id, userId),
      eq(connections.receiver_id, userId)
    ),
  });

  const accepted = allConnections.filter(c => c.status === "accepted");
  const pendingRequests = allConnections.filter(c => c.status === "pending" && c.receiver_id === userId);
  const sentRequests = allConnections.filter(c => c.status === "pending" && c.requester_id === userId);

  const connectedProfiles = await Promise.all(
    accepted.map(async (c) => {
      const targetId = c.requester_id === userId ? c.receiver_id : c.requester_id;
      const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, targetId) });
      return profile;
    })
  );

  return {
    connections: connectedProfiles.filter(Boolean),
    pendingRequests,
    sentRequests,
  };
}
