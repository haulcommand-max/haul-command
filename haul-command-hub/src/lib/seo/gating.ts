// Haul Command — Anti-Thin Page Gating Algorithm
// Decides whether a hub page should be indexed or noindexed + canonical'd
// Prevents Google thin-content penalties on programmatic pages

export type HubKind = 'country' | 'region' | 'city' | 'city_facet';

export interface HubMetrics {
    verifiedEscorts: number;
    totalEscorts: number;
    jobs90d: number;
    searches90d: number;
    uniqueContentScore: number;    // 0..1 (heuristic: 0 = pure template, 1 = fully unique)
    duplicateTemplateRatio: number; // 0..1 (1 = fully duplicated with other pages)
}

export type GateDecision =
    | { indexable: true; canonicalTo?: undefined; reason: string }
    | { indexable: false; canonicalTo: string; reason: string };

// ─── Configurable Thresholds ───
const THRESHOLDS = {
    // City pages
    city: {
        minVerified: 8,
        minTotal: 15,
        minJobs90d: 12,
        minSearches90d: 50,
    },
    // City facet pages (tightest gates)
    city_facet: {
        minVerified: 5,
        minJobs90d: 8,
        minSearches90d: 25,
    },
    // Content quality
    content: {
        minUniqueScore: 0.55,
        maxDuplicateRatio: 0.65,
    },
};

/**
 * Decide whether a hub page should be indexed by search engines.
 *
 * @param hubPath    — The URL path of this hub (e.g., "/directory/us/florida/miami/lead-car")
 * @param parentPath — The parent hub path for canonical fallback (e.g., "/directory/us/florida/miami")
 * @param metrics    — Supply, demand, and content quality metrics
 * @param kind       — The hub level (country, region, city, city_facet)
 *
 * @returns A GateDecision with indexable flag, optional canonical redirect, and reason
 */
export function decideIndexability(
    hubPath: string,
    parentPath: string,
    metrics: HubMetrics,
    kind: HubKind
): GateDecision {
    const contentOk = metrics.uniqueContentScore >= THRESHOLDS.content.minUniqueScore;
    const notDuplicate = metrics.duplicateTemplateRatio <= THRESHOLDS.content.maxDuplicateRatio;

    // ─── Country + Region: always index (they're top-level authority pages) ───
    if (kind === 'country' || kind === 'region') {
        if (contentOk && notDuplicate) {
            return { indexable: true, reason: `${kind} hub with sufficient unique content` };
        }
        // Still index but flag for content improvement
        return {
            indexable: true,
            reason: `${kind} hub indexed; needs content enrichment (score: ${metrics.uniqueContentScore.toFixed(2)}, dup: ${metrics.duplicateTemplateRatio.toFixed(2)})`,
        };
    }

    // ─── City: moderate gates ───
    if (kind === 'city') {
        const supplyOk =
            metrics.verifiedEscorts >= THRESHOLDS.city.minVerified ||
            metrics.totalEscorts >= THRESHOLDS.city.minTotal;
        const demandOk =
            metrics.jobs90d >= THRESHOLDS.city.minJobs90d ||
            metrics.searches90d >= THRESHOLDS.city.minSearches90d;

        if (supplyOk && demandOk && contentOk && notDuplicate) {
            return {
                indexable: true,
                reason: `city passes supply (${metrics.verifiedEscorts}v/${metrics.totalEscorts}t) + demand (${metrics.jobs90d}j/${metrics.searches90d}s) + content gates`,
            };
        }

        return {
            indexable: false,
            canonicalTo: parentPath,
            reason: `city gated: supply=${metrics.verifiedEscorts}v/${metrics.totalEscorts}t, demand=${metrics.jobs90d}j/${metrics.searches90d}s, content=${metrics.uniqueContentScore.toFixed(2)}, dup=${metrics.duplicateTemplateRatio.toFixed(2)}`,
        };
    }

    // ─── City Facet: strictest gates (these explode page count) ───
    if (kind === 'city_facet') {
        const facetSupplyOk = metrics.verifiedEscorts >= THRESHOLDS.city_facet.minVerified;
        const facetDemandOk =
            metrics.jobs90d >= THRESHOLDS.city_facet.minJobs90d ||
            metrics.searches90d >= THRESHOLDS.city_facet.minSearches90d;

        if (facetSupplyOk && facetDemandOk && contentOk && notDuplicate) {
            return {
                indexable: true,
                reason: `facet passes tight thresholds: supply=${metrics.verifiedEscorts}v, demand=${metrics.jobs90d}j/${metrics.searches90d}s`,
            };
        }

        // Canonical to city hub (strip the facet segment)
        const cityPath = hubPath.replace(/\/[^/]+$/, '');
        return {
            indexable: false,
            canonicalTo: cityPath,
            reason: `facet gated: supply=${metrics.verifiedEscorts}v, demand=${metrics.jobs90d}j/${metrics.searches90d}s, content=${metrics.uniqueContentScore.toFixed(2)}`,
        };
    }

    // ─── Fallback: gate it ───
    return {
        indexable: false,
        canonicalTo: parentPath,
        reason: 'fallback: unknown hub kind',
    };
}

// ─── Batch Assessment ───
// Run this nightly to audit all hub pages

export interface HubAuditEntry {
    hubPath: string;
    parentPath: string;
    kind: HubKind;
    metrics: HubMetrics;
    decision: GateDecision;
}

export function auditHubPages(
    hubs: { hubPath: string; parentPath: string; kind: HubKind; metrics: HubMetrics }[]
): HubAuditEntry[] {
    return hubs.map((hub) => ({
        ...hub,
        decision: decideIndexability(hub.hubPath, hub.parentPath, hub.metrics, hub.kind),
    }));
}

// ─── Summary Stats ───

export function auditSummary(entries: HubAuditEntry[]) {
    const total = entries.length;
    const indexable = entries.filter((e) => e.decision.indexable).length;
    const gated = total - indexable;

    const byKind = {
        country: { total: 0, indexable: 0 },
        region: { total: 0, indexable: 0 },
        city: { total: 0, indexable: 0 },
        city_facet: { total: 0, indexable: 0 },
    };

    for (const entry of entries) {
        byKind[entry.kind].total++;
        if (entry.decision.indexable) byKind[entry.kind].indexable++;
    }

    return { total, indexable, gated, byKind };
}
