/**
 * Haul Command — Search Types
 *
 * Shared types for search RPCs and API routes.
 */

export type OperatorSearchResult = {
    operator_id: string;
    title: string;
    subtitle: string | null;
    country_code: string | null;
    region: string | null;
    city: string | null;
    tags: string[];
    is_verified: boolean;
    trust_score: number;
    last_active_at: string | null;
    score: number;
};

export type LoadSearchResult = {
    load_id: string;
    title: string;
    subtitle: string | null;
    country_code: string | null;
    region: string | null;
    city: string | null;
    tags: string[];
    status: string;
    score: number;
};

export type OperatorSearchParams = {
    q?: string;
    country?: string;
    region?: string;
    city?: string;
    tags?: string;          // comma-separated
    verified?: string;      // "1" or "true"
    lat?: string;
    lng?: string;
    radius_km?: string;
    limit?: string;
    offset?: string;
};

export type LoadSearchParams = {
    q?: string;
    country?: string;
    region?: string;
    city?: string;
    status?: string;
    lat?: string;
    lng?: string;
    radius_km?: string;
    limit?: string;
    offset?: string;
};

export type SearchResponse<T> = {
    query: Record<string, unknown>;
    results: T[];
    count: number;
};
