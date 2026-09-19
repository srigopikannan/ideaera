import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentUserProfile } from "@/services/profile";
import { Connection, Notification, MatchRecommendation, Profile } from "@/types";

export async function getConnections(): Promise<{
  all: Connection[];
  incoming: Connection[];
  sent: Connection[];
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("connections")
        .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (data && !error) {
        return {
          all: data.filter((c) => c.status === "accepted"),
          incoming: data.filter((c) => c.status === "pending" && c.receiver_id === user.id),
          sent: data.filter((c) => c.status === "pending" && c.requester_id === user.id),
        };
      }
    }
  } catch (err) {
    console.error("Error in getConnections:", err);
  }

  return {
    all: [],
    incoming: [],
    sent: [],
  };
}

export async function sendConnectionRequest(targetUserId: string): Promise<Connection> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to send a connection request.");
  }

  if (targetUserId === user.id) {
    throw new Error("You cannot send a connection request to yourself.");
  }

  // Check if an existing connection exists between the two users in either direction
  const { data: existing } = await supabase
    .from("connections")
    .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    // If already accepted, return existing connection
    if (existing.status === "accepted") {
      return existing;
    }

    // If pending and target previously sent it to user, user clicking Connect auto-accepts!
    if (existing.status === "pending" && existing.receiver_id === user.id) {
      const { data: accepted, error: acceptErr } = await supabase
        .from("connections")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
        .single();

      if (!acceptErr && accepted) {
        try {
          const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
          const myName = myProfile?.full_name || "An innovator";
          await supabase.from("notifications").insert({
            user_id: existing.requester_id,
            type: "connection_accepted",
            title: "Connection Accepted",
            message: `${myName} accepted your connection signal.`,
            entity_id: user.id,
            is_read: false,
          });
        } catch {}
        return accepted;
      }
    }

    // If pending and user already sent it to target, return existing
    if (existing.status === "pending" && existing.requester_id === user.id) {
      return existing;
    }

    // If rejected, allow re-requesting
    if (existing.status === "rejected") {
      const { data: renewed, error: renewErr } = await supabase
        .from("connections")
        .update({
          requester_id: user.id,
          receiver_id: targetUserId,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
        .single();

      if (!renewErr && renewed) {
        return renewed;
      }
    }
  }

  // Insert new pending request
  const { data: inserted, error } = await supabase
    .from("connections")
    .insert({
      requester_id: user.id,
      receiver_id: targetUserId,
      status: "pending",
    })
    .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || "Failed to send connection request.");
  }

  // Notify recipient
  try {
    const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const myName = myProfile?.full_name || "An innovator";
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "connection_request",
      title: "Connection Request",
      message: `${myName} initiated a connection signal with you.`,
      entity_id: user.id,
      is_read: false,
    });
  } catch (notifErr) {
    console.error("Error creating connection notification:", notifErr);
  }

  return inserted;
}

export async function updateConnectionStatus(connectionId: string, status: "accepted" | "rejected"): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to manage connections.");
  }

  // Fetch connection to verify authorization
  const { data: connection, error: fetchError } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .eq("id", connectionId)
    .maybeSingle();

  if (fetchError || !connection) {
    throw new Error("Connection record not found.");
  }

  // Security authorization: only receiver can accept
  if (status === "accepted" && connection.receiver_id !== user.id) {
    throw new Error("Unauthorized: Only the recipient can accept a connection request.");
  }

  // Security authorization: only parties to the connection can reject/cancel
  if (status === "rejected" && connection.receiver_id !== user.id && connection.requester_id !== user.id) {
    throw new Error("Unauthorized: You are not a party to this connection.");
  }

  const { error } = await supabase
    .from("connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", connectionId);

  if (error) {
    throw new Error(error.message);
  }

  // Notify requester if accepted
  if (status === "accepted") {
    try {
      const { data: myProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const myName = myProfile?.full_name || "An innovator";
      await supabase.from("notifications").insert({
        user_id: connection.requester_id,
        type: "connection_accepted",
        title: "Connection Accepted",
        message: `${myName} accepted your connection signal.`,
        entity_id: user.id,
        is_read: false,
      });
    } catch {}
  }
}

export async function removeConnection(connectionId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to disconnect.");
  }

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("id", connectionId)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    throw new Error(error.message);
  }
}

function formatNotificationTitle(type: string): string {
  switch (type) {
    case "connection_request":
      return "Connection Request";
    case "connection_accepted":
      return "Connection Accepted";
    case "idea_like":
      return "Concept Endorsement";
    case "idea_comment":
      return "New Critique Note";
    case "project_invite":
      return "Venture Invitation";
    case "project_joined":
      return "Venture Member Joined";
    case "message":
      return "New Transmission";
    default:
      return "System Signal";
  }
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data && !error) {
        return data.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          type: r.type,
          title: r.title || formatNotificationTitle(r.type),
          message: r.message,
          related_id: r.entity_id || r.related_id || null,
          read: Boolean(r.is_read ?? r.read),
          created_at: r.created_at,
        }));
      }
    }
  } catch (err) {
    console.error("Error in getNotifications:", err);
  }

  return [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  } catch (err) {
    console.error("Error in markNotificationAsRead:", err);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    }
  } catch (err) {
    console.error("Error in markAllNotificationsAsRead:", err);
  }
}

export async function getMatchRecommendations(currentProfile?: Profile | null): Promise<MatchRecommendation[]> {
  const profile = currentProfile || (await getCurrentUserProfile());
  if (!profile) return [];

  const allProfiles = await getAllProfiles();
  const candidates = allProfiles.filter((p) => p.id !== profile.id);

  const currentSkills = new Set(profile.skills?.map((s) => s.toLowerCase().trim()) || []);
  const currentInterests = new Set(profile.interests?.map((i) => i.toLowerCase().trim()) || []);

  const headlineKeywords = (profile.headline || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const recommendations: MatchRecommendation[] = candidates.map((candidate) => {
    const candSkills = candidate.skills || [];
    const candInterests = candidate.interests || [];

    const sharedSkills = candSkills.filter((s) => currentSkills.has(s.toLowerCase().trim()));
    const sharedInterests = candInterests.filter((i) => currentInterests.has(i.toLowerCase().trim()));

    // Shared domain keywords from headline or bio
    const candText = `${candidate.headline || ""} ${candidate.bio || ""}`.toLowerCase();
    const sharedKeywords = headlineKeywords.filter((kw) => candText.includes(kw));

    // Deterministic base resonance from IDs
    let hash = 0;
    const combinedStr = `${profile.id}_${candidate.id}`;
    for (let i = 0; i < combinedStr.length; i++) {
      hash = (hash * 31 + combinedStr.charCodeAt(i)) % 1000;
    }
    // Baseline between 52 and 72 so every profile has a natural starting resonance
    const baseSynergy = 52 + (hash % 21);

    const skillScore = sharedSkills.length * 15;
    const interestScore = sharedInterests.length * 12;
    const keywordScore = Math.min(sharedKeywords.length * 8, 16);

    const matchScore = Math.min(Math.max(baseSynergy + skillScore + interestScore + keywordScore, 50), 98);

    let matchReason = "";
    if (sharedInterests.length > 0 && sharedSkills.length > 0) {
      matchReason = `You both focus on ${sharedInterests.slice(0, 2).join(" & ")} and share core proficiency in ${sharedSkills[0]}.`;
    } else if (sharedSkills.length > 0) {
      matchReason = `Complementary technical expertise with shared ${sharedSkills.slice(0, 2).join(", ")} capabilities.`;
    } else if (sharedInterests.length > 0) {
      matchReason = `High alignment on ${sharedInterests.slice(0, 2).join(", ")} innovation domains.`;
    } else if (sharedKeywords.length > 0) {
      matchReason = `Aligned background in ${sharedKeywords.slice(0, 2).join(" and ")} development.`;
    } else {
      matchReason = "Mutual synergy across adjacent technology initiatives and product domains.";
    }

    return {
      profile: candidate,
      matchScore,
      matchReason,
      sharedSkills,
      sharedInterests,
    };
  });

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}
