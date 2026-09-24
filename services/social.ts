import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getCurrentUserProfile } from "@/services/profile";
import { Connection, Notification, NotificationType, MatchRecommendation, Profile } from "@/types";
import { evaluateUserBadges } from "@/services/badges";

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

export async function getConnectedUsersForProfile(userId: string): Promise<Profile[]> {
  try {
    const supabase = await createClient();
    const { data: conns } = await supabase
      .from("connections")
      .select("requester_id, receiver_id, requester:profiles!requester_id(id, full_name, username, headline, avatar_url, skills), receiver:profiles!receiver_id(id, full_name, username, headline, avatar_url, skills)")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .limit(20);

    if (conns) {
      return conns.map((c: any) => {
        const rawProfile = c.requester_id === userId ? c.receiver : c.requester;
        if (!rawProfile) return null;
        return {
          ...rawProfile,
          connection_status: "connected" as const,
        };
      }).filter(Boolean) as Profile[];
    }
  } catch (err) {
    console.error("Error in getConnectedUsersForProfile:", err);
  }

  return [];
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

  // Validate Target User exists
  const { data: targetProfile, error: targetErr } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetErr || !targetProfile) {
    throw new Error("Target user profile does not exist.");
  }

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
      await updateConnectionStatus(existing.id, "accepted");
      const { data: accepted } = await supabase
        .from("connections")
        .select("*, requester:profiles!requester_id(*), receiver:profiles!receiver_id(*)")
        .eq("id", existing.id)
        .single();
      return accepted || existing;
    }

    // If pending and user already sent it to target, return existing without creating duplicate notifications
    if (existing.status === "pending" && existing.requester_id === user.id) {
      return existing;
    }

    // If rejected, allow re-requesting cleanly
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
        const notifType: NotificationType = isPublic ? "connection_accepted" : "connection_request";
        const notifTitle = isPublic ? "New Connection" : "Connection Request";
        const notifMessage = isPublic
          ? `${senderName} connected with you.`
          : `${senderName} sent you a connection request.`;

        // Check if an unread notification already exists to prevent duplicate spam
        const { data: existingNotif } = await supabase
          .from("notifications")
          .select("id")
          .eq("connection_id", renewed.id)
          .eq("recipient_id", targetUserId)
          .eq("type", notifType)
          .maybeSingle();

        if (!existingNotif) {
          await supabase.from("notifications").insert({
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
            updated_at: new Date().toISOString(),
          });
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

  // Create notification server-side for receiver
  const notifType: NotificationType = isPublic ? "connection_accepted" : "connection_request";
  const notifTitle = isPublic ? "New Connection" : "Connection Request";
  const notifMessage = isPublic
    ? `${senderName} connected with you.`
    : `${senderName} sent you a connection request.`;

  // Idempotency: verify no duplicate notification exists
  const { data: existingNotif } = await supabase
    .from("notifications")
    .select("id")
    .eq("connection_id", inserted.id)
    .eq("recipient_id", targetUserId)
    .maybeSingle();

  if (!existingNotif) {
    await supabase.from("notifications").insert({
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
      updated_at: new Date().toISOString(),
    });
  }

  if (isPublic) {
    evaluateUserBadges(user.id).catch(console.warn);
    evaluateUserBadges(targetUserId).catch(console.warn);
  }

  return inserted;
}

export async function updateConnectionStatus(
  connectionId: string,
  status: "accepted" | "rejected"
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to manage connections.");
  }

  // Fetch connection to verify authorization and current state
  const { data: connection, error: fetchError } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .eq("id", connectionId)
    .maybeSingle();

  if (fetchError || !connection) {
    throw new Error("Connection record not found.");
  }

  // If already at requested status, simply ensure notification is synced and return
  if (connection.status === status) {
    await syncConnectionNotifications(connectionId, status, connection.requester_id, connection.receiver_id);
    return;
  }

  // Security authorization: only receiver can accept a request
  if (status === "accepted" && connection.receiver_id !== user.id) {
    throw new Error("Unauthorized: Only the recipient can accept a connection request.");
  }

  // Security authorization: only parties to the connection can reject/cancel
  if (status === "rejected" && connection.receiver_id !== user.id && connection.requester_id !== user.id) {
    throw new Error("Unauthorized: You are not a party to this connection.");
  }

  // Update connection status
  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("connections")
    .update({ status, updated_at: now })
    .eq("id", connectionId);

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  // Synchronize and update all notifications associated with this connection
  await syncConnectionNotifications(connectionId, status, connection.requester_id, connection.receiver_id);

  if (status === "accepted") {
    evaluateUserBadges(connection.requester_id).catch(console.warn);
    evaluateUserBadges(connection.receiver_id).catch(console.warn);
  }
}

/**
 * Helper to synchronize notification records in DB so they reflect current status
 */
async function syncConnectionNotifications(
  connectionId: string,
  status: "accepted" | "rejected",
  requesterId: string,
  receiverId: string
) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch actor (requester) profile name for receiver's notification
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", requesterId)
    .maybeSingle();
  const requesterName = requesterProfile?.full_name || "Innovator";

  // Fetch receiver profile name for requester's notification
  const { data: receiverProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", receiverId)
    .maybeSingle();
  const receiverName = receiverProfile?.full_name || "Innovator";

  if (status === "accepted") {
    // 1. Update RECEIVER's notifications: transition from connection_request to connection_accepted
    await supabase
      .from("notifications")
      .update({
        type: "connection_accepted",
        title: "Connected",
        message: `${requesterName} is now connected with you.`,
        read: true,
        is_read: true,
        updated_at: now,
      })
      .eq("connection_id", connectionId)
      .eq("recipient_id", receiverId);

    // 2. Notify REQUESTER (User A) that User B accepted, with duplicate prevention
    const { data: existingAcceptNotif } = await supabase
      .from("notifications")
      .select("id")
      .eq("connection_id", connectionId)
      .eq("recipient_id", requesterId)
      .eq("type", "connection_accepted")
      .maybeSingle();

    if (!existingAcceptNotif) {
      await supabase.from("notifications").insert({
        recipient_id: requesterId,
        user_id: requesterId,
        actor_id: receiverId,
        connection_id: connectionId,
        entity_id: connectionId,
        type: "connection_accepted",
        title: "Connection Accepted",
        message: `${receiverName} accepted your connection request.`,
        read: false,
        is_read: false,
        updated_at: now,
      });
    }
  } else if (status === "rejected") {
    // Update RECEIVER's notifications: transition to connection_rejected, removing actions
    await supabase
      .from("notifications")
      .update({
        type: "connection_rejected",
        title: "Connection Rejected",
        message: "Connection request rejected.",
        read: true,
        is_read: true,
        updated_at: now,
      })
      .eq("connection_id", connectionId)
      .eq("recipient_id", receiverId);
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
      return "Connected";
    case "connection_rejected":
      return "Connection Rejected";
    case "follow_request":
      return "Follow Request";
    case "follow_accepted":
      return "New Follower";
    case "follow_rejected":
      return "Follow Request Rejected";
    case "idea_suggestion":
      return "💡 New Idea Suggestion";
    case "people_suggestion":
      return "👥 People Suggestion";
    case "team_suggestion":
      return "🤝 Team Formation";
    case "idea_trending":
      return "🔥 Your idea is trending!";
    case "idea_milestone":
      return "🎯 Milestone Reached";
    case "hackathon_suggestion":
      return "⚡ Hackathon Suggestion";
    case "project_activity":
      return "🛠️ Project Activity";
    case "badge_earned":
      return "🏆 Badge Earned!";
    case "idea_like":
      return "Concept Endorsement";
    case "idea_comment":
      return "New Critique Note";
    case "project_invite":
      return "Venture Invitation";
    case "project_joined":
      return "Venture Member Joined";
    case "message":
      return "New Message";
    default:
      return "Notification";
  }
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:profiles!actor_id(id, full_name, username, avatar_url, headline),
          connection:connections!connection_id(id, status, requester_id, receiver_id)
        `)
        .or(`recipient_id.eq.${user.id},user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[NOTIFICATION QUERY ERROR]", error);
        return [];
      }

      return (data || []).map((r: any) => {
        const actorName = r.actor?.full_name || "An innovator";
        let type: NotificationType = r.type;
        let title = r.title || formatNotificationTitle(r.type);
        let message = r.message;
        let isRead = Boolean(r.read ?? r.is_read);
        const connection = r.connection || null;
        const connectionStatus = connection?.status || null;

        // STATE SYNCHRONIZATION:
        // Always read live connection status from the database.
        // If connection is accepted or rejected, never leave a pending connection request!
        if (connection) {
          if (connection.status === "accepted") {
            if (type === "connection_request") {
              type = "connection_accepted";
              title = "Connected";
              message =
                r.recipient_id === connection.receiver_id
                  ? `${actorName} is now connected with you.`
                  : `${actorName} accepted your connection request.`;
              isRead = true;
            }
          } else if (connection.status === "rejected") {
            if (type === "connection_request") {
              type = "connection_rejected";
              title = "Connection Rejected";
              message = "Connection request rejected.";
              isRead = true;
            }
          }
        } else if (r.connection_id && !connection) {
          // Connection was removed or canceled
          if (type === "connection_request") {
            type = "connection_rejected";
            title = "Connection Canceled";
            message = "This connection request is no longer active.";
            isRead = true;
          }
        }

        return {
          id: r.id,
          user_id: r.recipient_id || r.user_id,
          recipient_id: r.recipient_id || r.user_id,
          actor_id: r.actor_id || null,
          actor: r.actor || undefined,
          connection_id: r.connection_id || r.entity_id || r.related_id || null,
          connection: connection || undefined,
          connection_status: connectionStatus,
          idea_id: r.idea_id || null,
          project_id: r.project_id || null,
          reference_id: r.connection_id || r.entity_id || r.related_id || null,
          related_id: r.connection_id || r.entity_id || r.related_id || null,
          type,
          title,
          message,
          read: isRead,
          is_read: isRead,
          data: r.data || {},
          created_at: r.created_at,
          updated_at: r.updated_at || r.created_at,
        };
      });
    }
  } catch (err) {
    console.error("Error in getNotifications:", err);
  }

  return [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true, read: true, updated_at: new Date().toISOString() })
      .eq("id", id);
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
        .update({ is_read: true, read: true, updated_at: new Date().toISOString() })
        .or(`recipient_id.eq.${user.id},user_id.eq.${user.id}`);
    }
  } catch (err) {
    console.error("Error in markAllNotificationsAsRead:", err);
  }
}

// ===================================================================
// DEDICATED NOTIFICATION GENERATORS (IDEAS, PEOPLE, MILESTONES, BADGES)
// ===================================================================

/**
 * Generate an idea suggestion notification for a user (Idempotent)
 */
export async function createIdeaSuggestionNotification(userId: string, ideaId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: idea } = await supabase.from("ideas").select("id, title, creator_id").eq("id", ideaId).maybeSingle();
    if (!idea || idea.creator_id === userId) return;

    // Check duplicate
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_id", userId)
      .eq("type", "idea_suggestion")
      .eq("idea_id", ideaId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("notifications").insert({
        recipient_id: userId,
        user_id: userId,
        actor_id: idea.creator_id,
        idea_id: idea.id,
        related_id: idea.id,
        type: "idea_suggestion",
        title: "💡 New Idea Suggestion",
        message: `An idea related to your interests is available: "${idea.title}".`,
        read: false,
        is_read: false,
      });
    }
  } catch (err) {
    console.error("Error creating idea suggestion notification:", err);
  }
}

/**
 * Generate a people suggestion notification (Idempotent)
 */
export async function createPeopleSuggestionNotification(
  userId: string,
  targetUserId: string,
  sharedSkillOrInterest?: string
): Promise<void> {
  try {
    const supabase = await createClient();
    if (userId === targetUserId) return;

    const { data: target } = await supabase.from("profiles").select("id, full_name, username").eq("id", targetUserId).maybeSingle();
    if (!target) return;

    // Check duplicate
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_id", userId)
      .eq("type", "people_suggestion")
      .eq("actor_id", targetUserId)
      .maybeSingle();

    if (!existing) {
      const reasonMsg = sharedSkillOrInterest
        ? `You may want to connect with ${target.full_name} because you share skills in ${sharedSkillOrInterest}.`
        : `You may want to connect with ${target.full_name} based on shared interests.`;

      await supabase.from("notifications").insert({
        recipient_id: userId,
        user_id: userId,
        actor_id: targetUserId,
        related_id: target.username,
        type: "people_suggestion",
        title: "👥 People Suggestion",
        message: reasonMsg,
        read: false,
        is_read: false,
      });
    }
  } catch (err) {
    console.error("Error creating people suggestion notification:", err);
  }
}

/**
 * Check and create milestone / trending notifications when threshold is achieved (Idempotent)
 */
export async function checkAndCreateIdeaMilestoneNotification(ideaId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: idea } = await supabase
      .from("ideas")
      .select("id, title, creator_id, likes_count")
      .eq("id", ideaId)
      .maybeSingle();

    if (!idea || !idea.creator_id) return;

    const likes = idea.likes_count || 0;
    // Milestone threshold: e.g. 5 likes for trending
    if (likes >= 5) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("recipient_id", idea.creator_id)
        .eq("type", "idea_trending")
        .eq("idea_id", ideaId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("notifications").insert({
          recipient_id: idea.creator_id,
          user_id: idea.creator_id,
          idea_id: idea.id,
          related_id: idea.id,
          type: "idea_trending",
          title: "🔥 Your idea is trending!",
          message: `Your idea "${idea.title}" has reached ${likes} endorsements!`,
          read: false,
          is_read: false,
        });
      }
    }
  } catch (err) {
    console.error("Error checking idea milestone:", err);
  }
}

/**
 * Create a badge earned notification (Idempotent)
 */
export async function createBadgeNotification(
  userId: string,
  badgeName: string,
  badgeDescription: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_id", userId)
      .eq("type", "badge_earned")
      .ilike("message", `%${badgeName}%`)
      .maybeSingle();

    if (!existing) {
      await supabase.from("notifications").insert({
        recipient_id: userId,
        user_id: userId,
        type: "badge_earned",
        title: "🏆 Badge Earned!",
        message: `You earned the "${badgeName}" badge: ${badgeDescription}`,
        read: false,
        is_read: false,
      });
    }
  } catch (err) {
    console.error("Error creating badge notification:", err);
  }
}

// ===================================================================
// MATCH RECOMMENDATIONS (PRESERVED)
// ===================================================================

export async function getMatchRecommendations(currentProfile?: Profile | null): Promise<MatchRecommendation[]> {
  const profile = currentProfile || (await getCurrentUserProfile());
  if (!profile) return [];

  const allProfiles = await getAllProfiles();
  const candidates = allProfiles.filter((p) => p.id !== profile.id);
  if (candidates.length === 0) return [];

  const supabase = await createClient();
  const candidateProfiles = candidates.slice(0, 30);
  const candidateIds = candidateProfiles.map((c) => c.id);

  const projectsByOwner: Record<string, { id: string; name: string; slug?: string }[]> = {};
  const interestsByCreator: Record<string, string[]> = {};

  if (candidateIds.length > 0) {
    try {
      const [projsRes, ideasRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, owner_id")
          .in("owner_id", candidateIds),
        supabase
          .from("ideas")
          .select("creator_id, category, title")
          .in("creator_id", candidateIds),
      ]);

      if (projsRes.data) {
        projsRes.data.forEach((p) => {
          if (!projectsByOwner[p.owner_id]) projectsByOwner[p.owner_id] = [];
          projectsByOwner[p.owner_id].push({ id: p.id, name: p.name, slug: p.id });
        });
      }

      if (ideasRes.data) {
        ideasRes.data.forEach((i) => {
          if (!interestsByCreator[i.creator_id]) interestsByCreator[i.creator_id] = [];
          if (i.category && !interestsByCreator[i.creator_id].includes(i.category)) {
            interestsByCreator[i.creator_id].push(i.category);
          }
        });
      }
    } catch (err) {
      console.error("Error in getMatchRecommendations parallel data fetch:", err);
    }
  }

  const currentSkills = new Set(profile.skills?.map((s) => s.toLowerCase().trim()) || []);
  const currentInterests = new Set(profile.interests?.map((i) => i.toLowerCase().trim()) || []);

  const headlineKeywords = (profile.headline || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const recommendations: MatchRecommendation[] = candidateProfiles.map((candidate) => {
    let candSkills = candidate.skills && candidate.skills.length > 0 ? candidate.skills : [];
    if (candSkills.length === 0) {
      const lowerBio = `${candidate.headline || ""} ${candidate.bio || ""}`.toLowerCase();
      const detected: string[] = [];
      ["ai", "react", "python", "next.js", "typescript", "full-stack", "backend", "cloud"].forEach((k) => {
        if (lowerBio.includes(k)) detected.push(k.toUpperCase());
      });
      candSkills = detected.length > 0 ? detected : ["AI / ML Systems", "Full-Stack Development"];
    }

    const candInterests =
      candidate.interests && candidate.interests.length > 0
        ? candidate.interests
        : (interestsByCreator[candidate.id] && interestsByCreator[candidate.id].length > 0)
        ? interestsByCreator[candidate.id]
        : ["Autonomous Agents", "Developer Tooling", "Spatial Intelligence"];

    const sharedSkills = candSkills.filter((s) => currentSkills.has(s.toLowerCase().trim()));
    const complementarySkills = candSkills.filter((s) => !currentSkills.has(s.toLowerCase().trim()));
    const sharedInterests = candInterests.filter((i) => currentInterests.has(i.toLowerCase().trim()));

    const candText = `${candidate.headline || ""} ${candidate.bio || ""}`.toLowerCase();
    const sharedKeywords = headlineKeywords.filter((kw) => candText.includes(kw));

    let hash = 0;
    const combinedStr = `${profile.id}_${candidate.id}`;
    for (let i = 0; i < combinedStr.length; i++) {
      hash = (hash * 31 + combinedStr.charCodeAt(i)) % 1000;
    }
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
