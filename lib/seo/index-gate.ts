import { createClient } from '@supabase/supabase-js';

/**
 * Anti-thin content gating for geo pages.
 * 
 * A page should be indexable ONLY if any of these are true:
 *   - has_generated_content (seo_pages entry with status='published')
 *   - entity_count >= 1 (directory listings in that region)
 *   - escort_count >= 1 (operators serving that region)
 *   - corridor_score >= 0.3 (significant corridor presence)
 * 
 * Otherwise: meta robots = "noindex,follow"
 * This prevents thin pages from being indexed while still allowing
 * link equity to flow through the site structure.
 */

export interface IndexGateResult {
    indexable: boolean;
    reason: string;
    signals: {
        has_content: boolean;
        entity_count: number;
        escort_count: number;
        corridor_score: number;
    };
}

/**
 * Check whether a geo page should be indexed.
 * 
 * Usage in generateMetadata():
 *   const gate = await checkIndexGate('county', 'harris', 'TX');
 *   return { robots: gate.indexable ? 'index,follow' : 'noindex,follow' };
 */
export async function checkIndexGate(
    pageType: 'county' | 'city' | 'port' | 'state',
    slug: string,
    regionCode?: string,
): Promise<IndexGateResult> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Can't check — default to indexable for safety
        return { indexable: true, reason: 'no_db_connection', signals: { has_content: false, entity_count: 0, escort_count: 0, corridor_score: 0 } };
    }

    const svc = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    let has_content = false;
    let entity_count = 0;
    let escort_count = 0;
    let corridor_score = 0;

    // 1. Check if we have generated content
    const seoSlug = regionCode
        ? `pilot-car/${regionCode.toLowerCase()}/${slug}`
        : `pilot-car/${slug}`;

    const { data: seoPage } = await svc
        .from('seo_pages')
        .select('status')
        .eq('slug', seoSlug)
        .single();

    has_content = seoPage?.status === 'published';

    // 2. Check entity density
    if (pageType === 'county' && regionCode) {
        const { count } = await svc
            .from('directory_listings')
            .select('id', { count: 'exact', head: true })
            .eq('region_code', regionCode);
        entity_count = count ?? 0;
    }

    // 3. Check escort count
    if (regionCode) {
        const { count } = await svc
            .from('directory_drivers')
            .select('id', { count: 'exact', head: true })
            .or(`state.eq.${regionCode},service_states.cs.{${regionCode}}`);
        escort_count = count ?? 0;
    }

    // 4. Check corridor score
    if (pageType === 'county') {
        const { data: county } = await svc
            .from('counties')
            .select('corridor_score')
            .eq('slug', slug)
            .single();
        corridor_score = county?.corridor_score ?? 0;
    }

    // Gate logic
    const indexable = has_content || entity_count >= 1 || escort_count >= 1 || corridor_score >= 0.3;

    const reason = indexable
        ? has_content ? 'has_content' : entity_count >= 1 ? 'has_entities' : escort_count >= 1 ? 'has_escorts' : 'corridor_score'
        : 'thin_page';

    return {
        indexable,
        reason,
        signals: { has_content, entity_count, escort_count, corridor_score },
    };
}

/**
 * Generate robots meta for a geo page.
 * Use this in generateMetadata() for any geo page that might be thin.
 */
export function geoRobots(gate: IndexGateResult): string {
    return gate.indexable ? 'index,follow' : 'noindex,follow';
}
