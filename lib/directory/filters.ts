// lib/directory/filters.ts
// ══════════════════════════════════════════════════════════════
// Haul Command Directory — Advanced Filter Schema
// Stolen from: GeoDirectory Advanced Search add-on patterns
// Applied to: pilot car / oversize load niche
// ══════════════════════════════════════════════════════════════

export type SortKey = "trust" | "response" | "on_time" | "recent" | "featured";

export interface DirectoryFilters {
    search: string;
    availableOnly: boolean;
    sort: SortKey;
    // Advanced filters
    equipment: EquipmentType[];
    certifiedStates: string[];
    serviceType: ServiceType[];
    superloadQualified: boolean;
    highPoleOnly: boolean;
    featured: boolean;
    // Verification status (matching OSOW Haven filters)
    verifiedOnly: boolean;
    witpacCertified: boolean;
    cevoCertified: boolean;
    backgroundChecked: boolean;
    insuranceVerified: boolean;
    nightCertified: boolean;
    multiStateCertified: boolean;
}

export type EquipmentType =
    | "high_pole"
    | "cb_radio"
    | "radar_gun"
    | "flags_signs"
    | "rotating_beacon"
    | "two_way_radio"
    | "amber_lights"
    | "witpac_cert"
    | "cevo_cert"
    | "background_checked"
    | "insurance_verified";

export type ServiceType = "lead" | "chase" | "both" | "steerman" | "emergency_response" | "route_survey";

export const EQUIPMENT_OPTIONS: { key: EquipmentType; label: string; icon: string }[] = [
    { key: "high_pole", label: "High Pole", icon: "📡" },
    { key: "cb_radio", label: "CB Radio", icon: "📻" },
    { key: "radar_gun", label: "Radar Gun", icon: "🔫" },
    { key: "flags_signs", label: "Flags & Signs", icon: "🚩" },
    { key: "rotating_beacon", label: "Rotating Beacon", icon: "🔆" },
    { key: "two_way_radio", label: "2-Way Radio", icon: "📡" },
    { key: "amber_lights", label: "Amber Lights", icon: "⚠️" },
];

export const SERVICE_TYPE_OPTIONS: { key: ServiceType; label: string; icon?: string }[] = [
    { key: "lead", label: "Lead Car", icon: "🚗" },
    { key: "chase", label: "Chase Car", icon: "🚙" },
    { key: "both", label: "Lead + Chase", icon: "🚗🚙" },
    { key: "steerman", label: "Steerman", icon: "🏗️" },
    { key: "route_survey", label: "Route Survey", icon: "🗺️" },
    { key: "emergency_response", label: "Emergency Response", icon: "🚨" },
];

export const VERIFICATION_OPTIONS: { key: keyof Pick<DirectoryFilters, 'witpacCertified' | 'cevoCertified' | 'backgroundChecked' | 'insuranceVerified'>; label: string; color: string }[] = [
    { key: "witpacCertified", label: "WITPAC Certified", color: "#10b981" },
    { key: "cevoCertified", label: "CEVO Certified", color: "#3b82f6" },
    { key: "backgroundChecked", label: "Background Checked", color: "#8b5cf6" },
    { key: "insuranceVerified", label: "Insurance Verified", color: "#f59e0b" },
];

// US States + Canadian provinces for certified-state filter
export const US_STATES: { code: string; name: string }[] = [
    { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
    { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
    { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" }, { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" }, { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
    { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
    { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" }, { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

// Popular interstate corridors for route-pair filtering
export const CORRIDORS = [
    "I-10", "I-20", "I-35", "I-40", "I-45", "I-65", "I-70",
    "I-75", "I-80", "I-90", "I-95", "US-287", "US-60",
];

export const DEFAULT_FILTERS: DirectoryFilters = {
    search: "",
    availableOnly: false,
    sort: "featured",
    equipment: [],
    certifiedStates: [],
    serviceType: [],
    superloadQualified: false,
    highPoleOnly: false,
    featured: false,
    // Verification defaults
    verifiedOnly: false,
    witpacCertified: false,
    cevoCertified: false,
    backgroundChecked: false,
    insuranceVerified: false,
    nightCertified: false,
    multiStateCertified: false,
};

/** Count how many advanced filters are active */
export function countActiveAdvancedFilters(f: DirectoryFilters): number {
    let n = 0;
    if (f.equipment.length > 0) n++;
    if (f.certifiedStates.length > 0) n++;
    if (f.serviceType.length > 0) n++;
    if (f.superloadQualified) n++;
    if (f.highPoleOnly) n++;
    if (f.verifiedOnly) n++;
    if (f.witpacCertified) n++;
    if (f.cevoCertified) n++;
    if (f.backgroundChecked) n++;
    if (f.insuranceVerified) n++;
    if (f.nightCertified) n++;
    if (f.multiStateCertified) n++;
    return n;
}

/** Apply all filters to an escort array */
export function applyFilters(escorts: any[], f: DirectoryFilters): any[] {
    let result = escorts;

    // Featured first
    if (f.featured) {
        result = result.filter(e => !!e.featured);
    }

    // Available now
    if (f.availableOnly) {
        result = result.filter(e =>
            e.availability_status === "available" ||
            (e.availability_status !== "offline" && e.availability_status !== "busy")
        );
    }

    // Text search
    if (f.search.trim().length > 0) {
        const q = f.search.toLowerCase();
        result = result.filter(e =>
            (e.company_name ?? "").toLowerCase().includes(q) ||
            (e.home_base_city ?? "").toLowerCase().includes(q) ||
            (e.home_base_state ?? "").toLowerCase().includes(q) ||
            (e.vehicle_type ?? "").toLowerCase().includes(q) ||
            (e.primary_corridors ?? []).some((c: string) => c.toLowerCase().includes(q)) ||
            (e.certified_states ?? []).some((s: string) => s.toLowerCase().includes(q))
        );
    }

    // Equipment filter
    if (f.equipment.length > 0) {
        result = result.filter(e => {
            const eq: string[] = e.equipment_types ?? [];
            return f.equipment.every(required => eq.includes(required));
        });
    }

    // Certified states filter
    if (f.certifiedStates.length > 0) {
        result = result.filter(e => {
            const states: string[] = e.certified_states ?? [e.home_base_state].filter(Boolean);
            return f.certifiedStates.some(s => states.includes(s));
        });
    }

    // Service type filter
    if (f.serviceType.length > 0) {
        result = result.filter(e => {
            const svc: string = e.service_type ?? "both";
            return f.serviceType.some(t =>
                t === svc || svc === "both"
            );
        });
    }

    // High pole only
    if (f.highPoleOnly) {
        result = result.filter(e =>
            (e.equipment_types ?? []).includes("high_pole") ||
            e.has_high_pole === true
        );
    }

    // Superload qualified
    if (f.superloadQualified) {
        result = result.filter(e => e.superload_qualified === true);
    }

    // Verification filters (OSOW Haven parity)
    if (f.verifiedOnly) {
        result = result.filter(e => e.is_verified === true || e.verified === true);
    }
    if (f.witpacCertified) {
        result = result.filter(e => e.witpac_certified === true);
    }
    if (f.cevoCertified) {
        result = result.filter(e => e.cevo_certified === true);
    }
    if (f.backgroundChecked) {
        result = result.filter(e => e.background_checked === true);
    }
    if (f.insuranceVerified) {
        result = result.filter(e => e.insurance_verified === true);
    }

    // New Attribute Filters
    if (f.nightCertified) {
        // Fallback: check equipment or explicit night_certified flag if added later
        result = result.filter(e => e.night_certified === true || (e.equipment_types ?? []).includes("rotating_beacon"));
    }
    if (f.multiStateCertified) {
        // True if they have more than 1 certified state OR if their service area explicitly allows it
        result = result.filter(e => (e.certified_states ?? []).length > 1);
    }

    return result;
}

/** Sort an escort array by sort key */
export function sortEscorts(escorts: any[], sort: SortKey): any[] {
    return [...escorts].sort((a, b) => {
        // Featured always floats to top
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;

        if (sort === "trust" || sort === "featured") {
            return (b.final_score ?? 0) - (a.final_score ?? 0);
        }
        if (sort === "response") {
            return (a.avg_response_seconds ?? 9999) - (b.avg_response_seconds ?? 9999);
        }
        if (sort === "on_time") {
            return (b.on_time_rate ?? 0) - (a.on_time_rate ?? 0);
        }
        if (sort === "recent") {
            return Date.parse(b.last_active_at ?? "0") - Date.parse(a.last_active_at ?? "0");
        }
        return 0;
    });
}
