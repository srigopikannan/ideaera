import { createClient } from "@/lib/supabase/server";
import { Message, Conversation, Profile } from "@/types";

export async function getConversations(): Promise<Conversation[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (data && !error) {
        // Group by partner
        const convMap = new Map<string, Conversation>();
        for (const msg of data) {
          const isSender = msg.sender_id === user.id;
          const partner: Profile = isSender ? msg.receiver : msg.sender;
          if (!partner) continue;

          if (!convMap.has(partner.id)) {
            convMap.set(partner.id, {
              other_user: partner,
              last_message: msg,
              unread_count: !isSender && !msg.read_at ? 1 : 0,
            });
          } else if (!isSender && !msg.read_at) {
            const existing = convMap.get(partner.id)!;
            existing.unread_count += 1;
          }
        }
        return Array.from(convMap.values());
      }
    }
  } catch (err) {
    console.error("Error in getConversations:", err);
  }

  return [];
}

export async function getMessages(otherUserId: string): Promise<Message[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (data && !error) return data;
    }
  } catch (err) {
    console.error("Error in getMessages:", err);
  }

  return [];
}

export async function sendMessage(receiverId: string, content: string): Promise<Message> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to send a message.");
  }

  // Verify accepted connection exists between the two users
  const { data: conn } = await supabase
    .from("connections")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`
    )
    .eq("status", "accepted")
    .maybeSingle();

  if (!conn) {
    throw new Error("You can only message users you are connected with.");
  }

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
    })
    .select("*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)")
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

  return inserted;
}
