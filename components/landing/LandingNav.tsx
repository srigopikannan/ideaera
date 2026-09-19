"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#050608]/90 backdrop-blur-xl border-b border-white/[0.08] py-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
            : "bg-transparent py-6 sm:py-10"
        }`}
      >
        <div className="w-full max-w-[1700px] mx-auto px-5 sm:px-10 lg:px-20 flex items-center justify-between">
          {/* Top Left: Clean Luxury Wordmark */}
          <Link
            href="/"
            className="text-xs sm:text-base font-medium uppercase tracking-[0.26em] sm:tracking-[0.28em] text-white hover:opacity-85 transition-opacity flex items-center gap-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.9)]" />
            <span>IDEA ERA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 sm:gap-12 text-xs font-mono uppercase tracking-[0.28em] text-neutral-300">
            <nav className="flex items-center gap-6 sm:gap-10 md:gap-14">
              <Link href="/ideas" className="hover:text-white transition-colors">
                IDEAS
              </Link>
              <Link href="/people" className="hover:text-white transition-colors">
                PEOPLE
              </Link>
              <Link href="/hackathons" className="hover:text-white transition-colors">
                POSSIBILITIES
              </Link>
            </nav>

            <div className="hidden sm:block w-10 h-[1.5px] bg-white/40" />

            <Link
              href="/login"
              className="text-[11px] font-mono tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
            >
              SIGN IN
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/login"
              className="text-[10px] font-mono tracking-[0.16em] uppercase px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-neutral-300 hover:text-white"
            >
              Sign In
            </Link>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-[#050608]/98 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 md:hidden animate-fade-in">
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.9)]" />
                <span className="text-xs font-bold tracking-[0.24em] uppercase text-white">IDEA ERA</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-col space-y-5 pt-2">
              <Link
                href="/ideas"
                onClick={() => setIsMobileOpen(false)}
                className="text-2xl font-light tracking-tight text-white hover:text-indigo-300 transition-colors flex items-center justify-between group"
              >
                <span>Discover Ideas</span>
                <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>
              <Link
                href="/people"
                onClick={() => setIsMobileOpen(false)}
                className="text-2xl font-light tracking-tight text-white hover:text-cyan-300 transition-colors flex items-center justify-between group"
              >
                <span>Find Collaborators</span>
                <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>
              <Link
                href="/hackathons"
                onClick={() => setIsMobileOpen(false)}
                className="text-2xl font-light tracking-tight text-white hover:text-amber-300 transition-colors flex items-center justify-between group"
              >
                <span>Sprints & Hackathons</span>
                <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>
              <Link
                href="/projects"
                onClick={() => setIsMobileOpen(false)}
                className="text-2xl font-light tracking-tight text-white hover:text-emerald-300 transition-colors flex items-center justify-between group"
              >
                <span>Active Projects</span>
                <ArrowUpRight className="h-5 w-5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>
              <Link
                href="/ideas/create"
                onClick={() => setIsMobileOpen(false)}
                className="text-2xl font-light tracking-tight text-indigo-300 hover:text-white transition-colors flex items-center justify-between group pt-2 border-t border-white/10"
              >
                <span>Share Your Idea</span>
                <ArrowUpRight className="h-5 w-5 text-indigo-400 group-hover:text-white transition-colors" />
              </Link>
            </nav>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-neutral-400">
            <Link
              href="/login"
              onClick={() => setIsMobileOpen(false)}
              className="hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMobileOpen(false)}
              className="text-white hover:text-indigo-300 transition-colors font-medium"
            >
              Create Account →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
