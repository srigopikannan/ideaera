"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationCenter } from "./NotificationCenter";
import { UserMenu } from "./UserMenu";
import { GlobalSearch } from "./GlobalSearch";
import {
  Search,
  Menu,
  X,
  PlusCircle,
  Lightbulb,
  Trophy,
  Users,
  FolderGit2,
  LayoutDashboard,
  User,
  Settings,
} from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("open-global-search", handleOpenSearch);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-global-search", handleOpenSearch);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const mobileNavItems = [
    { name: "Discover", href: "/ideas", icon: Lightbulb },
    { name: "Create", href: "/ideas/create", icon: PlusCircle },
    { name: "Collaborate", href: "/hackathons", icon: Trophy },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "People", href: "/people", icon: Users },
    { name: "Projects", href: "/projects", icon: FolderGit2 },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      <header className="h-16 border-b border-white/[0.08] bg-[#07080c]/85 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
        {/* Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-lg text-neutral-400 hover:text-white"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
            <span className="font-bold text-xs tracking-[0.24em] uppercase text-white">IDEA ERA</span>
          </Link>
        </div>

        {/* Global Search Bar (Desktop Trigger) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-global-search"));
            }}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 text-neutral-400 text-xs transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-300" />
              <span className="truncate">Search ideas, people, hackathons...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono bg-white/[0.06] text-neutral-400 rounded border border-white/10">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/ideas/create"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-white/20 bg-white text-black text-xs font-semibold uppercase tracking-[0.16em] hover:bg-neutral-200 transition-all shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create</span>
          </Link>

          <NotificationCenter />
          <UserMenu />
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 bg-[#07080c] flex flex-col justify-between p-8 md:hidden animate-fade-in">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-[0.24em] uppercase text-white">IDEA ERA</span>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="p-2 text-neutral-400 hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-col space-y-4">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className="text-2xl font-light tracking-tight text-neutral-300 hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-white/10 text-center">
            <p className="text-[11px] font-mono text-neutral-500">
              Where ideas become possibilities.
            </p>
          </div>
        </div>
      )}

      {/* Global Command Search Palette */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
