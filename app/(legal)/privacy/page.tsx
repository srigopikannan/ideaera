import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Privacy Policy | IdeaEra",
  description: "Official Privacy Policy and Data Processing Notice for IdeaEra.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-10 prose prose-invert max-w-none">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono tracking-wider uppercase">
          <Shield className="h-4 w-4" />
          <span>Official Legal Document</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white m-0">
          IdeaEra Privacy Policy & Data-Processing Notice
        </h1>
        <div className="flex flex-wrap gap-4 text-xs font-mono text-neutral-400 pt-1">
          <span>Version: <strong className="text-white">{LEGAL_CONFIG.privacyVersion}</strong></span>
          <span>•</span>
          <span>Effective Date: <strong className="text-white">{LEGAL_CONFIG.effectiveDate}</strong></span>
          <span>•</span>
          <span>Last Updated: <strong className="text-white">{LEGAL_CONFIG.lastUpdated}</strong></span>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] space-y-2">
        <h3 className="text-sm font-semibold text-indigo-300 m-0 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-indigo-400" />
          Key Privacy Commitments at a Glance
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed m-0 font-light">
          IdeaEra is designed for collegiate innovators, engineers, and creators. We collect only the data necessary to provide discovery, collaborative project workspaces, and verified innovation credentials. <strong>We do not sell your personal data, and we do not deploy third-party advertising or cross-site tracking cookies.</strong>
        </p>
      </div>

      {/* Section 1: Introduction */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          1. Introduction & Scope
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          This Privacy Policy and Data-Processing Notice explains how {LEGAL_CONFIG.entityName} (&quot;IdeaEra&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and protects personal data when you access or interact with our web platform (accessible at ideaera.vercel.app and affiliated domains).
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          By registering an account, publishing content, or interacting with collaborative features, you acknowledge this data-processing notice. This document accurately reflects our current architecture, database schema, and operational practices.
        </p>
      </section>

      {/* Section 2: Real Data Collected */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          2. Information We Collect
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We collect and process only the categories of data that you directly provide or that are generated through your genuine platform activity:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
          <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] space-y-1.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              A. Account & Profile Data
            </h4>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Full name, chosen username, email address, password hash (processed via Supabase Auth), profile avatar URL, professional headline, bio, collegiate affiliation, city, state, country, remote preference, collaboration availability status and hours note, age (optional integer), portfolio links, verified skills, and technology interests.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] space-y-1.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              B. Ideas & Validation Dimensions
            </h4>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Idea title, problem statement, solution statement, category, required skills, collaboration preferences, visibility settings (public or private), validation status (not validated, testing, validated), target user notes, differentiators, feedback votes, and version audit history.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] space-y-1.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              C. Project Workspace & Rescue
            </h4>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Project title, tech stack, repository and deployment URLs, Kanban task assignments, milestones, resource links (e.g. Figma, GitHub, Docs), team discussion posts, &quot;Needs Help&quot; rescue category, blocker descriptions, and immutable project activity logs.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] space-y-1.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              D. Direct Messaging & Social
            </h4>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              One-to-one direct messages between connected innovators, message text content, transmission timestamps (delivered_at, read_at), connection requests and acceptance state, and notification records.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] space-y-1.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              E. Hackathon Activity
            </h4>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Hackathons organized or registered for, participation timestamps, and sprint affiliation records.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] space-y-1.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-300 font-semibold">
              F. Technical & Consent Records
            </h4>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Session tokens, remember-me preferences, theme selection (stored in local browser storage), versioned consent audit logs (acceptance timestamp, policy version, user agent), and security logs.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Legal Basis & Purpose */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          3. How and Why We Process Your Data
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          IdeaEra processes your information under the following lawful bases:
        </p>
        <ul className="text-sm text-neutral-300 space-y-2 font-light list-disc pl-5">
          <li>
            <strong>Performance of Contract:</strong> To create and authenticate your account, maintain your profile, display your submitted ideas and projects, facilitate collaboration workspaces, and provide direct messaging.
          </li>
          <li>
            <strong>Legitimate Interests:</strong> To protect platform integrity, prevent abuse, calculate authentic performance achievements and badges, audit badge validity, and optimize responsive service performance.
          </li>
          <li>
            <strong>Consent:</strong> Where you provide explicit affirmative consent during signup or policy updates to process versioned legal records.
          </li>
          <li>
            <strong>Legal Compliance:</strong> To satisfy lawful discovery requests, enforce our Terms of Service, and comply with applicable statutory obligations.
          </li>
        </ul>
      </section>

      {/* Section 4: Security & Messaging Limitations */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          4. Security & Technical Safeguards (Honest Disclosure)
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We implement rigorous technical safeguards including encrypted database connections (TLS 1.3), Row Level Security (RLS) policies isolating user records in PostgreSQL, secure HttpOnly session cookies, and bcrypt-hashed authentication passwords.
        </p>
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] text-xs text-amber-200/90 leading-relaxed font-light space-y-1">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Direct Messaging Architecture Disclosure
          </div>
          <p className="m-0">
            Messages exchanged on IdeaEra are encrypted in transit via HTTPS/TLS and encrypted at rest in the database. However, messages are <strong>not client-side end-to-end encrypted (E2EE)</strong> with device-bound private keys. Message contents reside securely on our hosted infrastructure to allow cross-device synchronization and message history. Do not transmit sensitive trade secrets or passwords through the platform.
          </p>
        </div>
      </section>

      {/* Section 5: Third-Party Service Providers */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          5. Third-Party Service Providers
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We do not sell, rent, or trade your personal information. We partner exclusively with infrastructure providers necessary to run the service:
        </p>
        <ul className="text-sm text-neutral-300 space-y-2 font-light list-disc pl-5">
          <li>
            <strong>Supabase Inc. (Database & Authentication Infrastructure):</strong> Hosts our PostgreSQL database, handles user authentication, session tokens, and connection pooling in secure cloud datacenters.
          </li>
          <li>
            <strong>Vercel Inc. (Web Hosting & Edge Delivery):</strong> Hosts the Next.js frontend application and edge proxy routing. Standard web server logs (IP address, user agent, request route) are processed for delivery and DDoS mitigation.
          </li>
        </ul>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We do <strong>not</strong> integrate Google Analytics, advertising tracking pixels, cross-app tracking networks, or commercial data brokers.
        </p>
      </section>

      {/* Section 6: Data Retention & Deletion */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          6. Data Retention, Portability & Account Deletion
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We retain your personal data for as long as your account remains active. You maintain total sovereignty over your presence on IdeaEra:
        </p>
        <ul className="text-sm text-neutral-300 space-y-2 font-light list-disc pl-5">
          <li>
            <strong>Full Account Deletion:</strong> You can permanently delete your account at any time via <Link href="/settings" className="text-indigo-400 hover:underline">Settings &gt; Delete Account</Link>. When triggered, our automated deletion pipeline cascades across ideas, projects, memberships, messages, notifications, and connections, purging your personal records from the primary database.
          </li>
          <li>
            <strong>Badge Audit Records:</strong> When qualifying activity is deleted, our server-side evaluator automatically recalculates and revokes associated badges to prevent fraudulent credentials.
          </li>
        </ul>
      </section>

      {/* Section 7: User Rights */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          7. Your Rights Under Applicable Privacy Laws
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          Depending on your jurisdiction (such as GDPR, UK GDPR, California CCPA/CPRA, or India&apos;s DPDP Act), you possess the right to:
        </p>
        <ul className="text-sm text-neutral-300 space-y-1.5 font-light list-disc pl-5">
          <li>Request access to the personal data we hold about you.</li>
          <li>Request correction or rectification of incomplete or inaccurate data.</li>
          <li>Request erasure / deletion of your account and personal records.</li>
          <li>Review your historical consent audit records via the <Link href="/privacy-center" className="text-indigo-400 hover:underline">Privacy Center</Link>.</li>
          <li>Withdraw previously given consent where applicable.</li>
        </ul>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          To exercise any of these rights, contact us at <code className="text-indigo-300">{LEGAL_CONFIG.privacyEmail}</code>.
        </p>
      </section>

      {/* Section 8: Children's Privacy */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          8. Minors & Children&apos;s Privacy
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          IdeaEra is an innovation and collegiate hackathon collaboration platform intended for students, developers, and adult creators. We do not knowingly collect or solicit personal information from children under the age of 13 (or under 16 where required by regional law). If we become aware that an account was created by an underage minor without verifiable parental consent, we will promptly terminate the account and purge associated data.
        </p>
      </section>

      {/* Section 9: International Transfers & Policy Updates */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          9. Policy Updates & Versioning
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We may update this Privacy Policy to reflect technical enhancements or statutory requirements. When material changes occur, we increment the official policy version (e.g. from v1.0 to v1.1) and display a mandatory review screen upon your next authenticated session. Historical consent records are permanently preserved in our audit logs.
        </p>
      </section>

      {/* Section 10: Contact Information */}
      <section className="space-y-3 pb-8">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          10. Contact Information & Legal Inquiries
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          For privacy inquiries, data subject access requests, or legal notices, please contact our designated privacy operations team:
        </p>
        <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] text-xs font-mono space-y-1 text-neutral-300">
          <div>Entity: <span className="text-white">{LEGAL_CONFIG.entityName}</span></div>
          <div>Privacy Contact: <span className="text-indigo-300">{LEGAL_CONFIG.privacyEmail}</span></div>
          <div>Legal Desk: <span className="text-indigo-300">{LEGAL_CONFIG.supportEmail}</span></div>
          <div>Address: <span className="text-neutral-400">{LEGAL_CONFIG.contactAddress}</span></div>
        </div>
      </section>
    </article>
  );
}
