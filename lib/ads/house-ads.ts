import type { ServedAd } from './adrank';

/**
 * House Ad Provider — Internal promotion creatives.
 * 
 * Returns ServedAd[] for Haul Command's own marketing.
 * Used by HeroBillboard, StickyMobileChipRail, and any AdGrid
 * surface when no paid inventory is available.
 * 
 * These are zero-cost "house" campaigns that:
 * 1. Drive operator claims
 * 2. Drive sponsor purchases
 * 3. Promote premium features
 * 4. Fill empty ad slots to avoid dead space
 */

let _counter = 0;
function houseId() { return `house-${++_counter}`; }

export const HOUSE_ADS: ServedAd[] = [
  {
    ad_id: houseId(),
    campaign_id: 'house',
    creative_id: 'claim-listing-hero',
    headline: 'Claim Your Free Listing — Get Found by Brokers',
    body: 'Join 7,700+ operators already on Haul Command. Verified profiles get 3x more leads.',
    cta_text: 'Claim Now',
    cta_url: '/claim',
    image_url: null,
    creative_type: 'text',
    impression_token: `house-claim-${Date.now()}`,
    price_model: 'house',
    ad_rank: 0.95,
  },
  {
    ad_id: houseId(),
    campaign_id: 'house',
    creative_id: 'sponsor-territory-hero',
    headline: 'Own Your State — $299/mo Exclusive Sponsorship',
    body: 'Become the exclusive sponsor for your state. Your business appears first on every directory and near-me search.',
    cta_text: 'Claim Territory',
    cta_url: '/advertise/territory',
    image_url: null,
    creative_type: 'text',
    impression_token: `house-sponsor-${Date.now()}`,
    price_model: 'house',
    ad_rank: 0.90,
  },
  {
    ad_id: houseId(),
    campaign_id: 'house',
    creative_id: 'post-load-hero',
    headline: 'Post a Load — Match with Verified Escorts in Minutes',
    body: 'The fastest oversize load board in the industry. Median fill time: under 4 hours.',
    cta_text: 'Post a Load',
    cta_url: '/loads/post',
    image_url: null,
    creative_type: 'text',
    impression_token: `house-loads-${Date.now()}`,
    price_model: 'house',
    ad_rank: 0.85,
  },
  {
    ad_id: houseId(),
    campaign_id: 'house',
    creative_id: 'training-hero',
    headline: 'Get Certified — Haul Command Pilot Car Training',
    body: 'State-approved training packs. Start earning in your first week.',
    cta_text: 'Start Training',
    cta_url: '/training',
    image_url: null,
    creative_type: 'text',
    impression_token: `house-training-${Date.now()}`,
    price_model: 'house',
    ad_rank: 0.80,
  },
  {
    ad_id: houseId(),
    campaign_id: 'house',
    creative_id: 'data-market-hero',
    headline: 'Corridor Intelligence Reports — From $49/mo',
    body: 'Real-time rate data, fill times, and demand forecasting for 200+ heavy haul corridors.',
    cta_text: 'View Reports',
    cta_url: '/data',
    image_url: null,
    creative_type: 'text',
    impression_token: `house-data-${Date.now()}`,
    price_model: 'house',
    ad_rank: 0.75,
  },
  {
    ad_id: houseId(),
    campaign_id: 'house',
    creative_id: 'advertise-hero',
    headline: 'Advertise on Haul Command — 50,000+ Verified Pros',
    body: 'Territory sponsorships, corridor placements, self-serve CPC campaigns. Zero audience waste.',
    cta_text: 'Launch Campaign',
    cta_url: '/advertise',
    image_url: null,
    creative_type: 'text',
    impression_token: `house-advertise-${Date.now()}`,
    price_model: 'house',
    ad_rank: 0.70,
  },
];

/** Get house ads for a specific surface. Shuffles and limits. */
export function getHouseAds(opts?: { limit?: number; surface?: string }): ServedAd[] {
  const limit = opts?.limit ?? 4;
  // Fisher-Yates shuffle copy
  const shuffled = [...HOUSE_ADS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

/** Get house ads sorted by rank (best first) */
export function getTopHouseAds(limit = 3): ServedAd[] {
  return [...HOUSE_ADS]
    .sort((a, b) => b.ad_rank - a.ad_rank)
    .slice(0, limit);
}
