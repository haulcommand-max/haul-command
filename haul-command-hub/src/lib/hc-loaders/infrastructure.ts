import { supabaseServer } from '@/lib/supabase-server';

export const INFRASTRUCTURE_TYPES = [
  { slug: 'staging-yards', label: 'Staging Yards', icon: '🏗️' },
  { slug: 'hotels', label: 'Hotels & Motels', icon: '🏨' },
  { slug: 'truck-stops', label: 'Truck Stops', icon: '⛽' },
  { slug: 'secure-parking', label: 'Secure Parking', icon: '🅿️' },
  { slug: 'installers', label: 'Installers', icon: '🔧' },
  { slug: 'repair', label: 'Repair Services', icon: '🔩' },
  { slug: 'radio-shops', label: 'Radio Shops', icon: '📻' },
  { slug: 'upfitters', label: 'Upfitters', icon: '🚐' },
] as const;

export function getInfraTypeBySlug(slug: string) {
  return INFRASTRUCTURE_TYPES.find(t => t.slug === slug);
}

export async function getInfrastructureByCountry(type: string, countryCode: string, limit = 50) {
  const sb = supabaseServer();
  const { data } = await sb.from('hc_surfaces')
    .select('surface_id, name, surface_class, latitude, longitude, quality_score, is_claimable, surface_key, city')
    .eq('country_code', countryCode.toUpperCase())
    .eq('surface_class', type)
    .order('quality_score', { ascending: false })
    .limit(limit);
  return data ?? [];
}
