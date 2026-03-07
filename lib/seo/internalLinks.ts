/**
 * Internal Link Engine — Demand-Responsive + Legacy Static Link Builder
 *
 * Two modes:
 * 1. getWeightedLinks() — signal-driven, geo-boosted, diversity-guarded
 * 2. buildInternalLinks() — legacy static builder (backward compat)
 */

import { createClient } from "@supabase/supabase-js";
import { applyDiversityGuard } from "@/lib/seo/diversity";

// ── Supabase admin client (server-side only) ──────────────────────────────────

const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// ══════════════════════════════════════════════════════════════════════════════
// DYNAMIC WEIGHTED LINKS (NEW)
// ══════════════════════════════════════════════════════════════════════════════

export type LinkTargetType =
    | "country" | "region" | "city" | "corridor" | "port" | "glossary" | "operator";

export interface GetWeightedLinksParams {
    fromPageType: string;
    toPageType: LinkTargetType;
    countryCode?: string;
    regionCode?: string;

    // Geo-aware inputs (optional)
    fromH3r6?: string;
    fromMetroClusterId?: string;

    limit?: number;

    // Diversity caps
    diversity?: {
        maxPerMetroCluster?: number;
        maxPerH3r6?: number;
    };
}

export interface WeightedLink {
    id: string;
    path: string;
    link_weight: number;
    demand_score: number;
    metro_cluster_id?: string | null;
    h3_r6?: string | null;
    region_code?: string | null;
    boosted_weight: number;
}

function computeGeoBoost(args: {
    baseWeight: number;
    fromRegion?: string;
    toRegion?: string | null;
    fromH3r6?: string;
    toH3r6?: string | null;
    fromMetro?: string;
    toMetro?: string | null;
}) {
    let w = args.baseWeight;

    // Same region gets a meaningful boost (helps locality and crawl relevance)
    if (args.fromRegion && args.toRegion && args.fromRegion === args.toRegion) {
        w *= 1.15;
    }

    // Same H3 cell (coarse) gets a boost for "nearby" pages
    if (args.fromH3r6 && args.toH3r6 && args.fromH3r6 === args.toH3r6) {
        w *= 1.12;
    }

    // Same metro cluster (when linking within a metro family) — small boost only
    if (args.fromMetro && args.toMetro && args.fromMetro === args.toMetro) {
        w *= 1.05;
    }

    return w;
}

/**
 * Core dynamic internal link resolver
 *
 * Pulls highest-weight pages within the same geo scope,
 * applies geo-aware boosting and diversity guards.
 */
export async function getWeightedLinks(params: GetWeightedLinksParams): Promise<WeightedLink[]> {
    const {
        toPageType,
        countryCode,
        regionCode,
        fromH3r6,
        fromMetroClusterId,
        limit = 12,
        diversity,
    } = params;

    let query = supabase
        .from("seo_pages")
        .select(`
      id,
      canonical_path,
      metro_cluster_id,
      h3_r6,
      region_code,
      link_weight_signals!inner (
        link_weight,
        demand_score
      )
    `)
        .eq("page_type", toPageType)
        .eq("is_indexable", true)
        .order("link_weight_signals.link_weight", { ascending: false })
        .limit(limit * 6); // overfetch to allow diversity filtering + boosting

    if (countryCode) query = query.eq("country_code", countryCode);
    if (regionCode) query = query.eq("region_code", regionCode);

    const { data, error } = await query;

    if (error || !data) {
        console.error("getWeightedLinks error:", error);
        return [];
    }

    const enriched: WeightedLink[] = data.map((row: any) => {
        const base = Number(row.link_weight_signals?.link_weight ?? 1);
        const boosted = computeGeoBoost({
            baseWeight: base,
            fromRegion: regionCode,
            toRegion: row.region_code,
            fromH3r6,
            toH3r6: row.h3_r6,
            fromMetro: fromMetroClusterId,
            toMetro: row.metro_cluster_id,
        });

        return {
            id: row.id,
            path: row.canonical_path,
            link_weight: base,
            demand_score: Number(row.link_weight_signals?.demand_score ?? 0),
            metro_cluster_id: row.metro_cluster_id,
            h3_r6: row.h3_r6,
            region_code: row.region_code,
            boosted_weight: boosted,
        };
    });

    // Re-sort by boosted weight (and demand as tie-break)
    enriched.sort((a, b) => {
        if (b.boosted_weight !== a.boosted_weight) return b.boosted_weight - a.boosted_weight;
        return b.demand_score - a.demand_score;
    });

    // Apply diversity guard
    const diverse = applyDiversityGuard(enriched, {
        maxPerMetroCluster: diversity?.maxPerMetroCluster ?? 2,
        maxPerH3r6: diversity?.maxPerH3r6 ?? 3,
    });

    return diverse.slice(0, limit);
}

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY STATIC LINK BUILDER (backward compat — do not remove)
// ══════════════════════════════════════════════════════════════════════════════

export interface InternalLinkSet {
    parentState: { href: string; label: string };
    nearbyCities: Array<{ href: string; label: string }>;
    corridors: Array<{ href: string; label: string }>;
    ctaLink: { href: string; label: string };
}

// Corridor name → slug mapping
export const CORRIDOR_SLUGS: Record<string, string> = {
    "I-75": "i-75-north-south",
    "I-10": "i-10-gulf-coast",
    "I-95": "i-95-atlantic",
    "I-40": "i-40-transcon",
    "I-20": "i-20-southeast",
    "I-285": "i-285-atlanta-perimeter",
};

export function buildInternalLinks(opts: {
    country: string;
    state: string;
    city: string;
    slug: string;
    nearbyCities: string[];
    corridors?: string[];
}): InternalLinkSet {
    const { country, state, city, slug, nearbyCities, corridors = [] } = opts;

    const parentState = {
        href: `/${country}/${state}`,
        label: `Pilot Car Services in ${state.toUpperCase()}`,
    };

    const nearbyCityLinks = nearbyCities.slice(0, 4).map((c) => ({
        href: `/${country}/${state}/${c}`,
        label: `Escort Services near ${c.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}`,
    }));

    const corridorLinks = (corridors.length ? corridors : Object.keys(CORRIDOR_SLUGS).slice(0, 3)).map((name) => ({
        href: `/escort/corridor/${CORRIDOR_SLUGS[name] ?? name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        label: `${name} Corridor Escorts`,
    }));

    const ctaLink = {
        href: "/onboarding",
        label: `Get Matched Fast in ${city}`,
    };

    return { parentState, nearbyCities: nearbyCityLinks, corridors: corridorLinks, ctaLink };
}
