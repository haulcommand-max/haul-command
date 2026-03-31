// ══════════════════════════════════════════════════════════════
// CAPTURE ROUTER — Contextual "best next step" decision engine
//
// NOT a dumb popup. This is a sitewide decision engine that:
//  1. Reads visitor identity state (identity-ladder.ts)
//  2. Reads page context (what page, what entities)
//  3. Reads behavioral signals (time, scroll, clicks, searches)
//  4. Returns THE SINGLE BEST offer to show
//
// Priority order (owned assets first):
//  1. Claim / login / profile ownership
//  2. Email or push alerts
//  3. Saved search / saved corridor / saved state
//  4. Availability / operator readiness
//  5. Facebook group (rented land — last resort)
//  6. Do nothing (if user is deep in system)
// ══════════════════════════════════════════════════════════════

import type {
  VisitorIdentity,
  VisitorRole,
  PageContext,
  AlertCategory,
  IdentityRung,
  CommunityConfirmation,
} from './identity-ladder';
import { calculateRung, ALERT_CATEGORY_CONFIG } from './identity-ladder';

// ── Trigger Conditions ──
export interface TriggerSignals {
  timeOnPageSeconds: number;
  sessionPageviews: number;
  scrollDepthPct: number;
  hasClickedResult: boolean;
  hasUsedSearch: boolean;
  hasUsedFilter: boolean;
  hasUsedTool: boolean;
  isMobile: boolean;
  isReturnVisitor: boolean;
  referrerType: 'organic' | 'direct' | 'social' | 'paid' | 'referral' | 'unknown';
}

// ── Offer Types (priority-ordered) ──
export type OfferType =
  | 'claim_profile'
  | 'verify_profile'
  | 'set_availability'
  | 'set_coverage'
  | 'subscribe_alerts'
  | 'save_search'
  | 'save_corridor'
  | 'save_state'
  | 'follow_regulation'
  | 'save_operator'
  | 'get_urgent_dispatch'
  | 'upgrade_premium'
  | 'join_community'
  | 'two_path_chooser'
  | 'none';

export interface CaptureOffer {
  type: OfferType;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryCta?: { label: string; url: string };
  icon: string;
  variant: 'slide_in' | 'bottom_sheet' | 'inline_card';
  priority: number;        // 1 = highest
  dismissKey: string;      // localStorage key to avoid re-showing
  cooldownMinutes: number; // don't re-show for N minutes after dismiss
}

// ── Should we even show anything? ──
export function shouldTrigger(signals: TriggerSignals, pageContext: PageContext): boolean {
  // Never trigger on first 10 seconds
  if (signals.timeOnPageSeconds < 10) return false;

  // Directory pages: 20s OR second pageview OR interaction
  if (pageContext.pageType === 'operator_directory' || pageContext.pageType === 'directory_search' || pageContext.pageType === 'company_directory') {
    return (
      signals.timeOnPageSeconds >= 20 ||
      signals.sessionPageviews >= 2 ||
      signals.hasClickedResult ||
      signals.hasUsedSearch ||
      signals.hasUsedFilter
    );
  }

  // Tool pages: after tool use
  if (pageContext.pageType === 'tool' || pageContext.pageType === 'bridge_calculator' || pageContext.pageType === 'cost_calculator') {
    return signals.hasUsedTool || signals.timeOnPageSeconds >= 30;
  }

  // Regulation/certification pages: 25s or scroll depth
  if (pageContext.pageType === 'regulation' || pageContext.pageType === 'certification' || pageContext.pageType === 'frost_law') {
    return signals.timeOnPageSeconds >= 25 || signals.scrollDepthPct >= 60;
  }

  // Blog/glossary: 30s or deep scroll (engaged reader)
  if (pageContext.pageType === 'blog' || pageContext.pageType === 'glossary') {
    return signals.timeOnPageSeconds >= 30 || signals.scrollDepthPct >= 70;
  }

  // Mobile: scroll depth is primary signal
  if (signals.isMobile) {
    return signals.scrollDepthPct >= 50 || signals.timeOnPageSeconds >= 25;
  }

  // Default: 25s or second pageview
  return signals.timeOnPageSeconds >= 25 || signals.sessionPageviews >= 2;
}

// ══════════════════════════════════════════════════════════════
// THE CORE DECISION ENGINE
// ══════════════════════════════════════════════════════════════

export function decideCaptureOffer(
  identity: VisitorIdentity,
  pageContext: PageContext,
  signals: TriggerSignals,
): CaptureOffer | null {
  const rung = calculateRung(identity);

  // ── DEEP USERS: Don't waste the slot on noise ──
  if (rung === 'sponsor' || rung === 'data_buyer') return null;

  // ── PAID SUBSCRIBER: Show high-value upgrades only ──
  if (rung === 'paid_subscriber') {
    return paidSubscriberOffer(identity, pageContext);
  }

  // ── VERIFIED PROFILE: Push availability/dispatch/upgrade ──
  if (rung === 'verified_profile') {
    return verifiedProfileOffer(identity, pageContext);
  }

  // ── CLAIMED PROFILE: Push verification/completion ──
  if (rung === 'claimed_profile') {
    return claimedProfileOffer(identity, pageContext);
  }

  // ── COMMUNITY MEMBER: Push claim or alerts ──
  if (rung === 'community_member') {
    return communityMemberOffer(identity, pageContext);
  }

  // ── ALERT SUBSCRIBER: Push community or claim ──
  if (rung === 'alert_subscriber') {
    return alertSubscriberOffer(identity, pageContext);
  }

  // ── KNOWN EMAIL: Push alerts or community ──
  if (rung === 'known_email') {
    return knownEmailOffer(identity, pageContext);
  }

  // ── ANONYMOUS / COOKIE-ONLY: Show two-path or role-aware offer ──
  return anonymousOffer(identity, pageContext, signals);
}

// ══════════════════════════════════════════════════════════════
// RUNG-SPECIFIC OFFER GENERATORS
// ══════════════════════════════════════════════════════════════

function paidSubscriberOffer(identity: VisitorIdentity, ctx: PageContext): CaptureOffer | null {
  // Only show high-value: save corridor, follow regulation, sponsor opportunity
  if (ctx.pageType === 'corridor') {
    return {
      type: 'save_corridor',
      headline: 'Follow this corridor',
      subtext: 'Get real-time disruption, demand, and rate alerts for this route',
      ctaLabel: 'Follow Corridor',
      ctaUrl: `/api/capture/save-corridor?slug=${ctx.slug}`,
      icon: '🛤️',
      variant: 'inline_card',
      priority: 3,
      dismissKey: `dismiss_corridor_${ctx.slug}`,
      cooldownMinutes: 1440, // 24h
    };
  }
  if (ctx.pageType === 'regulation' || ctx.pageType === 'frost_law') {
    return {
      type: 'follow_regulation',
      headline: 'Follow this regulation',
      subtext: 'Get notified when rules change in this jurisdiction',
      ctaLabel: 'Follow Updates',
      ctaUrl: `/api/capture/follow-regulation?slug=${ctx.slug}`,
      icon: '📋',
      variant: 'inline_card',
      priority: 3,
      dismissKey: `dismiss_reg_${ctx.slug}`,
      cooldownMinutes: 1440,
    };
  }
  return null; // Don't waste the slot
}

function verifiedProfileOffer(identity: VisitorIdentity, ctx: PageContext): CaptureOffer | null {
  const role = identity.inferredRole;
  if (role === 'operator') {
    return {
      type: 'set_availability',
      headline: 'Set your availability',
      subtext: 'Available operators appear 2× higher in search and get dispatch priority',
      ctaLabel: 'Set Available Now',
      ctaUrl: '/dashboard/availability',
      icon: '🟢',
      variant: 'bottom_sheet',
      priority: 1,
      dismissKey: 'dismiss_availability',
      cooldownMinutes: 480, // 8h
    };
  }
  if (role === 'broker' || role === 'shipper') {
    return {
      type: 'save_search',
      headline: 'Save this search',
      subtext: 'Get notified when new operators match your criteria',
      ctaLabel: 'Save Search',
      ctaUrl: '/api/capture/save-search',
      icon: '🔍',
      variant: 'slide_in',
      priority: 2,
      dismissKey: 'dismiss_save_search',
      cooldownMinutes: 720,
    };
  }
  return null;
}

function claimedProfileOffer(identity: VisitorIdentity, ctx: PageContext): CaptureOffer | null {
  const completionPct = identity.profileCompletionPct;
  if (completionPct < 50) {
    return {
      type: 'verify_profile',
      headline: `Your profile is ${completionPct}% complete`,
      subtext: 'Complete verification to appear in search and receive dispatch leads',
      ctaLabel: 'Complete Profile',
      ctaUrl: '/dashboard/profile',
      icon: '📊',
      variant: 'bottom_sheet',
      priority: 1,
      dismissKey: 'dismiss_complete_profile',
      cooldownMinutes: 240,
    };
  }
  if (completionPct < 70) {
    return {
      type: 'verify_profile',
      headline: 'Almost dispatch-eligible',
      subtext: `${70 - completionPct}% more to unlock dispatch waves and map placement`,
      ctaLabel: 'Finish Verification',
      ctaUrl: '/dashboard/profile',
      icon: '🎯',
      variant: 'slide_in',
      priority: 1,
      dismissKey: 'dismiss_finish_verification',
      cooldownMinutes: 360,
    };
  }
  // Already past 70 — push premium
  return {
    type: 'upgrade_premium',
    headline: 'Unlock Commander features',
    subtext: 'See who viewed your profile, get priority dispatch, and unlock analytics',
    ctaLabel: 'Start 14-Day Trial',
    ctaUrl: '/pricing',
    icon: '⚡',
    variant: 'slide_in',
    priority: 2,
    dismissKey: 'dismiss_premium_trial',
    cooldownMinutes: 1440,
  };
}

function communityMemberOffer(identity: VisitorIdentity, ctx: PageContext): CaptureOffer | null {
  // Community member but no claimed profile → push claim
  if (ctx.pageType === 'operator_directory' && ctx.entityClaimed === false && ctx.entityId) {
    return {
      type: 'claim_profile',
      headline: 'Claim this profile',
      subtext: 'Verify ownership, add certifications, and start receiving leads',
      ctaLabel: 'Claim Now',
      ctaUrl: `/claim?listing=${ctx.entityId}`,
      icon: '🛡️',
      variant: 'bottom_sheet',
      priority: 1,
      dismissKey: `dismiss_claim_${ctx.entityId}`,
      cooldownMinutes: 720,
    };
  }
  // Push alerts if not already subscribed
  if (identity.alertCategories.length === 0) {
    return buildAlertOffer(identity, ctx);
  }
  return null;
}

function alertSubscriberOffer(identity: VisitorIdentity, ctx: PageContext): CaptureOffer | null {
  // Has alerts but not community → push claim first (higher value), then community
  if (ctx.pageType === 'operator_directory' && ctx.entityClaimed === false && ctx.entityId) {
    return {
      type: 'claim_profile',
      headline: 'Is this your business?',
      subtext: 'Claim to update details, receive direct leads, and get verified',
      ctaLabel: 'Claim Profile',
      ctaUrl: `/claim?listing=${ctx.entityId}`,
      icon: '🛡️',
      variant: 'bottom_sheet',
      priority: 1,
      dismissKey: `dismiss_claim_${ctx.entityId}`,
      cooldownMinutes: 720,
    };
  }
  // If not on a claimable page, push community
  if (identity.facebookGroupConfirmed === 'unknown') {
    return {
      type: 'join_community',
      headline: 'Join the operator community',
      subtext: 'Connect with 2,500+ pilot car operators, share intel, and get peer support',
      ctaLabel: 'Join Group',
      ctaUrl: 'https://www.facebook.com/groups/haulcommand',
      secondaryCta: { label: 'Already a member', url: '/api/capture/confirm-community' },
      icon: '👥',
      variant: 'slide_in',
      priority: 5, // Low priority — rented land
      dismissKey: 'dismiss_community',
      cooldownMinutes: 4320, // 3 days
    };
  }
  return null;
}

function knownEmailOffer(identity: VisitorIdentity, ctx: PageContext): CaptureOffer | null {
  // Has email but no alerts → push specific alerts based on page context
  return buildAlertOffer(identity, ctx);
}

function anonymousOffer(
  identity: VisitorIdentity,
  ctx: PageContext,
  signals: TriggerSignals,
): CaptureOffer | null {
  const role = identity.inferredRole;

  // If on an unclaimed directory listing → always push claim
  if (
    (ctx.pageType === 'operator_directory' || ctx.pageType === 'company_directory') &&
    ctx.entityClaimed === false &&
    ctx.entityId
  ) {
    return {
      type: 'claim_profile',
      headline: 'Is this your business?',
      subtext: 'Claim to verify, update details, and boost your rank',
      ctaLabel: 'Claim Now',
      ctaUrl: `/claim?listing=${ctx.entityId}`,
      icon: '🛡️',
      variant: 'bottom_sheet',
      priority: 1,
      dismissKey: `dismiss_claim_${ctx.entityId}`,
      cooldownMinutes: 720,
    };
  }

  // If operator-like behavior → push claim or certification path
  if (role === 'operator' || role === 'startup') {
    return {
      type: 'two_path_chooser',
      headline: 'Welcome to Haul Command',
      subtext: 'Choose your path to get started',
      ctaLabel: 'Claim Your Profile',
      ctaUrl: '/claim',
      secondaryCta: { label: 'Get Operator Alerts', url: '/alerts/subscribe?role=operator' },
      icon: '🚗',
      variant: 'bottom_sheet',
      priority: 1,
      dismissKey: 'dismiss_two_path_operator',
      cooldownMinutes: 1440,
    };
  }

  // If shipper/broker-like behavior → push save/alerts
  if (role === 'broker' || role === 'shipper') {
    return {
      type: 'two_path_chooser',
      headline: 'Find escorts faster',
      subtext: 'Save your search or get alerts for your corridors',
      ctaLabel: 'Get Route Alerts',
      ctaUrl: '/alerts/subscribe?role=shipper',
      secondaryCta: { label: 'Save This Search', url: '/api/capture/save-search' },
      icon: '📦',
      variant: 'slide_in',
      priority: 2,
      dismissKey: 'dismiss_two_path_shipper',
      cooldownMinutes: 1440,
    };
  }

  // Unknown role — generic two-path
  return {
    type: 'two_path_chooser',
    headline: 'Get heavy haul intelligence',
    subtext: 'Choose what fits you best',
    ctaLabel: 'Get Heavy Haul Alerts',
    ctaUrl: '/alerts/subscribe',
    secondaryCta: { label: 'Join Operator Community', url: '/community' },
    icon: '🎯',
    variant: 'bottom_sheet',
    priority: 3,
    dismissKey: 'dismiss_two_path_generic',
    cooldownMinutes: 2880, // 48h
  };
}

// ══════════════════════════════════════════════════════════════
// ALERT OFFER BUILDER — picks the best alert category for context
// ══════════════════════════════════════════════════════════════

function buildAlertOffer(identity: VisitorIdentity, ctx: PageContext): CaptureOffer | null {
  const role = identity.inferredRole;
  const existingAlerts = new Set(identity.alertCategories);

  // Map page context to the most relevant alert category
  const contextAlertMap: Partial<Record<string, AlertCategory>> = {
    regulation: 'state_regulation_changes',
    frost_law: 'frost_law_seasonal',
    permit: 'permit_delays',
    corridor: 'corridor_disruptions',
    cross_border: 'border_compliance',
    certification: 'certification_renewals',
    operator_directory: 'escort_availability',
    directory_search: 'escort_availability',
    cost_calculator: 'price_changes',
    blog: 'state_regulation_changes',
  };

  const suggestedCategory = contextAlertMap[ctx.pageType];

  if (suggestedCategory && !existingAlerts.has(suggestedCategory)) {
    const config = ALERT_CATEGORY_CONFIG[suggestedCategory];
    return {
      type: 'subscribe_alerts',
      headline: config.label,
      subtext: config.description,
      ctaLabel: `Get ${config.label}`,
      ctaUrl: `/alerts/subscribe?category=${suggestedCategory}`,
      icon: config.icon,
      variant: 'slide_in',
      priority: 2,
      dismissKey: `dismiss_alert_${suggestedCategory}`,
      cooldownMinutes: 1440,
    };
  }

  // Fallback: suggest the highest-value alert the user doesn't have yet
  const roleAlerts = Object.entries(ALERT_CATEGORY_CONFIG)
    .filter(([key, cfg]) => cfg.targetRoles.includes(role) && !existingAlerts.has(key as AlertCategory))
    .sort(([, a], [, b]) => (b.monetizable ? 1 : 0) - (a.monetizable ? 1 : 0));

  if (roleAlerts.length > 0) {
    const [key, config] = roleAlerts[0];
    return {
      type: 'subscribe_alerts',
      headline: config.label,
      subtext: config.description,
      ctaLabel: `Subscribe`,
      ctaUrl: `/alerts/subscribe?category=${key}`,
      icon: config.icon,
      variant: 'slide_in',
      priority: 3,
      dismissKey: `dismiss_alert_${key}`,
      cooldownMinutes: 2880,
    };
  }

  return null;
}

// ══════════════════════════════════════════════════════════════
// DISMISS / COOLDOWN MANAGER (client-side localStorage)
// ══════════════════════════════════════════════════════════════

export function isDismissed(dismissKey: string, cooldownMinutes: number): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(`hc_dismiss_${dismissKey}`);
  if (!raw) return false;
  const dismissedAt = parseInt(raw, 10);
  const elapsed = (Date.now() - dismissedAt) / 60000;
  return elapsed < cooldownMinutes;
}

export function markDismissed(dismissKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`hc_dismiss_${dismissKey}`, Date.now().toString());
}
