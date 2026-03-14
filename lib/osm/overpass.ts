// ============================================================
// Haul Command — Overpass / OpenStreetMap Adapter
// Infrastructure harvesting: yards, truck stops, hotels,
// staging zones, escorts, service surfaces, weigh stations
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

const OVERPASS_API_URL = process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';

// ── Types ──

export interface OSMElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

export interface HarvestResult {
  category: string;
  elements: OSMElement[];
  timestamp: string;
  bbox: string;
}

// ── POI Category Queries ──
// Each query is tuned for heavy-haul operations

const POI_QUERIES: Record<string, (bbox: string) => string> = {
  truck_stops: (bbox) => `
    [out:json][timeout:60];
    (
      node["amenity"="fuel"]["hgv"="yes"](${bbox});
      node["amenity"="fuel"]["truck"="yes"](${bbox});
      way["amenity"="fuel"]["hgv"="yes"](${bbox});
      node["highway"="rest_area"](${bbox});
      node["highway"="services"](${bbox});
    );
    out center;
  `,
  weigh_stations: (bbox) => `
    [out:json][timeout:60];
    (
      node["amenity"="weighbridge"](${bbox});
      node["highway"="checkpoint"]["checkpoint"="weigh_station"](${bbox});
      way["amenity"="weighbridge"](${bbox});
    );
    out center;
  `,
  staging_zones: (bbox) => `
    [out:json][timeout:60];
    (
      node["landuse"="industrial"]["name"~"staging|yard|lot|depot",i](${bbox});
      way["landuse"="industrial"]["name"~"staging|yard|lot|depot",i](${bbox});
      node["amenity"="parking"]["hgv"="yes"](${bbox});
      way["amenity"="parking"]["hgv"="yes"](${bbox});
    );
    out center;
  `,
  hotels: (bbox) => `
    [out:json][timeout:60];
    (
      node["tourism"="hotel"](${bbox});
      way["tourism"="hotel"](${bbox});
      node["tourism"="motel"](${bbox});
      way["tourism"="motel"](${bbox});
    );
    out center;
  `,
  low_bridges: (bbox) => `
    [out:json][timeout:60];
    (
      way["bridge"="yes"]["maxheight"](${bbox});
      node["barrier"="height_restrictor"](${bbox});
      way["maxheight"](${bbox});
    );
    out center;
  `,
  repair_shops: (bbox) => `
    [out:json][timeout:60];
    (
      node["shop"="car_repair"]["hgv"~"yes|designated",i](${bbox});
      node["shop"="truck_repair"](${bbox});
      way["shop"="car_repair"]["hgv"~"yes|designated",i](${bbox});
      node["craft"="mechanic"]["hgv"="yes"](${bbox});
    );
    out center;
  `,
  escort_parking: (bbox) => `
    [out:json][timeout:60];
    (
      node["amenity"="parking"]["access"~"permit|private"](${bbox});
      way["amenity"="parking"]["hgv"="designated"](${bbox});
    );
    out center;
  `,
  ports: (bbox) => `
    [out:json][timeout:60];
    (
      node["harbour"="yes"](${bbox});
      way["harbour"="yes"](${bbox});
      node["landuse"="port"](${bbox});
      way["landuse"="port"](${bbox});
      node["industrial"="port"](${bbox});
      way["industrial"="port"](${bbox});
    );
    out center;
  `,
  rail_yards: (bbox) => `
    [out:json][timeout:60];
    (
      node["landuse"="railway"](${bbox});
      way["landuse"="railway"](${bbox});
      node["railway"="yard"](${bbox});
      way["railway"="yard"](${bbox});
    );
    out center;
  `,
};

export type POICategory = keyof typeof POI_QUERIES;

// ── Core Query Engine ──

/**
 * Run a raw Overpass QL query.
 */
export async function queryOverpass(query: string): Promise<OSMElement[]> {
  if (!isEnabled('OVERPASS_OSM')) return [];

  const res = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query.trim())}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Overpass] Query failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.elements || [];
}

/**
 * Harvest POIs by category within a bounding box.
 * @param category One of the predefined POI categories
 * @param bbox Bounding box as "south,west,north,east"
 */
export async function harvestPOIs(
  category: POICategory,
  bbox: string
): Promise<HarvestResult> {
  const queryBuilder = POI_QUERIES[category];
  if (!queryBuilder) {
    throw new Error(`[Overpass] Unknown category: ${category}`);
  }

  const elements = await queryOverpass(queryBuilder(bbox));

  return {
    category,
    elements,
    timestamp: new Date().toISOString(),
    bbox,
  };
}

/**
 * Harvest ALL categories for a bounding box.
 * Runs sequentially to respect Overpass rate limits.
 */
export async function harvestAllPOIs(bbox: string): Promise<HarvestResult[]> {
  const results: HarvestResult[] = [];
  for (const category of Object.keys(POI_QUERIES) as POICategory[]) {
    try {
      const result = await harvestPOIs(category, bbox);
      results.push(result);
      // Rate limit: 1 second between requests
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`[Overpass] Failed to harvest ${category}:`, err);
    }
  }
  return results;
}

/**
 * Get the available POI categories.
 */
export function getCategories(): POICategory[] {
  return Object.keys(POI_QUERIES) as POICategory[];
}

/**
 * Extract a usable lat/lng from an OSM element.
 */
export function getCoordinates(el: OSMElement): { lat: number; lng: number } | null {
  if (el.lat && el.lon) return { lat: el.lat, lng: el.lon };
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

/**
 * Extract a human-readable name from an OSM element.
 */
export function getName(el: OSMElement): string {
  return el.tags?.name || el.tags?.['name:en'] || el.tags?.operator || `OSM ${el.type} ${el.id}`;
}

/**
 * Convert OSM elements to a flat ingest-ready format.
 */
export function toIngestRecords(category: string, elements: OSMElement[]) {
  return elements
    .map(el => {
      const coords = getCoordinates(el);
      if (!coords) return null;
      return {
        osm_id: `${el.type}/${el.id}`,
        name: getName(el),
        category,
        lat: coords.lat,
        lng: coords.lng,
        tags: el.tags,
        source: 'overpass_osm',
        harvested_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);
}
