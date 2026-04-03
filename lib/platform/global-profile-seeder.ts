// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL PROFILE SEEDING ENGINE — 100× Directory Density Machine
//
// Turns empty countries into alive directories by auto-generating claimable
// place profiles from structured global data sources. Runs as a cron pipeline.
//
// DATA INPUT SOURCES (per country):
//   1. OpenStreetMap Overpass API (truck stops, fuel, rest areas, weigh stations)
//   2. Port databases (World Port Index, port authority APIs)
//   3. Hotel/motel aggregators (Booking.com API, Google Places)
//   4. Industrial park registries (government open data)
//   5. HERE Maps POI API (supplemental)
//   6. User-submitted places (community contributions)
//   7. Web scraping pipeline (country-specific directories)
//
// OUTPUT: Unclaimed place records in `places` table ready for SEO + claim
//
// SCALE TARGET:
//   Gold countries:  2,000-5,000 places each
//   Blue countries:    500-2,000 places each
//   Silver countries:  200-1,000 places each
//   Slate countries:    50-200 places each
//   TOTAL: ~80,000-150,000 claimable places across 52 countries
// ═══════════════════════════════════════════════════════════════════════════════

import { COUNTRY_REGISTRY, type Tier, type CountryConfig } from '../config/country-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type PlaceCategory =
    | 'truck_stop'
    | 'motel'
    | 'hotel'
    | 'repair_shop'
    | 'tire_shop'
    | 'truck_parking'
    | 'scale_weigh_station_public'
    | 'washout'
    | 'fuel_station_diesel_heavy'
    | 'rest_area'
    | 'tow_rotator'
    | 'service_area'
    | 'freight_rest_stop'
    | 'border_facility'
    | 'port_adjacent_services'
    | 'industrial_park_services';

export interface SeedPlaceInput {
    name: string;
    placeType: PlaceCategory;
    countryCode: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
    address?: string;
    phone?: string;
    website?: string;
    amenities?: string[];
    services?: string[];
    dataSource: string;
    externalId?: string; // OSM node ID, Google Place ID, etc.
}

export interface SeedBatchResult {
    countryCode: string;
    totalProcessed: number;
    inserted: number;
    duplicates: number;
    errors: number;
    placeTypes: Record<string, number>;
    duration_ms: number;
}

export interface SeedPipelineConfig {
    countryCode: string;
    tier: Tier;
    sources: SeedSourceConfig[];
    targetPlaceCount: number;
    maxPerBatch: number;
    deduplicationRadius_km: number;
}

export interface SeedSourceConfig {
    sourceId: string;
    sourceType: 'osm' | 'port_db' | 'hotel_api' | 'gov_registry' | 'here_api' | 'google_places' | 'web_scrape' | 'manual';
    placeTypes: PlaceCategory[];
    priority: number;
    rateLimitPerMinute: number;
    apiKeyEnvVar?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED TARGETS BY TIER — How many places per country
// ═══════════════════════════════════════════════════════════════════════════════

const TIER_SEED_TARGETS: Record<Tier, {
    minPlaces: number;
    targetPlaces: number;
    maxPlaces: number;
    priorityTypes: PlaceCategory[];
}> = {
    gold: {
        minPlaces: 2000,
        targetPlaces: 5000,
        maxPlaces: 15000,
        priorityTypes: ['truck_stop', 'fuel_station_diesel_heavy', 'rest_area', 'repair_shop',
            'truck_parking', 'scale_weigh_station_public', 'tow_rotator', 'motel', 'hotel',
            'washout', 'port_adjacent_services', 'service_area', 'industrial_park_services'],
    },
    blue: {
        minPlaces: 500,
        targetPlaces: 2000,
        maxPlaces: 5000,
        priorityTypes: ['truck_stop', 'fuel_station_diesel_heavy', 'rest_area', 'service_area',
            'truck_parking', 'repair_shop', 'port_adjacent_services', 'hotel'],
    },
    silver: {
        minPlaces: 200,
        targetPlaces: 1000,
        maxPlaces: 3000,
        priorityTypes: ['truck_stop', 'fuel_station_diesel_heavy', 'rest_area', 'service_area',
            'port_adjacent_services', 'truck_parking'],
    },
    slate: {
        minPlaces: 50,
        targetPlaces: 200,
        maxPlaces: 500,
        priorityTypes: ['truck_stop', 'fuel_station_diesel_heavy', 'rest_area',
            'port_adjacent_services'],
    },
    copper: {
        minPlaces: 10,
        targetPlaces: 25,
        maxPlaces: 100,
        priorityTypes: ['truck_stop', 'fuel_station_diesel_heavy'],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// OSM OVERPASS QUERY TEMPLATES — Free, global, rich POI data
// ═══════════════════════════════════════════════════════════════════════════════

const OSM_QUERY_TEMPLATES: Record<PlaceCategory, string> = {
    truck_stop: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["amenity"="fuel"]["hgv"="yes"](area.searchArea);node["amenity"="truck_stop"](area.searchArea););out body;`,
    fuel_station_diesel_heavy: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["amenity"="fuel"]["fuel:diesel"="yes"](area.searchArea););out body;`,
    rest_area: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["highway"="rest_area"](area.searchArea);node["highway"="services"](area.searchArea););out body;`,
    truck_parking: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["amenity"="parking"]["hgv"="yes"](area.searchArea);node["amenity"="parking"]["parking"="truck"](area.searchArea););out body;`,
    scale_weigh_station_public: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["highway"="weigh_station"](area.searchArea););out body;`,
    repair_shop: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["shop"="truck_repair"](area.searchArea);node["shop"="car_repair"]["hgv"="yes"](area.searchArea););out body;`,
    motel: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["tourism"="motel"](area.searchArea););out body;`,
    hotel: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["tourism"="hotel"]["stars"~"[1-3]"](area.searchArea););out body;`,
    service_area: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["highway"="services"](area.searchArea););out body;`,
    tow_rotator: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["shop"="towing"](area.searchArea);node["amenity"="towing"](area.searchArea););out body;`,
    tire_shop: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["shop"="tyres"](area.searchArea););out body;`,
    washout: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["amenity"="truck_wash"](area.searchArea);node["amenity"="car_wash"]["hgv"="yes"](area.searchArea););out body;`,
    freight_rest_stop: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["highway"="rest_area"]["hgv"="yes"](area.searchArea););out body;`,
    border_facility: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["barrier"="border_control"](area.searchArea);node["office"="customs"](area.searchArea););out body;`,
    port_adjacent_services: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["landuse"="port"](area.searchArea);way["landuse"="port"](area.searchArea););out body;`,
    industrial_park_services: `[out:json][timeout:60];area["ISO3166-1"="{CC}"]->.searchArea;(node["landuse"="industrial"]["name"](area.searchArea););out body;`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SLUG GENERATOR — SEO-safe slugs for every country
// ═══════════════════════════════════════════════════════════════════════════════

export function generatePlaceSlug(name: string, city?: string, region?: string): string {
    const parts = [name, city, region].filter(Boolean).join('-');
    return parts
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
}

// ═══════════════════════════════════════════════════════════════════════════════
// META GENERATOR — Auto-generate SEO meta for seeded places
// ═══════════════════════════════════════════════════════════════════════════════

const PLACE_META_TEMPLATES: Record<PlaceCategory, {
    titleTemplate: string;
    descTemplate: string;
}> = {
    truck_stop: {
        titleTemplate: '{name} — Truck Stop near {city}, {region} | Haul Command',
        descTemplate: '{name} truck stop in {city}. Diesel fuel, parking, showers, and heavy-haul amenities. Hours, reviews, and directions on Haul Command.',
    },
    motel: {
        titleTemplate: '{name} — Trucker-Friendly Motel in {city} | Haul Command',
        descTemplate: '{name} motel near {city}. Truck parking, competitive rates, and driver amenities. Book via Haul Command.',
    },
    hotel: {
        titleTemplate: '{name} — Hotel near {city}, {region} | Haul Command',
        descTemplate: '{name} hotel in {city}. Convenient for heavy-haul drivers and escort operators. Rates and availability on Haul Command.',
    },
    repair_shop: {
        titleTemplate: '{name} — Heavy Truck Repair in {city} | Haul Command',
        descTemplate: '{name} specializes in heavy truck and trailer repair in {city}. Emergency service, diagnostics, and more. Find them on Haul Command.',
    },
    tire_shop: {
        titleTemplate: '{name} — Commercial Tire Shop in {city} | Haul Command',
        descTemplate: '{name} supplies and services commercial tires in {city}. Road service, alignments, retreads. Listed on Haul Command.',
    },
    truck_parking: {
        titleTemplate: '{name} — Truck Parking near {city} | Haul Command',
        descTemplate: 'Secure truck parking at {name} near {city}. Oversize capable, 24/7 access. Details on Haul Command.',
    },
    scale_weigh_station_public: {
        titleTemplate: '{name} — Public Weigh Station near {city} | Haul Command',
        descTemplate: 'Public weigh station at {name} near {city}. Operating hours, location, and compliance info on Haul Command.',
    },
    washout: {
        titleTemplate: '{name} — Truck Washout near {city} | Haul Command',
        descTemplate: '{name} truck wash facility near {city}. Full washout services for trailers. Find them on Haul Command.',
    },
    fuel_station_diesel_heavy: {
        titleTemplate: '{name} — Diesel Fuel Station near {city} | Haul Command',
        descTemplate: '{name} diesel fuel station near {city}. High-flow pumps, DEF, and truck-accessible. On Haul Command.',
    },
    rest_area: {
        titleTemplate: '{name} — Rest Area near {city} | Haul Command',
        descTemplate: 'Rest area at {name} near {city}. Truck parking, restrooms, and break facilities. Find more on Haul Command.',
    },
    tow_rotator: {
        titleTemplate: '{name} — Heavy Tow & Rotator Service in {city} | Haul Command',
        descTemplate: '{name} provides heavy tow and rotator recovery in {city}. 24/7 emergency response. Listed on Haul Command.',
    },
    service_area: {
        titleTemplate: '{name} — Service Area near {city} | Haul Command',
        descTemplate: 'Highway service area at {name} near {city}. Fuel, food, parking, and driver amenities. On Haul Command.',
    },
    freight_rest_stop: {
        titleTemplate: '{name} — Freight Rest Stop near {city} | Haul Command',
        descTemplate: '{name} freight rest stop near {city}. HGV parking, facilities, and overnight spots. Details on Haul Command.',
    },
    border_facility: {
        titleTemplate: '{name} — Border Crossing Facility near {city} | Haul Command',
        descTemplate: 'Border crossing at {name} near {city}. Customs, hours of operation, and oversize vehicle clearance info. On Haul Command.',
    },
    port_adjacent_services: {
        titleTemplate: '{name} — Port Services near {city} | Haul Command',
        descTemplate: 'Heavy-haul and escort services near {name} port in {city}. Staging, coordination, and logistics support. On Haul Command.',
    },
    industrial_park_services: {
        titleTemplate: '{name} — Industrial Park Services in {city} | Haul Command',
        descTemplate: 'Industrial park at {name} in {city}. Heavy-haul access, loading facilities, and logistics coordination. On Haul Command.',
    },
};

export function generatePlaceMeta(
    placeType: PlaceCategory,
    name: string,
    city?: string,
    region?: string,
): { metaTitle: string; metaDescription: string } {
    const template = PLACE_META_TEMPLATES[placeType] || PLACE_META_TEMPLATES.truck_stop;
    const fill = (s: string) => s
        .replace(/\{name\}/g, name || 'Unknown')
        .replace(/\{city\}/g, city || 'the area')
        .replace(/\{region\}/g, region || '');

    return {
        metaTitle: fill(template.titleTemplate).slice(0, 70),
        metaDescription: fill(template.descTemplate).slice(0, 160),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OSM DATA PARSER — Transform Overpass results to SeedPlaceInput
// ═══════════════════════════════════════════════════════════════════════════════

interface OSMElement {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    tags?: Record<string, string>;
}

export function parseOSMResponse(
    data: { elements: OSMElement[] },
    countryCode: string,
    placeType: PlaceCategory,
): SeedPlaceInput[] {
    const places: SeedPlaceInput[] = [];

    for (const el of data.elements || []) {
        if (!el.tags?.name && !el.tags?.['name:en']) continue;

        const name = el.tags?.['name:en'] || el.tags?.name || `${placeType} #${el.id}`;
        const amenities: string[] = [];

        // Extract amenities from OSM tags
        if (el.tags?.shower === 'yes') amenities.push('shower');
        if (el.tags?.wifi === 'yes' || el.tags?.internet_access === 'wlan') amenities.push('wifi');
        if (el.tags?.atm === 'yes') amenities.push('atm');
        if (el.tags?.['parking:hgv'] === 'yes' || el.tags?.hgv === 'yes') amenities.push('parking_oversize');
        if (el.tags?.restaurant === 'yes') amenities.push('restaurant');
        if (el.tags?.shop === 'yes') amenities.push('shop');
        if (el.tags?.laundry === 'yes') amenities.push('laundry');
        if (el.tags?.['fuel:diesel'] === 'yes') amenities.push('diesel');
        if (el.tags?.['fuel:adblue'] === 'yes') amenities.push('def');

        places.push({
            name,
            placeType,
            countryCode,
            region: el.tags?.['addr:state'] || el.tags?.['addr:province'] || el.tags?.['addr:county'],
            city: el.tags?.['addr:city'] || el.tags?.['addr:town'],
            lat: el.lat,
            lon: el.lon,
            address: [
                el.tags?.['addr:housenumber'],
                el.tags?.['addr:street'],
                el.tags?.['addr:city'],
            ].filter(Boolean).join(', ') || undefined,
            phone: el.tags?.phone || el.tags?.['contact:phone'],
            website: el.tags?.website || el.tags?.['contact:website'],
            amenities,
            dataSource: 'osm',
            externalId: `osm:${el.type}:${el.id}`,
        });
    }

    return places;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE ORCHESTRATOR — Coordinate seeding across all 52 countries
// ═══════════════════════════════════════════════════════════════════════════════

export function buildSeedPipeline(countryCode: string): SeedPipelineConfig {
    const country = COUNTRY_REGISTRY.find(c => c.code === countryCode);
    const tier: Tier = country?.tier ?? 'slate';
    const targets = TIER_SEED_TARGETS[tier];

    // Build source priority for this tier
    const sources: SeedSourceConfig[] = [];

    // OSM — always first, free, global coverage
    sources.push({
        sourceId: `osm-${countryCode}`,
        sourceType: 'osm',
        placeTypes: targets.priorityTypes,
        priority: 1,
        rateLimitPerMinute: 2, // OSM is rate-sensitive
    });

    // HERE Maps — supplemental for Gold/Blue
    if (tier === 'gold' || tier === 'blue') {
        sources.push({
            sourceId: `here-${countryCode}`,
            sourceType: 'here_api',
            placeTypes: ['truck_stop', 'fuel_station_diesel_heavy', 'rest_area', 'repair_shop'],
            priority: 2,
            rateLimitPerMinute: 30,
            apiKeyEnvVar: 'HERE_API_KEY',
        });
    }

    // Google Places — Gold countries only (costs money)
    if (tier === 'gold') {
        sources.push({
            sourceId: `google-${countryCode}`,
            sourceType: 'google_places',
            placeTypes: ['truck_stop', 'motel', 'hotel', 'repair_shop', 'tow_rotator'],
            priority: 3,
            rateLimitPerMinute: 60,
            apiKeyEnvVar: 'GOOGLE_PLACES_API_KEY',
        });
    }

    return {
        countryCode,
        tier,
        sources,
        targetPlaceCount: targets.targetPlaces,
        maxPerBatch: tier === 'gold' ? 500 : tier === 'blue' ? 200 : 100,
        deduplicationRadius_km: 0.15, // 150m dedup radius
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADGRID + TRUST SCORE CALCULATION — Score seeded profiles on insert
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateSeedTrustScore(place: SeedPlaceInput): number {
    let score = 10; // baseline seed score

    if (place.name && place.name.length > 5) score += 5;
    if (place.phone) score += 10;
    if (place.website) score += 10;
    if (place.address) score += 5;
    if (place.lat && place.lon) score += 10;
    if (place.city) score += 5;
    if (place.region) score += 5;
    if ((place.amenities?.length || 0) > 2) score += 5;
    if ((place.services?.length || 0) > 0) score += 5;
    if (place.dataSource === 'osm') score += 5; // OSM is generally reliable
    if (place.dataSource === 'google_places') score += 10;

    return Math.min(score, 75); // cap at 75 — only claimed profiles can go higher
}

export function calculateAdGridEligibility(place: SeedPlaceInput, trustScore: number): number {
    let score = trustScore * 0.5; // trust is 50% of adgrid score

    // Phone required for ad eligibility
    if (place.phone) score += 15;
    if (place.website) score += 10;
    if (place.lat && place.lon) score += 10;
    if ((place.amenities?.length || 0) > 3) score += 5;

    return Math.min(score, 60); // unclaimed max 60 — claimed can boost to 100
}

// ═══════════════════════════════════════════════════════════════════════════════
// SQL BATCH GENERATOR — Create INSERT statements for Supabase
// ═══════════════════════════════════════════════════════════════════════════════

export function generateInsertSQL(places: SeedPlaceInput[]): string {
    if (places.length === 0) return '';

    const rows = places.map(place => {
        const slug = generatePlaceSlug(place.name, place.city, place.region);
        const meta = generatePlaceMeta(place.placeType, place.name, place.city, place.region);
        const trustScore = calculateSeedTrustScore(place);
        const adgridScore = calculateAdGridEligibility(place, trustScore);

        const esc = (s?: string) => s ? `'${s.replace(/'/g, "''")}'` : 'NULL';
        const arrJson = (arr?: string[]) => arr?.length ? `'${JSON.stringify(arr)}'::jsonb` : "'[]'::jsonb";

        return `(
            '${place.placeType}',
            ${esc(place.name)},
            '${place.countryCode}',
            ${esc(place.region)},
            ${esc(place.city)},
            ${place.lat || 'NULL'},
            ${place.lon || 'NULL'},
            ${esc(place.address)},
            ${esc(place.phone)},
            ${esc(place.website)},
            ${arrJson(place.amenities)},
            ${arrJson(place.services)},
            '${place.dataSource}',
            ${esc(slug)},
            'unclaimed',
            'unverified',
            ${trustScore},
            ${adgridScore},
            ${esc(meta.metaTitle)},
            ${esc(meta.metaDescription)}
        )`;
    });

    return `INSERT INTO public.places (
        place_type, name, country_code, region, city,
        lat, lon, address, phone, website,
        amenities_json, services_json, data_source, slug,
        claim_status, verification_status,
        trust_score_seed, adgrid_eligibility_score,
        meta_title, meta_description
    ) VALUES
    ${rows.join(',\n')}
    ON CONFLICT (country_code, slug) DO NOTHING;`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED PROGRESS TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

export interface SeedProgress {
    countryCode: string;
    tier: Tier;
    countryName: string;
    currentCount: number;
    targetCount: number;
    percentComplete: number;
    byType: Record<string, number>;
    lastSeedRun?: string;
    status: 'not_started' | 'in_progress' | 'target_reached' | 'exceeded';
}

export function computeSeedProgress(
    countryCode: string,
    currentCounts: Record<string, number>,
): SeedProgress {
    const country = COUNTRY_REGISTRY.find(c => c.code === countryCode);
    const tier = country?.tier ?? 'slate';
    const targets = TIER_SEED_TARGETS[tier];
    const total = Object.values(currentCounts).reduce((a, b) => a + b, 0);

    return {
        countryCode,
        tier,
        countryName: country?.name ?? countryCode,
        currentCount: total,
        targetCount: targets.targetPlaces,
        percentComplete: Math.round((total / targets.targetPlaces) * 100),
        byType: currentCounts,
        status: total === 0 ? 'not_started'
            : total >= targets.targetPlaces ? 'target_reached'
                : total >= targets.maxPlaces ? 'exceeded'
                    : 'in_progress',
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD: Full 52-country seed status
// ═══════════════════════════════════════════════════════════════════════════════

export function computeGlobalSeedDashboard(
    allCounts: Record<string, Record<string, number>>,
): {
    totalPlaces: number;
    totalCountries: number;
    countriesSeeded: number;
    countriesNotStarted: number;
    countriesAtTarget: number;
    byTier: Record<Tier, { countries: number; places: number; target: number; pct: number }>;
    countries: SeedProgress[];
    estimatedTimeToTarget_hours: number;
} {
    const countries: SeedProgress[] = [];
    let totalPlaces = 0;
    let countriesSeeded = 0;
    let countriesNotStarted = 0;
    let countriesAtTarget = 0;

    const byTier: Record<Tier, { countries: number; places: number; target: number; pct: number }> = {
        gold: { countries: 0, places: 0, target: 0, pct: 0 },
        blue: { countries: 0, places: 0, target: 0, pct: 0 },
        silver: { countries: 0, places: 0, target: 0, pct: 0 },
        slate: { countries: 0, places: 0, target: 0, pct: 0 },
        copper: { countries: 0, places: 0, target: 0, pct: 0 },
    };

    for (const country of COUNTRY_REGISTRY) {
        const counts = allCounts[country.code] || {};
        const progress = computeSeedProgress(country.code, counts);
        countries.push(progress);

        totalPlaces += progress.currentCount;
        byTier[progress.tier].countries++;
        byTier[progress.tier].places += progress.currentCount;
        byTier[progress.tier].target += progress.targetCount;

        if (progress.status === 'not_started') countriesNotStarted++;
        else if (progress.status === 'target_reached' || progress.status === 'exceeded') countriesAtTarget++;
        else countriesSeeded++;
    }

    for (const tier of Object.keys(byTier) as Tier[]) {
        byTier[tier].pct = byTier[tier].target > 0
            ? Math.round((byTier[tier].places / byTier[tier].target) * 100) : 0;
    }

    // Estimate: ~500 places/hour via OSM pipeline
    const targetTotal = Object.values(byTier).reduce((a, b) => a + b.target, 0);
    const remaining = Math.max(0, targetTotal - totalPlaces);
    const estimatedTimeToTarget_hours = Math.ceil(remaining / 500);

    return {
        totalPlaces,
        totalCountries: COUNTRY_REGISTRY.length,
        countriesSeeded: countriesSeeded + countriesAtTarget,
        countriesNotStarted,
        countriesAtTarget,
        byTier,
        countries: countries.sort((a, b) => b.percentComplete - a.percentComplete),
        estimatedTimeToTarget_hours,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERPASS API FETCHER — Fetch OSM data for a country + place type
// ═══════════════════════════════════════════════════════════════════════════════

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

export async function fetchOSMPlaces(
    countryCode: string,
    placeType: PlaceCategory,
): Promise<SeedPlaceInput[]> {
    const queryTemplate = OSM_QUERY_TEMPLATES[placeType];
    if (!queryTemplate) return [];

    const query = queryTemplate.replace(/\{CC\}/g, countryCode);

    try {
        const response = await fetch(OVERPASS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
            signal: AbortSignal.timeout(90000), // 90s timeout
        });

        if (!response.ok) {
            console.error(`[OSM] ${countryCode}/${placeType}: HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        return parseOSMResponse(data, countryCode, placeType);
    } catch (err) {
        console.error(`[OSM] ${countryCode}/${placeType}: Error`, err);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL COUNTRY SEED — Run all place types for one country
// ═══════════════════════════════════════════════════════════════════════════════

export async function seedCountry(
    countryCode: string,
    options: { dryRun?: boolean; maxPerType?: number } = {},
): Promise<SeedBatchResult> {
    const start = Date.now();
    const pipeline = buildSeedPipeline(countryCode);
    const allPlaces: SeedPlaceInput[] = [];
    const typeCounts: Record<string, number> = {};
    let errors = 0;

    const maxPerType = options.maxPerType || pipeline.maxPerBatch;

    for (const placeType of TIER_SEED_TARGETS[pipeline.tier].priorityTypes) {
        try {
            console.log(`[Seed] ${countryCode} → fetching ${placeType}...`);
            const places = await fetchOSMPlaces(countryCode, placeType);
            const limited = places.slice(0, maxPerType);
            allPlaces.push(...limited);
            typeCounts[placeType] = limited.length;

            // Rate limit: 2 requests/min for OSM
            await new Promise(resolve => setTimeout(resolve, 30000));
        } catch (err) {
            console.error(`[Seed] ${countryCode}/${placeType} error:`, err);
            errors++;
        }
    }

    if (options.dryRun) {
        console.log(`[Seed DRY RUN] ${countryCode}: ${allPlaces.length} places would be inserted`);
    }

    return {
        countryCode,
        totalProcessed: allPlaces.length,
        inserted: options.dryRun ? 0 : allPlaces.length,
        duplicates: 0, // dedup happens at DB level via ON CONFLICT
        errors,
        placeTypes: typeCounts,
        duration_ms: Date.now() - start,
    };
}
