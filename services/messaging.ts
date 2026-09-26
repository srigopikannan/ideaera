import { createClient } from "@/lib/supabase/server";
import { Message, Conversation, Profile } from "@/types";
import {
  getAllProfiles,
  getProfileById,
  getProfileByUsername,
  formatProfile,
  isDeletedProfile,
} from "@/services/profile";
import { rateLimiters } from "@/lib/rate-limit";

export async function getConversations(limit: number = 50): Promise<Conversation[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const safeScanLimit = Math.min(200, Math.max(20, limit * 3));
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, receiver_id, content, created_at, delivered_at, read_at, is_read, sender:profiles!sender_id(id, full_name, username, avatar_url), receiver:profiles!receiver_id(id, full_name, username, avatar_url)"
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(safeScanLimit);

      if (data && !error) {
        // Group by partner
        const convMap = new Map<string, Conversation>();
        for (const msg of data) {
          const isSender = msg.sender_id === user.id;
          const rawPartner = isSender ? msg.receiver : msg.sender;
          if (!rawPartner || isDeletedProfile(rawPartner)) continue;

          const partner: Profile = formatProfile(rawPartner, user.id);
          const isUnread = !isSender && !msg.read_at && !msg.is_read;

          if (!convMap.has(partner.id)) {
            convMap.set(partner.id, {
              other_user: partner,
              last_message: msg as unknown as Message,
              unread_count: isUnread ? 1 : 0,
            });
          } else if (isUnread) {
            const existing = convMap.get(partner.id)!;
            existing.unread_count += 1;
          }
        }
        return Array.from(convMap.values()).slice(0, limit);
      }
    }
  } catch (err) {
    console.error("Error in getConversations:", err);
  }

  return [];
}

export async function getMessages(
  otherUserId: string,
  limit: number = 50,
  beforeTimestamp?: string
): Promise<Message[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const safeLimit = Math.min(100, Math.max(1, limit));
      let qb = supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, receiver_id, content, created_at, delivered_at, read_at, is_read, sender:profiles!sender_id(id, full_name, username, avatar_url), receiver:profiles!receiver_id(id, full_name, username, avatar_url)"
        )
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: false })
        .limit(safeLimit);

      if (beforeTimestamp) {
        qb = qb.lt("created_at", beforeTimestamp);
      }

      const { data, error } = await qb;

      if (data && !error) {
        // Mark unread messages sent to current user as read and delivered
        const nowIso = new Date().toISOString();
        try {
          await supabase
            .from("messages")
            .update({
              is_read: true,
              read_at: nowIso,
              delivered_at: nowIso,
            })
            .eq("sender_id", otherUserId)
            .eq("receiver_id", user.id)
            .is("read_at", null);
        } catch (markErr) {
          console.error("Error marking messages as read in getMessages:", markErr);
        }

        // Return in ascending chronological order for UI display
        return (data as unknown as Message[]).reverse();
      }
    }
  } catch (err) {
    console.error("Error in getMessages:", err);
  }

  return [];
}

export async function sendMessage(receiverId: string, content: string): Promise<Message> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to send a message.");
  }

  if (user.id === receiverId) {
    throw new Error("You cannot send a message to yourself.");
  }

  // Rate Limiting Protection (30 messages / min)
  const rateCheck = rateLimiters.messages.check(user.id);
  if (!rateCheck.success) {
    throw new Error("You are sending messages too quickly. Please wait a moment.");
  }

  const conversationId = [user.id, receiverId].sort().join(":");

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      conversation_id: conversationId,
      is_read: false,
      delivered_at: null,
      read_at: null,
    })
    .select(
      "id, conversation_id, sender_id, receiver_id, content, created_at, delivered_at, read_at, is_read, sender:profiles!sender_id(id, full_name, username, avatar_url), receiver:profiles!receiver_id(id, full_name, username, avatar_url)"
    )
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to send message.");
  }

  // Create message notification for receiver
  try {
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const senderName = senderProfile?.full_name || "A collaborator";
    await supabase.from("notifications").insert({
      recipient_id: receiverId,
      user_id: receiverId,
      actor_id: user.id,
      type: "message",
      title: "New Message",
      message: `${senderName}: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
      read: false,
      is_read: false,
    });
  } catch (notifErr) {
    console.error("Error creating message notification:", notifErr);
  }

  return inserted as unknown as Message;
}

export async function markMessagesDelivered(messageIds?: string[]): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const nowIso = new Date().toISOString();
    let query = supabase
      .from("messages")
      .update({ delivered_at: nowIso })
      .eq("receiver_id", user.id)
      .is("delivered_at", null);

    if (messageIds && messageIds.length > 0) {
      query = query.in("id", messageIds);
    }

    const { error } = await query;
    return !error;
  } catch (err) {
    console.error("Error in markMessagesDelivered:", err);
    return false;
  }
}

export async function markConversationAsRead(otherUserId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: nowIso,
        delivered_at: nowIso,
      })
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .is("read_at", null);

    return !error;
  } catch (err) {
    console.error("Error in markConversationAsRead:", err);
    return false;
  }
}

export async function getAllMessageableUsers(currentUserId?: string): Promise<Profile[]> {
  try {
    const supabase = await createClient();
    let qb = supabase
      .from("profiles")
      .select("id, full_name, username, headline, bio, avatar_url, skills, city, state, country, show_location")
      .order("created_at", { ascending: false })
      .limit(50);

    if (currentUserId) {
      qb = qb.neq("id", currentUserId);
    }

    const { data, error } = await qb;
    if (data && !error) {
      return data.filter((p) => !isDeletedProfile(p)).map((p) => formatProfile(p, currentUserId));
    }
  } catch (err) {
    console.error("Error in getAllMessageableUsers:", err);
  }

  return [];
}

export async function getUserForMessaging(identifier: string): Promise<Profile | null> {
  try {
    const cleanId = decodeURIComponent(identifier).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    if (isUuid) {
      const p = await getProfileById(cleanId);
      if (p) return p;
    }
    return await getProfileByUsername(cleanId);
  } catch (err) {
    console.error("Error in getUserForMessaging:", err);
    return null;
  }
}
