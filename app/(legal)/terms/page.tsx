import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Scale, ShieldAlert, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { LEGAL_CONFIG } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Terms of Service | IdeaEra",
  description: "Official Terms of Service and Platform Agreement for IdeaEra.",
};

export default function TermsOfServicePage() {
  return (
    <article className="space-y-10 prose prose-invert max-w-none">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono tracking-wider uppercase">
          <Scale className="h-4 w-4" />
          <span>Official Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white m-0">
          IdeaEra Terms of Service
        </h1>
        <div className="flex flex-wrap gap-4 text-xs font-mono text-neutral-400 pt-1">
          <span>Version: <strong className="text-white">{LEGAL_CONFIG.termsVersion}</strong></span>
          <span>•</span>
          <span>Effective Date: <strong className="text-white">{LEGAL_CONFIG.effectiveDate}</strong></span>
          <span>•</span>
          <span>Last Updated: <strong className="text-white">{LEGAL_CONFIG.lastUpdated}</strong></span>
        </div>
      </div>

      {/* Mandatory IP Callout Box */}
      <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] space-y-2">
        <h3 className="text-sm font-semibold text-amber-300 m-0 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          Crucial Notice Regarding Ideas & Intellectual Property
        </h3>
        <p className="text-xs text-neutral-200 leading-relaxed m-0 font-light">
          IdeaEra provides privacy controls, controlled sharing, access management, and platform timestamped history to help users manage their ideas. <strong>These technical features do not guarantee that an idea cannot be copied and do not themselves create legal copyright, patent, trademark, trade-secret, or other intellectual-property protection.</strong> We strongly encourage innovators to seek appropriate professional legal counsel and registered protection when necessary before publishing sensitive proprietary concepts.
        </p>
      </div>

      {/* Section 1: Acceptance */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          1. Acceptance of Terms
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;) and {LEGAL_CONFIG.entityName} (&quot;IdeaEra&quot;, &quot;we&quot;, &quot;us&quot;). By creating an account, browsing public concepts, joining project workspaces, or using our collaboration services, you agree to be bound by these Terms and our <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          If you do not agree to these Terms in their entirety, you must not select the acceptance checkbox and must refrain from using the platform.
        </p>
      </section>

      {/* Section 2: Account Creation & Security */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          2. Account Registration & Security
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          To access collaboration, workspace, and submission features, you must register an account. You agree to:
        </p>
        <ul className="text-sm text-neutral-300 space-y-1.5 font-light list-disc pl-5">
          <li>Provide accurate, current, and complete registration information.</li>
          <li>Maintain the confidentiality of your authentication credentials.</li>
          <li>Never share account access or impersonate any individual or organization.</li>
          <li>Promptly notify us at <code className="text-indigo-300">{LEGAL_CONFIG.abuseEmail}</code> if you detect unauthorized account activity.</li>
        </ul>
      </section>

      {/* Section 3: Ideas & Intellectual Property */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          3. Ideas, Ownership & Intellectual Property Rights
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          IdeaEra was built to empower collegiate creators and founders. Our core intellectual property principles are:
        </p>
        <ul className="text-sm text-neutral-300 space-y-2 font-light list-disc pl-5">
          <li>
            <strong>You Retain Ownership:</strong> You retain all ownership rights in and to the original concepts, code, project documentation, designs, and content you submit to IdeaEra. IdeaEra does not claim equity, intellectual ownership, or commercial licensing rights over your submitted ideas.
          </li>
          <li>
            <strong>Limited Operational License:</strong> Solely to provide the platform (e.g. hosting your project pages, rendering cards in search, matching teammates, and generating badge credentials), you grant IdeaEra a non-exclusive, worldwide, royalty-free license to display, transmit, and format your content according to your chosen visibility settings.
          </li>
          <li>
            <strong>Visibility Controls:</strong> When you mark an idea or workspace as &quot;Public&quot;, you acknowledge that other registered innovators can view, comment on, and critique your idea. If an idea contains unpatented trade secrets, keep it &quot;Private&quot; or execute private nondisclosure agreements before sharing.
          </li>
          <li>
            <strong>No Guarantee of Non-Copying:</strong> As explicitly stated above, IdeaEra does not and cannot guarantee that third parties who view your public submissions will not independently replicate or adapt concepts. You are solely responsible for obtaining legal patents, trademarks, or copyrights.
          </li>
        </ul>
      </section>

      {/* Section 4: Projects & Team Collaboration */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          4. Project Workspaces, Teams & &quot;Project Rescue&quot;
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          When participating in team workspaces or Project Rescue:
        </p>
        <ul className="text-sm text-neutral-300 space-y-1.5 font-light list-disc pl-5">
          <li>Project architects control membership and role designations (Owner, Contributor, Viewer).</li>
          <li>Collaborators agree to interact professionally, respect code repositories, and adhere to open-source or proprietary licenses specified by the project owner.</li>
          <li>IdeaEra is not an employer, broker, or agent in any team formation and assumes no responsibility for disputes between team members regarding contributions, equity splits, or prize distributions.</li>
        </ul>
      </section>

      {/* Section 5: Hackathons & External Links */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          5. Hackathon Directory & Third-Party Resources
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          IdeaEra provides an index of collegiate and global hackathons (including Smart India Hackathon, MLH, Naan Mudhalvan, and campus sprints). Hackathons are hosted and governed by independent third-party institutions. We are not responsible for event scheduling, rule changes, judging decisions, prize payouts, or external website content.
        </p>
      </section>

      {/* Section 6: Prohibited Conduct */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          6. Acceptable Use & Prohibited Conduct
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          You agree not to engage in any of the following prohibited activities:
        </p>
        <ul className="text-sm text-neutral-300 space-y-1.5 font-light list-disc pl-5">
          <li>Harassing, threatening, defaming, or abusing fellow builders or mentors.</li>
          <li>Submitting fraudulent, plagiarized, or counterfeit project submissions to artificially game badges or credentials.</li>
          <li>Injecting malware, unauthorized automated scrapers, bots, or DDoS attacks against platform endpoints.</li>
          <li>Publishing unsolicited commercial spam, pyramid schemes, or illegal material.</li>
          <li>Attempting to bypass database Row Level Security (RLS) policies or access private records belonging to other users.</li>
        </ul>
      </section>

      {/* Section 7: Enforcement & Account Deletion */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          7. Account Suspension, Termination & Content Removal
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          We reserve the right to suspend or terminate accounts, remove infringing content, or revoke earned badges if a user violates these Terms or our community standards. Users can voluntarily delete their account at any time via Settings.
        </p>
      </section>

      {/* Section 8: Disclaimers & Limitations of Liability */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          8. Disclaimers of Warranties & Limitation of Liability
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          IDEAERA IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, IDEAERA AND ITS OPERATORS DISCLAIM ALL WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          IN NO EVENT SHALL IDEAERA BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR ACCESS TO, INABILITY TO ACCESS, OR CONTENT SHARED ON THE PLATFORM.
        </p>
      </section>

      {/* Section 9: Governing Law & Jurisdiction */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          9. Governing Law & Dispute Resolution
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          These Terms shall be construed and governed in accordance with the laws of {LEGAL_CONFIG.jurisdiction}, without giving effect to conflict of laws principles. Any legal suit or proceeding shall be instituted exclusively in the designated courts of that jurisdiction.
        </p>
      </section>

      {/* Section 10: Contact Information */}
      <section className="space-y-3 pb-8">
        <h2 className="text-xl font-medium text-white border-b border-white/5 pb-2">
          10. Inquiries & Legal Notices
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed font-light">
          For legal notices, terms inquiries, or copyright infringement notifications, please contact our legal desk:
        </p>
        <div className="p-4 rounded-xl border border-white/10 bg-[#0d1017] text-xs font-mono space-y-1 text-neutral-300">
          <div>Entity: <span className="text-white">{LEGAL_CONFIG.entityName}</span></div>
          <div>Legal Desk: <span className="text-indigo-300">{LEGAL_CONFIG.supportEmail}</span></div>
          <div>Abuse & Takedowns: <span className="text-indigo-300">{LEGAL_CONFIG.abuseEmail}</span></div>
          <div>Postal: <span className="text-neutral-400">{LEGAL_CONFIG.contactAddress}</span></div>
        </div>
      </section>
    </article>
  );
}
