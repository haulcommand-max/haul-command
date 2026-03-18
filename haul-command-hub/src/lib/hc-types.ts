/**
 * Haul Command — Shared Component Type System
 * 
 * Every HC-prefixed component uses these types.
 * Based on the component contracts spec v1.
 */

// ─── Shared Schema Types ────────────────────────────────────

export interface HCLink {
  label: string;
  href: string;
  external?: boolean;
}

export type HCActionType = 'navigate' | 'call' | 'sms' | 'claim' | 'verify' | 'report' | 'submit';
export type HCActionPriority = 'primary' | 'secondary' | 'tertiary';

export interface HCAction {
  id: string;
  label: string;
  href: string;
  type: HCActionType;
  trackingEvent?: string;
  priority: HCActionPriority;
  icon?: string;
}

export interface HCFreshness {
  lastUpdatedAt: string;       // ISO datetime
  lastSeenAt?: string;         // ISO datetime
  updateLabel: string;         // e.g. "Updated 2 hours ago"
  sourceCount?: number;
}

export interface HCMetric {
  label: string;
  value: string;
  geographyScope: string;
  timeWindow: string;
  freshness: HCFreshness;
  methodologyUrl?: string;
}

export interface HCBadge {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'premium';
  icon?: string;
}

export interface HCContact {
  phoneE164?: string;
  phoneDisplay?: string;
  smsE164?: string;
  websiteUrl?: string;
  email?: string;
}

export interface HCImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface HCResultCard {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  entityType: 'operator' | 'company' | 'broker' | 'infrastructure';
  locationLabel: string;
  badges: HCBadge[];
  primaryActions: HCAction[];
  secondaryActions?: HCAction[];
  freshness?: HCFreshness;
  image?: HCImage;
  href: string;
}

export interface HCBreadcrumb {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface HCFaqItem {
  question: string;
  answer: string;
}

export interface HCCorridorSummary {
  slug: string;
  name: string;
  regionLabels: string[];
  healthLabel?: string;
  rateRangeLabel?: string;
  topServices: string[];
  linkedRequirementsUrl?: string;
  freshness?: HCFreshness;
}

export interface HCRequirementsSummary {
  jurisdictionLabel: string;
  escortThresholds: string[];
  permitLinks: HCLink[];
  lastReviewedAt: string;
  disclaimer?: string;
}

export interface HCRateSummary {
  geographyLabel: string;
  rateRangeLabel: string;
  changeVs7dLabel?: string;
  changeVs30dLabel?: string;
  methodologyUrl?: string;
  freshness?: HCFreshness;
}

export interface HCSponsor {
  label: 'sponsored' | 'featured' | 'promoted';
  sponsorName: string;
  headline: string;
  body?: string;
  cta: HCAction;
  image?: HCImage;
}

// ─── Market Maturity ────────────────────────────────────────

export type MarketMaturityState = 'live' | 'data_only' | 'planned' | 'future';

export type VerificationState = 'unverified' | 'claimed' | 'phone_verified' | 'document_verified' | 'partner_verified';

// ─── Operator Status Badges ─────────────────────────────────

export interface AvailabilityBadge {
  available: boolean;
  label: string;            // e.g. "Available Now", "Unavailable"
  lastConfirmedAt?: string; // ISO datetime
}

export interface FastResponderBadge {
  eligible: boolean;
  label: string;              // e.g. "Fast Responder — avg 12 min"
  avgResponseMinutes?: number;
  qualifiedSince?: string;    // ISO datetime
}

// ─── Claim Pressure ─────────────────────────────────────────

export interface HCClaimPressure {
  unclaimedViews30d: number;
  threshold: number;          // when views exceed this, elevate claim CTA
  elevated: boolean;          // derived: unclaimedViews30d > threshold
  urgencyLevel: 'low' | 'medium' | 'high';
}

// ─── Profile Types ──────────────────────────────────────────

export interface HCProfile {
  id: string;
  slug: string;
  entityType: string;
  displayName: string;
  legalName?: string;
  tagline?: string;
  description?: string;
  verificationState: VerificationState;
  contact: HCContact;
  serviceAreaLabels: string[];
  capabilities: string[];
  badges: HCBadge[];
  freshness: HCFreshness;
  claimStatus: 'unclaimed' | 'claimed';
  heroImage?: HCImage;
  gallery?: HCImage[];
  primaryActions: HCAction[];
  secondaryActions?: HCAction[];
  availability?: AvailabilityBadge;
  fastResponder?: FastResponderBadge;
  claimPressure?: HCClaimPressure;
}
