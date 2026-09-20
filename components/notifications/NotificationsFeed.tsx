"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Notification } from "@/types";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  updateConnectionAction,
} from "@/app/(dashboard)/actions/social";
import { formatTimeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  UserPlus,
  UserCheck,
  Heart,
  MessageCircle,
  FolderGit2,
  Check,
  X,
  Activity,
  CheckCheck,
  ArrowUpRight,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationsFeedProps {
  initialNotifications: Notification[];
  currentUserId: string;
}

export function NotificationsFeed({
  initialNotifications,
  currentUserId,
}: NotificationsFeedProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = React.useState<"all" | "requests" | "activity">("all");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchLatest = React.useCallback(async () => {
    try {
      const data = await getNotificationsAction();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // Subscribe to Supabase Realtime notifications
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`feed_notifications_${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          fetchLatest();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          fetchLatest();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchLatest]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, is_read: true } : n))
    );
    await markNotificationReadAction(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, is_read: true }))
    );
    await markAllNotificationsReadAction();
  };

  const handleAcceptRequest = async (notification: Notification) => {
    const connId = notification.connection_id || notification.related_id;
    if (!connId) return;

    setProcessingId(notification.id);
    try {
      await updateConnectionAction(connId, "accepted");
      await markNotificationReadAction(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? {
                ...n,
                type: "connection_accepted",
                title: "Connection Accepted",
                message: `You are now connected with ${n.actor?.full_name || "this innovator"}.`,
                read: true,
                is_read: true,
              }
            : n
        )
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to accept connection request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (notification: Notification) => {
    const connId = notification.connection_id || notification.related_id;
    if (!connId) return;

    setProcessingId(notification.id);
    try {
      await updateConnectionAction(connId, "rejected");
      await markNotificationReadAction(notification.id);
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      router.refresh();
    } catch (err) {
      console.error("Failed to reject connection request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read && !n.is_read).length;
  const requestNotifications = notifications.filter(
    (n) => n.type === "connection_request"
  );
  const activityNotifications = notifications.filter(
    (n) => n.type !== "connection_request"
  );

  const displayedList =
    activeTab === "all"
      ? notifications
      : activeTab === "requests"
      ? requestNotifications
      : activityNotifications;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "connection_request":
        return <UserPlus className="h-4 w-4 text-cyan-400" />;
      case "connection_accepted":
        return <UserCheck className="h-4 w-4 text-emerald-400" />;
      case "idea_like":
        return <Heart className="h-4 w-4 text-rose-400 fill-rose-400/20" />;
      case "idea_comment":
        return <MessageCircle className="h-4 w-4 text-indigo-400" />;
      case "project_invite":
      case "project_joined":
        return <FolderGit2 className="h-4 w-4 text-amber-400" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      default:
        return <Activity className="h-4 w-4 text-neutral-400" />;
    }
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-10 select-none overflow-x-hidden">
      {/* Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.9)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.26em] text-neutral-400">
              COMMUNICATION STREAM // SIGNAL REGISTRY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-5xl font-extralight text-white uppercase tracking-tight">
              Notifications.
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white font-mono text-xs font-semibold shadow-[0_0_12px_rgba(99,102,241,0.8)]">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {/* Tab switcher & bulk actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-full border border-white/10 bg-[#0a0c13]/85 backdrop-blur-xl">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all",
                activeTab === "all"
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              All Signals ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all",
                activeTab === "requests"
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Requests ({requestNotifications.length})
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all",
                activeTab === "activity"
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Activity ({activityNotifications.length})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/10 bg-white/[0.03] text-neutral-300 hover:text-white hover:bg-white/10 text-xs font-mono transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl space-y-3">
        {displayedList.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-white/[0.08] bg-[#0a0c13]/40 backdrop-blur-xl space-y-3">
            <Bell className="h-10 w-10 text-neutral-600 mx-auto stroke-[1.2]" />
            <p className="text-sm font-mono text-neutral-400 uppercase tracking-wider">
              No notifications in this stream
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Signals from peer connection requests, concept endorsements, and project transmissions will appear here in real time.
            </p>
          </div>
        ) : (
          displayedList.map((n) => {
            const isRead = n.read || n.is_read;
            const actorName = n.actor?.full_name || "An innovator";
            const actorUsername = n.actor?.username || "";
            const actorAvatar = n.actor?.avatar_url;
            const actorHeadline = n.actor?.headline;

            return (
              <div
                key={n.id}
                className={cn(
                  "group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300",
                  !isRead
                    ? "bg-[#0c0f1d]/80 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.08)]"
                    : "bg-[#0a0c13]/60 border-white/[0.08] hover:border-white/20"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Avatar + Details */}
                  <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      {actorUsername ? (
                        <Link href={`/profile/${actorUsername}`}>
                          <div className="h-11 w-11 rounded-2xl overflow-hidden border border-white/15 bg-white/5 hover:border-white/40 transition-colors flex items-center justify-center">
                            {actorAvatar ? (
                              <Image
                                src={actorAvatar}
                                alt={actorName}
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold font-mono text-neutral-300">
                                {actorName.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="h-11 w-11 rounded-2xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center">
                          {actorAvatar ? (
                            <Image
                              src={actorAvatar}
                              alt={actorName}
                              width={44}
                              height={44}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold font-mono text-neutral-300">
                              {actorName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Small type badge */}
                      <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0a0c13] border border-white/10 shadow-sm">
                        {getNotificationIcon(n.type)}
                      </span>
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {actorUsername ? (
                          <Link
                            href={`/profile/${actorUsername}`}
                            className="text-sm font-medium text-white hover:text-indigo-300 transition-colors inline-flex items-center gap-1 group/link"
                          >
                            <span>{actorName}</span>
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-neutral-400" />
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-white">{actorName}</span>
                        )}

                        <span className="text-xs text-neutral-400 font-light">
                          {n.type === "connection_request"
                            ? "sent you a connection request."
                            : n.type === "connection_accepted"
                            ? "connected with you."
                            : n.message}
                        </span>

                        {!isRead && (
                          <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.9)]" />
                        )}
                      </div>

                      {actorHeadline && (
                        <p className="text-[11px] text-neutral-400 truncate max-w-md">
                          {actorHeadline}
                        </p>
                      )}

                      <div className="flex items-center gap-3 pt-0.5 text-[10px] font-mono text-neutral-500">
                        <span>{formatTimeAgo(n.created_at)}</span>
                        <span>•</span>
                        <span className="uppercase">{n.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {n.type === "connection_request" ? (
                      <>
                        <button
                          disabled={processingId === n.id}
                          onClick={() => handleAcceptRequest(n)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-mono font-medium transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          disabled={processingId === n.id}
                          onClick={() => handleRejectRequest(n)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs font-mono transition-colors disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : n.type === "connection_accepted" && actorUsername ? (
                      <Link
                        href={`/messages?user=${actorUsername}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 text-xs font-mono transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Message</span>
                      </Link>
                    ) : null}

                    {!isRead && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
