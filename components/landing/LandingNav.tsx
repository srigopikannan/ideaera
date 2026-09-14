"use client";

import * as React from "react";
import Link from "next/link";

export function LandingNav() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#050608]/85 backdrop-blur-xl border-b border-white/[0.08] py-4 shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
          : "bg-transparent py-8 sm:py-10"
      }`}
    >
      <div className="w-full max-w-[1700px] mx-auto px-8 sm:px-14 lg:px-20 flex items-center justify-between">
        {/* Top Left: Clean Luxury Wordmark */}
        <Link
          href="/"
          className="text-sm sm:text-base font-medium uppercase tracking-[0.28em] text-white hover:opacity-85 transition-opacity"
        >
          IDEA ERA
        </Link>

        {/* Top Right: IDEAS    PEOPLE    POSSIBILITIES    —— */}
        <div className="flex items-center gap-8 sm:gap-12 text-xs font-mono uppercase tracking-[0.28em] text-neutral-300">
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

          {/* Reference image horizontal indicator bar */}
          <div className="hidden sm:block w-10 h-[1.5px] bg-white/40" />

          {/* Quick Entry Link */}
          <Link
            href="/login"
            className="text-[11px] font-mono tracking-[0.2em] text-neutral-400 hover:text-white transition-colors hidden md:block"
          >
            SIGN IN
          </Link>
        </div>
      </div>
    </header>
  );
}
