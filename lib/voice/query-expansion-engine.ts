// ══════════════════════════════════════════════════════════════
// CONVERSATIONAL QUERY EXPANSION ENGINE
// Purpose: Predict and generate long-tail spoken queries that
//          competitors will never think to target. Self-improving.
// ══════════════════════════════════════════════════════════════

import { LANGUAGE_VOICE_PATTERNS, URGENCY_MODIFIERS, SITUATION_MODIFIERS, DISTANCE_MODIFIERS, VEHICLE_CONTEXT } from "./voice-intent-engine";

// ── Core Service Terms by Language ──

const SERVICE_TERMS: Record<string, string[]> = {
    en: ["pilot car", "escort vehicle", "wide load escort", "oversize escort", "oversized load escort", "heavy haul escort"],
    es: ["carro piloto", "vehículo escolta", "escolta de carga pesada", "escolta carga sobredimensionada"],
    pt: ["carro batedor", "veículo de escolta", "escolta de carga excedente"],
    de: ["Begleitfahrzeug", "Schwertransport Begleitung", "BF3 Begleitung", "Transportbegleitung"],
    fr: ["véhicule d'accompagnement", "escorte convoi exceptionnel", "voiture pilote"],
    nl: ["begeleidingsvoertuig", "exceptioneel transport begeleiding"],
    ar: ["سيارة مرافقة", "مرافقة حمولة كبيرة"],
    it: ["veicolo di scorta", "scorta tecnica", "scorta trasporto eccezionale"],
    ja: ["先導車", "誘導車", "特殊車両先導"],
    ko: ["유도차량", "호송차량", "특수차량 호송"],
    tr: ["refakat aracı", "özel yük eskort"],
    pl: ["pojazd pilotujący", "pilot drogowy", "pilotaż transportu"],
};

// ── Geo Entities for Expansion ──

export interface GeoEntity {
    name: string;
    type: "city" | "metro" | "corridor" | "highway" | "port" | "industrial_zone" | "landmark";
    countryCode: string;
}

// ── Query Synthesis Engine ──

export interface SynthesizedQuery {
    query: string;
    language: string;
    intentCluster: "emergency" | "broker" | "compliance" | "route" | "pricing" | "discovery";
    geoEntity?: string;
    estimatedVolume: "high" | "medium" | "low" | "micro";
    competitorCoverage: "none" | "weak" | "moderate" | "strong";
    serpTarget: "featured_snippet" | "people_also_ask" | "voice_answer" | "local_map_pack" | "conversational_ai";
}

export function synthesizeDriverStressQueries(lang: string, city?: string, highway?: string): SynthesizedQuery[] {
    const terms = SERVICE_TERMS[lang] || SERVICE_TERMS["en"];
    const queries: SynthesizedQuery[] = [];

    for (const term of terms.slice(0, 3)) { // top 3 per language
        // "where can I find a [term] near me right now"
        queries.push({ query: `where can I find a ${term} near me right now`, language: lang, intentCluster: "emergency", estimatedVolume: "medium", competitorCoverage: "none", serpTarget: "voice_answer" });

        // "who has a [term] open near me"
        queries.push({ query: `who has a ${term} open near me`, language: lang, intentCluster: "emergency", estimatedVolume: "medium", competitorCoverage: "none", serpTarget: "voice_answer" });

        // "need [term] asap near my location"
        queries.push({ query: `need ${term} asap near my location`, language: lang, intentCluster: "emergency", estimatedVolume: "low", competitorCoverage: "none", serpTarget: "voice_answer" });

        // "is there a [term] close to me on this route"
        queries.push({ query: `is there a ${term} close to me on this route`, language: lang, intentCluster: "emergency", estimatedVolume: "low", competitorCoverage: "none", serpTarget: "voice_answer" });

        if (city) {
            queries.push({ query: `${term} near ${city} right now`, language: lang, intentCluster: "emergency", geoEntity: city, estimatedVolume: "medium", competitorCoverage: "weak", serpTarget: "local_map_pack" });
            queries.push({ query: `${term} available today ${city}`, language: lang, intentCluster: "emergency", geoEntity: city, estimatedVolume: "medium", competitorCoverage: "weak", serpTarget: "local_map_pack" });
        }

        if (highway) {
            queries.push({ query: `${term} along ${highway}`, language: lang, intentCluster: "route", geoEntity: highway, estimatedVolume: "low", competitorCoverage: "none", serpTarget: "voice_answer" });
        }
    }

    return queries;
}

export function synthesizeBrokerPrecisionQueries(lang: string, cities: string[]): SynthesizedQuery[] {
    const terms = SERVICE_TERMS[lang] || SERVICE_TERMS["en"];
    const queries: SynthesizedQuery[] = [];

    for (const city of cities) {
        const term = terms[0]; // primary term
        queries.push(
            { query: `certified ${term} companies near ${city}`, language: lang, intentCluster: "broker", geoEntity: city, estimatedVolume: "medium", competitorCoverage: "weak", serpTarget: "local_map_pack" },
            { query: `${term} coverage in ${city}`, language: lang, intentCluster: "broker", geoEntity: city, estimatedVolume: "low", competitorCoverage: "none", serpTarget: "featured_snippet" },
            { query: `${term} providers available today ${city}`, language: lang, intentCluster: "broker", geoEntity: city, estimatedVolume: "low", competitorCoverage: "none", serpTarget: "voice_answer" },
            { query: `who has ${term} capacity near ${city}`, language: lang, intentCluster: "broker", geoEntity: city, estimatedVolume: "micro", competitorCoverage: "none", serpTarget: "conversational_ai" },
        );
    }

    return queries;
}

export function synthesizeRouteQueries(lang: string, origins: string[], destinations: string[]): SynthesizedQuery[] {
    const term = (SERVICE_TERMS[lang] || SERVICE_TERMS["en"])[0];
    const queries: SynthesizedQuery[] = [];

    for (const origin of origins) {
        for (const dest of destinations) {
            if (origin !== dest) {
                queries.push(
                    { query: `${term} from ${origin} to ${dest}`, language: lang, intentCluster: "route", geoEntity: `${origin}-${dest}`, estimatedVolume: "low", competitorCoverage: "none", serpTarget: "voice_answer" },
                    { query: `escort needed ${origin} to ${dest}`, language: lang, intentCluster: "route", geoEntity: `${origin}-${dest}`, estimatedVolume: "micro", competitorCoverage: "none", serpTarget: "conversational_ai" },
                );
            }
        }
    }

    return queries;
}

export function synthesizePricingQueries(lang: string, regions: string[]): SynthesizedQuery[] {
    const terms = SERVICE_TERMS[lang] || SERVICE_TERMS["en"];
    const queries: SynthesizedQuery[] = [];

    for (const region of regions) {
        queries.push(
            { query: `how much does a ${terms[0]} cost in ${region}`, language: lang, intentCluster: "pricing", geoEntity: region, estimatedVolume: "medium", competitorCoverage: "weak", serpTarget: "featured_snippet" },
            { query: `${terms[0]} rates per mile ${region}`, language: lang, intentCluster: "pricing", geoEntity: region, estimatedVolume: "low", competitorCoverage: "none", serpTarget: "featured_snippet" },
            { query: `${terms[0]} hourly rate ${region}`, language: lang, intentCluster: "pricing", geoEntity: region, estimatedVolume: "low", competitorCoverage: "none", serpTarget: "people_also_ask" },
            { query: `what do ${terms[0]}s charge per day ${region}`, language: lang, intentCluster: "pricing", geoEntity: region, estimatedVolume: "micro", competitorCoverage: "none", serpTarget: "voice_answer" },
        );
    }

    return queries;
}

// ── Geo-Intent Multiplier (the 10-15x lever) ──

export function geoIntentMultiplier(
    lang: string,
    geoEntities: GeoEntity[]
): SynthesizedQuery[] {
    const terms = SERVICE_TERMS[lang] || SERVICE_TERMS["en"];
    const queries: SynthesizedQuery[] = [];
    const term = terms[0];

    for (const geo of geoEntities) {
        const patterns: { q: string; cluster: SynthesizedQuery['intentCluster']; serp: SynthesizedQuery['serpTarget'] }[] = [
            { q: `${term} near ${geo.name}`, cluster: "emergency" as const, serp: "local_map_pack" as const },
            { q: `${term} in ${geo.name}`, cluster: "discovery" as const, serp: "local_map_pack" as const },
            { q: `${term} open now ${geo.name}`, cluster: "emergency" as const, serp: "voice_answer" as const },
            { q: `${term} closest to ${geo.name}`, cluster: "emergency" as const, serp: "voice_answer" as const },
        ];

        if (geo.type === "port") {
            patterns.push({ q: `${term} near ${geo.name} port`, cluster: "broker" as const, serp: "local_map_pack" as const });
        }
        if (geo.type === "highway") {
            patterns.push({ q: `${term} along ${geo.name}`, cluster: "route" as const, serp: "voice_answer" as const });
        }

        for (const p of patterns) {
            queries.push({
                query: p.q,
                language: lang,
                intentCluster: p.cluster,
                geoEntity: geo.name,
                estimatedVolume: geo.type === "city" ? "medium" : "low",
                competitorCoverage: "none",
                serpTarget: p.serp,
            });
        }
    }

    return queries;
}

// ── Full Country Query Matrix Generator ──

export function generateFullCountryQueryMatrix(
    countryCode: string,
    lang: string,
    cities: string[],
    regions: string[],
    highways: string[],
    ports: string[]
): { totalQueries: number; byCluster: Record<string, number>; queries: SynthesizedQuery[] } {
    const all: SynthesizedQuery[] = [];

    // Driver stress (with top 3 cities)
    for (const city of cities.slice(0, 3)) {
        all.push(...synthesizeDriverStressQueries(lang, city, highways[0]));
    }

    // Broker precision
    all.push(...synthesizeBrokerPrecisionQueries(lang, cities.slice(0, 10)));

    // Route queries (top 5 × top 5 city pairs)
    all.push(...synthesizeRouteQueries(lang, cities.slice(0, 5), cities.slice(0, 5)));

    // Pricing queries
    all.push(...synthesizePricingQueries(lang, regions.slice(0, 5)));

    // Geo multiplier
    const geoEntities: GeoEntity[] = [
        ...cities.slice(0, 15).map(c => ({ name: c, type: "city" as const, countryCode })),
        ...ports.slice(0, 5).map(p => ({ name: p, type: "port" as const, countryCode })),
        ...highways.slice(0, 5).map(h => ({ name: h, type: "highway" as const, countryCode })),
    ];
    all.push(...geoIntentMultiplier(lang, geoEntities));

    // Deduplicate
    const seen = new Set<string>();
    const unique = all.filter(q => {
        const key = q.query.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const byCluster: Record<string, number> = {};
    for (const q of unique) {
        byCluster[q.intentCluster] = (byCluster[q.intentCluster] || 0) + 1;
    }

    return { totalQueries: unique.length, byCluster, queries: unique };
}

// ── Competitor Gap Scanner ──

export function identifyCompetitorGaps(
    ourQueries: SynthesizedQuery[]
): { uncoveredByCompetitors: number; percentage: number; topOpportunities: SynthesizedQuery[] } {
    const uncovered = ourQueries.filter(q => q.competitorCoverage === "none");
    return {
        uncoveredByCompetitors: uncovered.length,
        percentage: Math.round((uncovered.length / ourQueries.length) * 100),
        topOpportunities: uncovered
            .filter(q => q.estimatedVolume !== "micro")
            .slice(0, 20),
    };
}

// ── Learning Loop (query freshness) ──

export interface QueryPerformance {
    query: string;
    impressions: number;
    clicks: number;
    ctr: number;
    avgPosition: number;
    conversion: boolean;
}

export function prioritizeByPerformance(
    queries: SynthesizedQuery[],
    performance: QueryPerformance[]
): SynthesizedQuery[] {
    const performanceMap = new Map(performance.map(p => [p.query.toLowerCase(), p]));

    return queries.sort((a, b) => {
        const aPerf = performanceMap.get(a.query.toLowerCase());
        const bPerf = performanceMap.get(b.query.toLowerCase());

        // Converting queries first
        if (aPerf?.conversion && !bPerf?.conversion) return -1;
        if (!aPerf?.conversion && bPerf?.conversion) return 1;

        // High CTR next
        if (aPerf && bPerf) return bPerf.ctr - aPerf.ctr;

        // Untested queries get middle priority
        return 0;
    });
}

// ── Auto Expansion Rules ──

export function autoExpandNewPattern(
    basePattern: string,
    lang: string,
    geoEntities: GeoEntity[]
): SynthesizedQuery[] {
    const queries: SynthesizedQuery[] = [];

    for (const geo of geoEntities.slice(0, 25)) {
        queries.push({
            query: `${basePattern} ${geo.name}`,
            language: lang,
            intentCluster: "discovery",
            geoEntity: geo.name,
            estimatedVolume: "micro",
            competitorCoverage: "none",
            serpTarget: "conversational_ai",
        });
        queries.push({
            query: `${basePattern} near ${geo.name}`,
            language: lang,
            intentCluster: "emergency",
            geoEntity: geo.name,
            estimatedVolume: "micro",
            competitorCoverage: "none",
            serpTarget: "voice_answer",
        });
    }

    return queries;
}
