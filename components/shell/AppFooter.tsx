"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppFooter() {
  const pathname = usePathname();

  // On full-screen spatial starfield / living canvas, do not disrupt the interactive 3D viewport
  if (pathname === "/ideas") {
    return null;
  }

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#07080c] text-xs font-mono text-neutral-400 py-4 px-4 sm:px-6 lg:px-8 mt-auto select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
          <p className="text-neutral-300 font-mono text-xs tracking-wide">
            © 2026 Srigopikannan K — IdeaEra. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-neutral-400 font-mono">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <span>•</span>
          <Link href="/cookies" className="hover:text-white transition-colors">
            Cookies
          </Link>
          <span>•</span>
          <Link
            href="/privacy-center"
            className="hover:text-white transition-colors text-indigo-300"
          >
            Privacy Center
          </Link>
        </div>
      </div>
    </footer>
  );
}
