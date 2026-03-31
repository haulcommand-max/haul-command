// ══════════════════════════════════════════════════════════════
// IDENTITY LADDER — Visitor → Member → Claim → Paid progression
// This is the pre-claim and cross-claim identity system that
// covers states the claim-engine doesn't (anonymous, email-only,
// alert subscriber, community member).
//
// The claim-engine handles: claim_started → premium_paid
// This ladder handles: anonymous → known_email → alert_subscriber
//   → community_member → [claim-engine takes over] → sponsor
// ══════════════════════════════════════════════════════════════

export const IDENTITY_RUNGS = [
  'anonymous',
  'cookie_identified',      // has session cookie, return visitor
  'known_email',            // gave us email via any surface
  'alert_subscriber',       // subscribed to at least one alert category
  'community_member',       // confirmed FB group or other community
  'claimed_profile',        // entered claim flow (handoff to claim-engine)
  'verified_profile',       // claim-engine: verification_pending → dispatch_eligible
  'paid_subscriber',        // Stripe subscription active
  'sponsor',                // AdGrid/corridor sponsor
  'data_buyer',             // Enterprise data API customer
] as const;

export type IdentityRung = (typeof IDENTITY_RUNGS)[number];

// ── Community State (never assume) ──
export type CommunityConfirmation = 'confirmed' | 'declined' | 'unknown';

export interface VisitorIdentity {
  // Core identity
  rung: IdentityRung;
  sessionId: string;
  userId: string | null;       // null if anonymous
  email: string | null;

  // Role inference
  inferredRole: VisitorRole;
  roleConfidence: number;      // 0-1

  // Community state — NEVER assume true
  facebookGroupConfirmed: CommunityConfirmation;
  communityJoinedAt: string | null;

  // Alert state
  alertCategories: AlertCategory[];
  pushEnabled: boolean;

  // Saved intent state
  savedStates: string[];
  savedCorridors: string[];
  savedOperators: string[];
  savedSearches: SavedSearch[];
  followedRegulations: string[];

  // Engagement signals
  pageviewCount: number;
  firstVisitAt: string;
  lastVisitAt: string;
  totalSessionSeconds: number;
  directoryPageviews: number;
  toolUsageCount: number;
  searchCount: number;
  scrollDepthMax: number;      // 0-100

  // Claim state (if in claim flow)
  claimState: string | null;   // from claim-engine
  profileCompletionPct: number;

  // Monetization state
  stripeCustomerId: string | null;
  subscriptionTier: 'none' | 'basic' | 'pro' | 'elite' | 'broker_seat';
  sponsorActive: boolean;
}

// ── Role Inference ──
export type VisitorRole =
  | 'operator'    // escort/pilot car operator
  | 'shipper'     // needs to move oversize loads
  | 'broker'      // arranges transport
  | 'carrier'     // trucking company
  | 'startup'     // wants to start pilot car business
  | 'unknown';

export function inferRole(identity: VisitorIdentity, pageHistory: PageContext[]): { role: VisitorRole; confidence: number } {
  let scores: Record<VisitorRole, number> = {
    operator: 0, shipper: 0, broker: 0, carrier: 0, startup: 0, unknown: 0,
  };

  for (const page of pageHistory) {
    switch (page.pageType) {
      case 'certification':
      case 'operator_directory':
      case 'equipment_checklist':
        scores.operator += 2;
        break;
      case 'pilot_car_startup':
        scores.startup += 5;
        scores.operator += 1;
        break;
      case 'permit':
      case 'regulation':
      case 'cost_calculator':
        scores.shipper += 2;
        scores.carrier += 1;
        break;
      case 'directory_search':
      case 'broker_tools':
        scores.broker += 3;
        break;
      case 'corridor':
      case 'route_check':
        scores.carrier += 2;
        scores.broker += 1;
        break;
      case 'glossary':
      case 'blog':
        // Educational — no strong signal
        scores.unknown += 0.5;
        break;
    }
  }

  const entries = Object.entries(scores).filter(([k]) => k !== 'unknown') as [VisitorRole, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const [topRole, topScore] = entries[0];
  const [, secondScore] = entries[1] || ['unknown', 0];
  const totalNonZero = entries.reduce((s, [, v]) => s + v, 0);

  if (totalNonZero === 0) return { role: 'unknown', confidence: 0 };

  const confidence = Math.min(1, (topScore - secondScore) / Math.max(totalNonZero, 1) + topScore * 0.1);
  return { role: topRole, confidence: Math.round(confidence * 100) / 100 };
}

// ── Rung Calculation ──
export function calculateRung(identity: VisitorIdentity): IdentityRung {
  if (identity.sponsorActive) return 'sponsor';
  if (identity.stripeCustomerId && identity.subscriptionTier !== 'none') return 'paid_subscriber';
  if (identity.claimState && ['dispatch_eligible', 'premium_trial', 'premium_paid'].includes(identity.claimState)) return 'verified_profile';
  if (identity.claimState && identity.claimState !== 'unclaimed') return 'claimed_profile';
  if (identity.facebookGroupConfirmed === 'confirmed') return 'community_member';
  if (identity.alertCategories.length > 0) return 'alert_subscriber';
  if (identity.email) return 'known_email';
  if (identity.pageviewCount > 1) return 'cookie_identified';
  return 'anonymous';
}

// ── Alert Categories — specific, not generic ──
export type AlertCategory =
  | 'state_regulation_changes'
  | 'corridor_disruptions'
  | 'permit_delays'
  | 'operator_demand'
  | 'high_pole_jobs'
  | 'border_compliance'
  | 'frost_law_seasonal'
  | 'new_loads_corridor'
  | 'escort_availability'
  | 'price_changes'
  | 'certification_renewals'
  | 'insurance_expiry';

export const ALERT_CATEGORY_CONFIG: Record<AlertCategory, {
  label: string;
  description: string;
  icon: string;
  targetRoles: VisitorRole[];
  monetizable: boolean;
}> = {
  state_regulation_changes: {
    label: 'Regulation Alerts',
    description: 'Get notified when oversize/overweight rules change in your states',
    icon: '📋',
    targetRoles: ['operator', 'carrier', 'shipper', 'broker'],
    monetizable: true,
  },
  corridor_disruptions: {
    label: 'Corridor Disruptions',
    description: 'Real-time closures, weather impacts, and detour alerts',
    icon: '🚧',
    targetRoles: ['carrier', 'broker', 'operator'],
    monetizable: true,
  },
  permit_delays: {
    label: 'Permit Delay Alerts',
    description: 'Know when state permit processing times change',
    icon: '📄',
    targetRoles: ['shipper', 'carrier', 'broker'],
    monetizable: true,
  },
  operator_demand: {
    label: 'Operator Demand',
    description: 'Coverage gaps and high-demand zones near you',
    icon: '📍',
    targetRoles: ['operator'],
    monetizable: true,
  },
  high_pole_jobs: {
    label: 'High Pole Jobs',
    description: 'Urgent high-pole escort requests in your area',
    icon: '🏗️',
    targetRoles: ['operator'],
    monetizable: true,
  },
  border_compliance: {
    label: 'Border Compliance',
    description: 'Cross-border rule changes and wait time alerts',
    icon: '🛂',
    targetRoles: ['carrier', 'broker'],
    monetizable: true,
  },
  frost_law_seasonal: {
    label: 'Seasonal Restrictions',
    description: 'Frost laws, thaw periods, and weight restriction updates',
    icon: '❄️',
    targetRoles: ['carrier', 'broker', 'operator'],
    monetizable: false,
  },
  new_loads_corridor: {
    label: 'New Load Alerts',
    description: 'Loads posted on your saved corridors',
    icon: '📦',
    targetRoles: ['operator', 'carrier'],
    monetizable: true,
  },
  escort_availability: {
    label: 'Escort Availability',
    description: 'Know when escorts become available on your routes',
    icon: '🚗',
    targetRoles: ['broker', 'shipper'],
    monetizable: true,
  },
  price_changes: {
    label: 'Rate Intelligence',
    description: 'Market rate shifts and seasonal pricing trends',
    icon: '💰',
    targetRoles: ['broker', 'shipper', 'carrier'],
    monetizable: true,
  },
  certification_renewals: {
    label: 'Certification Renewals',
    description: 'Renewal deadlines for your pilot car certifications',
    icon: '🎓',
    targetRoles: ['operator'],
    monetizable: false,
  },
  insurance_expiry: {
    label: 'Insurance Expiry',
    description: 'Don\'t let your coverage lapse — get renewal reminders',
    icon: '🛡️',
    targetRoles: ['operator', 'carrier'],
    monetizable: false,
  },
};

// ── Saved Intent Types ──
export interface SavedSearch {
  id: string;
  query: string;
  filters: Record<string, string>;
  savedAt: string;
  lastNotifiedAt: string | null;
}

// ── Page Context (for role inference + CTA routing) ──
export type PageType =
  | 'homepage'
  | 'directory_search'
  | 'operator_directory'
  | 'company_directory'
  | 'certification'
  | 'pilot_car_startup'
  | 'regulation'
  | 'permit'
  | 'corridor'
  | 'glossary'
  | 'blog'
  | 'tool'
  | 'bridge_calculator'
  | 'frost_law'
  | 'cross_border'
  | 'equipment_checklist'
  | 'cost_calculator'
  | 'route_check'
  | 'broker_tools'
  | 'resource_hub'
  | 'state_page'
  | 'city_page'
  | 'country_page';

export interface PageContext {
  pageType: PageType;
  slug: string;
  stateCode?: string;
  countryCode?: string;
  entityId?: string;        // operator/company ID if on a listing page
  entityClaimed?: boolean;  // is the listing claimed?
  categorySlug?: string;
}
