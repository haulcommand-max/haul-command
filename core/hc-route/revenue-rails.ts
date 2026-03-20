/**
 * HC Revenue Rails — 8 Rails, No Money Leaves
 * 
 * Every dollar in the freight ecosystem flows through Haul Command.
 * Each revenue rail maps to one or more HC Divisions.
 */

export interface RevenueRail {
  id: string;
  name: string;
  description: string;
  model: string;           // Pricing model (per-transaction, subscription, etc.)
  division: string;        // Primary HC Division
  alphabetAnalog: string;  // What Google/Alphabet equivalent this maps to
  status: 'active' | 'beta' | 'planned';
  projectedRevenue?: string; // At scale
}

export const HC_REVENUE_RAILS: RevenueRail[] = [
  {
    id: 'load-fees',
    name: 'Load Fees',
    description: 'Per-transaction fee on every load matched through HC Load Marketplace. Operators and brokers pay a platform fee on successful matches.',
    model: 'Per-transaction (% of load value)',
    division: 'hc-load-marketplace',
    alphabetAnalog: 'Google Search revenue (ads on search results)',
    status: 'active',
    projectedRevenue: '$2-5M/yr at 10K loads/month',
  },
  {
    id: 'track-subscriptions',
    name: 'HC Track Subscriptions',
    description: 'Per-device monthly subscription for GPS tracking, fleet visibility, and HC Route oversize routing navigation.',
    model: 'Subscription (per device/month)',
    division: 'hc-track',
    alphabetAnalog: 'Google Maps Platform API pricing',
    status: 'planned',
    projectedRevenue: '$190K/mo at 2K operators × 5 devices × $19/mo',
  },
  {
    id: 'adgrid-revenue',
    name: 'AdGrid Revenue',
    description: 'CPC/CPM advertising from vendors (tire shops, insurance, fuel, parts) targeting operators on the HC platform.',
    model: 'CPC ($0.50-$5.00) / CPM ($10-$50)',
    division: 'hc-adgrid',
    alphabetAnalog: 'Google Ads',
    status: 'active',
    projectedRevenue: '$500K-$2M/yr at scale',
  },
  {
    id: 'marketplace-commissions',
    name: 'Marketplace Commissions',
    description: '30% commission on every extension, integration, and tool sold through the HC Marketplace App Store.',
    model: 'Commission (30% of sale)',
    division: 'hc-marketplace',
    alphabetAnalog: 'Google Play Store 30% cut',
    status: 'planned',
    projectedRevenue: '$100K-$500K/yr depending on developer ecosystem',
  },
  {
    id: 'api-access-fees',
    name: 'API Access Fees',
    description: 'Tiered API access for third-party developers building on HC infrastructure. Free tier, Pro tier, Enterprise tier.',
    model: 'Tiered subscription + usage-based',
    division: 'hc-developer-platform',
    alphabetAnalog: 'Google Cloud Platform',
    status: 'beta',
    projectedRevenue: '$50K-$200K/yr',
  },
  {
    id: 'capital-interest',
    name: 'HC Capital Interest',
    description: 'Interest earned on financing deployed to operators. Equipment loans, factoring, working capital advances.',
    model: 'Interest (APR on deployed capital)',
    division: 'hc-capital',
    alphabetAnalog: 'Google Ventures / GV returns',
    status: 'planned',
    projectedRevenue: 'Depends on capital deployed',
  },
  {
    id: 'data-intelligence',
    name: 'Data & Intelligence Products',
    description: 'Enterprise data products: rate benchmarks, demand forecasting, safety scoring, route optimization models.',
    model: 'Enterprise subscription',
    division: 'hc-intelligence',
    alphabetAnalog: 'DeepMind / Google AI services',
    status: 'planned',
    projectedRevenue: '$200K-$1M/yr for enterprise clients',
  },
  {
    id: 'partner-licensing',
    name: 'Partner Licensing',
    description: 'White-label licensing and reseller agreements. Partners pay to rebrand and resell HC technology in their markets.',
    model: 'Licensing fee + revenue share',
    division: 'hc-developer-platform',
    alphabetAnalog: 'Google Cloud Partner program',
    status: 'planned',
    projectedRevenue: '$100K-$500K/yr per partner',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────

/** Get total number of revenue rails */
export function getTotalRails(): number {
  return HC_REVENUE_RAILS.length;
}

/** Get active revenue rails */
export function getActiveRails(): RevenueRail[] {
  return HC_REVENUE_RAILS.filter(r => r.status === 'active');
}

/** Get rails by division */
export function getRailsByDivision(divisionId: string): RevenueRail[] {
  return HC_REVENUE_RAILS.filter(r => r.division === divisionId);
}

/** Get rails by status */
export function getRailsByStatus(status: RevenueRail['status']): RevenueRail[] {
  return HC_REVENUE_RAILS.filter(r => r.status === status);
}
