// =========================================================
// lib/vendor/helpers.ts
// Shared utility functions for vendor + placement UI
// Used by: upgrade page, admin placements, apply form,
//          placement detail, emergency nearby
// =========================================================

// ─────────────────────────────────────────────────────────
// Plan pricing
// ─────────────────────────────────────────────────────────
export function planPrice(tier: string): number {
    switch (tier) {
        case "verified": return 29;
        case "priority": return 99;
        case "command_partner": return 299;
        case "corridor_dominator": return 999;
        default: return 0;
    }
}

// ─────────────────────────────────────────────────────────
// Plan entitlements (what each tier unlocks)
// ─────────────────────────────────────────────────────────
export function planEntitlements(tier: string): Record<string, unknown> {
    switch (tier) {
        case "verified":
            return { verified_badge: true, emergency_surface: "standard", in_app_surface: "standard", corridor_boost: false, push_eligible: false };
        case "priority":
            return { verified_badge: true, emergency_surface: "top3", in_app_surface: "boosted", corridor_boost: false, push_eligible: false };
        case "command_partner":
            return { verified_badge: true, emergency_surface: "top1", in_app_surface: "featured", corridor_boost: true, push_eligible: true };
        case "corridor_dominator":
            return { verified_badge: true, emergency_surface: "top1", in_app_surface: "featured", corridor_boost: true, push_eligible: true, corridor_exclusive_eligible: true };
        default:
            return { verified_badge: false, emergency_surface: "none", in_app_surface: "limited", corridor_boost: false, push_eligible: false };
    }
}

// ─────────────────────────────────────────────────────────
// Derive regions from vendor_locations rows
// ─────────────────────────────────────────────────────────
export function regionsForVendor(locations: Array<{ region1?: string | null }>): string[] {
    return [...new Set(locations.map(l => l.region1).filter((r): r is string => Boolean(r)))];
}

// ─────────────────────────────────────────────────────────
// Date/timestamp helpers
// ─────────────────────────────────────────────────────────

/** Convert a date-input value ("2026-06-01") to ISO UTC timestamp string */
export function dateToTs(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Return current time as ISO UTC string */
export function nowTs(): string {
    return new Date().toISOString();
}

// ─────────────────────────────────────────────────────────
// Placements filter (client-side, used in admin list)
// ─────────────────────────────────────────────────────────
export type PlacementStatus = "active_now" | "upcoming" | "expired" | "all";

export function placementsFilter(
    placements: Array<{ start_at: string; end_at: string; placement_type?: string; region1?: string | null; corridor_name?: string | null }>,
    opts: {
        type?: string;
        region1?: string;
        corridor?: string;
        status?: PlacementStatus;
    }
): typeof placements {
    const now = Date.now();
    return placements.filter(p => {
        if (opts.type && opts.type !== "all" && p.placement_type !== opts.type) return false;
        if (opts.region1 && p.region1 !== opts.region1) return false;
        if (opts.corridor && p.corridor_name !== opts.corridor) return false;

        if (opts.status === "active_now") {
            return new Date(p.start_at).getTime() <= now && new Date(p.end_at).getTime() >= now;
        } else if (opts.status === "upcoming") {
            return new Date(p.start_at).getTime() > now;
        } else if (opts.status === "expired") {
            return new Date(p.end_at).getTime() < now;
        }
        return true;
    });
}

// ─────────────────────────────────────────────────────────
// Quick service map (for display in emergency results)
// ─────────────────────────────────────────────────────────
export function mapServicesQuick(
    services: Array<{ service_name?: string; service_category?: string }>
): string {
    return services
        .slice(0, 5)
        .map(s => s.service_name ?? s.service_category ?? "")
        .filter(Boolean)
        .join(", ");
}

// ─────────────────────────────────────────────────────────
// Variance percentage helper
// ─────────────────────────────────────────────────────────
export function variancePct(a: number, b: number): number {
    if (!b) return 0;
    return Math.round((Math.abs(a - b) / b) * 1000) / 10;
}
