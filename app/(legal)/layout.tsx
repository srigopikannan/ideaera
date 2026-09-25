import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, Cookie, Lock, Sparkles } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Legal Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#07090e]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-400 hover:text-white text-xs font-mono transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to IdeaEra</span>
            </Link>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <Link href="/" className="flex items-center gap-2 group">
              <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
              <span className="font-bold tracking-[0.2em] text-sm text-white uppercase font-mono">
                IDEA ERA
              </span>
            </Link>
          </div>

          {/* Quick Legal Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/privacy"
              className="px-3 py-1.5 rounded-lg text-xs font-light text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="px-3 py-1.5 rounded-lg text-xs font-light text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="px-3 py-1.5 rounded-lg text-xs font-light text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/privacy-center"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors hidden md:inline-flex items-center gap-1.5"
            >
              <Shield className="h-3 w-3" />
              Privacy Center
            </Link>
          </nav>
        </div>
      </header>

      {/* Product Draft / Formal Counsel Notice Banner */}
      <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-[11px] text-amber-300/90 font-mono tracking-wide">
        <span>
          ⚡ Legal Notice: These documents accurately describe IdeaEra&apos;s real data practices and architecture. Formal counsel review required prior to commercial launch.
        </span>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {children}
      </main>

      {/* Legal Footer */}
      <footer className="border-t border-white/[0.08] bg-[#050609] py-8 text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap justify-center gap-4 text-neutral-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            <span>•</span>
            <Link href="/privacy-center" className="hover:text-white transition-colors">Privacy Center</Link>
          </div>
          <p>© {new Date().getFullYear()} IDEA ERA. All platform intellectual property and rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
