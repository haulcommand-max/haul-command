/**
 * Haul Command — Unified Ad Serving Engine
 * 
 * MERGED FROM: ad-engine.ts + adgrid/inventory.ts + feed/insertNativeAds.ts
 * 
 * Single source of truth for all ad operations:
 * - Billboard rotation (hero, inline, sidecar, mobile, alert gate)
 * - AdGrid slot management (page-level inventory)
 * - Feed interleaving (native ad insertion into any list)
 * - Ad rank formula scoring
 * - Trust guardrails (always labeled, never replaces truth)
 */

import { supabaseServer } from '@/lib/supabase-server';

// ─── Slot Family Types ──────────────────────────────────────

export type SlotFamily = 
  | 'hero_billboard'
  | 'inline_billboard'
  | 'sidecar_sponsor'
  | 'sticky_mobile_chip_rail'
  | 'alert_gate_offer';

// ─── Creative Types ─────────────────────────────────────────

export interface AdCreative {
  creative_id: string;
  advertiser_name: string;
  slot_family: string;
  ad_class: string;
  headline: string;
  subhead?: string;
  cta_label: string;
  cta_url: string;
  image_landscape_url?: string;
  image_square_url?: string;
  image_vertical_url?: string;
  logo_url?: string;
  sponsor_label: string;
  ad_rank: number;
}

export interface AdRequest {
  slotFamily: SlotFamily;
  pageType: string;
  countrySlug?: string;
  corridorSlug?: string;
  serviceSlug?: string;
  urgencyState?: string;
  maxCreatives?: number;
}

// ─── AdGrid Inventory (from adgrid/inventory.ts) ────────────

export type AdGridSlotData = {
  id: string;
  inventory_key: string;
  page_key_id: string;
  placement_type: string;
  traffic_band: string;
  floor_price_usd: number;
  is_sellable: boolean;
};

export function shouldRenderAd(slot: AdGridSlotData | null): boolean {
  return !!slot && slot.is_sellable;
}

export function trafficBandLabel(band: string): string {
  const labels: Record<string, string> = {
    starter: 'Starter', growth: 'Growth', premium: 'Premium', elite: 'Elite',
  };
  return labels[band] ?? band;
}

export function trafficBandColor(band: string): string {
  const colors: Record<string, string> = {
    starter: '#9ca3af', growth: '#8090ff', premium: '#ffb400', elite: '#00c896',
  };
  return colors[band] ?? '#666';
}

// ─── Feed Interleaving (from feed/insertNativeAds.ts) ───────

export type FeedRow<T> =
  | { kind: 'item'; item: T }
  | { kind: 'ad'; placement: string; slotIndex: number };

/**
 * Interleaves NativeAdCard slots into a feed of items (directory, load board, etc).
 */
export function interleaveNativeAds<T>(
  items: T[],
  opts: {
    everyNth: number;
    placement: string;
    startAfter?: number;
    maxAds?: number;
  }
): FeedRow<T>[] {
  const { everyNth, placement, startAfter = everyNth, maxAds = 999 } = opts;
  const out: FeedRow<T>[] = [];
  let adCount = 0;

  for (let i = 0; i < items.length; i++) {
    out.push({ kind: 'item', item: items[i] });
    const itemIndex1 = i + 1;
    if (itemIndex1 >= startAfter && itemIndex1 % everyNth === 0 && adCount < maxAds) {
      out.push({ kind: 'ad', placement, slotIndex: adCount });
      adCount++;
    }
  }
  return out;
}

// Placement constants for GA4 tracking
export const AD_PLACEMENTS = {
  DIRECTORY_INLINE: 'directory_inline',
  DIRECTORY_SIDEBAR: 'directory_sidebar',
  LEADERBOARD_INLINE: 'leaderboard_inline',
  LOAD_FEED_INLINE: 'load_feed_inline',
  HUB_BANNER: 'hub_banner',
  COUNTRY_HUB: 'country_hub_banner',
  SERVICE_PAGE: 'service_page_banner',
  GUIDE_PAGE: 'guide_page_banner',
  CORRIDOR_HERO: 'corridor_hero_billboard',
  CORRIDOR_INLINE: 'corridor_inline_billboard',
  PROVIDER_SIDECAR: 'provider_sidecar_sponsor',
} as const;

export const AD_VARIANTS = {
  NATIVE_CARD: 'native_card',
  SLOT_BANNER: 'slot_banner',
  HERO_BILLBOARD: 'hero_billboard',
  INLINE_BILLBOARD: 'inline_billboard',
  SIDECAR: 'sidecar_sponsor',
  CHIP_RAIL: 'sticky_mobile_chip_rail',
} as const;

// ─── Ad Rank Formula ────────────────────────────────────────

/** 
 * Ad rank formula from execution board:
 * 100 × (0.30×intent + 0.20×local + 0.15×urgency + 0.10×quality + 0.10×ctr + 0.05×fresh + 0.05×sponsor + 0.05×landing)
 */
function computeAdRank(creative: Record<string, unknown>): number {
  const intent = Number(creative.intent_match_score) || 0.5;
  const local = Number(creative.local_relevance_score) || 0.5;
  const urgency = Number(creative.urgency_match_score) || 0.5;
  const quality = Number(creative.creative_quality_score) || 0.5;
  const ctr = Math.min(Number(creative.historical_ctr) || 0, 1);
  const fresh = 0.5;
  const sponsor = 0.5;
  const landing = 0.5;

  return 100 * (
    0.30 * intent +
    0.20 * local +
    0.15 * urgency +
    0.10 * quality +
    0.10 * ctr +
    0.05 * fresh +
    0.05 * sponsor +
    0.05 * landing
  );
}

// ─── Billboard Creative Fetching ────────────────────────────

/**
 * Fetch ranked creatives for a slot.
 * Returns empty array if no matching creatives (never fake).
 */
export async function getCreativesForSlot(request: AdRequest): Promise<AdCreative[]> {
  try {
    const sb = supabaseServer();
    const now = new Date().toISOString();

    let query = sb
      .from('hc_ad_creatives')
      .select('*')
      .eq('slot_family', request.slotFamily)
      .eq('active', true)
      .contains('page_types', [request.pageType]);

    query = query.or(`starts_at.is.null,starts_at.lte.${now}`);
    query = query.or(`ends_at.is.null,ends_at.gte.${now}`);
    query = query.gte('creative_quality_score', 0.40);

    const { data } = await query.limit(request.maxCreatives ?? 6);
    if (!data || data.length === 0) return [];

    const ranked: AdCreative[] = data
      .map((c) => ({
        creative_id: c.creative_id ?? c.id,
        advertiser_name: c.advertiser_name ?? '',
        slot_family: c.slot_family,
        ad_class: c.ad_class ?? 'local_visibility',
        headline: c.headline ?? '',
        subhead: c.subhead ?? c.description,
        cta_label: c.cta_label ?? c.cta_text ?? 'Learn More',
        cta_url: c.cta_url ?? '#',
        image_landscape_url: c.image_landscape_url ?? c.image_url,
        image_square_url: c.image_square_url,
        image_vertical_url: c.image_vertical_url,
        logo_url: c.logo_url,
        sponsor_label: c.sponsor_label ?? 'sponsored',
        ad_rank: computeAdRank(c),
      }))
      .filter((c) => c.headline && c.sponsor_label)
      .sort((a, b) => b.ad_rank - a.ad_rank);

    // Diversity rule: no same advertiser back-to-back
    const diverse: AdCreative[] = [];
    let lastAdvertiser = '';
    for (const c of ranked) {
      if (c.advertiser_name !== lastAdvertiser || diverse.length === 0) {
        diverse.push(c);
        lastAdvertiser = c.advertiser_name;
      }
    }
    return diverse.slice(0, request.maxCreatives ?? 6);
  } catch {
    return [];
  }
}

// ─── Corridor Signals ───────────────────────────────────────

export async function getCorridorSignals(corridorSlug: string) {
  try {
    const sb = supabaseServer();
    const { data } = await sb
      .from('hc_corridor_signals')
      .select('*')
      .eq('corridor_slug', corridorSlug)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

// ─── AdGrid Page Slot (from page-factory.ts) ────────────────

export async function getAdSlot(pageKeyId: string): Promise<AdGridSlotData | null> {
  try {
    const sb = supabaseServer();
    const { data } = await sb
      .from('hc_adgrid_page_inventory')
      .select('*')
      .eq('page_key_id', pageKeyId)
      .eq('is_sellable', true)
      .limit(1)
      .single();
    return data as AdGridSlotData | null;
  } catch {
    return null;
  }
}
