"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  PlusCircle,
  Trophy,
  Users,
  FolderGit2,
  Building2,
  Zap,
  UserCheck,
  MessageSquare,
  User,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const coreNav: NavItem[] = [
  { name: "Discover", href: "/ideas", icon: Lightbulb },
  { name: "Create", href: "/ideas/create", icon: PlusCircle },
  { name: "Collaborate", href: "/hackathons", icon: Trophy },
];

const workspaceNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "People", href: "/people", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderGit2 },
  { name: "Match", href: "/match", icon: Zap },
  { name: "Connections", href: "/connections", icon: UserCheck },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Companies", href: "/companies", icon: Building2 },
];

const accountNav: NavItem[] = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = React.useState<{
    name: string;
    username: string;
    avatar_url?: string | null;
  }>({
    name: "Innovator",
    username: "innovator",
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const targetId = user?.id || "d1aabec0-3b89-4c1d-a33d-a6573224f5c2";

        if (targetId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username, avatar_url")
            .eq("id", targetId)
            .maybeSingle();

          if (profile) {
            setCurrentUser({
              name: profile.full_name || "Innovator",
              username: profile.username || "innovator",
              avatar_url: profile.avatar_url,
            });
          }
        }
      } catch {}
    };
    fetchUser();
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/ideas") return pathname === "/ideas";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.08] bg-[#07080c] h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.08]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.9)] transition-transform group-hover:scale-125" />
          <span className="font-bold tracking-[0.24em] text-sm text-white uppercase">
            IDEA ERA
          </span>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        {/* Core Navigation (Discover, Create, Collaborate) */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-[0.25em]">
            Core
          </div>
          <nav className="space-y-1">
            {coreNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs uppercase tracking-[0.16em] font-medium transition-all",
                    active
                      ? "bg-white/[0.08] text-white border-l-2 border-indigo-400 pl-2.5 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-indigo-300" : "text-neutral-500 group-hover:text-white"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Workspace Navigation */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-[0.25em]">
            Workspace
          </div>
          <nav className="space-y-1">
            {workspaceNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs uppercase tracking-[0.16em] font-medium transition-all",
                    active
                      ? "bg-white/[0.08] text-white border-l-2 border-indigo-400 pl-2.5 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-indigo-300" : "text-neutral-500 group-hover:text-white"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Personal Navigation */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-mono font-medium text-neutral-500 uppercase tracking-[0.25em]">
            Account
          </div>
          <nav className="space-y-1">
            {accountNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs uppercase tracking-[0.16em] font-medium transition-all",
                    active
                      ? "bg-white/[0.08] text-white border-l-2 border-indigo-400 pl-2.5 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-indigo-300" : "text-neutral-500 group-hover:text-white"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-white/[0.08]">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
        >
          <div className="h-8 w-8 rounded-full overflow-hidden bg-indigo-500/15 border border-white/10 flex items-center justify-center text-indigo-300 text-xs font-semibold">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="h-full w-full object-cover"
              />
            ) : (
              currentUser.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate group-hover:text-indigo-200 transition-colors">
              {currentUser.name}
            </p>
            <p className="text-[10px] font-mono text-neutral-500 truncate">
              @{currentUser.username}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
