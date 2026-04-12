/**
 * Haul Command — Phase 3: Internal Linking Graph Engine
 * 
 * Deterministic link generation to prevent orphan pages, manage crawl depth,
 * and ensure PageRank flows rationally across the 25k+ page matrix.
 */
import { createClient } from "@supabase/supabase-js";

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

    // Initialize Supabase Client for backend data fetching
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Corridors
    const { data: corridors } = await supabase.rpc('get_nearest_corridors', { lat: coords.lat, lon: coords.lon, limit_val: 5 });
    if (corridors) {
        corridors.forEach((c: any) => links.push({
            href: `/rates/corridors/${c.corridor_id.toLowerCase()}`,
            anchorText: generateAnchorEntropy(`Rates for ${c.corridor_id}`, 'corridor'),
            relationship: 'sibling',
            weight: Number(c.composite_weight) || 0.8
        }));
    }

    // 3. Nearby Operators
    const { data: operators } = await supabase.rpc('get_nearest_operators', { lat: coords.lat, lon: coords.lon, limit_val: 5 });
    if (operators) {
        operators.forEach((op: any) => links.push({
            href: `/directory/profile/${op.slug}`,
            anchorText: generateAnchorEntropy(op.display_name, 'operator'),
            relationship: 'nearby',
            weight: Number(op.composite_weight) || 0.7
        }));
    }

    // 4. Surfaces: Ports / Zones
    const { data: surfaces } = await supabase.rpc('get_nearest_surfaces', { lat: coords.lat, lon: coords.lon, limit_val: 3 });
    if (surfaces) {
        surfaces.forEach((s: any) => links.push({
            href: `/directory/poi/${s.surface_id}`,
            anchorText: `${s.surface_type === 'port' ? 'Port ' : ''}${s.surface_name} Freight`,
            relationship: 'authority',
            weight: 0.6
        }));
    }

    // 5. Related/Nearby Cities
    const { data: cities } = await supabase.rpc('get_nearest_cities', { lat: coords.lat, lon: coords.lon, limit_val: 3 });
    if (cities) {
        cities.forEach((city: any) => {
            if (city.city_slug !== citySlug) {
                links.push({
                    href: `/${countryCode.toLowerCase()}/${city.city_slug}/pilot-car-services`,
                    anchorText: `Escort loads in ${city.city_name}`,
                    relationship: 'sibling',
                    weight: 0.5
                });
            }
        });
    }

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Operators on Route
    const { data: operators } = await supabase.rpc('get_operators_for_corridor', { target_corridor_id: corridorId, limit_val: 5 });
    if (operators) {
        operators.forEach((op: any) => links.push({
            href: `/directory/profile/${op.slug}`,
            anchorText: generateAnchorEntropy(op.display_name, 'operator'),
            relationship: 'nearby',
            weight: Number(op.trust_score) / 100 || 0.8
        }));
    }

    // 4. Connecting Corridors
    const { data: corridors } = await supabase.rpc('get_connecting_corridors', { target_corridor_id: corridorId, limit_val: 3 });
    if (corridors) {
        corridors.forEach((c: any) => links.push({
            href: `/rates/corridors/${c.corridor_id.toLowerCase()}`,
            anchorText: `Connects to ${c.corridor_id}`,
            relationship: 'sibling',
            weight: 0.8
        }));
    }

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
