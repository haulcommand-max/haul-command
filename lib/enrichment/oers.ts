/**
 * OERS — Oversize Ecosystem Relevance Score
 * 
 * Multi-signal scoring model that determines if a candidate POI
 * belongs in the Haul Command oversize load ecosystem.
 * 
 * Score thresholds:
 *   ≥ 0.62 → include
 *   0.45–0.61 → review
 *   < 0.45 → reject
 * 
 * Scoring weights:
 *   name_keyword_match:        35%
 *   category_match:            25%
 *   tag_match:                 20%
 *   proximity_to_corridor:     10%
 *   cross_source_confirmation: 10%
 */

// ═══════════════════════════════════════════════════════════════
// KEYWORD INTENT SETS
// ═══════════════════════════════════════════════════════════════

export interface KeywordSet {
    tier: string;
    weight: number;
    terms: string[];
}

export const KEYWORD_INTENT_SETS: KeywordSet[] = [
    {
        tier: 'tier1_direct_escort',
        weight: 1.0,
        terms: [
            'pilot car', 'escort vehicle', 'escort service oversize',
            'wide load escort', 'oversize load escort', 'heavy haul escort',
            'abnormal load escort', 'pilot vehicle',
        ],
    },
    {
        tier: 'tier2_heavy_haul_core',
        weight: 0.85,
        terms: [
            'heavy haul', 'oversize transport', 'wide load transport',
            'specialized transport', 'super load transport', 'heavy transport',
        ],
    },
    {
        tier: 'tier3_supporting_logistics',
        weight: 0.55,
        terms: [
            'flatbed trucking', 'lowboy transport', 'multi-axle transport',
            'freight forwarding project cargo', 'heavy equipment transport',
            'crane service heavy lift', 'rigging service',
        ],
    },
    {
        tier: 'tier4_compliance_signal',
        weight: 0.35,
        terms: [
            'oversize permits', 'dot permits', 'escort certification',
            'weigh station', 'truck inspection',
        ],
    },
];

// ═══════════════════════════════════════════════════════════════
// SEMANTIC NAME CLASSIFIER
// ═══════════════════════════════════════════════════════════════

export const POSITIVE_PATTERNS: RegExp[] = [
    /(haul|transport|escort|pilot).*(special|heavy|oversize|wide)/i,
    /(heavy|oversize|wide).*(transport|logistics|haul)/i,
    /project\s+cargo/i,
    /super\s*load/i,
    /abnormal\s*(load|transport)/i,
    /freight\s*escort/i,
    /route\s*survey/i,
    /height\s*pole/i,
    /bucket\s*truck\s*escort/i,
    /utility\s*line\s*lift/i,
];

export const NEGATIVE_PATTERNS: RegExp[] = [
    /\btaxi\b/i,
    /\btow\s+only\b/i,
    /moving\s*&?\s*storage\s*residential/i,
    /\bcourier\b/i,
    /food\s*delivery/i,
    /pizza/i,
    /uber|lyft/i,
    /passenger/i,
    /\bvan\s*lines?\b/i,
    /household\s*goods/i,
    /junk\s*removal/i,
    /garbage|waste\s*management/i,
    /car\s*wash/i,
    /auto\s*detail/i,
    /nail\s*salon/i,
    /restaurant/i,
];

// ═══════════════════════════════════════════════════════════════
// OSM TAG FILTERS
// ═══════════════════════════════════════════════════════════════

export const OSM_HIGH_PRECISION_TAGS = [
    'operator=pilot car',
    'escort=yes',
    'cargo=oversize',
    'heavy_transport=yes',
];

export const OSM_INDUSTRIAL_PROXIES = [
    'landuse=industrial',
    'industrial=logistics',
    'industrial=warehouse',
    'industrial=port',
];

export const OSM_LOGISTICS_TAGS = [
    'shop=truck_parts',
    'office=logistics',
    'craft=metal_construction',
    'man_made=crane',
];

// ═══════════════════════════════════════════════════════════════
// GOOGLE PLACES NICHE CONFIG
// ═══════════════════════════════════════════════════════════════

export const GOOGLE_PLACES_CONFIG = {
    mode: 'niche_only' as const,
    nearbySearchQueries: [
        'pilot car escort',
        'oversize load escort',
        'heavy haul transport',
        'wide load escort',
        'heavy equipment transport',
    ],
    typeFilters: ['moving_company', 'storage', 'general_contractor', 'point_of_interest'],
    costControls: {
        maxResultsPerQuery: 20,
        maxQueriesPerCity: 6,
        fieldMaskMinimal: true,
        requireKeywordHit: true,
        ttlDays: 30,
        hardStopDailyBudgetUsd: 25,
    },
};

// ═══════════════════════════════════════════════════════════════
// POST-FILTER CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const POST_FILTER = {
    requiredMinScore: 0.62,
    reviewThreshold: 0.45,
    dedupeRadiusMeters: 120,
    nameSimilarityThreshold: 0.88,
};

// ═══════════════════════════════════════════════════════════════
// SCORING WEIGHTS
// ═══════════════════════════════════════════════════════════════

const SCORE_WEIGHTS = {
    nameKeywordMatch: 0.35,
    categoryMatch: 0.25,
    tagMatch: 0.20,
    proximityToCorridor: 0.10,
    crossSourceConfirmation: 0.10,
} as const;

// ═══════════════════════════════════════════════════════════════
// CORE SCORING ENGINE
// ═══════════════════════════════════════════════════════════════

export interface CandidatePOI {
    id: string;
    name: string;
    categories?: string[];         // Google types or OSM categories
    tags?: Record<string, string>; // OSM key=value tags
    lat: number;
    lon: number;
    source: 'osm' | 'google' | 'seed' | 'partner';
    crossSourceConfirmed?: boolean;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    region?: string;
    countryCode?: string;
}

export interface OERSResult {
    score: number;
    verdict: 'include' | 'review' | 'reject';
    breakdown: {
        nameKeywordMatch: number;
        categoryMatch: number;
        tagMatch: number;
        proximityToCorridor: number;
        crossSourceConfirmation: number;
    };
    matchedKeywords: string[];
    matchedTier: string | null;
    semanticHit: boolean;
    negativeHit: boolean;
    reasons: string[];
}

export interface CorridorRef {
    slug: string;
    lat: number;
    lon: number;
    radiusKm: number;
}

/**
 * Compute the OERS score for a single candidate POI
 */
export function computeOERS(
    candidate: CandidatePOI,
    corridorRefs: CorridorRef[],
): OERSResult {
    const reasons: string[] = [];
    const matchedKeywords: string[] = [];
    let matchedTier: string | null = null;

    // ─── 1. NEGATIVE PATTERN FILTER (hard reject) ───────────────
    const nameDown = (candidate.name || '').toLowerCase();
    const negativeHit = NEGATIVE_PATTERNS.some(p => p.test(nameDown));
    if (negativeHit) {
        return {
            score: 0,
            verdict: 'reject',
            breakdown: { nameKeywordMatch: 0, categoryMatch: 0, tagMatch: 0, proximityToCorridor: 0, crossSourceConfirmation: 0 },
            matchedKeywords: [],
            matchedTier: null,
            semanticHit: false,
            negativeHit: true,
            reasons: [`Negative pattern match: "${candidate.name}"`],
        };
    }

    // ─── 2. NAME KEYWORD MATCH (35%) ────────────────────────────
    let nameScore = 0;
    for (const set of KEYWORD_INTENT_SETS) {
        for (const term of set.terms) {
            if (nameDown.includes(term.toLowerCase())) {
                const score = set.weight;
                if (score > nameScore) {
                    nameScore = score;
                    matchedTier = set.tier;
                }
                matchedKeywords.push(term);
            }
        }
    }

    // Semantic pattern fallback
    let semanticHit = false;
    if (nameScore < 0.5) {
        for (const pattern of POSITIVE_PATTERNS) {
            if (pattern.test(nameDown)) {
                nameScore = Math.max(nameScore, 0.65);
                semanticHit = true;
                reasons.push(`Semantic pattern match on name`);
                break;
            }
        }
    }

    if (nameScore > 0) {
        reasons.push(`Name keyword match: score=${nameScore.toFixed(2)}, tier=${matchedTier}`);
    }

    // ─── 3. CATEGORY MATCH (25%) ────────────────────────────────
    let categoryScore = 0;
    const cats = (candidate.categories || []).map(c => c.toLowerCase());

    const NICHE_CATEGORIES = [
        'moving_company', 'storage', 'general_contractor',
        'trucking_company', 'logistics', 'freight',
        'industrial', 'construction', 'crane_service',
    ];

    const ANTI_CATEGORIES = [
        'restaurant', 'food', 'bar', 'cafe', 'beauty', 'salon',
        'gym', 'spa', 'hotel_generic', 'clothing', 'electronics',
        'supermarket', 'pharmacy', 'doctor', 'dentist', 'bank',
    ];

    for (const cat of cats) {
        if (ANTI_CATEGORIES.some(a => cat.includes(a))) {
            categoryScore = 0;
            reasons.push(`Anti-category detected: ${cat}`);
            break;
        }
        if (NICHE_CATEGORIES.some(n => cat.includes(n))) {
            categoryScore = Math.max(categoryScore, 0.8);
        }
    }

    // ─── 4. TAG MATCH (20%) ─────────────────────────────────────
    let tagScore = 0;
    if (candidate.tags && Object.keys(candidate.tags).length > 0) {
        const tagString = Object.entries(candidate.tags)
            .map(([k, v]) => `${k}=${v}`.toLowerCase())
            .join(' ');

        for (const tag of OSM_HIGH_PRECISION_TAGS) {
            if (tagString.includes(tag.toLowerCase())) {
                tagScore = 1.0;
                reasons.push(`High-precision OSM tag: ${tag}`);
                break;
            }
        }

        if (tagScore === 0) {
            for (const tag of OSM_LOGISTICS_TAGS) {
                if (tagString.includes(tag.toLowerCase())) {
                    tagScore = Math.max(tagScore, 0.6);
                    reasons.push(`Logistics OSM tag: ${tag}`);
                }
            }
        }

        if (tagScore === 0) {
            for (const tag of OSM_INDUSTRIAL_PROXIES) {
                if (tagString.includes(tag.toLowerCase())) {
                    tagScore = Math.max(tagScore, 0.3);
                    reasons.push(`Industrial proxy tag: ${tag}`);
                }
            }
        }
    }

    // ─── 5. CORRIDOR PROXIMITY (10%) ────────────────────────────
    let proximityScore = 0;
    if (corridorRefs.length > 0 && candidate.lat && candidate.lon) {
        for (const corr of corridorRefs) {
            const distKm = haversineKm(candidate.lat, candidate.lon, corr.lat, corr.lon);
            if (distKm <= corr.radiusKm) {
                proximityScore = 1.0;
                reasons.push(`Within ${corr.radiusKm}km of corridor ${corr.slug}`);
                break;
            } else if (distKm <= corr.radiusKm * 2) {
                proximityScore = Math.max(proximityScore, 0.5);
            }
        }
    }

    // ─── 6. CROSS-SOURCE CONFIRMATION (10%) ─────────────────────
    const crossScore = candidate.crossSourceConfirmed ? 1.0 : 0.0;
    if (crossScore > 0) reasons.push('Cross-source confirmed');

    // ─── WEIGHTED SUM ───────────────────────────────────────────
    const breakdown = {
        nameKeywordMatch: nameScore,
        categoryMatch: categoryScore,
        tagMatch: tagScore,
        proximityToCorridor: proximityScore,
        crossSourceConfirmation: crossScore,
    };

    const score =
        (breakdown.nameKeywordMatch * SCORE_WEIGHTS.nameKeywordMatch) +
        (breakdown.categoryMatch * SCORE_WEIGHTS.categoryMatch) +
        (breakdown.tagMatch * SCORE_WEIGHTS.tagMatch) +
        (breakdown.proximityToCorridor * SCORE_WEIGHTS.proximityToCorridor) +
        (breakdown.crossSourceConfirmation * SCORE_WEIGHTS.crossSourceConfirmation);

    const roundedScore = Math.round(score * 10000) / 10000;

    let verdict: OERSResult['verdict'];
    if (roundedScore >= POST_FILTER.requiredMinScore) {
        verdict = 'include';
    } else if (roundedScore >= POST_FILTER.reviewThreshold) {
        verdict = 'review';
    } else {
        verdict = 'reject';
    }

    return {
        score: roundedScore,
        verdict,
        breakdown,
        matchedKeywords,
        matchedTier,
        semanticHit,
        negativeHit: false,
        reasons,
    };
}

// ═══════════════════════════════════════════════════════════════
// BATCH SCORING + DEDUPLICATION
// ═══════════════════════════════════════════════════════════════

export interface BatchOERSResult {
    included: Array<CandidatePOI & { oers: OERSResult }>;
    review: Array<CandidatePOI & { oers: OERSResult }>;
    rejected: number;
    totalProcessed: number;
    deduped: number;
}

export function scoreBatch(
    candidates: CandidatePOI[],
    corridorRefs: CorridorRef[],
): BatchOERSResult {
    const scored = candidates.map(c => ({
        ...c,
        oers: computeOERS(c, corridorRefs),
    }));

    // Separate by verdict
    const included = scored.filter(s => s.oers.verdict === 'include');
    const review = scored.filter(s => s.oers.verdict === 'review');
    const rejected = scored.filter(s => s.oers.verdict === 'reject').length;

    // Deduplicate within include set (by proximity + name similarity)
    const deduped = deduplicatePOIs(included);

    return {
        included: deduped.kept,
        review,
        rejected,
        totalProcessed: candidates.length,
        deduped: deduped.removed,
    };
}

function deduplicatePOIs(
    pois: Array<CandidatePOI & { oers: OERSResult }>,
): { kept: Array<CandidatePOI & { oers: OERSResult }>; removed: number } {
    const kept: Array<CandidatePOI & { oers: OERSResult }> = [];
    let removed = 0;

    // Sort by score descending so we keep the highest-scoring version
    const sorted = [...pois].sort((a, b) => b.oers.score - a.oers.score);

    for (const poi of sorted) {
        const isDupe = kept.some(existing => {
            const distM = haversineKm(poi.lat, poi.lon, existing.lat, existing.lon) * 1000;
            if (distM > POST_FILTER.dedupeRadiusMeters) return false;
            const similarity = nameSimilarity(poi.name, existing.name);
            return similarity >= POST_FILTER.nameSimilarityThreshold;
        });

        if (isDupe) {
            removed++;
        } else {
            kept.push(poi);
        }
    }

    return { kept, removed };
}

// ═══════════════════════════════════════════════════════════════
// COMPETITOR DENSITY MODEL
// ═══════════════════════════════════════════════════════════════

export interface CompetitorDensityResult {
    escortDensityScore: number;
    heavyHaulDensityScore: number;
    saturationFlag: boolean;
    opportunityIndex: number;
}

export function computeCompetitorDensity(
    escortCount: number,
    heavyHaulCount: number,
    metroAreaKm2: number,
    corridorTrafficScore: number, // 0-100
): CompetitorDensityResult {
    const escortDensity = metroAreaKm2 > 0 ? escortCount / metroAreaKm2 : 0;
    const heavyHaulDensity = metroAreaKm2 > 0 ? heavyHaulCount / metroAreaKm2 : 0;

    // Saturation: >0.5 escorts per km² in the area
    const saturationFlag = escortDensity > 0.5;

    // Opportunity Index: high traffic + low density = high opportunity
    const normalizedTraffic = corridorTrafficScore / 100;
    const normalizedDensity = Math.min(escortDensity / 1.0, 1.0); // cap at 1/km²
    const opportunityIndex = (normalizedTraffic * 0.6) - (normalizedDensity * 0.4);

    return {
        escortDensityScore: Math.round(escortDensity * 10000) / 10000,
        heavyHaulDensityScore: Math.round(heavyHaulDensity * 10000) / 10000,
        saturationFlag,
        opportunityIndex: Math.round(Math.max(0, opportunityIndex) * 10000) / 10000,
    };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/** Haversine distance in km between two lat/lon pairs */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/** Normalized Levenshtein-based name similarity (0–1) */
export function nameSimilarity(a: string, b: string): number {
    const sa = a.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const sb = b.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    if (sa === sb) return 1.0;
    const maxLen = Math.max(sa.length, sb.length);
    if (maxLen === 0) return 1.0;
    const dist = levenshtein(sa, sb);
    return Math.round((1 - dist / maxLen) * 100) / 100;
}

function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}
