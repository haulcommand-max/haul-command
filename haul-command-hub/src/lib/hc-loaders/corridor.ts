import { supabaseServer } from '@/lib/supabase-server';

export async function getCorridorBySlug(slug: string) {
  const sb = supabaseServer();
  const { data } = await sb.from('corridors')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function getAllCorridors(limit = 100) {
  const sb = supabaseServer();
  const { data } = await sb.from('corridors')
    .select('id, slug, name, origin_city, origin_state, dest_city, dest_state, miles, cls_tier')
    .order('name')
    .limit(limit);
  return data ?? [];
}

export async function getCorridorOperators(corridorSlug: string, limit = 20) {
  const sb = supabaseServer();
  const { data: corridor } = await sb.from('corridors').select('origin_state, dest_state').eq('slug', corridorSlug).maybeSingle();
  if (!corridor) return [];
  // Real operators from hc_global_operators
  const { data } = await sb.from('hc_global_operators')
    .select('id, slug, name, city, admin1_code')
    .or(`admin1_code.eq.${corridor.origin_state},admin1_code.eq.${corridor.dest_state}`)
    .limit(limit);
  return data ?? [];
}
