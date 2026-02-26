
/**
 * wazeUpdatesModel.ts
 * Minimal safe model for “Waze-style updates” without creating infinite SEO URLs.
 */

export type ReporterTier = "anonymous_untrusted" | "logged_in" | "verified_provider" | "elite_operator";

export type UpdateCategory =
    | "tight_bridge" | "restricted_route" | "curfew_hotspot" | "construction" | "low_clearance"
    | "weigh_station_wait" | "port_entry_delay" | "fuel_good" | "bathroom_clean" | "food_good"
    | "parking_safe" | "cell_signal_good";

export type WazeUpdate = {
    id: string;
    category: UpdateCategory;
    title: string;
    note?: string;
    geohash: string;         // store coarse location (privacy + safety)
    corridorSlug?: string;
    citySlug?: string;
    admin1Slug?: string;
    countrySlug: string;
    reporterTier: ReporterTier;
    confidence: number;      // computed server-side
    photoUrl?: string;
    createdAtISO: string;
    expiresAtISO: string;    // auto-expire (default 72h)
    status: "active" | "flagged" | "removed";
};

export function computeConfidence(tier: ReporterTier, hasPhoto: boolean): number {
    const base: Record<ReporterTier, number> = {
        anonymous_untrusted: 0.25,
        logged_in: 0.45,
        verified_provider: 0.70,
        elite_operator: 0.85
    };
    let c = base[tier];
    if (hasPhoto) c += 0.10;
    return Math.min(0.95, c);
}

export function shouldRequirePhoto(cat: UpdateCategory): boolean {
    return ["tight_bridge", "low_clearance", "restricted_route"].includes(cat);
}
