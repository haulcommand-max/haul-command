import { supabaseServer } from '@/lib/supabase-server';

/**
 * Rates loader — must read:
 *   - hc_rates_public (truth-safe rates)
 *   - hc_market_truth_flags (gate conditions)
 *   - hc_page_seo_contracts (SEO metadata)
 *
 * Rules:
 *   - if methodology_url missing → hide rates, show alert capture
 *   - never render rates without guardrail pass
 */

export interface PublicRate {
  surface_key: string;
  surface_type: string;
  country_slug: string | null;
  jurisdiction_slug: string | null;
  corridor_slug: string | null;
  currency_code: string;
  rate_low: number | null;
  rate_mid: number | null;
  rate_high: number | null;
  sample_size_30d: number | null;
  change_vs_7d_pct: number | null;
  change_vs_30d_pct: number | null;
  methodology_url: string | null;
  freshness_timestamp: string | null;
  quality_guardrail_pass: boolean;
}

export async function getRatesPublic(filters?: { countrySlug?: string; corridorSlug?: string; jurisdictionSlug?: string }): Promise<PublicRate[]> {
  const sb = supabaseServer();

  // Try truth-safe hc_rates_public first
  let q = sb.from('hc_rates_public').select('*').eq('quality_guardrail_pass', true);
  if (filters?.countrySlug) q = q.eq('country_slug', filters.countrySlug);
  if (filters?.corridorSlug) q = q.eq('corridor_slug', filters.corridorSlug);
  if (filters?.jurisdictionSlug) q = q.eq('jurisdiction_slug', filters.jurisdictionSlug);
  const { data } = await q.order('surface_key').limit(100);

  if (data && data.length > 0) return data as PublicRate[];
  return [];
}

export async function getRatesSeoContract(canonicalUrl: string) {
  const sb = supabaseServer();
  const { data } = await sb
    .from('hc_page_seo_contracts')
    .select('title, meta_description, h1, intro_copy')
    .eq('canonical_url', canonicalUrl)
    .single();
  return data;
}

// Legacy compatibility
export async function getRatesBenchmark(filters?: { countryCode?: string; corridorSlug?: string }) {
  const sb = supabaseServer();
  let q = sb.from('escort_coordination').select('rate_benchmark_per_hour, corridor_slug, created_at').not('rate_benchmark_per_hour', 'is', null);
  if (filters?.countryCode) q = q.eq('country_code', filters.countryCode);
  if (filters?.corridorSlug) q = q.eq('corridor_slug', filters.corridorSlug);
  const { data } = await q.order('created_at', { ascending: false }).limit(50);
  return data ?? [];
}

export function computeRateRange(rates: { rate_benchmark_per_hour: number }[]): { min: number; max: number; avg: number } | null {
  const vals = rates.map(r => r.rate_benchmark_per_hour).filter(v => v > 0);
  if (!vals.length) return null;
  return {
    min: Math.min(...vals),
    max: Math.max(...vals),
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
  };
}
