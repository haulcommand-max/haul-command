import { supabaseServer } from '@/lib/supabase-server';

export async function getClaimableCount() {
  const sb = supabaseServer();
  const { count } = await sb.from('hc_places').select('id', { count: 'exact', head: true })
    .eq('status', 'published').neq('claim_status', 'claimed');
  return count ?? 0;
}

export async function searchClaimable(query: string, limit = 10) {
  const sb = supabaseServer();
  const { data } = await sb.from('hc_places')
    .select('id, slug, name, locality, admin1_code, country_code')
    .eq('status', 'published')
    .neq('claim_status', 'claimed')
    .ilike('name', `%${query}%`)
    .limit(limit);
  return data ?? [];
}
