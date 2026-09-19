"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Notification } from "@/types";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/(dashboard)/actions/social";
import { formatTimeAgo } from "@/lib/utils";
import {
  Bell,
  UserPlus,
  UserCheck,
  Heart,
  MessageCircle,
  FolderGit2,
  Check,
  Activity,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    getNotificationsAction()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationReadAction(id);
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);

    if (n.type === "idea_like" || n.type === "idea_comment") {
      if (n.related_id) router.push(`/ideas/${n.related_id}`);
      else router.push("/ideas");
    } else if (n.type === "project_invite" || n.type === "project_joined") {
      if (n.related_id) router.push(`/projects/${n.related_id}`);
      else router.push("/projects");
    } else if (n.type === "connection_request" || n.type === "connection_accepted") {
      router.push("/connections");
    } else if (n.type === "message") {
      router.push("/messages");
    } else if (n.related_id) {
      router.push(`/ideas/${n.related_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.05]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Event stream quiet. No new signals.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "p-4 flex items-start gap-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer",
                    !n.read && "bg-indigo-500/[0.05]"
                  )}
                >
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-light text-white leading-snug">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-light line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[9px] font-mono text-neutral-500">
                      {formatTimeAgo(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
