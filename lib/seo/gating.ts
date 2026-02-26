// lib/seo/gating.ts
// ══════════════════════════════════════════════════════════════
// Anti-thin Page Gating Algorithm — Haul Command
//
// Goal: expand long-tail directory URLs without creating
// programmatic junk that gets penalized by Google.
//
// Called from:
//   1. generateMetadata() in each hub route — sets robots meta + canonical
//   2. Nightly cron job — flags hubs that flipped state
//   3. Admin SEO Control panel — shows override status
//
// Decision: index/noindex + canonical target + reason string.
//
// Tune MIN_* thresholds to match your real inventory.
// ══════════════════════════════════════════════════════════════

export type HubKind = "country" | "region" | "city" | "city_facet";

export interface HubMetrics {
    verifiedEscorts: number;
    totalEscorts: number;
    jobs90d: number;
    searches90d: number;
    /** 0..1 — heuristic: does this page have genuinely unique content? */
    uniqueContentScore: number;
    /** 0..1 — 1 = fully copy-paste template, no differentiation */
    duplicateTemplateRatio: number;
}

export type GateDecision =
    | { indexable: true; canonicalTo?: string; reason: string }
    | { indexable: false; canonicalTo: string; reason: string };

// ── Thresholds ────────────────────────────────────────────────
const T = {
    MIN_VERIFIED_CITY: 8,
    MIN_TOTAL_CITY: 15,
    MIN_JOBS_90D_CITY: 12,
    MIN_SEARCHES_CITY: 50,

    MIN_VERIFIED_FACET: 5,
    MIN_JOBS_90D_FACET: 8,
    MIN_SEARCHES_FACET: 25,

    CONTENT_MIN_SCORE: 0.55,
    DUPLICATE_MAX_RATIO: 0.65,
} as const;

export function decideIndexability(
    hubPath: string,
    parentPath: string,
    m: HubMetrics,
    kind: HubKind,
): GateDecision {
    const contentOk = m.uniqueContentScore >= T.CONTENT_MIN_SCORE;
    const notDuplicate = m.duplicateTemplateRatio <= T.DUPLICATE_MAX_RATIO;

    // Country + region hubs: almost always indexable — just need real content
    if (kind === "country" || kind === "region") {
        if (contentOk && notDuplicate) {
            return { indexable: true, reason: "top-level hub with unique content" };
        }
        // Still index but flag for content improvement
        return { indexable: true, reason: "top-level hub — improve content blocks" };
    }

    if (kind === "city") {
        const supplyOk =
            m.verifiedEscorts >= T.MIN_VERIFIED_CITY ||
            m.totalEscorts >= T.MIN_TOTAL_CITY;
        const demandOk =
            m.jobs90d >= T.MIN_JOBS_90D_CITY ||
            m.searches90d >= T.MIN_SEARCHES_CITY;

        if (supplyOk && demandOk && contentOk && notDuplicate) {
            return { indexable: true, reason: "city passes supply+demand+content check" };
        }
        return {
            indexable: false,
            canonicalTo: parentPath,
            reason: `city gated — ${!supplyOk ? "insufficient supply" : !demandOk ? "insufficient demand" : "thin content"}`,
        };
    }

    // city_facet is highest thin-page risk — tighter thresholds
    if (kind === "city_facet") {
        const facetSupplyOk = m.verifiedEscorts >= T.MIN_VERIFIED_FACET;
        const facetDemandOk =
            m.jobs90d >= T.MIN_JOBS_90D_FACET ||
            m.searches90d >= T.MIN_SEARCHES_FACET;

        if (facetSupplyOk && facetDemandOk && contentOk && notDuplicate) {
            return { indexable: true, reason: "facet passes tighter supply+demand+content" };
        }
        return {
            indexable: false,
            canonicalTo: hubPath.replace(/\/[^/]+$/, ""), // strip facet → city
            reason: `facet gated — ${!facetSupplyOk ? "insufficient supply" : !facetDemandOk ? "insufficient demand" : "thin content"}`,
        };
    }

    return { indexable: false, canonicalTo: parentPath, reason: "fallback gated" };
}

// ── Next.js metadata helper ───────────────────────────────────
// Usage in generateMetadata():
//   const decision = decideIndexability(hubPath, parentPath, metrics, kind);
//   return buildHubMetadata(hubPath, decision);

export function buildRobotsDirective(decision: GateDecision): {
    robots: { index: boolean; follow: boolean };
    alternates: { canonical: string };
} {
    return {
        robots: { index: decision.indexable, follow: true },
        alternates: {
            canonical: decision.indexable
                ? hubPathToAbsolute(decision.canonicalTo ?? "")  // self-canonical when indexable
                : hubPathToAbsolute(decision.canonicalTo),
        },
    };
}

function hubPathToAbsolute(path: string): string {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

// ── Facet config ──────────────────────────────────────────────
// The canonical list of supported city facets.
// Keep short — each facet = N indexable pages if gated open.

export const CITY_FACETS = {
    "lead-car": { group: "service", label: "Lead Car Escorts" },
    "chase-car": { group: "service", label: "Chase Car Escorts" },
    "height-pole": { group: "equipment", label: "High-Pole Escorts" },
    "night-moves": { group: "schedule", label: "Night-Move Escorts" },
    "available-now": { group: "availability", label: "Available Now" },
    "available-this-week": { group: "availability", label: "Available This Week" },
    "verified": { group: "trust", label: "Verified Escorts" },
    "top-rated": { group: "trust", label: "Top-Rated Escorts" },
} as const;

export type CityFacetSlug = keyof typeof CITY_FACETS;
export const SUPPORTED_FACET_SLUGS = Object.keys(CITY_FACETS) as CityFacetSlug[];
