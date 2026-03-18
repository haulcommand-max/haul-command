import { supabaseServer } from '@/lib/supabase-server';
import { COUNTRIES } from '@/lib/seo-countries';

/**
 * Homepage loader — must read:
 *   - hc_market_truth_flags (gate metric rendering)
 *   - hc_page_seo_contracts (SEO metadata)
 *
 * Rules:
 *   - hide proof bar if no truth-safe metrics
 *   - never fallback to placeholder numbers
 */

export interface HomepageTruthMetric {
  metric_name: string;
  metric_value_numeric: number | null;
  metric_value_text: string | null;
  is_renderable: boolean;
  reason_code: string;
}

export async function getHomepageTruthMetrics() {
  const sb = supabaseServer();

  // Try truth-gated metrics first
  const { data: truthFlags } = await sb
    .from('hc_market_truth_flags')
    .select('metric_name, metric_value_numeric, metric_value_text, is_renderable, reason_code')
    .eq('surface_type', 'homepage')
    .eq('page_key', '/');

  if (truthFlags && truthFlags.length > 0) {
    // Only return metrics where is_renderable = true
    const renderable = truthFlags.filter((f: any) => f.is_renderable);
    return {
      truthGated: true,
      metrics: renderable as HomepageTruthMetric[],
      placeCount: renderable.find((m: any) => m.metric_name === 'provider_count')?.metric_value_numeric ?? null,
      jurisdictionCount: renderable.find((m: any) => m.metric_name === 'jurisdiction_count')?.metric_value_numeric ?? null,
      countryCount: renderable.find((m: any) => m.metric_name === 'country_count')?.metric_value_numeric ?? COUNTRIES.length,
    };
  }

  // Fallback to direct count (no fake numbers — real DB counts only)
  const [places, jurisdictions] = await Promise.all([
    sb.from('hc_places').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('jurisdictions').select('id', { count: 'exact', head: true }),
  ]);

  return {
    truthGated: false,
    metrics: [] as HomepageTruthMetric[],
    placeCount: places.count ?? 0,
    jurisdictionCount: jurisdictions.count ?? 0,
    countryCount: COUNTRIES.length,
  };
}

export async function getHomepageSeoContract() {
  const sb = supabaseServer();
  const { data } = await sb
    .from('hc_page_seo_contracts')
    .select('title, meta_description, h1, intro_copy, breadcrumb_json, structured_data_json')
    .eq('canonical_url', '/')
    .single();
  return data;
}

export async function getHomepageQuickMarkets() {
  return COUNTRIES.filter(c => c.tier === 'A').slice(0, 8).map(c => ({
    label: c.name,
    href: `/directory/${c.slug}`,
    flag: c.flag,
  }));
}

export async function getHomepagePreviewResults(limit = 6) {
  const sb = supabaseServer();

  // Prefer search index (organic rank order)
  const { data: indexed } = await sb
    .from('hc_provider_search_index')
    .select('provider_id, provider_slug, title, subtitle, location_label, badges_json, organic_rank_score')
    .eq('quality_guardrail_pass', true)
    .order('organic_rank_score', { ascending: false })
    .limit(limit);

  if (indexed && indexed.length > 0) {
    return indexed.map((p: any) => ({
      id: p.provider_id,
      slug: p.provider_slug,
      name: p.title,
      locality: p.location_label,
      badges: p.badges_json,
    }));
  }

  // Fallback to hc_places
  const { data } = await sb
    .from('hc_places')
    .select('id, slug, name, surface_category_key, locality, admin1_code, country_code, phone, claim_status')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
