import { supabaseServer } from '@/lib/supabase-server';

/**
 * Broker profile loader — must read:
 *   - hc_broker_public_profile (primary)
 *   - hc_public_operators (real operators — fallback)
 *   - hc_page_seo_contracts (SEO metadata)
 */

export async function getBrokerProfile(slug: string) {
  const sb = supabaseServer();

  // Try hc_broker_public_profile first
  const { data: broker } = await sb
    .from('hc_broker_public_profile')
    .select('*')
    .eq('broker_slug', slug)
    .maybeSingle();

  if (broker) return broker;

  // Fallback to hc_public_operators (real verified data only)
  const { data: opBroker } = await sb.from('hc_public_operators')
    .select('*')
    .eq('slug', slug)
    .eq('entity_type', 'broker')
    .maybeSingle();

  if (opBroker) return opBroker;

  // Last resort: hc_places (infrastructure/legacy)
  const { data } = await sb.from('hc_places')
    .select('*')
    .eq('slug', slug)
    .eq('surface_category_key', 'broker')
    .eq('status', 'published')
    .maybeSingle();
  return data;
}

export async function getBrokerSeoContract(slug: string) {
  const sb = supabaseServer();
  const { data } = await sb
    .from('hc_page_seo_contracts')
    .select('title, meta_description, h1, intro_copy')
    .eq('canonical_url', `/broker/${slug}`)
    .single();
  return data;
}

export async function getBrokerLoads(brokerId: string, limit = 20) {
  const sb = supabaseServer();
  const { data } = await sb.from('hc_raw_loads')
    .select('*')
    .eq('broker_id', brokerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getBrokerCorridors(brokerId: string) {
  const sb = supabaseServer();
  const { data } = await sb.from('corridors')
    .select('id, slug, name, origin_city, origin_state, dest_city, dest_state')
    .limit(20);
  return data ?? [];
}
