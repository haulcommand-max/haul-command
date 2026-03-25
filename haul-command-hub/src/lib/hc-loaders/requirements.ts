import { supabaseServer } from '@/lib/supabase-server';

/**
 * Requirements loader — must read:
 *   - hc_requirements_public (canonical requirements)
 *   - hc_page_seo_contracts (SEO metadata)
 *
 * Rules:
 *   - if governing_source_links missing → render official-source-hunt state
 */

export interface PublicRequirement {
  surface_key: string;
  country_slug: string;
  jurisdiction_slug: string | null;
  load_type_slug: string | null;
  jurisdiction_label: string;
  escort_thresholds_json: any;
  permit_links_json: any;
  governing_source_links_json: any;
  methodology_url: string | null;
  last_reviewed_at: string | null;
  quality_guardrail_pass: boolean;
}

export async function getRequirementsPublic(countrySlug: string): Promise<PublicRequirement[]> {
  const sb = supabaseServer();
  const { data } = await sb
    .from('hc_requirements_public')
    .select('*')
    .eq('country_slug', countrySlug)
    .order('jurisdiction_label');
  return (data ?? []) as PublicRequirement[];
}

export async function getRequirementsSeoContract(canonicalUrl: string) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('hc_page_seo_contracts')
    .select('title, meta_description, h1, intro_copy')
    .eq('canonical_url', canonicalUrl)
    .maybeSingle();
  if (error) {
    console.error(`[Requirements] SEO contract error for ${canonicalUrl}:`, error.message);
    return null;
  }
  return data;
}

// Legacy compatibility
export async function getRequirementsByCountry(countryCode: string) {
  const sb = supabaseServer();
  const { data } = await sb.rpc('hc_list_all_jurisdictions');
  return (data ?? []).filter((j: any) => j.country_code === countryCode.toUpperCase());
}

export async function getRequirementsByJurisdiction(jurisdictionCode: string) {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb.rpc('hc_get_jurisdiction_requirements', { p_jurisdiction: jurisdictionCode.toUpperCase() });
    if (error) {
      console.error(`[Requirements] RPC error for ${jurisdictionCode}:`, error.message);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`[Requirements] Unexpected error for ${jurisdictionCode}:`, err);
    return [];
  }
}

export async function getAllJurisdictions() {
  const sb = supabaseServer();
  const { data } = await sb.rpc('hc_list_all_jurisdictions');
  return data ?? [];
}
