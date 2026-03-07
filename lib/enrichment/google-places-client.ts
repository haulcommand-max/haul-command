/**
 * Google Places Niche-Only Enrichment Client
 * 
 * Fallback source when OSM returns insufficient results.
 * Strict cost controls enforced.
 * 
 * Cost guardrails:
 *   - Max 20 results per query
 *   - Max 6 queries per city
 *   - Field mask minimal (name, lat/lon, types, phone only)
 *   - Hard stop at $25/day
 *   - All candidates must pass keyword filter before storage
 *   - Results cached with 30-day TTL
 */

import type { CandidatePOI } from './oers';
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// COST TRACKER (IN-MEMORY PER PROCESS)
// ═══════════════════════════════════════════════════════════════

let dailySpendEstimateUsd = 0;
let lastResetDate = new Date().toDateString();

const COST_PER_BASIC_FIELDS_REQUEST = 0.017;  // ~$17/1000 requests
const HARD_STOP_USD = 25;

function checkAndResetBudget(): boolean {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
        dailySpendEstimateUsd = 0;
        lastResetDate = today;
    }
    return dailySpendEstimateUsd < HARD_STOP_USD;
}

function recordSpend(requests: number): void {
    dailySpendEstimateUsd += requests * COST_PER_BASIC_FIELDS_REQUEST;
}

// ═══════════════════════════════════════════════════════════════
// NICHE SEARCH QUERIES (OVERSIZE ECOSYSTEM ONLY)
// ═══════════════════════════════════════════════════════════════

const NICHE_QUERIES = [
    'pilot car escort',
    'oversize load escort',
    'heavy haul transport',
    'wide load escort',
    'heavy equipment transport',
];

// Minimal field mask — only what we need for scoring + storage  
const FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.location',
    'places.types',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.formattedAddress',
    'places.shortFormattedAddress',
].join(',');

// ═══════════════════════════════════════════════════════════════
// KEYWORD PRE-FILTER (before any result is accepted)
// ═══════════════════════════════════════════════════════════════

const KEYWORD_GATE_PATTERNS = [
    /pilot\s*car/i,
    /escort/i,
    /oversize/i,
    /wide\s*load/i,
    /heavy\s*haul/i,
    /heavy\s*transport/i,
    /specialized\s*transport/i,
    /super\s*load/i,
    /abnormal\s*load/i,
    /flatbed/i,
    /lowboy/i,
    /crane/i,
    /rigging/i,
    /project\s*cargo/i,
    /heavy\s*equipment/i,
    /heavy\s*lift/i,
];

function passesKeywordGate(name: string): boolean {
    return KEYWORD_GATE_PATTERNS.some(p => p.test(name));
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE PLACES API CALLER
// ═══════════════════════════════════════════════════════════════

interface GooglePlacesNearbyParams {
    lat: number;
    lon: number;
    radiusM: number;
    maxQueriesPerCity: number;
}

export async function searchGooglePlacesNiche(
    params: GooglePlacesNearbyParams,
): Promise<CandidatePOI[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        console.warn('[Google Places] No API key configured — skipping fallback');
        return [];
    }

    if (!checkAndResetBudget()) {
        console.warn(`[Google Places] Daily budget exhausted ($${dailySpendEstimateUsd.toFixed(2)}/$${HARD_STOP_USD})`);
        return [];
    }

    const candidates: CandidatePOI[] = [];
    const queriesUsed = Math.min(NICHE_QUERIES.length, params.maxQueriesPerCity);

    for (let i = 0; i < queriesUsed; i++) {
        if (!checkAndResetBudget()) break;

        const query = NICHE_QUERIES[i];

        try {
            const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': FIELD_MASK,
                },
                body: JSON.stringify({
                    textQuery: query,
                    locationBias: {
                        circle: {
                            center: { latitude: params.lat, longitude: params.lon },
                            radius: params.radiusM,
                        },
                    },
                    maxResultCount: 20,
                }),
            });

            recordSpend(1);

            if (!response.ok) {
                console.error(`[Google Places] API error for "${query}": ${response.status}`);
                continue;
            }

            const data = await response.json();
            const places = data.places || [];

            for (const place of places) {
                const name = place.displayName?.text || '';

                // Keyword gate — reject any result that doesn't match niche patterns
                if (!passesKeywordGate(name)) {
                    continue;
                }

                candidates.push({
                    id: `gp_${place.id || Math.random().toString(36).substring(2, 15)}`,
                    name,
                    categories: place.types || [],
                    lat: place.location?.latitude || 0,
                    lon: place.location?.longitude || 0,
                    source: 'google',
                    phone: place.nationalPhoneNumber,
                    website: place.websiteUri,
                    address: place.formattedAddress || place.shortFormattedAddress,
                });
            }
        } catch (err) {
            console.error(`[Google Places] Request failed for "${query}":`, err);
        }
    }

    return candidates;
}

// ═══════════════════════════════════════════════════════════════
// COST REPORTING
// ═══════════════════════════════════════════════════════════════

export function getGooglePlacesSpendReport(): {
    estimatedSpendToday: number;
    hardStopBudget: number;
    budgetRemaining: number;
    exhausted: boolean;
} {
    return {
        estimatedSpendToday: Math.round(dailySpendEstimateUsd * 100) / 100,
        hardStopBudget: HARD_STOP_USD,
        budgetRemaining: Math.round((HARD_STOP_USD - dailySpendEstimateUsd) * 100) / 100,
        exhausted: dailySpendEstimateUsd >= HARD_STOP_USD,
    };
}

// ═══════════════════════════════════════════════════════════════
// CACHE CHECK (30-day TTL)
// ═══════════════════════════════════════════════════════════════

export async function checkEnrichmentCache(
    lat: number, lon: number, radiusKm: number,
): Promise<CandidatePOI[] | null> {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data } = await supabase
            .from('enrichment_cache')
            .select('candidates_json, cached_at')
            .eq('center_lat', Math.round(lat * 100) / 100)
            .eq('center_lon', Math.round(lon * 100) / 100)
            .eq('radius_km', radiusKm)
            .single();

        if (!data) return null;

        const cacheAge = (Date.now() - new Date(data.cached_at).getTime()) / (1000 * 60 * 60 * 24);
        if (cacheAge > 30) return null; // expired

        return data.candidates_json as CandidatePOI[];
    } catch {
        return null;
    }
}
