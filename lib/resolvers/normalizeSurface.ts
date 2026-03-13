/**
 * Surface Normalizer
 * 
 * Converts raw hc_surfaces rows into a typed SurfaceViewModel
 * that the surface detail page can render without column mismatches.
 * 
 * Source: hc_surfaces (810K+ rows, OSM-sourced global surfaces)
 * 
 * Column mapping:
 *   hc_surfaces.surface_id    → vm.surface_id
 *   hc_surfaces.slug          → vm.slug
 *   hc_surfaces.name          → vm.name
 *   hc_surfaces.surface_type  → vm.category
 *   hc_surfaces.country_code  → vm.country_code
 *   hc_surfaces.latitude      → vm.lat
 *   hc_surfaces.longitude     → vm.lng
 *   hc_surfaces.brand         → vm.brand
 *   hc_surfaces.confidence    → vm.confidence
 *   hc_surfaces.quality_score → vm.quality_score
 *   hc_surfaces.osm_id        → vm.osm_id
 *   hc_surfaces.address       → vm.address
 *   hc_surfaces.region_code   → vm.region_code
 *   hc_surfaces.city          → vm.city
 *   hc_surfaces.updated_at    → vm.updated_at
 * 
 * Fields NOT in hc_surfaces (guarded out):
 *   anchor_type, corridor_geo_key, tags, status, source, claim_status
 */

export interface SurfaceViewModel {
    surface_id: string;
    slug: string;
    name: string;
    category: string;           // mapped from surface_type
    country_code: string;
    lat: number | null;
    lng: number | null;
    address: string | null;
    region_code: string | null;
    city: string | null;
    brand: string | null;
    confidence: number | null;
    quality_score: number | null;
    osm_id: number | null;
    updated_at: string;
    // Derived / display-only
    has_coordinates: boolean;
    confidence_label: "high" | "medium" | "low" | "unknown";
}

/**
 * Normalize a raw hc_surfaces DB row into a SurfaceViewModel.
 * All field access is null-safe — missing columns produce fallback values.
 */
export function normalizeSurface(row: any): SurfaceViewModel {
    const confidence = row.confidence != null ? Number(row.confidence) : null;

    return {
        surface_id: row.surface_id,
        slug: row.slug,
        name: row.name || "Unknown Surface",
        category: row.surface_type || "unknown",
        country_code: row.country_code || "XX",
        lat: row.latitude != null ? Number(row.latitude) : null,
        lng: row.longitude != null ? Number(row.longitude) : null,
        address: row.address ?? null,
        region_code: row.region_code ?? null,
        city: row.city ?? null,
        brand: row.brand ?? null,
        confidence,
        quality_score: row.quality_score != null ? Number(row.quality_score) : null,
        osm_id: row.osm_id != null ? Number(row.osm_id) : null,
        updated_at: row.updated_at || new Date().toISOString(),
        // Derived
        has_coordinates: row.latitude != null && row.longitude != null,
        confidence_label: confidence != null
            ? (confidence >= 0.8 ? "high" : confidence >= 0.5 ? "medium" : "low")
            : "unknown",
    };
}

/**
 * Select string for hc_surfaces queries.
 * Only request the columns we actually use.
 */
export const HC_SURFACES_SELECT =
    "surface_id,slug,name,surface_type,country_code,latitude,longitude,address,region_code,city,brand,confidence,quality_score,osm_id,updated_at";
