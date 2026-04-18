/**
 * lib/google-places.ts
 *
 * Server-side Google Places (New) API wrapper.
 * GUARDRAILS:
 *   1. FieldMask is ALWAYS set — defaults to Basic SKU fields only.
 *   2. API key is read from server-only env (no NEXT_PUBLIC_ prefix).
 *   3. In-process LRU cache with 15-min TTL kills duplicate billing.
 *   4. No Google Maps JS SDK is loaded — this is REST-only.
 */

const BASE = "https://places.googleapis.com/v1";

// ── Basic SKU field mask (cheapest) ────────────────────────────────────────
export const BASIC_FIELDS =
  "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types";

// ── Extended field mask (Advanced SKU — use only on drill-down) ─────────────
export const EXTENDED_FIELDS =
  `${BASIC_FIELDS},places.regularOpeningHours,places.internationalPhoneNumber,places.websiteUri,places.businessStatus`;

// ── Types ────────────────────────────────────────────────────────────────────

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface ViewportBounds {
  sw: LatLng;
  ne: LatLng;
}

export interface HCPlace {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  rating?: number;
  types?: string[];
  phone?: string;
  website?: string;
  hours?: string[];
  mapsUrl: string; // constructed — no API key needed
}

export interface TextSearchOptions {
  query: string;
  bounds?: ViewportBounds;
  maxResults?: number;
  fieldMask?: string;
  /** For Search Along Route — provide ordered waypoints */
  routePolyline?: string;
}

export interface NearbySearchOptions {
  location: LatLng;
  radiusMeters?: number;
  includedTypes?: string[];
  maxResults?: number;
  fieldMask?: string;
}

// ── In-process LRU cache ──────────────────────────────────────────────────
// Keyed by hash of (fieldMask + body JSON). TTL: 15 minutes.

const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  data: HCPlace[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(prefix: string, payload: object): string {
  return `${prefix}:${JSON.stringify(payload)}`;
}

function getCached(key: string): HCPlace[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: HCPlace[]): void {
  // Evict oldest entry if cache grows beyond 200 entries
  if (cache.size >= 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ── API key guard ─────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set in environment.");
  return key;
}

// ── Response normalizer ───────────────────────────────────────────────────

function normalizePlaces(raw: any[]): HCPlace[] {
  return (raw || []).map((p: any): HCPlace => {
    const name = p.displayName?.text ?? "Unknown Place";
    const address = p.formattedAddress ?? "";
    const q = encodeURIComponent(`${name} ${address}`.trim());
    return {
      id: p.id ?? crypto.randomUUID(),
      name,
      address,
      location: {
        latitude: p.location?.latitude ?? 0,
        longitude: p.location?.longitude ?? 0,
      },
      rating: p.rating,
      types: p.types,
      phone: p.internationalPhoneNumber,
      website: p.websiteUri,
      hours: p.regularOpeningHours?.weekdayDescriptions,
      mapsUrl: `https://maps.google.com/?q=${q}`,
    };
  });
}

// ── Text Search ───────────────────────────────────────────────────────────

export async function textSearch(opts: TextSearchOptions): Promise<HCPlace[]> {
  const fieldMask = opts.fieldMask ?? BASIC_FIELDS;
  const body: Record<string, unknown> = {
    textQuery: opts.query,
    maxResultCount: Math.min(opts.maxResults ?? 10, 20),
  };

  if (opts.bounds) {
    body.locationBias = {
      rectangle: {
        low: opts.bounds.sw,
        high: opts.bounds.ne,
      },
    };
  }

  const key = cacheKey("text", { fieldMask, body });
  const cached = getCached(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
    // Server-side: no caching at the fetch layer — our own cache handles it
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places textSearch failed (${res.status}): ${err}`);
  }

  const json = await res.json();
  const result = normalizePlaces(json.places ?? []);
  setCached(key, result);
  return result;
}

// ── Nearby Search ─────────────────────────────────────────────────────────

export async function nearbySearch(opts: NearbySearchOptions): Promise<HCPlace[]> {
  const fieldMask = opts.fieldMask ?? BASIC_FIELDS;
  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: opts.location,
        radius: opts.radiusMeters ?? 50_000, // 50 km default
      },
    },
    maxResultCount: Math.min(opts.maxResults ?? 10, 20),
  };

  if (opts.includedTypes?.length) {
    body.includedTypes = opts.includedTypes;
  }

  const key = cacheKey("nearby", { fieldMask, body });
  const cached = getCached(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/places:searchNearby`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places nearbySearch failed (${res.status}): ${err}`);
  }

  const json = await res.json();
  const result = normalizePlaces(json.places ?? []);
  setCached(key, result);
  return result;
}

// ── HC Ask query types ────────────────────────────────────────────────────

/** Map natural-language query chips to includedTypes for nearbySearch */
export const CHIP_TYPE_MAP: Record<string, string[]> = {
  "Fuel Stops":       ["gas_station", "truck_stop"],
  "Hotels w/ Parking":["lodging", "motel"],
  "Weigh Stations":   ["transit_station"],
  "Rest Areas":       ["rest_stop"],
  "Truck Stops":      ["truck_stop"],
};
