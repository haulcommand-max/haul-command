/**
 * Haul Command — Search Client
 *
 * Thin fetch wrapper for search API routes.
 * Works on both client and server (SSR-safe).
 */

import type {
    OperatorSearchResult,
    LoadSearchResult,
    OperatorSearchParams,
    LoadSearchParams,
    SearchResponse,
} from './types';

const BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL ?? '');

export async function searchOperators(
    params: OperatorSearchParams
): Promise<SearchResponse<OperatorSearchResult>> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v != null && v !== '') qs.set(k, String(v));
    }
    const res = await fetch(`${BASE}/api/search/operators?${qs.toString()}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const json = await res.json();
    return { query: json.meta ?? json.query, results: json.results, count: json.meta?.count ?? json.count ?? json.results.length };
}

export async function searchLoads(
    params: LoadSearchParams
): Promise<SearchResponse<LoadSearchResult>> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v != null && v !== '') qs.set(k, String(v));
    }
    const res = await fetch(`${BASE}/api/search/loads?${qs.toString()}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const json = await res.json();
    return { query: json.meta ?? json.query, results: json.results, count: json.meta?.count ?? json.count ?? json.results.length };
}
