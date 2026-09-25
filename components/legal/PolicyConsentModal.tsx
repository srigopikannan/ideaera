"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { acceptCurrentPoliciesAction } from "@/app/(dashboard)/actions/legal";
import {
  CURRENT_PRIVACY_POLICY_VERSION,
  CURRENT_TERMS_VERSION,
} from "@/lib/legal-config";
import {
  ShieldAlert,
  FileText,
  Scale,
  Cookie,
  CheckCircle2,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PolicyConsentModalProps {
  initialRequiresConsent?: boolean;
}

export function PolicyConsentModal({
  initialRequiresConsent = false,
}: PolicyConsentModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(initialRequiresConsent);
  const [hasAgreed, setHasAgreed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  // If server indicated requiresConsent, keep open
  React.useEffect(() => {
    if (initialRequiresConsent) {
      setIsOpen(true);
    }
  }, [initialRequiresConsent]);

  const handleAccept = async () => {
    if (!hasAgreed) {
      setError(
        "You must review and check the agreement box to continue using IdeaEra."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await acceptCurrentPoliciesAction("policy_update");
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to record consent. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-lg bg-[#0d1017] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2
              id="policy-modal-title"
              className="text-lg sm:text-xl font-light tracking-wide text-white m-0"
            >
              Action Required: Updated Terms &amp; Privacy Policy
            </h2>
            <p className="text-xs text-neutral-400 font-light leading-relaxed m-0">
              IdeaEra has updated its legal framework to version v{CURRENT_PRIVACY_POLICY_VERSION}. To continue accessing your projects, collaboration workspaces, and ideas, please review and accept our updated policies.
            </p>
          </div>
        </div>

        {/* Policy Links Card */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3 text-xs">
          <div className="flex items-center justify-between text-neutral-300 font-medium">
            <span>Documents for Your Review:</span>
            <span className="font-mono text-[10px] text-indigo-300 uppercase">
              Current Versions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/privacy"
              target="_blank"
              className="p-2.5 rounded-xl border border-white/5 bg-[#121622] hover:border-indigo-500/40 hover:bg-white/[0.04] flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span className="truncate">Privacy (v{CURRENT_PRIVACY_POLICY_VERSION})</span>
            </Link>

            <Link
              href="/terms"
              target="_blank"
              className="p-2.5 rounded-xl border border-white/5 bg-[#121622] hover:border-indigo-500/40 hover:bg-white/[0.04] flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
            >
              <Scale className="h-3.5 w-3.5 text-indigo-400" />
              <span className="truncate">Terms (v{CURRENT_TERMS_VERSION})</span>
            </Link>

            <Link
              href="/cookies"
              target="_blank"
              className="p-2.5 rounded-xl border border-white/5 bg-[#121622] hover:border-indigo-500/40 hover:bg-white/[0.04] flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
            >
              <Cookie className="h-3.5 w-3.5 text-indigo-400" />
              <span className="truncate">Cookies</span>
            </Link>
          </div>

          <p className="text-[11px] text-neutral-400 font-light leading-relaxed border-t border-white/5 pt-2.5 m-0">
            IdeaEra utilizes necessary authentication and session technologies required to secure your account and data. We do not use third-party advertising or marketing trackers.
          </p>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Checkbox (MUST NOT be pre-selected) */}
        <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors bg-white/[0.01]">
          <input
            type="checkbox"
            checked={hasAgreed}
            onChange={(e) => {
              setHasAgreed(e.target.checked);
              if (error) setError(null);
            }}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/50 text-indigo-500 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs text-neutral-200 font-light leading-relaxed">
            I have read, understood, and affirmatively agree to the updated{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="text-indigo-400 hover:underline font-medium"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-indigo-400 hover:underline font-medium"
            >
              Terms of Service
            </Link>
            .
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSignOut}
            disabled={isSigningOut || isSubmitting}
            className="w-full sm:w-auto text-xs text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out &amp; Reject</span>
          </Button>

          <Button
            type="button"
            onClick={handleAccept}
            isLoading={isSubmitting}
            disabled={isSigningOut}
            className="w-full sm:w-auto px-6 h-11 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 gap-1.5"
          >
            <span>Accept &amp; Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
