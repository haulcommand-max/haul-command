// HC Search Client — TypeScript contracts for search API

// =====================================================================
// HC Search Client — TypeScript contracts for search API
// =====================================================================

export interface OperatorSearchParams {
    [key: string]: unknown;
    q?: string;
    lat?: number;
    lng?: number;
    radius?: number;       // miles, default 150
    country?: string;      // US, CA, etc.
    state?: string;        // FL, ON, etc.
    verified?: boolean;
    highPole?: boolean;
    limit?: number;        // default 50, max 100
    offset?: number;
}

export interface OperatorSearchResult {
    profile_id: string;
    display_name: string;
    role: string;
    home_city: string;
    home_state: string;
    country: string;
    verified_badge: boolean;
    has_high_pole: boolean;
    distance_miles: number | null;
    text_score: number;
    trust_score: number;
    composite_score: number;
}

export interface LoadSearchParams {
    [key: string]: unknown;
    q?: string;
    status?: string;       // default "posted"
    lat?: number;
    lng?: number;
    radius?: number;       // miles, default 200
    limit?: number;
    offset?: number;
}

export interface LoadSearchResult {
    load_id: string;
    title: string;
    status: string;
    origin_text: string;
    dest_text: string;
    pickup_start: string;
    distance_miles: number | null;
}

export interface SearchResponse<T> {
    results: T[];
    meta: {
        query: string | null;
        count: number;
        limit: number;
        offset: number;
        [key: string]: unknown;
    };
}

// =====================================================================
// Client-side search (calls API routes)
// =====================================================================

function buildParams(params: Record<string, unknown>): string {
    const sp = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
            sp.set(key === 'highPole' ? 'high_pole' : key, String(val));
        }
    }
    return sp.toString();
}

export async function searchOperators(
    params: OperatorSearchParams,
): Promise<SearchResponse<OperatorSearchResult>> {
    const qs = buildParams(params);
    const res = await fetch(`/api/search/operators?${qs}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return res.json();
}

export async function searchLoads(
    params: LoadSearchParams,
): Promise<SearchResponse<LoadSearchResult>> {
    const qs = buildParams(params);
    const res = await fetch(`/api/search/loads?${qs}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return res.json();
}


// =====================================================================
// Server-side direct search (bypasses API route, uses RPC)
// =====================================================================

export async function searchOperatorsServer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    params: OperatorSearchParams,
): Promise<OperatorSearchResult[]> {
    const { data, error } = await supabase.rpc('hc_search_operators', {
        p_query: params.q ?? null,
        p_lat: params.lat ?? null,
        p_lng: params.lng ?? null,
        p_radius_miles: params.radius ?? 150,
        p_country: params.country ?? null,
        p_state: params.state ?? null,
        p_verified_only: params.verified ?? false,
        p_has_high_pole: params.highPole ?? false,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0,
    });
    if (error) throw error;
    return data ?? [];
}

export async function searchLoadsServer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    params: LoadSearchParams,
): Promise<LoadSearchResult[]> {
    const { data, error } = await supabase.rpc('hc_search_loads', {
        p_query: params.q ?? null,
        p_status: params.status ?? 'posted',
        p_origin_lat: params.lat ?? null,
        p_origin_lng: params.lng ?? null,
        p_radius_miles: params.radius ?? 200,
        p_limit: params.limit ?? 50,
        p_offset: params.offset ?? 0,
    });
    if (error) throw error;
    return data ?? [];
}
