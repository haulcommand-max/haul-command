import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Unified Indexability Engine — single source of truth for page index state.
 *
 * Implements:
 *   - Entity density gating (listings, drivers)
 *   - Content presence check (seo_pages)
 *   - Corridor score weighting
 *   - Hysteresis (prevents index flip-flopping)
 *   - Revenue-weighted crawl priority scoring
 *
 * Usage:
 *   const state = await getIndexabilityState('city', { country: 'us', state: 'fl', city: 'miami' });
 *   return { robots: state.robots };
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type PageType = 'city' | 'state' | 'region' | 'corridor' | 'port' | 'county';

export interface IndexabilityKeys {
    country?: string;
    state?: string;
    city?: string;
    slug?: string;
}

export interface IndexabilitySignals {
    has_published_content: boolean;
    listing_count: number;
    driver_count: number;
    corridor_score: number;
    internal_link_score: number;
    demand_signals: number;
    paid_presence: number;
}

export interface IndexabilityState {
    indexable: boolean;
    robots: 'index,follow' | 'noindex,follow';
    reason: string;
    priority: number;       // 0.0–1.0 crawl priority
    lastmod: string | null; // ISO date or null
    signals: IndexabilitySignals;
}

// ── Hysteresis Thresholds ──────────────────────────────────────────────────────
// Once a page is indexed, it requires a stronger drop signal to be de-indexed.
// This prevents flip-flopping that damages Google's trust in the sitemap.

const HYSTERESIS = {
    index_on: {
        corridor_score: 0.35,
        min_entities: 1,  // listings + drivers
    },
    deindex_below: {
        corridor_score: 0.25,
        min_entities: 0,
    },
};

// ── Priority Weights ───────────────────────────────────────────────────────────
const PRIORITY_WEIGHTS = {
    corridor_score: 0.35,
    listing_density: 0.25,
    demand_signals: 0.25,
    paid_presence: 0.15,
};

// ── Singleton client ───────────────────────────────────────────────────────────
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
    if (_client) return _client;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    _client = createClient(url, key, { auth: { persistSession: false } });
    return _client;
}

// ── Core Engine ────────────────────────────────────────────────────────────────

export async function getIndexabilityState(
    pageType: PageType,
    keys: IndexabilityKeys,
): Promise<IndexabilityState> {
    const client = getClient();

    // No DB → default indexable (safety for build time / local dev)
    if (!client) {
        return {
            indexable: true,
            robots: 'index,follow',
            reason: 'no_db_connection',
            priority: 0.5,
            lastmod: null,
            signals: { has_published_content: false, listing_count: 0, driver_count: 0, corridor_score: 0, internal_link_score: 0, demand_signals: 0, paid_presence: 0 },
        };
    }

    // State/region pages are always indexable (taxonomy-driven, always have content)
    if (pageType === 'state' || pageType === 'region') {
        const signals = await fetchSignals(client, pageType, keys);
        return {
            indexable: true,
            robots: 'index,follow',
            reason: 'taxonomy_page',
            priority: 0.85,
            lastmod: await getLastmod(client, pageType, keys),
            signals,
        };
    }

    const signals = await fetchSignals(client, pageType, keys);
    const totalEntities = signals.listing_count + signals.driver_count;

    // ── Hysteresis logic ──
    // Check if page was previously indexed (has published seo_pages entry)
    const wasIndexed = signals.has_published_content;

    let indexable: boolean;
    let reason: string;

    if (wasIndexed) {
        // Already indexed — only de-index if drops BELOW deindex thresholds
        const shouldDeindex = totalEntities <= HYSTERESIS.deindex_below.min_entities
            && signals.corridor_score < HYSTERESIS.deindex_below.corridor_score
            && !signals.has_published_content;
        indexable = !shouldDeindex;
        reason = shouldDeindex ? 'hysteresis_deindex' : 'hysteresis_retain';
    } else {
        // Not yet indexed — must EXCEED index_on thresholds
        indexable = signals.has_published_content
            || totalEntities >= HYSTERESIS.index_on.min_entities
            || signals.corridor_score >= HYSTERESIS.index_on.corridor_score;
        reason = indexable
            ? (signals.has_published_content ? 'has_content' : totalEntities >= 1 ? 'has_entities' : 'corridor_qualified')
            : 'below_threshold';
    }

    // ── Revenue-weighted priority ──
    const normalizedListings = Math.min(totalEntities / 20, 1); // cap at 20 for normalization
    const priority = Math.min(1.0, Math.max(0.1,
        (signals.corridor_score * PRIORITY_WEIGHTS.corridor_score) +
        (normalizedListings * PRIORITY_WEIGHTS.listing_density) +
        (signals.demand_signals * PRIORITY_WEIGHTS.demand_signals) +
        (signals.paid_presence * PRIORITY_WEIGHTS.paid_presence)
    ));

    return {
        indexable,
        robots: indexable ? 'index,follow' : 'noindex,follow',
        reason,
        priority: Math.round(priority * 100) / 100,
        lastmod: await getLastmod(client, pageType, keys),
        signals,
    };
}

// ── Signal Fetching ────────────────────────────────────────────────────────────

async function fetchSignals(
    client: SupabaseClient,
    pageType: PageType,
    keys: IndexabilityKeys,
): Promise<IndexabilitySignals> {
    const regionCode = keys.state?.toUpperCase();
    const citySlug = keys.city;

    let has_published_content = false;
    let listing_count = 0;
    let driver_count = 0;
    let corridor_score = 0;

    // Parallel queries for speed (async closures produce real Promise<void>)
    const queries: Promise<void>[] = [];

    // 1. Check published content
    const seoSlug = regionCode && citySlug
        ? `pilot-car/${regionCode.toLowerCase()}/${citySlug}`
        : citySlug
            ? `pilot-car/${citySlug}`
            : null;

    if (seoSlug) {
        queries.push((async () => {
            const { data } = await client
                .from('seo_pages')
                .select('status')
                .eq('slug', seoSlug)
                .eq('status', 'published')
                .limit(1);
            has_published_content = (data?.length ?? 0) > 0;
        })());
    }

    // 2. Listing count
    if (regionCode) {
        queries.push((async () => {
            const { count } = await client
                .from('directory_listings')
                .select('id', { count: 'exact', head: true })
                .eq('region_code', regionCode);
            listing_count = count ?? 0;
        })());
    }

    // 3. Driver count
    if (regionCode) {
        queries.push((async () => {
            const { count } = await client
                .from('directory_drivers')
                .select('id', { count: 'exact', head: true })
                .or(`state.eq.${regionCode},service_states.cs.{${regionCode}}`);
            driver_count = count ?? 0;
        })());
    }

    // 4. Corridor score
    if (pageType === 'county' && citySlug) {
        queries.push((async () => {
            const { data } = await client
                .from('counties')
                .select('corridor_score')
                .eq('slug', citySlug)
                .single();
            corridor_score = data?.corridor_score ?? 0;
        })());
    }

    await Promise.allSettled(queries);

    return {
        has_published_content,
        listing_count,
        driver_count,
        corridor_score,
        internal_link_score: 0,  // future: compute from link graph
        demand_signals: 0,       // future: from load activity
        paid_presence: 0,        // future: from sponsor data
    };
}

// ── Lastmod Precision ──────────────────────────────────────────────────────────
// Uses MAX rollup from real data sources. Never fabricates freshness.

async function getLastmod(
    client: SupabaseClient,
    pageType: PageType,
    keys: IndexabilityKeys,
): Promise<string | null> {
    const regionCode = keys.state?.toUpperCase();
    const dates: Date[] = [];

    try {
        // SEO page lastmod
        const seoSlug = regionCode && keys.city
            ? `pilot-car/${regionCode.toLowerCase()}/${keys.city}`
            : null;

        if (seoSlug) {
            const { data } = await client
                .from('seo_pages')
                .select('updated_at')
                .eq('slug', seoSlug)
                .single();
            if (data?.updated_at) dates.push(new Date(data.updated_at));
        }

        // Latest driver update in region
        if (regionCode) {
            const { data } = await client
                .from('directory_drivers')
                .select('updated_at')
                .or(`state.eq.${regionCode},service_states.cs.{${regionCode}}`)
                .order('updated_at', { ascending: false })
                .limit(1);
            if (data?.[0]?.updated_at) dates.push(new Date(data[0].updated_at));
        }
    } catch {
        // Swallow errors — lastmod is optional
    }

    if (dates.length === 0) return null;

    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    return maxDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── Batch Indexability (for sitemaps) ──────────────────────────────────────────

export interface BatchIndexableCity {
    city: string;
    slug: string;
    state: string;
    country: string;
    priority: number;
    lastmod: string | null;
    listing_count: number;
    driver_count: number;
    corridor_score: number;
}

/**
 * Fetch all indexable cities for sitemap generation.
 * Uses seo_market_pulse for efficient batch queries.
 * Returns only cities that pass indexability thresholds, sorted by priority.
 */
export async function getIndexableCities(
    limit: number = 50000,
): Promise<BatchIndexableCity[]> {
    const client = getClient();
    if (!client) return [];

    // Fetch cities with entity signals
    const { data, error } = await client
        .from('seo_market_pulse')
        .select('city, region_code, country, escort_count, listing_count, corridor_score, updated_at')
        .or('escort_count.gte.1,listing_count.gte.1,corridor_score.gte.0.35')
        .order('escort_count', { ascending: false })
        .limit(limit);

    if (error || !data) return [];

    return data.map(c => {
        const totalEntities = (c.escort_count ?? 0) + (c.listing_count ?? 0);
        const normalizedListings = Math.min(totalEntities / 20, 1);
        const cs = c.corridor_score ?? 0;

        const priority = Math.min(1.0, Math.max(0.1,
            (cs * PRIORITY_WEIGHTS.corridor_score) +
            (normalizedListings * PRIORITY_WEIGHTS.listing_density)
        ));

        return {
            city: c.city,
            slug: c.city.toLowerCase().replace(/\s+/g, '-'),
            state: c.region_code.toLowerCase(),
            country: (c.country?.toLowerCase() === 'ca' ? 'ca' : 'us'),
            priority: Math.round(priority * 100) / 100,
            lastmod: c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : null,
            listing_count: c.listing_count ?? 0,
            driver_count: c.escort_count ?? 0,
            corridor_score: cs,
        };
    }).sort((a, b) => b.priority - a.priority);
}

// ── Helper for generateMetadata ────────────────────────────────────────────────

export function indexRobots(state: IndexabilityState): string {
    return state.robots;
}
