import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, CheckCircle2, XCircle, Info } from "lucide-react";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Cookie Policy | IdeaEra",
  description: "Official Cookie Policy and Technical Storage Notice for IdeaEra.",
};

export default function CookiePolicyPage() {
  return (
    <article className="space-y-10 prose prose-invert max-w-none">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono tracking-wider uppercase">
          <Cookie className="h-4 w-4" />
          <span>Technical Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white m-0">
          IdeaEra Cookie & Local Storage Policy
        </h1>
        <div className="flex flex-wrap gap-4 text-xs font-mono text-neutral-400 pt-1">
          <span>Version: <strong className="text-white">{LEGAL_CONFIG.cookieVersion}</strong></span>
          <span>•</span>
          <span>Effective Date: <strong className="text-white">{LEGAL_CONFIG.effectiveDate}</strong></span>
          <span>•</span>
          <span>Last Updated: <strong className="text-white">{LEGAL_CONFIG.lastUpdated}</strong></span>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] space-y-2">
        <h3 className="text-sm font-semibold text-emerald-300 m-0 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Zero Advertising or Third-Party Tracking Trackers
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed m-0 font-light">
          IdeaEra uses <strong>strictly necessary authentication and security technologies</strong> required to provide account login, session protection, and basic user preferences. We <strong>do not</strong> deploy marketing cookies, third-party analytics trackers, or cross-site tracking beacons.
        </p>
      </div>

      {/* Section 1: Overview */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          1. What Are Cookies and Local Storage?
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          Cookies are small data files stored on your computer or mobile device when you visit a website. Local storage is a standard web browser technology that allows web applications to store preferences locally on your client machine.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          Under global privacy regulations (including the EU ePrivacy Directive, GDPR, and UK law), technologies are classified as either <em>Strictly Necessary</em> (exempt from consent requirements because they are indispensable to deliver the requested service) or <em>Optional</em> (such as behavioral advertising or analytics).
        </p>
      </section>

      {/* Section 2: Strictly Necessary Technologies */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          2. Strictly Necessary Technologies Used by IdeaEra
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          The following technologies are essential to keep your account authenticated, maintain secure sessions, and protect your workspace data. Because the platform cannot operate without them, they cannot be disabled within the application:
        </p>

        <div className="overflow-x-auto not-prose">
          <table className="w-full text-left border border-white/10 rounded-xl overflow-hidden text-xs">
            <thead className="bg-white/5 text-neutral-300 font-mono uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-3">Identifier / Name</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300 font-light">
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-indigo-300 font-semibold">sb-*-auth-token</td>
                <td className="p-3">Supabase / IdeaEra</td>
                <td className="p-3">Stores cryptographic JWT authentication tokens to maintain your secure signed-in session across page navigation.</td>
                <td className="p-3 font-mono">Session / 1 Year</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">Essential Cookie</span></td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-indigo-300 font-semibold">sb-remember</td>
                <td className="p-3">IdeaEra</td>
                <td className="p-3">Records your explicit choice during login whether to remember your session across browser restarts or clear upon closing.</td>
                <td className="p-3 font-mono">1 Year (if chosen)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">Preference Cookie</span></td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-indigo-300 font-semibold">theme</td>
                <td className="p-3">IdeaEra</td>
                <td className="p-3">Stores your visual display preference (&quot;dark&quot; vs &quot;light&quot; mode) to prevent screen flickering upon initial load.</td>
                <td className="p-3 font-mono">Persistent</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">Client LocalStorage</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Optional Technologies - Explicitly None */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          3. Optional Technologies & Third-Party Trackers (None Installed)
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We believe in transparent engineering. Many platforms deploy extensive tracking technology; IdeaEra explicitly does not:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose">
          <div className="p-3.5 rounded-xl border border-white/10 bg-[#0d1017] flex items-start gap-3 text-xs">
            <XCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white block font-medium">No Advertising Cookies</strong>
              <span className="text-neutral-400 font-light">We do not display third-party advertisements or profile your browsing activity.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-white/10 bg-[#0d1017] flex items-start gap-3 text-xs">
            <XCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-white block font-medium">No Analytics Trackers</strong>
              <span className="text-neutral-400 font-light">We do not deploy Google Analytics, Hotjar, Facebook Pixel, or cross-site tracking beacons.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: How to Manage Browser Cookies */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          4. How to Control or Clear Cookies in Your Browser
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          You can restrict or block cookies through your browser settings. However, because IdeaEra uses cookies exclusively for secure authentication and session management, blocking all cookies will prevent you from signing in or using protected account features.
        </p>
        <ul className="text-sm text-neutral-300 space-y-1.5 font-light list-disc pl-5">
          <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data.</li>
          <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data.</li>
          <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Block all cookies.</li>
          <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions.</li>
        </ul>
      </section>

      {/* Section 5: Updates & Inquiries */}
      <section className="space-y-3 pb-8">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          5. Policy Revisions & Contact
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          If our technical stack evolves to include new essential technologies, this policy will be updated with an incremented version number. Questions regarding our cookie practices should be sent to <code className="text-indigo-300">{LEGAL_CONFIG.privacyEmail}</code>.
        </p>
      </section>
    </article>
  );
}
