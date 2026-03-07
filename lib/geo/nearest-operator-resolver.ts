// ══════════════════════════════════════════════════════════════
// NEAREST OPERATOR RESOLVER
// Spec: HC_DOMINATION_PATCH_V1 Phase 7
// Purpose: Given any point on Earth, find K nearest escorts
//          ranked by distance + trust + availability
// ══════════════════════════════════════════════════════════════

export interface GeoPoint { lat: number; lng: number; }

export interface EscortOperator {
    id: string;
    name: string;
    location: GeoPoint;
    countryCode: string;
    city: string;
    trustScore: number;
    responseTimeMinutes: number;
    isAvailable: boolean;
    certifications: string[];
    operatingRadiusKm: number;
    completedJobs: number;
    rating: number;
    isPremium: boolean;
}

export interface NearestResult {
    operator: EscortOperator;
    distanceKm: number;
    arrivalMinutes: number;
    relevanceScore: number;
    withinRadius: boolean;
}

const R = 6371; // Earth radius km

export function haversine(a: GeoPoint, b: GeoPoint): number {
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export function relevanceScore(distKm: number, maxKm: number, op: EscortOperator): number {
    const dist = Math.max(0, 1 - distKm / maxKm) * 35;
    const trust = (op.trustScore / 100) * 25;
    const avail = op.isAvailable ? 20 : 4;
    const speed = Math.max(0, (100 - op.responseTimeMinutes / 2) / 100) * 15;
    const prem = op.isPremium ? 5 : 0;
    return Math.round(dist + trust + avail + speed + prem);
}

export function resolveNearest(
    origin: GeoPoint,
    operators: EscortOperator[],
    opts: { maxResults: number; maxKm: number; onlyAvailable: boolean; minTrust?: number; certs?: string[]; premiumFirst: boolean }
): NearestResult[] {
    let pool = operators.filter(op => {
        if (opts.onlyAvailable && !op.isAvailable) return false;
        if (opts.minTrust && op.trustScore < opts.minTrust) return false;
        if (opts.certs?.length && !opts.certs.every(c => op.certifications.includes(c))) return false;
        return true;
    });

    let results: NearestResult[] = pool.map(op => {
        const d = haversine(origin, op.location);
        return { operator: op, distanceKm: d, arrivalMinutes: Math.round(d / 80 * 60), relevanceScore: relevanceScore(d, opts.maxKm, op), withinRadius: d <= op.operatingRadiusKm };
    }).filter(r => r.distanceKm <= opts.maxKm);

    results.sort((a, b) => {
        if (opts.premiumFirst) {
            if (a.operator.isPremium !== b.operator.isPremium) return a.operator.isPremium ? -1 : 1;
        }
        return b.relevanceScore - a.relevanceScore;
    });

    return results.slice(0, opts.maxResults);
}

// Coverage gap detection
export interface CoverageGap {
    center: GeoPoint;
    radiusKm: number;
    escortCount: number;
    severity: "critical" | "high" | "medium" | "low";
    nearestKm: number;
}

export function detectGaps(gridPoints: GeoPoint[], operators: EscortOperator[], thresholdKm = 100): CoverageGap[] {
    return gridPoints.map(pt => {
        const nearby = operators.filter(op => haversine(pt, op.location) <= thresholdKm);
        const nearest = operators.reduce((min, op) => Math.min(min, haversine(pt, op.location)), Infinity);
        const severity: CoverageGap["severity"] = nearby.length === 0 ? "critical" : nearby.length <= 2 ? "high" : nearby.length <= 5 ? "medium" : "low";
        return { center: pt, radiusKm: thresholdKm, escortCount: nearby.length, severity, nearestKm: Math.round(nearest) };
    }).filter(g => g.severity === "critical" || g.severity === "high")
        .sort((a, b) => (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1));
}
