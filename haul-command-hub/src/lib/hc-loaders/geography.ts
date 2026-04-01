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
      tier: 'A',
      lang: 'en',
      currency: 'USD',
      units: 'metric',
      terms: { pilot_car: 'Pilot Car', escort_vehicle: 'Escort Vehicle', oversize_load: 'Oversize Load', heavy_haul: 'Heavy Haul', wide_load: 'Wide Load', route_survey: 'Route Survey', superload: 'Superload', permit: 'Permit' },
      regions: [],
      cities: [],
      equipment_focus: [],
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
  // Real operators from hc_global_operators
  const { count } = await sb.from('hc_global_operators').select('id', { count: 'exact', head: true })
    .eq('country_code', countryCode.toUpperCase());
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
  // Real operators from hc_global_operators
  const { data } = await sb.from('hc_global_operators')
    .select('id, slug, name, entity_type, city, admin1_code, claim_status')
    .eq('country_code', countryCode.toUpperCase())
    .limit(limit);
  return data ?? [];
}

export async function getCountryJurisdictions(countryCode: string) {
  const sb = supabaseServer();
  const { data } = await sb.rpc('hc_list_all_jurisdictions');
  return (data ?? []).filter((j: any) => j.country_code === countryCode.toUpperCase());
}
