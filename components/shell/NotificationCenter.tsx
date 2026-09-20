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
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchNotifications = React.useCallback(() => {
    getNotificationsAction()
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch((err) => {
        console.error("Error fetching notifications in NotificationCenter:", err);
      });
  }, []);

  // Fetch on mount and subscribe to realtime
  React.useEffect(() => {
    fetchNotifications();

    const supabase = createClient();
    let channel: any = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);

      channel = supabase
        .channel(`header_notifs_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchNotifications]);

  // Also refetch when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read && !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, is_read: true } : n))
    );
    await markNotificationReadAction(id);
  };

  const handleNotificationClick = async (n: Notification, e?: React.MouseEvent) => {
    // If clicking a button or link inside, don't trigger outer navigation
    if (e && (e.target as HTMLElement).closest("button, a")) {
      return;
    }

    if (!n.read && !n.is_read) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);

    if (n.type === "connection_request" || n.type === "connection_accepted") {
      if (n.actor?.username) {
        router.push(`/profile/${n.actor.username}`);
      } else {
        router.push("/connections");
      }
    } else if (n.type === "idea_like" || n.type === "idea_comment") {
      if (n.related_id) router.push(`/ideas/${n.related_id}`);
      else router.push("/ideas");
    } else if (n.type === "project_invite" || n.type === "project_joined") {
      if (n.related_id) router.push(`/projects/${n.related_id}`);
      else router.push("/projects");
    } else if (n.type === "message") {
      if (n.actor?.username) router.push(`/messages?user=${n.actor.username}`);
      else router.push("/messages");
    } else if (n.related_id) {
      router.push(`/ideas/${n.related_id}`);
    }
  };

  const handleAcceptRequest = async (n: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    const connId = n.connection_id || n.related_id;
    if (!connId) return;

    setProcessingId(n.id);
    try {
      await updateConnectionAction(connId, "accepted");
      await markNotificationReadAction(n.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id
            ? {
                ...item,
                type: "connection_accepted",
                title: "Connection Accepted",
                message: `You are now connected with ${item.actor?.full_name || "this innovator"}.`,
                read: true,
                is_read: true,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to accept connection:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (n: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    const connId = n.connection_id || n.related_id;
    if (!connId) return;

    setProcessingId(n.id);
    try {
      await updateConnectionAction(connId, "rejected");
      await markNotificationReadAction(n.id);
      setNotifications((prev) => prev.filter((item) => item.id !== n.id));
    } catch (err) {
      console.error("Failed to reject connection:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
    await markAllNotificationsReadAction();
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "connection_request":
        return <UserPlus className="h-3.5 w-3.5 text-cyan-400" />;
      case "connection_accepted":
        return <UserCheck className="h-3.5 w-3.5 text-emerald-400" />;
      case "idea_like":
        return <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-400/20" />;
      case "idea_comment":
        return <MessageCircle className="h-3.5 w-3.5 text-indigo-400" />;
      case "project_invite":
      case "project_joined":
        return <FolderGit2 className="h-3.5 w-3.5 text-amber-400" />;
      case "message":
        return <MessageSquare className="h-3.5 w-3.5 text-blue-400" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-neutral-400" />;
    }
  };

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full border border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-mono font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute -right-12 sm:right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-3xl border border-white/15 bg-[#0a0c13]/95 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                EVENT STREAM
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-84 overflow-y-auto divide-y divide-white/[0.05]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Event stream quiet. No new signals.
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = n.read || n.is_read;
                const actorName = n.actor?.full_name || "An innovator";
                const actorUsername = n.actor?.username;
                const actorAvatar = n.actor?.avatar_url;

                return (
                  <div
                    key={n.id}
                    onClick={(e) => handleNotificationClick(n, e)}
                    className={cn(
                      "p-4 flex items-start gap-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer group",
                      !isRead && "bg-indigo-500/[0.06]"
                    )}
                  >
                    {/* Avatar / Icon */}
                    <div className="relative shrink-0 mt-0.5">
                      {actorAvatar ? (
                        <div className="h-9 w-9 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                          <Image
                            src={actorAvatar}
                            alt={actorName}
                            width={36}
                            height={36}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-neutral-300">
                          {actorName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#0a0c13] border border-white/10">
                        {getIcon(n.type)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {actorUsername ? (
                          <Link
                            href={`/profile/${actorUsername}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-white hover:text-indigo-300 transition-colors"
                          >
                            {actorName}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-white">{actorName}</span>
                        )}

                        <span className="text-[11px] text-neutral-400 font-light">
                          {n.type === "connection_request"
                            ? "sent you a connection request."
                            : n.type === "connection_accepted"
                            ? "connected with you."
                            : n.message}
                        </span>
                      </div>

                      <p className="text-[9px] font-mono text-neutral-500">
                        {formatTimeAgo(n.created_at)}
                      </p>

                      {/* Inline Accept/Reject for connection requests */}
                      {n.type === "connection_request" && (
                        <div className="flex items-center gap-2 pt-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={processingId === n.id}
                            onClick={(e) => handleAcceptRequest(n, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-[10px] font-mono font-medium transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            disabled={processingId === n.id}
                            onClick={(e) => handleRejectRequest(n, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 text-[10px] font-mono transition-colors disabled:opacity-50"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!isRead && (
                      <span className="h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer link to full notifications page */}
          <div className="p-3 border-t border-white/[0.08] bg-white/[0.01] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <span>Open All Notifications</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
