import { supabaseServer } from '@/lib/supabase-server';
import { COUNTRIES, type CountryConfig } from '@/lib/seo-countries';
import type { MarketMaturityState } from '@/lib/hc-types';

export function getCountryConfig(slug: string): CountryConfig | undefined {
  if (slug === 'all') {
    return {
      name: 'Global',
      slug: 'all',
      code: 'ALL',
      flag: '🌍',
      continent: 'Global',
      drivingDirection: 'right',
      unitSystem: 'metric'
    };
  }
  return COUNTRIES.find(c => c.slug === slug);
}

export function getCountryByCode(code: string): CountryConfig | undefined {
  return COUNTRIES.find(c => c.code === code.toUpperCase());
}

export function getAllCountrySlugs(): string[] {
  return COUNTRIES.map(c => c.slug);
}

export async function getCountryPlaceCount(countryCode: string): Promise<number> {
  const sb = supabaseServer();
  const { count } = await sb.from('hc_places').select('id', { count: 'exact', head: true })
    .eq('country_code', countryCode.toUpperCase()).eq('status', 'published');
  return count ?? 0;
}

export async function getMarketMaturity(countryCode: string): Promise<MarketMaturityState> {
  const count = await getCountryPlaceCount(countryCode);
  if (count >= 10) return 'live';
  if (count >= 1) return 'data_only';
  return 'planned';
}

export async function getCountryPlaces(countryCode: string, limit = 50) {
  const sb = supabaseServer();
  const { data } = await sb.from('hc_places')
    .select('id, slug, name, surface_category_key, locality, admin1_code, phone, claim_status, updated_at')
    .eq('country_code', countryCode.toUpperCase())
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getCountryJurisdictions(countryCode: string) {
  const sb = supabaseServer();
  const { data } = await sb.rpc('hc_list_all_jurisdictions');
  return (data ?? []).filter((j: any) => j.country_code === countryCode.toUpperCase());
}
