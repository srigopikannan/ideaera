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

export async function sendConnectionRequest(
  targetUserId: string,
  connectionType: "public" | "private" = "private"
): Promise<Connection> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to send a connection request.");
  }

  if (targetUserId === user.id) {
    throw new Error("You cannot send a connection request to yourself.");
  }

  // Validate User B exists
  const { data: targetProfile, error: targetErr } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetErr || !targetProfile) {
    throw new Error("Target user profile does not exist.");
  }

  console.log(`[CONNECTION] sender: ${user.id}, receiver: ${targetUserId}, type: ${connectionType}`);

  // Fetch sender profile for notification message
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .maybeSingle();
  const senderName = senderProfile?.full_name || "An innovator";

  // Check if an existing connection exists between the two users in either direction
  const { data: existing } = await supabase
    .from("connections")
    .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    // If already accepted, return existing connection (no duplicate)
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
        console.log(`[NOTIFICATION] recipient: ${existing.requester_id}, actor: ${user.id}, connection: ${accepted.id}`);
        const { error: notifErr } = await supabase.from("notifications").insert({
          recipient_id: existing.requester_id,
          user_id: existing.requester_id,
          actor_id: user.id,
          connection_id: accepted.id,
          entity_id: accepted.id,
          type: "connection_accepted",
          title: "Connection Accepted",
          message: `${senderName} accepted your connection request.`,
          read: false,
          is_read: false,
        });
        if (notifErr) {
          console.error("[NOTIFICATION ERROR]", notifErr);
        }
        return accepted;
      }
    }

    // If pending and user already sent it to target, return existing (no duplicate)
    if (existing.status === "pending" && existing.requester_id === user.id) {
      return existing;
    }

    // If rejected, allow re-requesting
    if (existing.status === "rejected") {
      const isPublic = connectionType === "public";
      const newStatus = isPublic ? "accepted" : "pending";
      const { data: renewed, error: renewErr } = await supabase
        .from("connections")
        .update({
          requester_id: user.id,
          receiver_id: targetUserId,
          status: newStatus,
          connection_type: connectionType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
        .single();

      if (!renewErr && renewed) {
        const notifType = isPublic ? "connection_accepted" : "connection_request";
        const notifTitle = isPublic ? "New Connection" : "Connection Request";
        const notifMessage = isPublic
          ? `${senderName} connected with you.`
          : `${senderName} sent you a connection request.`;

        console.log(`[NOTIFICATION] recipient: ${targetUserId}, actor: ${user.id}, connection: ${renewed.id}`);
        const { error: notifErr } = await supabase.from("notifications").insert({
          recipient_id: targetUserId,
          user_id: targetUserId,
          actor_id: user.id,
          connection_id: renewed.id,
          entity_id: renewed.id,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          read: false,
          is_read: false,
        });
        if (notifErr) {
          console.error("[NOTIFICATION ERROR]", notifErr);
        }
        return renewed;
      }
    }
  }

  // Insert new connection
  const isPublic = connectionType === "public";
  const initialStatus = isPublic ? "accepted" : "pending";

  const { data: inserted, error: connError } = await supabase
    .from("connections")
    .insert({
      requester_id: user.id,
      receiver_id: targetUserId,
      status: initialStatus,
      connection_type: connectionType,
    })
    .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
    .single();

  if (connError || !inserted) {
    console.error("[CONNECTION ERROR]", connError);
    throw new Error(connError?.message || "Failed to send connection request.");
  }

  console.log(`[CONNECTION SUCCESS] id: ${inserted.id}, requester: ${user.id}, receiver: ${targetUserId}, status: ${initialStatus}`);

  // Create notification server-side for receiver
  const notifType = isPublic ? "connection_accepted" : "connection_request";
  const notifTitle = isPublic ? "New Connection" : "Connection Request";
  const notifMessage = isPublic
    ? `${senderName} connected with you.`
    : `${senderName} sent you a connection request.`;

  console.log(`[NOTIFICATION] recipient: ${targetUserId}, actor: ${user.id}, connection: ${inserted.id}`);
  const { error: notifErr } = await supabase.from("notifications").insert({
    recipient_id: targetUserId,
    user_id: targetUserId,
    actor_id: user.id,
    connection_id: inserted.id,
    entity_id: inserted.id,
    type: notifType,
    title: notifTitle,
    message: notifMessage,
    read: false,
    is_read: false,
  });

  if (notifErr) {
    console.error("[NOTIFICATION ERROR]", notifErr);
  } else {
    console.log(`[NOTIFICATION SUCCESS] created notification for receiver ${targetUserId}`);
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
      console.log(`[NOTIFICATION] recipient: ${connection.requester_id}, actor: ${user.id}, connection: ${connectionId}`);
      const { error: notifErr } = await supabase.from("notifications").insert({
        recipient_id: connection.requester_id,
        user_id: connection.requester_id,
        actor_id: user.id,
        connection_id: connection.id,
        entity_id: connection.id,
        type: "connection_accepted",
        title: "Connection Accepted",
        message: `${myName} accepted your connection request.`,
        read: false,
        is_read: false,
      });
      if (notifErr) {
        console.error("[NOTIFICATION ERROR]", notifErr);
      }
    } catch (err) {
      console.error("[NOTIFICATION ERROR]", err);
    }
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
        .select("*, actor:profiles!actor_id(id, full_name, username, avatar_url, headline)")
        .or(`recipient_id.eq.${user.id},user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[NOTIFICATION QUERY ERROR]", error);
        return [];
      }

      console.log(`[NOTIFICATION QUERY] Found ${data?.length || 0} notifications for user ${user.id}`);

      return (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.recipient_id || r.user_id,
        recipient_id: r.recipient_id || r.user_id,
        actor_id: r.actor_id || null,
        actor: r.actor || undefined,
        connection_id: r.connection_id || r.entity_id || r.related_id || null,
        type: r.type,
        title: r.title || formatNotificationTitle(r.type),
        message: r.message,
        related_id: r.connection_id || r.entity_id || r.related_id || null,
        read: Boolean(r.read ?? r.is_read),
        is_read: Boolean(r.is_read ?? r.read),
        created_at: r.created_at,
      }));
    }
  } catch (err) {
    console.error("Error in getNotifications:", err);
  }

  return [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").update({ is_read: true, read: true }).eq("id", id);
  } catch (err) {
    console.error("Error in markNotificationAsRead:", err);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ is_read: true, read: true })
        .or(`recipient_id.eq.${user.id},user_id.eq.${user.id}`);
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
  if (candidates.length === 0) return [];

  const supabase = await createClient();
  const candidateIds = candidates.map((c) => c.id);

  // 1. Fetch user projects from projects table
  const projectsByOwner: Record<string, { id: string; name: string; slug?: string }[]> = {};
  if (candidateIds.length > 0) {
    try {
      const { data: projs } = await supabase
        .from("projects")
        .select("id, name, slug, owner_id")
        .in("owner_id", candidateIds);
      if (projs) {
        projs.forEach((p) => {
          if (!projectsByOwner[p.owner_id]) projectsByOwner[p.owner_id] = [];
          projectsByOwner[p.owner_id].push({ id: p.id, name: p.name, slug: p.slug || p.id });
        });
      }
    } catch (projErr) {
      console.error("Error fetching candidate projects:", projErr);
    }
  }

  // 2. Fetch candidate domain interests from published ideas
  const interestsByCreator: Record<string, string[]> = {};
  if (candidateIds.length > 0) {
    try {
      const { data: ideas } = await supabase
        .from("ideas")
        .select("creator_id, category, title")
        .in("creator_id", candidateIds);
      if (ideas) {
        ideas.forEach((i) => {
          if (!interestsByCreator[i.creator_id]) interestsByCreator[i.creator_id] = [];
          if (i.category && !interestsByCreator[i.creator_id].includes(i.category)) {
            interestsByCreator[i.creator_id].push(i.category);
          }
        });
      }
    } catch (ideaErr) {
      console.error("Error fetching candidate idea domains:", ideaErr);
    }
  }

  const currentSkills = new Set(profile.skills?.map((s) => s.toLowerCase().trim()) || []);
  const currentInterests = new Set(profile.interests?.map((i) => i.toLowerCase().trim()) || []);

  const headlineKeywords = (profile.headline || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const recommendations: MatchRecommendation[] = candidates.map((candidate) => {
    // Distinct skills: from candidate user_skills or headline capabilities
    let candSkills = candidate.skills && candidate.skills.length > 0 ? candidate.skills : [];
    if (candSkills.length === 0) {
      const lowerBio = `${candidate.headline || ""} ${candidate.bio || ""}`.toLowerCase();
      const detected: string[] = [];
      ["ai", "react", "python", "next.js", "typescript", "full-stack", "backend", "cloud"].forEach((k) => {
        if (lowerBio.includes(k)) detected.push(k.toUpperCase());
      });
      candSkills = detected.length > 0 ? detected : ["AI / ML Systems", "Full-Stack Development"];
    }

    // Distinct interests: from published ideas/categories or innovation areas
    const candInterests =
      candidate.interests && candidate.interests.length > 0
        ? candidate.interests
        : (interestsByCreator[candidate.id] && interestsByCreator[candidate.id].length > 0)
        ? interestsByCreator[candidate.id]
        : ["Autonomous Agents", "Developer Tooling", "Spatial Intelligence"];

    const sharedSkills = candSkills.filter((s) => currentSkills.has(s.toLowerCase().trim()));
    const complementarySkills = candSkills.filter((s) => !currentSkills.has(s.toLowerCase().trim()));
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
      profile: {
        ...candidate,
        skills: candSkills,
        interests: candInterests,
      },
      matchScore,
      matchReason,
      sharedSkills,
      sharedInterests,
      complementarySkills: complementarySkills.length > 0 ? complementarySkills : ["System Architecture", "Cloud Infrastructure"],
      projects: projectsByOwner[candidate.id] || [],
    };
  });

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}
