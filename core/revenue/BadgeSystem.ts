// ══════════════════════════════════════════════════════════════
// HC CERTIFIED BADGE SYSTEM — Revenue Feature
// Paid verification that boosts trust + visibility.
// Free: unclaimed profile. $49/mo: verified badge.
// $149/mo: Certified Pro with priority ranking.
// ══════════════════════════════════════════════════════════════

export interface BadgeTier {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  benefits: string[];
  rankBoost: number;        // Multiplier applied to rank_score
  searchPriority: number;   // 0 = normal, 1 = boosted, 2 = top
  badgeSvg: string;
}

export const BADGE_TIERS: Record<string, BadgeTier> = {
  unclaimed: {
    id: 'unclaimed', name: 'Unclaimed', monthlyPrice: 0, annualPrice: 0,
    color: '#6B6B75', bgColor: 'rgba(107,107,117,0.08)', borderColor: 'rgba(107,107,117,0.15)',
    icon: '○', benefits: ['Basic listing', 'Name + location visible', 'Claim CTA shown'],
    rankBoost: 1.0, searchPriority: 0,
    badgeSvg: '',
  },
  verified: {
    id: 'verified', name: 'Verified', monthlyPrice: 49, annualPrice: 468,
    color: '#22c55e', bgColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.20)',
    icon: '✓', benefits: [
      'Green verified badge on profile', 'Contact info visible to brokers',
      'Direct messaging enabled', 'Rate card display', 'Appear in search results',
      'Respond to loads', '1.3× rank boost',
    ],
    rankBoost: 1.3, searchPriority: 1,
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#22c55e" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  certified_pro: {
    id: 'certified_pro', name: 'Certified Pro', monthlyPrice: 149, annualPrice: 1428,
    color: '#C6923A', bgColor: 'rgba(198,146,58,0.08)', borderColor: 'rgba(198,146,58,0.25)',
    icon: '★', benefits: [
      'Gold HC Certified Pro badge', 'Priority in all search results',
      'Featured on corridor pages', 'Rate card PDF generator (no branding)',
      'Analytics dashboard', 'Emergency dispatch priority',
      'Broker Connect visibility', 'Direct phone forwarding',
      '2× rank boost', 'Dedicated support',
    ],
    rankBoost: 2.0, searchPriority: 2,
    badgeSvg: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#C6923A" stroke-width="2" fill="rgba(198,146,58,0.15)" stroke-linejoin="round"/></svg>`,
  },
};

// ── Stripe price IDs (set after creating prices in Stripe) ──
export const BADGE_STRIPE_PRICES: Record<string, { monthly: string; annual: string }> = {
  verified: { monthly: 'price_verified_monthly', annual: 'price_verified_annual' },
  certified_pro: { monthly: 'price_certified_pro_monthly', annual: 'price_certified_pro_annual' },
};

// ── Territory Claiming (Revenue Leak #6) ──
export interface TerritoryClaim {
  operatorId: string;
  regionCode: string;          // The state/jurisdiction being claimed
  monthlyPrice: number;        // $49/mo
  unclaimedProfilesInRegion: number;
  impression: number;          // Monthly impressions on unclaimed profiles
  startDate: string;
  status: 'active' | 'paused' | 'cancelled';
}

export const TERRITORY_CLAIM_PRICE = 49;  // $/month

export function getTerritoryCTAText(regionCode: string): string {
  return `Claim ${regionCode} Territory — Your card appears on all unclaimed profiles in ${regionCode}`;
}

// ── Broker Connect (Revenue Leak #4) ──
export interface BrokerConnectPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  features: string[];
}

export const BROKER_CONNECT_PLANS: BrokerConnectPlan[] = [
  {
    id: 'broker_free', name: 'Free', monthlyPrice: 0,
    features: ['View operator names', 'See corridor rankings', 'View rates'],
  },
  {
    id: 'broker_connect', name: 'Broker Connect', monthlyPrice: 29,
    features: [
      'Full contact info (phone, email)', 'Direct message operators',
      '2-hour response guarantee or money back', 'Operator availability status',
      'Priority in emergency fill', 'Rate negotiation tools',
    ],
  },
];

// ── Emergency Fill (Revenue Leak #7) ──
export const EMERGENCY_FILL_PRICE = 25;  // per emergency blast

export interface EmergencyFillRequest {
  loadId: string;
  brokerId: string;
  corridor: string;
  urgencyLevel: 'critical' | 'urgent';
  maxRate: number;
  notifiedOperators: number;
  respondedOperators: number;
  filledAt?: string;
  chargedAmount: number;
}

// ── Compliance Copilot Pricing (Revenue Leak #5) ──
export const COMPLIANCE_COPILOT = {
  freeQuestionsPerMonth: 10,
  proMonthlyPrice: 9,
  proFeatures: [
    'Unlimited compliance questions',
    'State-by-state requirement lookup',
    'Permit requirement checker',
    'Fine avoidance alerts',
    'Jurisdiction change notifications',
  ],
};

// ── Training Center Pricing (Revenue Leak #9) ──
export interface TrainingCourse {
  id: string;
  slug: string;
  title: string;
  price: number;
  description: string;
  modules: number;
  estimatedHours: number;
  certification: boolean;
}

export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'pilot-car-fundamentals', slug: 'pilot-car-fundamentals',
    title: 'Pilot Car Fundamentals', price: 199,
    description: 'Essential knowledge for new pilot car operators. Covers safety protocols, equipment requirements, communication procedures, and state-by-state regulations.',
    modules: 8, estimatedHours: 6, certification: true,
  },
  {
    id: 'state-certification-prep', slug: 'state-certification-prep',
    title: 'State Certification Prep', price: 299,
    description: 'Comprehensive preparation for state pilot car certification exams. Includes practice tests, regulation deep-dives, and real-world scenarios for all 50 states.',
    modules: 12, estimatedHours: 10, certification: true,
  },
  {
    id: 'advanced-route-management', slug: 'advanced-route-management',
    title: 'Advanced Route Management', price: 399,
    description: 'Master complex route planning for oversize loads. Bridge clearances, permit routing, night moves, urban navigation, and multi-state corridor management.',
    modules: 15, estimatedHours: 14, certification: true,
  },
];

// ── White Label API Pricing (Revenue Leak #8) ──
export const WHITE_LABEL_API = {
  monthlyPrice: 999,
  features: [
    'Full directory API access',
    'Compliance data API',
    'Rate intelligence API',
    'Corridor analytics API',
    'Custom branding',
    'Dedicated API key',
    '99.9% SLA',
    'Priority support',
  ],
  rateLimit: 100000,  // requests/month
};
