/**
 * Page Factory — Supabase queries for hc_page_keys driven ISR routes
 * Every route reads from hc_page_keys as the routing authority.
 */
import { supabaseServer } from '@/lib/supabase-server';

function getSupabase() {
    return supabaseServer();
}

export type PageKey = {
    id: string;
    page_type: string;
    country_code: string | null;
    country_slug: string | null;
    city_slug: string | null;
    surface_class: string | null;
    corridor_slug: string | null;
    anchor_type: string | null;
    anchor_slug: string | null;
    surface_key: string | null;
    canonical_slug: string;
    title: string;
    meta_description: string | null;
    h1: string;
    entity_count: number;
    quality_score: number;
    indexable: boolean;
    noindex_reason: string | null;
    page_status: string;
};

export type Surface = {
    surface_id: string;
    surface_key: string;
    name: string | null;
    surface_class: string;
    country_code: string;
    city: string | null;
    state: string | null;
    latitude: number;
    longitude: number;
    quality_score: number;
    is_claimable: boolean;
    brand: string | null;
    address: string | null;
};

export type InternalLink = {
    target_page_key_id: string;
    link_type: string;
    anchor_text: string;
    weight: number;
    canonical_slug: string;
};

// ─── Page Key Lookups ─────────────────────────────────────

export async function getPageKey(
    pageType: string,
    filters: Record<string, string>
): Promise<PageKey | null> {
    let q = getSupabase()
        .from('hc_page_keys')
        .select('*')
        .eq('page_type', pageType)
        .eq('page_status', 'active');

    for (const [key, val] of Object.entries(filters)) {
        q = q.eq(key, val.toLowerCase());
    }

    const { data, error } = await q.limit(1).maybeSingle();
    if (error) {
        console.error(`[PageFactory] getPageKey error for ${pageType}:`, error.message);
        return null;
    }
    return data as PageKey | null;
}

// ─── Surface Listings ─────────────────────────────────────

export async function getSurfaces(
    filters: Record<string, string>,
    limit = 50
): Promise<Surface[]> {
    let q = getSupabase()
        .from('hc_surfaces')
        .select('surface_id,surface_key,name,surface_class,country_code,city,state,latitude,longitude,quality_score,is_claimable,brand,address')
        .order('quality_score', { ascending: false })
        .limit(limit);

    for (const [key, val] of Object.entries(filters)) {
        q = q.eq(key, val);
    }

    const { data } = await q;
    return (data ?? []) as Surface[];
}

// ─── Internal Links ───────────────────────────────────────

export async function getInternalLinks(pageKeyId: string, limit = 12): Promise<InternalLink[]> {
    const { data } = await getSupabase()
        .from('hc_internal_links')
        .select('target_page_key_id, link_type, anchor_text, weight, hc_page_keys!target_page_key_id(canonical_slug)')
        .eq('source_page_key_id', pageKeyId)
        .order('weight', { ascending: false })
        .limit(limit);

    return (data ?? []).map((d: any) => ({
        target_page_key_id: d.target_page_key_id,
        link_type: d.link_type,
        anchor_text: d.anchor_text,
        weight: d.weight,
        canonical_slug: d.hc_page_keys?.canonical_slug ?? '#',
    }));
}

// ─── AdGrid Inventory (canonical: @/lib/ad-engine) ────────
// Re-exported for backward compatibility
export { getAdSlot } from '@/lib/ad-engine';

// ─── City Rollups for a Country ───────────────────────────

export async function getCityRollups(countryCode: string, surfaceClass: string) {
    const { data } = await getSupabase()
        .from('hc_surface_city_rollups')
        .select('*')
        .eq('country_code', countryCode)
        .eq('surface_class', surfaceClass)
        .order('total', { ascending: false })
        .limit(20);
    return data ?? [];
}

// ─── Country Hub Stats ────────────────────────────────────

export async function getCountryRollup(countryCode: string, surfaceClass: string) {
    const { data, error } = await getSupabase()
        .from('hc_surface_rollups_country')
        .select('*')
        .eq('country_code', countryCode)
        .eq('surface_class', surfaceClass)
        .limit(1)
        .maybeSingle();
    if (error) {
        console.error(`[PageFactory] getCountryRollup error for ${countryCode}:`, error.message);
        return null;
    }
    return data;
}

// ─── Helpers ──────────────────────────────────────────────

export function formatClassName(sc: string): string {
    return sc
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// Country name lookup: canonical source is @/lib/directory-helpers
// Re-exported for backward compatibility
export { countryName as getCountryName } from '@/lib/directory-helpers';

