/**
 * Centralized Legal Configuration & Policy Version Management for IdeaEra.
 * All policy version increments and legal constants must be managed here.
 */

export const CURRENT_PRIVACY_POLICY_VERSION = "1.0";
export const CURRENT_TERMS_VERSION = "1.0";
export const CURRENT_COOKIE_POLICY_VERSION = "1.0";

export const LEGAL_CONFIG = {
  appName: "IdeaEra",
  platformTagline: "Where ideas become possibilities",
  effectiveDate: "September 25, 2026",
  lastUpdated: "September 25, 2026",
  privacyVersion: CURRENT_PRIVACY_POLICY_VERSION,
  termsVersion: CURRENT_TERMS_VERSION,
  cookieVersion: CURRENT_COOKIE_POLICY_VERSION,

  // Organization & Legal Representation Placeholders
  entityName: "[IdeaEra Platform Operator / Legal Entity Pending Final Registration]",
  jurisdiction: "[State of Delaware, United States / State of Tamil Nadu, India — Final Governing Law Clause Subject to Counsel Review]",
  supportEmail: "legal@ideaera.com",
  privacyEmail: "privacy@ideaera.com",
  abuseEmail: "abuse@ideaera.com",
  contactAddress: "[IdeaEra Legal Operations, 100 Innovation Way, Suite 400 — Physical Address Placeholder]",

  // Disclaimer for development / staging artifacts
  legalCounselReviewNotice:
    "NOTICE: These legal documents accurately describe IdeaEra's real architecture and data processing practices. They represent product drafts that require final formal review by qualified legal counsel prior to public commercial launch.",
};
