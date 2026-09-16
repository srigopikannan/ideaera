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

  return inserted;
}

export async function updateConnectionStatus(connectionId: string, status: "accepted" | "rejected"): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", connectionId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeConnection(connectionId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("connections").delete().eq("id", connectionId);
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

  const currentSkills = new Set(profile.skills?.map((s) => s.toLowerCase()) || []);
  const currentInterests = new Set(profile.interests?.map((i) => i.toLowerCase()) || []);

  const recommendations: MatchRecommendation[] = candidates.map((candidate) => {
    const candSkills = candidate.skills || [];
    const candInterests = candidate.interests || [];

    const sharedSkills = candSkills.filter((s) => currentSkills.has(s.toLowerCase()));
    const sharedInterests = candInterests.filter((i) => currentInterests.has(i.toLowerCase()));

    const skillScore = Math.min(sharedSkills.length * 20, 50);
    const interestScore = Math.min(sharedInterests.length * 20, 40);
    const baseSynergy = 10;
    const matchScore = Math.min(skillScore + interestScore + baseSynergy, 98);

    let matchReason = "";
    if (sharedInterests.length > 0 && sharedSkills.length > 0) {
      matchReason = `You both focus on ${sharedInterests.slice(0, 2).join(" & ")} and share core proficiency in ${sharedSkills[0]}.`;
    } else if (sharedInterests.length > 0) {
      matchReason = `High alignment on ${sharedInterests.join(", ")} innovation domains.`;
    } else if (sharedSkills.length > 0) {
      matchReason = `Complementary technical expertise with shared ${sharedSkills.join(", ")} capabilities.`;
    } else {
      matchReason = "Mutual synergy across adjacent technology initiatives.";
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
