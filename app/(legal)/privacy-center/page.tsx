import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserConsents } from "@/services/legal";
import { LEGAL_CONFIG } from "@/lib/legal-config";
import {
  Shield,
  FileText,
  Cookie,
  Scale,
  History,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  Trash2,
  Sliders,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Center | IdeaEra",
  description: "Manage your privacy settings, inspect legal versions, and view your personal consent history.",
};

export default async function PrivacyCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const consents = user ? await getUserConsents(user.id) : [];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono tracking-wider uppercase">
          <Shield className="h-4 w-4" />
          <span>User Rights & Privacy Command</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white m-0">
          IdeaEra Privacy & Legal Center
        </h1>
        <p className="text-sm text-neutral-400 font-light max-w-2xl leading-relaxed">
          Welcome to your privacy dashboard. Review our active legal agreements, inspect your immutable consent audit history, and manage your account sovereignty.
        </p>
      </div>

      {/* 1. Active Legal Policies Directory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white tracking-wide">
            Active Legal Agreements
          </h2>
          <span className="text-xs font-mono text-neutral-400">
            Effective: {LEGAL_CONFIG.effectiveDate}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Privacy Policy Card */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d1017] flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-colors">
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Privacy Policy</h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Comprehensive data processing notice explaining what information is stored and how your privacy is safeguarded.
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-indigo-300">
                Version {LEGAL_CONFIG.privacyVersion}
              </span>
              <Link
                href="/privacy"
                className="text-xs font-medium text-white hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                View Document <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Terms of Service Card */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d1017] flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-colors">
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Scale className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Terms of Service</h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Rules governing platform membership, intellectual property disclaimers, workspace collaboration, and fair conduct.
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-indigo-300">
                Version {LEGAL_CONFIG.termsVersion}
              </span>
              <Link
                href="/terms"
                className="text-xs font-medium text-white hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                View Document <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Cookie Policy Card */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d1017] flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-colors">
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Cookie className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Cookie Policy</h3>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Transparent disclosure detailing strictly necessary session tokens and our zero-advertising stance.
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-indigo-300">
                Version {LEGAL_CONFIG.cookieVersion}
              </span>
              <Link
                href="/cookies"
                className="text-xs font-medium text-white hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                View Document <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal Consent History Audit */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-400" />
          <h2 className="text-lg font-medium text-white tracking-wide">
            Your Legal Consent History
          </h2>
        </div>

        {user ? (
          <div className="rounded-2xl border border-white/10 bg-[#0d1017] overflow-hidden">
            {consents.length > 0 ? (
              <div className="divide-y divide-white/5">
                {consents.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-white">
                          Privacy Policy v{c.privacy_policy_version} &amp; Terms v{c.terms_version}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {c.consent_type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-light pl-6">
                        Affirmative consent recorded on server. Cookie Policy v{c.cookie_policy_version}.
                      </p>
                    </div>

                    <div className="text-xs font-mono text-neutral-400 pl-6 sm:pl-0 sm:text-right">
                      <span className="text-white block">
                        {formatDate(c.accepted_at)}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {new Date(c.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center space-y-2">
                <p className="text-sm text-neutral-400 font-light">
                  No historical consent records found for your account. You may be prompted to review updated policies during your session.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0d1017] text-center space-y-3">
            <Lock className="h-6 w-6 text-neutral-500 mx-auto" />
            <p className="text-sm text-neutral-400 font-light max-w-md mx-auto">
              Please sign in to inspect your personal consent records and verify which policy versions you have accepted.
            </p>
            <Link
              href="/login?redirectedFrom=/privacy-center"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Sign In to View Consent History
            </Link>
          </div>
        )}
      </section>

      {/* 3. Account & Data Sovereignty Controls */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white tracking-wide">
          Your Data &amp; Account Sovereignty Controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-white/10 bg-[#0d1017] space-y-3">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <span>Profile Visibility &amp; Preferences</span>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Control your public discoverability, college affiliation, age visibility, collaboration availability status, and social portfolio links.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-white transition-colors"
            >
              Edit Profile Settings <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] space-y-3">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Permanent Account Deletion</span>
            </div>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Exercise your right to erasure. Permanently cascades across your ideas, projects, memberships, messages, notifications, and connections.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 transition-colors"
            >
              Go to Settings &gt; Delete Account <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
