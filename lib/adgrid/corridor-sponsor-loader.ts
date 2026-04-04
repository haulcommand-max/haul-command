import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface CorridorSponsorAd {
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  badgeLabel?: string;
}

/**
 * Loads an active AdGrid sponsor creative for a given corridor.
 * Returns null if no live sponsor exists — caller falls back to house ad.
 *
 * Table: hc_adgrid_slots (to be created in migration 014)
 * For now returns null so the house ad always shows, preserving truth-first.
 */
export async function loadCorridorSponsor(
  corridorSlug: string
): Promise<CorridorSponsorAd | null> {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data } = await supabase
      .from('hc_adgrid_slots')
      .select('headline,subline,cta_label,cta_href,badge_label')
      .eq('surface', 'corridor')
      .eq('corridor_slug', corridorSlug)
      .eq('status', 'active')
      .lte('starts_at', new Date().toISOString())
      .gte('ends_at', new Date().toISOString())
      .order('priority_score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return {
      headline: data.headline,
      subline: data.subline,
      ctaLabel: data.cta_label,
      ctaHref: data.cta_href,
      badgeLabel: data.badge_label ?? undefined,
    };
  } catch {
    // Table may not exist yet — degrade gracefully to house ad
    return null;
  }
}
