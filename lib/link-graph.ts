/**
 * Haul Command — Phase 3: Internal Linking Graph Engine
 * 
 * Deterministic link generation to prevent orphan pages, manage crawl depth,
 * and ensure PageRank flows rationally across the 25k+ page matrix.
 */

// Basic types for the graph builder
export type NodeEntity = 'country' | 'city' | 'corridor' | 'port' | 'zone' | 'operator' | 'industry';

export interface InternalLink {
    href: string;
    anchorText: string;
    relationship: 'parent' | 'child' | 'sibling' | 'nearby' | 'authority';
    weight: number;
}

/**
 * Returns deterministic links for a City Page hub
 * Rules: 3-5 corridors, 5 nearby operators, 3 related cities, 3 surfaces (ports/zones), 1 country hub
 */
export async function buildCityLinkGraph(countryCode: string, citySlug: string, coords: { lat: number, lon: number }): Promise<InternalLink[]> {
    const links: InternalLink[] = [];

    // 1. Parent Country Hub
    links.push({
        href: `/${countryCode.toLowerCase()}`,
        anchorText: `All ${countryCode.toUpperCase()} Escort Services`,
        relationship: 'parent',
        weight: 1.0
    });

    // 2. Corridors (Requires PostGIS nearest neighbor)
    // TODO: Implement Supabase RPC call "get_nearest_corridors(lat, lon, 5)"

    // 3. Nearby Operators (Requires PostGIS nearest neighbor)
    // TODO: Implement Supabase RPC call "get_nearest_operators(lat, lon, 5)"

    // 4. Surfaces: Ports / Zones (Requires PostGIS nearest neighbor)
    // TODO: Implement Supabase RPC call "get_nearest_surfaces(lat, lon, 3)"

    // 5. Related/Nearby Cities
    // TODO: Implement Supabase RPC call "get_nearest_cities(lat, lon, 3)"

    return links;
}

/**
 * Returns deterministic links for a Corridor Page
 * Rules: origin city, dest city, operators covering route, related corridors
 */
export async function buildCorridorLinkGraph(corridorId: string, originSlug: string, destSlug: string, countryCode: string): Promise<InternalLink[]> {
    const links: InternalLink[] = [];

    // 1. Origin City Hub
    links.push({
        href: `/${countryCode.toLowerCase()}/${originSlug}/pilot-car-services`,
        anchorText: `Escorts in ${formatSlug(originSlug)}`,
        relationship: 'parent',
        weight: 0.9
    });

    // 2. Destination City Hub
    links.push({
        href: `/${countryCode.toLowerCase()}/${destSlug}/pilot-car-services`,
        anchorText: `Escorts in ${formatSlug(destSlug)}`,
        relationship: 'parent',
        weight: 0.9
    });

    // 3. Operators on Route
    // TODO: Implement "get_operators_for_corridor(corridorId)"

    // 4. Connecting Corridors
    // TODO: Implement "get_connecting_corridors(corridorId)"

    return links;
}

/**
 * Utility: anchor text entropy generator (prevents Google over-optimization penalties)
 */
export function generateAnchorEntropy(baseText: string, nodeType: NodeEntity): string {
    const variations = [
        baseText,
        `${baseText} Pilot Cars`,
        `Hire Escorts in ${baseText}`,
        `${baseText} Heavy Haul Coverage`,
        `View ${baseText} Lanes`
    ];
    // Deterministic rotation based on string length to ensure consistency on rebuilds
    const index = baseText.length % variations.length;
    return variations[index] || baseText;
}

// Simple formatter for slugs to anchor text
function formatSlug(slug: string): string {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
