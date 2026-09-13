"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotificationsAction,
  markNotificationReadAction,
} from "@/app/(dashboard)/actions/social";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchNotifications() {
    setIsLoading(true);

    try {
      const data = await getNotificationsAction();
      setNotifications(
        data.map((notification) => ({
          ...notification,
          created_at: notification.created_at.toISOString(),
          is_read: notification.is_read ?? false,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAsRead(id: string) {
    try {
      await markNotificationReadAction(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to update notification", error);
      toast.error("Failed to update notification");
    }
  }

  async function markAllAsRead() {
    try {
      const unread = notifications.filter(
        (notification) => !notification.is_read
      );

      await Promise.all(
        unread.map((notification) =>
          markNotificationReadAction(notification.id)
        )
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read",
        error
      );
      toast.error("Failed to update notifications");
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-background shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Notifications</h3>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                >
                  Mark all read
                </Button>
              )}
            </div>

            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="space-y-3 p-8 text-center">
                  <Bell className="mx-auto h-8 w-8 text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex cursor-pointer gap-3 p-4 transition-colors hover:bg-accent/50 ${
                        !notification.is_read
                          ? "bg-primary/5"
                          : ""
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          notification.type ===
                          "connection_request"
                            ? "bg-blue-100 text-blue-600"
                            : notification.type === "message"
                              ? "bg-green-100 text-green-600"
                              : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {notification.type ===
                        "connection_request" ? (
                          <UserPlus className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <p
                          className={`line-clamp-2 text-sm ${
                            !notification.is_read
                              ? "font-semibold"
                              : "font-medium"
                          }`}
                        >
                          {notification.message}
                        </p>

                        <p className="text-[10px] text-muted-foreground">
                          {new Date(
                            notification.created_at
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}