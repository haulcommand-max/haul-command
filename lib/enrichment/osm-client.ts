/**
 * OSM Overpass Enrichment Client
 * 
 * Queries the Overpass API for oversize-load-relevant entities
 * within a bounding box. OSM is the primary source of truth
 * (free, open, no cost guardrails needed).
 * 
 * Strategy: osm_first_google_fallback
 */

import type { CandidatePOI } from './oers';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// ═══════════════════════════════════════════════════════════════
// OVERPASS QUERY BUILDER
// ═══════════════════════════════════════════════════════════════

interface BBox {
    south: number;
    west: number;
    north: number;
    east: number;
}

/**
 * Build a niche-focused Overpass query that targets:
 * 1. High-precision escort/heavy-haul tags
 * 2. Industrial/logistics proxies
 * 3. Logistics business tags
 * 4. Transport-related businesses by name
 */
function buildNicheOverpassQuery(bbox: BBox): string {
    const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;

    return `
[out:json][timeout:30];
(
  // HIGH-PRECISION: escort/heavy-haul tags
  node["escort"="yes"](${b});
  way["escort"="yes"](${b});
  node["cargo"="oversize"](${b});
  way["cargo"="oversize"](${b});
  node["heavy_transport"="yes"](${b});
  way["heavy_transport"="yes"](${b});

  // LOGISTICS BUSINESSES
  node["office"="logistics"](${b});
  way["office"="logistics"](${b});
  node["office"="freight"](${b});
  way["office"="freight"](${b});
  node["shop"="truck_parts"](${b});
  way["shop"="truck_parts"](${b});

  // INDUSTRIAL LOGISTICS
  node["industrial"="logistics"](${b});
  way["industrial"="logistics"](${b});
  node["industrial"="warehouse"](${b});
  way["industrial"="warehouse"](${b});
  node["industrial"="port"](${b});
  way["industrial"="port"](${b});

  // CRANES AND HEAVY LIFT
  node["man_made"="crane"](${b});
  way["man_made"="crane"](${b});
  node["craft"="metal_construction"](${b});
  way["craft"="metal_construction"](${b});

  // NAME-BASED: Pilot car, escort, heavy haul in name
  node["name"~"pilot.car|escort|heavy.haul|oversize|wide.load",i](${b});
  way["name"~"pilot.car|escort|heavy.haul|oversize|wide.load",i](${b});
  node["name"~"specialized.transport|super.load|abnormal.load",i](${b});
  way["name"~"specialized.transport|super.load|abnormal.load",i](${b});
);
out center;
`.trim();
}

// ═══════════════════════════════════════════════════════════════
// FETCH + PARSE
// ═══════════════════════════════════════════════════════════════

interface OverpassElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

export async function queryOSMForNiche(bbox: BBox): Promise<CandidatePOI[]> {
    const query = buildNicheOverpassQuery(bbox);

    const response = await fetch(OVERPASS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const elements: OverpassElement[] = data.elements || [];

    return elements
        .flatMap(el => {
            const lat = el.lat ?? el.center?.lat;
            const lon = el.lon ?? el.center?.lon;
            if (!lat || !lon) return [];

            const tags = el.tags || {};
            const name = tags.name || tags['name:en'] || '';
            if (!name) return []; // Skip unnamed entities

            // Extract business info from tags
            const categories: string[] = [];
            if (tags.office) categories.push(`office_${tags.office}`);
            if (tags.shop) categories.push(`shop_${tags.shop}`);
            if (tags.industrial) categories.push(`industrial_${tags.industrial}`);
            if (tags.craft) categories.push(`craft_${tags.craft}`);
            if (tags.man_made) categories.push(`man_made_${tags.man_made}`);
            if (tags.landuse) categories.push(`landuse_${tags.landuse}`);

            const poi: CandidatePOI = {
                id: `osm_${el.type}_${el.id}`,
                name,
                categories,
                tags,
                lat,
                lon,
                source: 'osm' as const,
                phone: tags.phone || tags['contact:phone'] || undefined,
                website: tags.website || tags['contact:website'] || undefined,
                address: buildAddress(tags),
                city: tags['addr:city'] || undefined,
                region: tags['addr:state'] || undefined,
                countryCode: undefined, // Will be enriched later
            };
            return [poi];
        });
}

function buildAddress(tags: Record<string, string>): string | undefined {
    const parts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:city'],
        tags['addr:state'],
        tags['addr:postcode'],
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : undefined;
}

// ═══════════════════════════════════════════════════════════════
// CORRIDOR-BASED BBOX GENERATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a bounding box around a corridor waypoint
 * with a configurable radius in km
 */
export function corridorPointToBBox(lat: number, lon: number, radiusKm: number = 25): BBox {
    // Approximate degrees per km at given latitude
    const latDeg = radiusKm / 111.32;
    const lonDeg = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));

    return {
        south: lat - latDeg,
        west: lon - lonDeg,
        north: lat + latDeg,
        east: lon + lonDeg,
    };
}

/**
 * Generate bounding boxes along a corridor's major cities
 */
export function generateCorridorBBoxes(
    waypoints: Array<{ lat: number; lon: number }>,
    radiusKm: number = 25,
): BBox[] {
    return waypoints.map(wp => corridorPointToBBox(wp.lat, wp.lon, radiusKm));
}
