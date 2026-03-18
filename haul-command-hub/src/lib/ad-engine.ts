/**
 * Haul Command — Ad Serving Engine
 * 
 * Serves ads from hc_ad_creatives based on:
 * - Slot family (hero_billboard, inline_billboard, sidecar_sponsor, etc.)
 * - Page type and context matching
 * - Ad rank formula scoring
 * - Trust guardrails (always labeled, never replaces truth)
 */

import { supabaseServer } from '@/lib/supabase-server';

export type SlotFamily = 
  | 'hero_billboard'
  | 'inline_billboard'
  | 'sidecar_sponsor'
  | 'sticky_mobile_chip_rail'
  | 'alert_gate_offer';

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

/** 
 * Ad rank formula from the execution board:
 * 100 * (0.30*intent + 0.20*local + 0.15*urgency + 0.10*quality + 0.10*ctr + 0.05*fresh + 0.05*sponsor + 0.05*landing)
 */
function computeAdRank(creative: Record<string, unknown>): number {
  const intent = Number(creative.intent_match_score) || 0.5;
  const local = Number(creative.local_relevance_score) || 0.5;
  const urgency = Number(creative.urgency_match_score) || 0.5;
  const quality = Number(creative.creative_quality_score) || 0.5;
  const ctr = Math.min(Number(creative.historical_ctr) || 0, 1);
  const fresh = 0.5; // TODO: compute from created_at age
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

    // Date filtering
    query = query.or(`starts_at.is.null,starts_at.lte.${now}`);
    query = query.or(`ends_at.is.null,ends_at.gte.${now}`);

    // Quality guardrail: minimum 0.40
    query = query.gte('creative_quality_score', 0.40);

    const { data } = await query.limit(request.maxCreatives ?? 6);

    if (!data || data.length === 0) return [];

    // Compute ad rank and sort
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
      .filter((c) => c.headline && c.sponsor_label) // Hard block: must have label
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

/**
 * Get corridor signals for hard-fill/hot/thin determination.
 */
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
