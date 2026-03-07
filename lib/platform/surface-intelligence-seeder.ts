// ============================================================
// GLOBAL SURFACE INTELLIGENCE SEEDER
// Populates heavy_haul_surfaces across all 52 countries
// Principle: index_where_oversize_touches_pavement
// ============================================================

// ── Country Tier Map ──────────────────────────────────────────
const COUNTRY_TIERS: Record<string, { tier: string; name: string; priority: number }> = {
    // Tier A — Gold (10)
    US: { tier: 'A', name: 'United States', priority: 100 },
    CA: { tier: 'A', name: 'Canada', priority: 98 },
    AU: { tier: 'A', name: 'Australia', priority: 96 },
    GB: { tier: 'A', name: 'United Kingdom', priority: 95 },
    NZ: { tier: 'A', name: 'New Zealand', priority: 90 },
    ZA: { tier: 'A', name: 'South Africa', priority: 88 },
    DE: { tier: 'A', name: 'Germany', priority: 92 },
    NL: { tier: 'A', name: 'Netherlands', priority: 90 },
    AE: { tier: 'A', name: 'United Arab Emirates', priority: 87 },
    BR: { tier: 'A', name: 'Brazil', priority: 85 },
    // Tier B — Blue (15)
    IE: { tier: 'B', name: 'Ireland', priority: 82 },
    SE: { tier: 'B', name: 'Sweden', priority: 82 },
    NO: { tier: 'B', name: 'Norway', priority: 84 },
    DK: { tier: 'B', name: 'Denmark', priority: 80 },
    FI: { tier: 'B', name: 'Finland', priority: 80 },
    BE: { tier: 'B', name: 'Belgium', priority: 80 },
    AT: { tier: 'B', name: 'Austria', priority: 78 },
    CH: { tier: 'B', name: 'Switzerland', priority: 80 },
    ES: { tier: 'B', name: 'Spain', priority: 82 },
    FR: { tier: 'B', name: 'France', priority: 85 },
    IT: { tier: 'B', name: 'Italy', priority: 83 },
    PT: { tier: 'B', name: 'Portugal', priority: 76 },
    SA: { tier: 'B', name: 'Saudi Arabia', priority: 80 },
    QA: { tier: 'B', name: 'Qatar', priority: 78 },
    MX: { tier: 'B', name: 'Mexico', priority: 82 },
    // Tier C — Silver (24)
    PL: { tier: 'C', name: 'Poland', priority: 72 },
    CZ: { tier: 'C', name: 'Czech Republic', priority: 68 },
    SK: { tier: 'C', name: 'Slovakia', priority: 62 },
    HU: { tier: 'C', name: 'Hungary', priority: 64 },
    SI: { tier: 'C', name: 'Slovenia', priority: 60 },
    EE: { tier: 'C', name: 'Estonia', priority: 58 },
    LV: { tier: 'C', name: 'Latvia', priority: 58 },
    LT: { tier: 'C', name: 'Lithuania', priority: 58 },
    HR: { tier: 'C', name: 'Croatia', priority: 62 },
    RO: { tier: 'C', name: 'Romania', priority: 64 },
    BG: { tier: 'C', name: 'Bulgaria', priority: 60 },
    GR: { tier: 'C', name: 'Greece', priority: 66 },
    TR: { tier: 'C', name: 'Turkey', priority: 72 },
    KW: { tier: 'C', name: 'Kuwait', priority: 68 },
    OM: { tier: 'C', name: 'Oman', priority: 62 },
    BH: { tier: 'C', name: 'Bahrain', priority: 60 },
    SG: { tier: 'C', name: 'Singapore', priority: 70 },
    MY: { tier: 'C', name: 'Malaysia', priority: 66 },
    JP: { tier: 'C', name: 'Japan', priority: 74 },
    KR: { tier: 'C', name: 'South Korea', priority: 72 },
    CL: { tier: 'C', name: 'Chile', priority: 66 },
    AR: { tier: 'C', name: 'Argentina', priority: 64 },
    CO: { tier: 'C', name: 'Colombia', priority: 60 },
    PE: { tier: 'C', name: 'Peru', priority: 60 },
    // Tier D — Slate (3)
    UY: { tier: 'D', name: 'Uruguay', priority: 50 },
    PA: { tier: 'D', name: 'Panama', priority: 52 },
    CR: { tier: 'D', name: 'Costa Rica', priority: 48 },
};

// ── Surface Category Definitions with OSM Query Tags ──────────
interface SurfaceCategoryDef {
    category: string;
    tier: 'tier_1_hard_infra' | 'tier_2_flow' | 'tier_3_defensive';
    subtypes: string[];
    osmQuery: string; // Overpass QL filter body
    adgridSlots: number;
    adgridValue: string;
    urlPattern: string;
    demandSignal: string;
    // Countries where this surface has STRONG presence
    hotCountries: string[];
    // Seed targets per tier
    seedTargets: { A: number; B: number; C: number; D: number };
}

const SURFACE_CATEGORIES: SurfaceCategoryDef[] = [
    // ===== TIER 1: HARD INFRASTRUCTURE =====
    {
        category: 'seaport',
        tier: 'tier_1_hard_infra',
        subtypes: ['cargo_port', 'container_port', 'bulk_port'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["harbour:type"](area.searchArea);
        way["landuse"="port"](area.searchArea);
        relation["landuse"="port"](area.searchArea);
        node["seamark:type"="harbour"](area.searchArea);
      );
      out center 200;`,
        adgridSlots: 6,
        adgridValue: 'elite',
        urlPattern: '/port/{country}/{slug}',
        demandSignal: 'very_high',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'NL', 'DE', 'BR', 'AE', 'ZA', 'NZ', 'NO', 'SE', 'FR', 'ES', 'IT', 'JP', 'KR', 'SG', 'MY', 'TR', 'GR', 'HR', 'PT', 'BE', 'DK', 'FI', 'PL', 'EE', 'LV', 'LT', 'RO', 'BG', 'SA', 'QA', 'KW', 'OM', 'BH', 'MX', 'CO', 'CL', 'AR', 'PE', 'PA', 'CR', 'UY'],
        seedTargets: { A: 50, B: 25, C: 15, D: 5 },
    },

    {
        category: 'intermodal_rail_yard',
        tier: 'tier_1_hard_infra',
        subtypes: ['intermodal_terminal', 'freight_rail_yard', 'classification_yard', 'dry_port'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["railway"="yard"](area.searchArea);
        way["railway"="yard"](area.searchArea);
        node["landuse"="railway"]["service"="yard"](area.searchArea);
        way["landuse"="railway"](area.searchArea);
      );
      out center 300;`,
        adgridSlots: 5,
        adgridValue: 'elite',
        urlPattern: '/rail/{country}/{slug}',
        demandSignal: 'very_high',
        hotCountries: ['US', 'CA', 'AU', 'DE', 'FR', 'IT', 'PL', 'MX', 'BR', 'GB', 'ES', 'SE', 'NO', 'AT', 'CH', 'JP', 'KR', 'ZA', 'AR', 'CZ', 'SK', 'HU', 'RO', 'TR', 'BE', 'NL', 'DK', 'FI'],
        seedTargets: { A: 80, B: 40, C: 20, D: 5 },
    },

    {
        category: 'heavy_industrial_plant',
        tier: 'tier_1_hard_infra',
        subtypes: ['wind_turbine_factory', 'transformer_factory', 'steel_mill', 'heavy_equipment_plant', 'precast_concrete_plant', 'aerospace_plant'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["man_made"="works"](area.searchArea);
        way["man_made"="works"](area.searchArea);
        way["industrial"="steel_mill"](area.searchArea);
        way["industrial"="factory"](area.searchArea);
      );
      out center 500;`,
        adgridSlots: 6,
        adgridValue: 'elite',
        urlPattern: '/industrial/{country}/{subtype}/{slug}',
        demandSignal: 'very_high',
        hotCountries: ['US', 'CA', 'DE', 'GB', 'FR', 'IT', 'ES', 'JP', 'KR', 'BR', 'MX', 'SE', 'NO', 'FI', 'PL', 'CZ', 'TR', 'ZA', 'AU', 'AT', 'CH', 'NL', 'BE', 'HU', 'RO', 'SK', 'GR', 'AR', 'CL', 'CO', 'SA', 'AE', 'SG', 'MY'],
        seedTargets: { A: 100, B: 50, C: 25, D: 5 },
    },

    {
        category: 'modular_home_factory',
        tier: 'tier_1_hard_infra',
        subtypes: ['modular_housing_factory', 'mobile_home_plant', 'prefab_construction_yard', 'manufactured_home_plant'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["industrial"="factory"]["product"~"house|building|prefab"](area.searchArea);
        way["industrial"="factory"]["product"~"house|building|prefab"](area.searchArea);
        node["building"="manufacture"]["product"~"mobile_home|modular"](area.searchArea);
      );
      out center 100;`,
        adgridSlots: 6,
        adgridValue: 'elite',
        urlPattern: '/industrial/{country}/modular/{slug}',
        demandSignal: 'very_high',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'NZ', 'DE', 'NL', 'JP', 'SE', 'NO', 'FI', 'AT', 'CH', 'IE'],
        seedTargets: { A: 40, B: 15, C: 5, D: 2 },
    },

    {
        category: 'energy_infrastructure',
        tier: 'tier_1_hard_infra',
        subtypes: ['power_plant', 'substation', 'wind_farm', 'solar_farm', 'refinery', 'petrochemical_complex', 'nuclear_facility'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["power"="plant"](area.searchArea);
        way["power"="plant"](area.searchArea);
        node["power"="substation"]["voltage"~"[0-9]{6,}"](area.searchArea);
        way["power"="substation"]["voltage"~"[0-9]{6,}"](area.searchArea);
        way["power"="generator"]["generator:source"="wind"](area.searchArea);
        way["man_made"="petroleum_well"](area.searchArea);
        way["industrial"="refinery"](area.searchArea);
      );
      out center 500;`,
        adgridSlots: 6,
        adgridValue: 'elite',
        urlPattern: '/energy/{country}/{subtype}/{slug}',
        demandSignal: 'very_high',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'NO', 'AE', 'SA', 'QA', 'BR', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'DK', 'FI', 'MX', 'CO', 'AR', 'CL', 'TR', 'ZA', 'PL', 'CZ', 'RO', 'BG', 'GR', 'JP', 'KR', 'KW', 'OM', 'BH', 'MY', 'SG'],
        seedTargets: { A: 120, B: 60, C: 30, D: 10 },
    },

    {
        category: 'shipyard',
        tier: 'tier_1_hard_infra',
        subtypes: ['commercial_shipyard', 'naval_shipyard', 'drydock', 'ship_repair_yard'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["industrial"="shipyard"](area.searchArea);
        way["industrial"="shipyard"](area.searchArea);
        way["waterway"="boatyard"](area.searchArea);
        way["man_made"="dry_dock"](area.searchArea);
      );
      out center 100;`,
        adgridSlots: 6,
        adgridValue: 'elite',
        urlPattern: '/industrial/{country}/shipyard/{slug}',
        demandSignal: 'very_high',
        hotCountries: ['US', 'CA', 'GB', 'DE', 'NL', 'NO', 'KR', 'JP', 'IT', 'FR', 'ES', 'TR', 'BR', 'SG', 'AU', 'HR', 'GR', 'FI', 'SE', 'DK', 'PL'],
        seedTargets: { A: 30, B: 15, C: 8, D: 3 },
    },

    {
        category: 'military_base',
        tier: 'tier_1_hard_infra',
        subtypes: ['army_base', 'air_force_base', 'naval_base', 'defense_depot'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["military"="barracks"](area.searchArea);
        way["military"="barracks"](area.searchArea);
        way["landuse"="military"](area.searchArea);
        node["military"="airfield"](area.searchArea);
        way["military"="naval_base"](area.searchArea);
      );
      out center 200;`,
        adgridSlots: 5,
        adgridValue: 'high',
        urlPattern: '/infrastructure/{country}/defense/{slug}',
        demandSignal: 'high',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'IT', 'ES', 'NO', 'DK', 'NL', 'BE', 'PL', 'TR', 'SA', 'AE', 'QA', 'KW', 'JP', 'KR', 'BR', 'ZA', 'GR'],
        seedTargets: { A: 40, B: 20, C: 10, D: 3 },
    },

    {
        category: 'crane_rental_yard',
        tier: 'tier_1_hard_infra',
        subtypes: ['mobile_crane_depot', 'tower_crane_yard', 'heavy_lift_crane_base'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["man_made"="crane"](area.searchArea);
        way["industrial"="crane"](area.searchArea);
        node["shop"="crane"](area.searchArea);
      );
      out center 100;`,
        adgridSlots: 5,
        adgridValue: 'elite',
        urlPattern: '/industrial/{country}/crane/{slug}',
        demandSignal: 'very_high',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'AE', 'SA', 'QA', 'NO', 'SE', 'BR', 'MX', 'JP', 'KR', 'SG'],
        seedTargets: { A: 30, B: 15, C: 8, D: 2 },
    },

    // ===== TIER 2: FLOW SURFACES =====
    {
        category: 'logistics_park',
        tier: 'tier_2_flow',
        subtypes: ['logistics_park', 'freight_village', 'free_trade_zone', 'inland_container_depot'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        way["landuse"="industrial"]["industrial"="warehouse"](area.searchArea);
        way["landuse"="commercial"]["name"~"(?i)logistics|freight|cargo"](area.searchArea);
        node["amenity"="cargo"](area.searchArea);
      );
      out center 300;`,
        adgridSlots: 5,
        adgridValue: 'high',
        urlPattern: '/logistics/{country}/{slug}',
        demandSignal: 'medium_high',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'BE', 'FR', 'ES', 'IT', 'AE', 'SG', 'MY', 'MX', 'BR', 'PL', 'CZ', 'TR', 'JP', 'KR'],
        seedTargets: { A: 60, B: 30, C: 15, D: 5 },
    },

    {
        category: 'mining_site',
        tier: 'tier_2_flow',
        subtypes: ['open_pit_mine', 'quarry', 'mineral_processing', 'ore_loading'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["man_made"="mineshaft"](area.searchArea);
        way["landuse"="quarry"](area.searchArea);
        node["industrial"="mine"](area.searchArea);
        way["industrial"="mine"](area.searchArea);
      );
      out center 300;`,
        adgridSlots: 6,
        adgridValue: 'high',
        urlPattern: '/mining/{country}/{slug}',
        demandSignal: 'high',
        hotCountries: ['AU', 'CA', 'CL', 'BR', 'ZA', 'PE', 'CO', 'AR', 'MX', 'US', 'NO', 'SE', 'FI', 'GR', 'TR', 'PL'],
        seedTargets: { A: 50, B: 25, C: 15, D: 3 },
    },

    {
        category: 'border_crossing',
        tier: 'tier_2_flow',
        subtypes: ['commercial_border_crossing', 'freight_border_station', 'customs_yard'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["barrier"="border_control"](area.searchArea);
        node["border_type"="customs"](area.searchArea);
        node["amenity"="customs"](area.searchArea);
      );
      out center 100;`,
        adgridSlots: 6,
        adgridValue: 'high',
        urlPattern: '/crossing/{country}/{slug}',
        demandSignal: 'high',
        hotCountries: ['US', 'CA', 'MX', 'DE', 'PL', 'CZ', 'AT', 'CH', 'FR', 'BE', 'NL', 'ES', 'PT', 'IT', 'SI', 'HR', 'HU', 'SK', 'EE', 'LV', 'LT', 'RO', 'BG', 'GR', 'TR'],
        seedTargets: { A: 20, B: 15, C: 10, D: 5 },
    },

    {
        category: 'yacht_manufacturer',
        tier: 'tier_2_flow',
        subtypes: ['yacht_builder', 'boat_manufacturer', 'marina_boatyard'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["craft"="boatbuilder"](area.searchArea);
        way["craft"="boatbuilder"](area.searchArea);
        way["industrial"="boatbuilder"](area.searchArea);
        node["leisure"="marina"]["name"~"(?i)boat.*build|yacht.*build|marine.*fabric"](area.searchArea);
      );
      out center 100;`,
        adgridSlots: 5,
        adgridValue: 'high',
        urlPattern: '/industrial/{country}/marine/{slug}',
        demandSignal: 'high',
        hotCountries: ['US', 'AU', 'NZ', 'NL', 'IT', 'FR', 'NO', 'GB', 'DE', 'TR', 'HR', 'GR', 'ES', 'BR', 'CA'],
        seedTargets: { A: 20, B: 10, C: 5, D: 2 },
    },

    {
        category: 'agricultural_processing',
        tier: 'tier_2_flow',
        subtypes: ['grain_elevator', 'feed_mill', 'ethanol_plant', 'farm_equipment_dealer'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["man_made"="silo"](area.searchArea);
        way["man_made"="silo"](area.searchArea);
        way["industrial"="flour_mill"](area.searchArea);
        node["industrial"="brewery"]["product"="ethanol"](area.searchArea);
      );
      out center 400;`,
        adgridSlots: 4,
        adgridValue: 'high',
        urlPattern: '/agriculture/{country}/{slug}',
        demandSignal: 'medium_high',
        hotCountries: ['US', 'CA', 'AU', 'BR', 'AR', 'FR', 'DE', 'PL', 'RO', 'HU', 'IT', 'ES', 'ZA', 'NZ', 'MX', 'CO', 'UY'],
        seedTargets: { A: 60, B: 25, C: 10, D: 3 },
    },

    {
        category: 'dam_site',
        tier: 'tier_2_flow',
        subtypes: ['hydroelectric_dam', 'irrigation_dam', 'flood_control_dam'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        way["waterway"="dam"](area.searchArea);
        node["waterway"="dam"](area.searchArea);
        way["man_made"="reservoir"](area.searchArea);
      );
      out center 200;`,
        adgridSlots: 5,
        adgridValue: 'high',
        urlPattern: '/infrastructure/{country}/dam/{slug}',
        demandSignal: 'high',
        hotCountries: ['US', 'CA', 'BR', 'NO', 'SE', 'TR', 'JP', 'AU', 'NZ', 'AT', 'CH', 'CO', 'PE', 'CL', 'AR', 'ZA', 'MX'],
        seedTargets: { A: 30, B: 15, C: 8, D: 3 },
    },

    // ===== TIER 3: DEFENSIVE MESH =====
    {
        category: 'weigh_station',
        tier: 'tier_3_defensive',
        subtypes: ['truck_weigh_station', 'inspection_station', 'toll_plaza_commercial'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["amenity"="weighbridge"](area.searchArea);
        node["highway"="weigh_station"](area.searchArea);
      );
      out center 100;`,
        adgridSlots: 4,
        adgridValue: 'geo_local',
        urlPattern: '/infrastructure/{country}/weigh/{slug}',
        demandSignal: 'medium',
        hotCountries: ['US', 'CA', 'AU', 'MX', 'BR', 'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'TR', 'ZA', 'AR'],
        seedTargets: { A: 40, B: 15, C: 8, D: 2 },
    },

    {
        category: 'escort_staging_zone',
        tier: 'tier_3_defensive',
        subtypes: ['truck_staging_area', 'escort_meeting_point', 'wide_load_pull_off', 'oversize_parking_zone'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["amenity"="parking"]["hgv"="yes"](area.searchArea);
        way["amenity"="parking"]["hgv"="yes"](area.searchArea);
        node["highway"="rest_area"]["hgv"="yes"](area.searchArea);
      );
      out center 200;`,
        adgridSlots: 4,
        adgridValue: 'geo_local',
        urlPattern: '/staging/{country}/{slug}',
        demandSignal: 'medium',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'SE', 'NO'],
        seedTargets: { A: 50, B: 20, C: 10, D: 3 },
    },

    {
        category: 'truck_rest_stop',
        tier: 'tier_3_defensive',
        subtypes: ['heavy_truck_stop', 'freight_rest_area', 'truck_service_center'],
        osmQuery: `[out:json][timeout:60];
      area["ISO3166-1"="{CC}"]->.searchArea;
      (
        node["amenity"="fuel"]["hgv"="yes"](area.searchArea);
        way["amenity"="fuel"]["hgv"="yes"](area.searchArea);
        node["highway"="rest_area"](area.searchArea);
        node["highway"="services"](area.searchArea);
      );
      out center 400;`,
        adgridSlots: 4,
        adgridValue: 'geo_local',
        urlPattern: '/rest/{country}/{slug}',
        demandSignal: 'medium',
        hotCountries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'NL', 'SE', 'NO', 'IT', 'ES', 'PL', 'BR', 'MX', 'ZA', 'TR'],
        seedTargets: { A: 80, B: 35, C: 15, D: 5 },
    },
];

// ── Slug Generator ────────────────────────────────────────────
function toSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80);
}

// ── OSM Overpass Fetcher ──────────────────────────────────────
interface OsmElement {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

async function queryOverpass(query: string): Promise<OsmElement[]> {
    const endpoint = 'https://overpass-api.de/api/interpreter';
    const resp = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!resp.ok) {
        console.warn(`Overpass API error: ${resp.status}`);
        return [];
    }

    const data = await resp.json();
    return (data.elements || []) as OsmElement[];
}

// ── Surface Record Generator ──────────────────────────────────
interface SurfaceRecord {
    surface_tier: string;
    surface_category: string;
    surface_subtype: string | null;
    name: string;
    slug: string;
    description: string;
    country_code: string;
    country_tier: string;
    region_code: string | null;
    city: string | null;
    city_slug: string | null;
    latitude: number | null;
    longitude: number | null;
    geo_precision: string;
    claim_status: string;
    demand_likelihood_score: number;
    demand_band: string;
    oversize_probability: number;
    seo_priority: string;
    page_url_pattern: string;
    adgrid_slots: number;
    adgrid_value: string;
    data_source: string;
    osm_id: string | null;
    confidence_score: number;
    metadata: Record<string, unknown>;
}

function osmElementToSurface(
    el: OsmElement,
    cat: SurfaceCategoryDef,
    countryCode: string,
): SurfaceRecord | null {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || tags.operator || tags.brand;
    if (!name) return null;

    const lat = el.lat ?? el.center?.lat ?? null;
    const lon = el.lon ?? el.center?.lon ?? null;
    const countryInfo = COUNTRY_TIERS[countryCode];

    // Infer subtype from OSM tags
    let subtype: string | null = null;
    if (tags['harbour:type']) subtype = `${tags['harbour:type']}_port`;
    else if (tags.railway === 'yard') subtype = 'freight_rail_yard';
    else if (tags.industrial === 'shipyard') subtype = 'commercial_shipyard';
    else if (tags['power:source'] === 'nuclear') subtype = 'nuclear_facility';
    else if (tags['generator:source'] === 'wind') subtype = 'wind_farm';
    else if (tags['generator:source'] === 'solar') subtype = 'solar_farm';
    else if (tags.industrial === 'refinery') subtype = 'refinery';
    else if (tags.military) subtype = `${tags.military}_base`;
    else if (cat.subtypes.length > 0) subtype = cat.subtypes[0];

    // Base demand score from tier + category
    const tierScore = { A: 20, B: 15, C: 10, D: 5 }[countryInfo?.tier || 'D'] || 5;
    const categoryBonus = cat.tier === 'tier_1_hard_infra' ? 25 : cat.tier === 'tier_2_flow' ? 15 : 5;
    const isHotCountry = cat.hotCountries.includes(countryCode) ? 15 : 0;
    const geoBonus = lat !== null ? 10 : 0;
    const demandScore = Math.min(tierScore + categoryBonus + isHotCountry + geoBonus, 100);

    const demandBand =
        demandScore >= 90 ? 'elite_hot_zone' :
            demandScore >= 75 ? 'high_probability' :
                demandScore >= 55 ? 'emerging_zone' :
                    demandScore >= 35 ? 'watchlist' : 'low_priority';

    return {
        surface_tier: cat.tier,
        surface_category: cat.category,
        surface_subtype: subtype,
        name,
        slug: toSlug(name) + '-' + el.id.toString().slice(-6),
        description: `${name} — ${cat.category.replace(/_/g, ' ')} in ${countryInfo?.name || countryCode}`,
        country_code: countryCode,
        country_tier: countryInfo?.tier || 'D',
        region_code: tags['addr:state'] || tags['addr:province'] || null,
        city: tags['addr:city'] || null,
        city_slug: tags['addr:city'] ? toSlug(tags['addr:city']) : null,
        latitude: lat,
        longitude: lon,
        geo_precision: lat !== null ? 'high' : 'low',
        claim_status: 'unclaimed',
        demand_likelihood_score: demandScore,
        demand_band: demandBand,
        oversize_probability: cat.tier === 'tier_1_hard_infra' ? 0.85 : cat.tier === 'tier_2_flow' ? 0.6 : 0.35,
        seo_priority: demandScore >= 75 ? 'elite' : demandScore >= 55 ? 'high' : 'standard',
        page_url_pattern: cat.urlPattern,
        adgrid_slots: cat.adgridSlots,
        adgrid_value: cat.adgridValue,
        data_source: 'osm_overpass',
        osm_id: `${el.type}/${el.id}`,
        confidence_score: lat !== null ? 0.85 : 0.5,
        metadata: {
            osm_tags: tags,
            fetched_at: new Date().toISOString(),
            hot_country: cat.hotCountries.includes(countryCode),
        },
    };
}

// ── Batch SQL Generator ───────────────────────────────────────
function generateInsertSQL(surfaces: SurfaceRecord[]): string {
    if (surfaces.length === 0) return '-- No surfaces to insert';

    const values = surfaces.map(s => {
        const esc = (v: string | null) => v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;
        return `(
      gen_random_uuid(),
      '${s.surface_tier}'::surface_demand_tier,
      ${esc(s.surface_category)},
      ${esc(s.surface_subtype)},
      ${esc(s.name)},
      ${esc(s.slug)},
      ${esc(s.description)},
      ${esc(s.country_code)},
      ${esc(s.country_tier)},
      ${esc(s.region_code)},
      ${esc(s.city)},
      ${esc(s.city_slug)},
      NULL,
      ${s.latitude ?? 'NULL'},
      ${s.longitude ?? 'NULL'},
      ${esc(s.geo_precision)},
      NULL, NULL, NULL,
      ${esc(s.claim_status)},
      NULL, NULL,
      ${s.demand_likelihood_score},
      ${esc(s.demand_band)},
      ${s.oversize_probability},
      'unknown',
      NULL, NULL,
      ${s.metadata && (s.metadata as Record<string, unknown>).hot_country ? 0.8 : 0.3},
      ${s.metadata && (s.metadata as Record<string, unknown>).hot_country ? 'true' : 'false'},
      false, false,
      '{}',
      ${esc(s.seo_priority)},
      ${esc(s.page_url_pattern)},
      ${s.adgrid_slots},
      ${esc(s.adgrid_value)},
      ${esc(s.data_source)},
      ${esc(s.osm_id)},
      NULL,
      ${s.confidence_score},
      '${JSON.stringify(s.metadata).replace(/'/g, "''")}'::jsonb,
      true,
      now(), now(), NULL
    )`;
    });

    return `INSERT INTO heavy_haul_surfaces (
    id, surface_tier, surface_category, surface_subtype, name, slug, description,
    country_code, country_tier, region_code, city, city_slug, address,
    latitude, longitude, geo_precision, phone, website, email,
    claim_status, claimed_by, claimed_at,
    demand_likelihood_score, demand_band, oversize_probability, escort_frequency,
    port_proximity_km, rail_proximity_km, heavy_industry_density, energy_presence,
    wind_project_nearby, mining_activity, historical_escort_signals,
    seo_priority, page_url_pattern, adgrid_slots, adgrid_value,
    data_source, osm_id, source_url, confidence_score, metadata,
    is_visible, created_at, updated_at, last_verified_at
  ) VALUES ${values.join(',\n')}
  ON CONFLICT (country_code, surface_category, slug) DO NOTHING;`;
}

// ── Master Seeder ─────────────────────────────────────────────
export interface SeedProgress {
    country: string;
    category: string;
    fetched: number;
    inserted: number;
    skipped: number;
}

export interface SeedReport {
    totalCountries: number;
    totalCategories: number;
    totalSurfacesFetched: number;
    totalSurfacesInserted: number;
    totalAdGridSlots: number;
    estimatedIndexablePages: number;
    progress: SeedProgress[];
    errors: string[];
    startedAt: string;
    completedAt: string;
}

export async function seedSurfacesForCountry(
    countryCode: string,
    categories?: string[],
): Promise<{ surfaces: SurfaceRecord[]; sql: string }> {
    const allSurfaces: SurfaceRecord[] = [];
    const targetCats = categories
        ? SURFACE_CATEGORIES.filter(c => categories.includes(c.category))
        : SURFACE_CATEGORIES;

    for (const cat of targetCats) {
        if (!cat.hotCountries.includes(countryCode) && !categories) continue;

        const query = cat.osmQuery.replace(/\{CC\}/g, countryCode);
        try {
            const elements = await queryOverpass(query);
            const countryInfo = COUNTRY_TIERS[countryCode];
            const tierKey = (countryInfo?.tier || 'D') as keyof typeof cat.seedTargets;
            const limit = cat.seedTargets[tierKey] || 5;
            const limited = elements.slice(0, limit);

            for (const el of limited) {
                const surface = osmElementToSurface(el, cat, countryCode);
                if (surface) allSurfaces.push(surface);
            }
        } catch (err) {
            console.warn(`Error fetching ${cat.category} for ${countryCode}:`, err);
        }

        // Rate limit: 1 req per 2 seconds for Overpass
        await new Promise(r => setTimeout(r, 2000));
    }

    return {
        surfaces: allSurfaces,
        sql: generateInsertSQL(allSurfaces),
    };
}

export async function runGlobalSeed(): Promise<SeedReport> {
    const report: SeedReport = {
        totalCountries: 0,
        totalCategories: SURFACE_CATEGORIES.length,
        totalSurfacesFetched: 0,
        totalSurfacesInserted: 0,
        totalAdGridSlots: 0,
        estimatedIndexablePages: 0,
        progress: [],
        errors: [],
        startedAt: new Date().toISOString(),
        completedAt: '',
    };

    // Process countries in tier order
    const sortedCountries = Object.entries(COUNTRY_TIERS)
        .sort((a, b) => b[1].priority - a[1].priority)
        .map(([code]) => code);

    for (const cc of sortedCountries) {
        try {
            const { surfaces } = await seedSurfacesForCountry(cc);
            report.totalCountries++;
            report.totalSurfacesFetched += surfaces.length;

            for (const s of surfaces) {
                report.totalAdGridSlots += s.adgrid_slots;
                report.progress.push({
                    country: cc,
                    category: s.surface_category,
                    fetched: 1,
                    inserted: 1,
                    skipped: 0,
                });
            }
        } catch (err) {
            report.errors.push(`${cc}: ${String(err)}`);
        }
    }

    report.totalSurfacesInserted = report.totalSurfacesFetched;
    report.estimatedIndexablePages = report.totalSurfacesFetched * 8; // SEO surface explosion
    report.completedAt = new Date().toISOString();

    return report;
}

// ── Projections ───────────────────────────────────────────────
export function computeProjections(): {
    totalSurfaceCategories: number;
    countriesWithSurfaces: number;
    estimatedSurfaces: number;
    estimatedAdGridSlots: number;
    estimatedIndexablePages: number;
    estimatedMonetizableImpressions: number;
    breakdownByTier: Record<string, { surfaces: number; adSlots: number; pages: number }>;
} {
    let totalSurfaces = 0;
    let totalSlots = 0;
    const byTier: Record<string, { surfaces: number; adSlots: number; pages: number }> = {
        A: { surfaces: 0, adSlots: 0, pages: 0 },
        B: { surfaces: 0, adSlots: 0, pages: 0 },
        C: { surfaces: 0, adSlots: 0, pages: 0 },
        D: { surfaces: 0, adSlots: 0, pages: 0 },
    };

    for (const [cc, info] of Object.entries(COUNTRY_TIERS)) {
        for (const cat of SURFACE_CATEGORIES) {
            if (!cat.hotCountries.includes(cc)) continue;
            const tierKey = info.tier as keyof typeof cat.seedTargets;
            const target = cat.seedTargets[tierKey] || 0;
            totalSurfaces += target;
            totalSlots += target * cat.adgridSlots;
            byTier[info.tier].surfaces += target;
            byTier[info.tier].adSlots += target * cat.adgridSlots;
            byTier[info.tier].pages += target * 8;
        }
    }

    return {
        totalSurfaceCategories: SURFACE_CATEGORIES.length,
        countriesWithSurfaces: Object.keys(COUNTRY_TIERS).length,
        estimatedSurfaces: totalSurfaces,
        estimatedAdGridSlots: totalSlots,
        estimatedIndexablePages: totalSurfaces * 8,
        estimatedMonetizableImpressions: totalSlots * 30 * 3, // 30 days × 3 impressions/slot/day
        breakdownByTier: byTier,
    };
}

// ── Exportable Summary ────────────────────────────────────────
export const SURFACE_TAXONOMY_SUMMARY = {
    tier_1_count: SURFACE_CATEGORIES.filter(c => c.tier === 'tier_1_hard_infra').length,
    tier_2_count: SURFACE_CATEGORIES.filter(c => c.tier === 'tier_2_flow').length,
    tier_3_count: SURFACE_CATEGORIES.filter(c => c.tier === 'tier_3_defensive').length,
    total_categories: SURFACE_CATEGORIES.length,
    country_count: Object.keys(COUNTRY_TIERS).length,
    all_categories: SURFACE_CATEGORIES.map(c => ({
        category: c.category,
        tier: c.tier,
        signal: c.demandSignal,
        hotCountries: c.hotCountries.length,
        adgridSlots: c.adgridSlots,
    })),
};
