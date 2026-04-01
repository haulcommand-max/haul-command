import { supabaseServer } from '@/lib/supabase-server';
import { getCanonicalStats } from '@/lib/hc-loaders/stats';

export async function getClaimableCount() {
  // Unclaimed operators from hc_global_operators (canonical source)
  const stats = await getCanonicalStats();
  // total_real_operators - claimed_profiles = unclaimed
  return Math.max(0, stats.total_real_operators - stats.claimed_profiles);
}

export async function searchClaimable(query: string, limit = 10) {
  const sb = supabaseServer();
  // Search real operators only from hc_global_operators view
  const { data } = await sb
    .from('hc_global_operators')
    .select('id, slug, display_name, city, admin1_code, country_code')
    .eq('claim_status', 'unclaimed')
    .ilike('display_name', `%${query}%`)
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.display_name,
    city: r.city,
    region_code: r.admin1_code,
    country_code: r.country_code,
  }));
}
