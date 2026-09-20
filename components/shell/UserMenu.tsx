"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user?: {
    name: string;
    username: string;
    avatar_url?: string | null;
  };
}

export function UserMenu({
  user: initialUser,
}: UserMenuProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState(
    initialUser || {
      name: "Innovator",
      username: "innovator",
      avatar_url: null,
    }
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!initialUser) {
      const fetchUser = async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, username, avatar_url")
              .eq("id", user.id)
              .maybeSingle();

            if (profile) {
              setCurrentUser({
                name: profile.full_name || "Innovator",
                username: profile.username || "innovator",
                avatar_url: profile.avatar_url,
              });
            }
          }
        } catch {
          // Fallback
        }
      };
      fetchUser();
    }
  }, [initialUser]);

  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof document !== "undefined") {
        document.cookie = "sb-remember=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    } catch {
      // Ignore
    }
    window.location.href = "/login";
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
        aria-label="User menu"
      >
        <Avatar
          src={currentUser.avatar_url}
          alt={currentUser.name}
          size="sm"
          online={true}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface text-foreground shadow-elevated p-1.5 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">@{currentUser.username}</p>
          </div>

          <div className="space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Your Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Appearance</span>
              </div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                {isDark ? "Dark" : "Light"}
              </span>
            </button>
          </div>

          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-error hover:bg-error/10 transition-colors"
            >
              <LogOut className="h-4 w-4 text-error" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
