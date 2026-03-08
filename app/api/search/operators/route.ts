/**
 * GET /api/search/operators
 * 
 * Search operators via Typesense with full-text search, geo, facets, and filters.
 * This is the primary directory search endpoint.
 * 
 * Query params:
 *   q          - Search query (company name, bio, etc.)
 *   state      - Filter by state/province
 *   country    - Filter by country code
 *   role       - Filter by role subtype
 *   corridor   - Filter by corridor
 *   height_pole- Filter for height pole operators only (true)
 *   dispatch   - Filter for dispatch-ready only (true)
 *   claimed    - Filter for claimed only (true)
 *   lat/lng/radius - Geo search (radius in miles)
 *   sort       - Sort by: relevance, reputation, distance, newest
 *   page       - Page number (1-indexed)
 *   per_page   - Results per page (default 20, max 100)
 * 
 * Phase 1: search_ui_live
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getTypesenseSearch, OPERATORS_COLLECTION } from '@/lib/typesense/client';

export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams;

    const q = params.get('q') || '*';
    const state = params.get('state');
    const country = params.get('country');
    const role = params.get('role');
    const corridor = params.get('corridor');
    const heightPole = params.get('height_pole');
    const dispatch = params.get('dispatch');
    const claimed = params.get('claimed');
    const lat = params.get('lat');
    const lng = params.get('lng');
    const radius = params.get('radius') || '100';
    const sort = params.get('sort') || 'relevance';
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') || '20', 10)));

    // Build filter string
    const filters: string[] = [];
    if (state) filters.push(`state:=${state}`);
    if (country) filters.push(`country_code:=${country}`);
    if (role) filters.push(`role_subtypes:=${role}`);
    if (corridor) filters.push(`service_corridors:=${corridor}`);
    if (heightPole === 'true') filters.push(`has_height_pole:=true`);
    if (dispatch === 'true') filters.push(`dispatch_ready:=true`);
    if (claimed === 'true') filters.push(`is_claimed:=true`);

    // Build sort string
    let sortBy = '_text_match:desc';
    switch (sort) {
        case 'reputation':
            sortBy = 'reputation_score:desc';
            break;
        case 'newest':
            sortBy = 'updated_at:desc';
            break;
        case 'distance':
            if (lat && lng) {
                sortBy = `location(${lat}, ${lng}):asc`;
            }
            break;
        case 'relevance':
        default:
            sortBy = '_text_match:desc,reputation_score:desc';
    }

    // Add geo filter if coordinates provided
    if (lat && lng) {
        const radiusMiles = parseInt(radius, 10);
        const radiusKm = radiusMiles * 1.60934;
        filters.push(`location:(${lat}, ${lng}, ${radiusKm} km)`);
    }

    try {
        const typesense = getTypesenseSearch();

        const results = await typesense
            .collections(OPERATORS_COLLECTION)
            .documents()
            .search({
                q,
                query_by: 'company_name,bio,city,state,country_code',
                filter_by: filters.length > 0 ? filters.join(' && ') : undefined,
                sort_by: sortBy,
                page,
                per_page: perPage,
                facet_by: 'state,country_code,role_subtypes,availability_status,trust_tier,has_height_pole',
                max_facet_values: 50,
                highlight_full_fields: 'company_name,bio',
                num_typos: 2,
                typo_tokens_threshold: 3,
            });

        // Extract facets for sidebar
        const facets: Record<string, { value: string; count: number }[]> = {};
        if (results.facet_counts) {
            for (const fc of results.facet_counts) {
                facets[fc.field_name] = fc.counts.map((c: { value: string; count: number }) => ({
                    value: c.value,
                    count: c.count,
                }));
            }
        }

        return NextResponse.json({
            query: q,
            found: results.found,
            page,
            perPage,
            totalPages: Math.ceil(results.found / perPage),
            hits: results.hits?.map(hit => ({
                ...hit.document,
                highlights: hit.highlights,
                textMatchScore: hit.text_match,
            })) || [],
            facets,
            processingTimeMs: results.search_time_ms,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Search error';
        console.error('[SEARCH] Error:', message);

        // Fallback: if Typesense is down, return empty results gracefully
        return NextResponse.json({
            query: q,
            found: 0,
            page,
            perPage,
            totalPages: 0,
            hits: [],
            facets: {},
            error: 'Search temporarily unavailable',
            fallback: true,
        }, { status: 503 });
    }
}
