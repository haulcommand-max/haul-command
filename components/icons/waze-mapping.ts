/**
 * HAUL COMMAND — Waze Category Mapping Table
 *
 * Maps Haul Command global category IDs to the closest Waze place categories.
 * Purpose: data quality optimization for place submissions, NOT custom artwork.
 *
 * Waze categories: https://support.google.com/waze/partners/answer/10694507
 */

export interface WazeMapping {
    hc_icon_id: string;
    hc_global_category_id: string;
    hc_label: string;

    // Waze target
    waze_category: string;
    waze_subcategory: string | null;
    waze_place_type: 'point' | 'area' | 'either';

    // Quality signals
    naming_quality: 'exact' | 'close' | 'approximate' | 'no_match';
    data_requirements: string[];
    point_suitability: 1 | 2 | 3 | 4 | 5; // 5 = perfect fit
    notes: string;
}

export const WAZE_CATEGORY_MAP: WazeMapping[] = [
    // ── CORE MARKET ─────────────────────────────────────────────────────────
    { hc_icon_id: 'pilot_car_operators', hc_global_category_id: 'cat_pilot_car_operators', hc_label: 'Pilot Car Operators',
        waze_category: 'Professional and public', waze_subcategory: 'Transportation', waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'address', 'phone', 'hours'], point_suitability: 3,
        notes: 'No exact Waze category. Use Transportation > Other. Ensure company name mentions pilot/escort.' },
    { hc_icon_id: 'pilot_car_companies', hc_global_category_id: 'cat_pilot_car_companies', hc_label: 'Pilot Car Companies',
        waze_category: 'Professional and public', waze_subcategory: 'Transportation', waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'address', 'phone'], point_suitability: 3,
        notes: 'Same as operators. Fixed office locations map better.' },
    { hc_icon_id: 'heavy_haul_trucking_companies', hc_global_category_id: 'cat_heavy_haul_trucking', hc_label: 'Heavy Haul Trucking',
        waze_category: 'Professional and public', waze_subcategory: 'Transportation', waze_place_type: 'point',
        naming_quality: 'close', data_requirements: ['name', 'address', 'phone', 'website'], point_suitability: 4,
        notes: 'Trucking companies with fixed yards are a good fit.' },
    { hc_icon_id: 'heavy_haul_brokers', hc_global_category_id: 'cat_heavy_haul_brokers', hc_label: 'Heavy Haul Brokers',
        waze_category: 'Professional and public', waze_subcategory: 'Office', waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'address'], point_suitability: 2,
        notes: 'Most brokers are virtual offices. Only submit if physical office confirmed.' },
    { hc_icon_id: 'permit_services', hc_global_category_id: 'cat_permit_services', hc_label: 'Permit Services',
        waze_category: 'Professional and public', waze_subcategory: 'Office', waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'address'], point_suitability: 2,
        notes: 'Virtual services common. Only submit physical offices.' },
    { hc_icon_id: 'truck_parking_operators', hc_global_category_id: 'cat_truck_parking', hc_label: 'Truck Parking',
        waze_category: 'Parking lot', waze_subcategory: null, waze_place_type: 'area',
        naming_quality: 'close', data_requirements: ['name', 'address', 'hours', 'description'], point_suitability: 5,
        notes: 'Excellent Waze fit. Include "truck parking" in name. Area polygons preferred.' },
    { hc_icon_id: 'staging_yards', hc_global_category_id: 'cat_staging_yards', hc_label: 'Staging Yards',
        waze_category: 'Parking lot', waze_subcategory: null, waze_place_type: 'area',
        naming_quality: 'approximate', data_requirements: ['name', 'address'], point_suitability: 4,
        notes: 'Map as parking lot. Include "staging" or "marshalling" in name.' },
    { hc_icon_id: 'industrial_outdoor_storage', hc_global_category_id: 'cat_industrial_storage', hc_label: 'Industrial Outdoor Storage',
        waze_category: 'Parking lot', waze_subcategory: null, waze_place_type: 'area',
        naming_quality: 'approximate', data_requirements: ['name', 'address'], point_suitability: 3,
        notes: 'Use parking lot as proxy. Not all IOS yards are public.' },
    { hc_icon_id: 'truck_repair_shops', hc_global_category_id: 'cat_truck_repair', hc_label: 'Truck Repair Shops',
        waze_category: 'Car services', waze_subcategory: 'Mechanic', waze_place_type: 'point',
        naming_quality: 'close', data_requirements: ['name', 'address', 'phone', 'hours'], point_suitability: 5,
        notes: 'Great fit. Ensure name includes "truck" or "diesel" for specificity.' },
    { hc_icon_id: 'mobile_diesel_repair', hc_global_category_id: 'cat_mobile_diesel', hc_label: 'Mobile Diesel Repair',
        waze_category: 'Car services', waze_subcategory: 'Mechanic', waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'phone'], point_suitability: 2,
        notes: 'Mobile services rarely have fixed locations. Only submit shop/dispatch bases.' },
    { hc_icon_id: 'tow_recovery', hc_global_category_id: 'cat_tow_recovery', hc_label: 'Tow & Recovery',
        waze_category: 'Car services', waze_subcategory: 'Tow truck', waze_place_type: 'point',
        naming_quality: 'exact', data_requirements: ['name', 'address', 'phone', 'hours'], point_suitability: 5,
        notes: 'Perfect Waze match. High value for drivers on the road.' },
    { hc_icon_id: 'truck_stops', hc_global_category_id: 'cat_truck_stops', hc_label: 'Truck Stops',
        waze_category: 'Gas station', waze_subcategory: null, waze_place_type: 'point',
        naming_quality: 'close', data_requirements: ['name', 'address', 'brand', 'hours', 'fuel_types'], point_suitability: 5,
        notes: 'Gas station is the closest Waze category. Include truck stop name and brand.' },
    { hc_icon_id: 'hotels', hc_global_category_id: 'cat_hotels', hc_label: 'Hotels',
        waze_category: 'Lodging', waze_subcategory: null, waze_place_type: 'point',
        naming_quality: 'exact', data_requirements: ['name', 'address', 'phone', 'brand'], point_suitability: 5,
        notes: 'Perfect Waze fit. Include hotel chain/brand for deduplication.' },
    { hc_icon_id: 'warehouses', hc_global_category_id: 'cat_warehouses', hc_label: 'Warehouses',
        waze_category: 'Professional and public', waze_subcategory: 'Industrial', waze_place_type: 'area',
        naming_quality: 'close', data_requirements: ['name', 'address'], point_suitability: 4,
        notes: 'Industrial subcategory works. Area polygons help show facility size.' },
    { hc_icon_id: 'crane_rigging', hc_global_category_id: 'cat_crane_rigging', hc_label: 'Crane & Rigging',
        waze_category: 'Professional and public', waze_subcategory: 'Construction', waze_place_type: 'point',
        naming_quality: 'close', data_requirements: ['name', 'address', 'phone'], point_suitability: 3,
        notes: 'Construction sub-category. Include "crane" or "rigging" in name.' },

    // ── INFRASTRUCTURE ──────────────────────────────────────────────────────
    { hc_icon_id: 'secure_parking', hc_global_category_id: 'cat_secure_parking', hc_label: 'Secure Parking',
        waze_category: 'Parking lot', waze_subcategory: null, waze_place_type: 'area',
        naming_quality: 'close', data_requirements: ['name', 'address', 'hours', 'security_features'], point_suitability: 5,
        notes: 'Include "secure" or "guarded" in name for differentiation.' },
    { hc_icon_id: 'ports_terminals', hc_global_category_id: 'cat_ports_terminals', hc_label: 'Ports & Terminals',
        waze_category: 'Professional and public', waze_subcategory: 'Seaport/Marina/Harbor', waze_place_type: 'area',
        naming_quality: 'exact', data_requirements: ['name', 'address', 'type'], point_suitability: 5,
        notes: 'Port/harbor is an exact match in Waze. Use area polygons for large facilities.' },
    { hc_icon_id: 'rail_intermodal', hc_global_category_id: 'cat_rail_intermodal', hc_label: 'Rail & Intermodal',
        waze_category: 'Professional and public', waze_subcategory: 'Transportation', waze_place_type: 'area',
        naming_quality: 'close', data_requirements: ['name', 'address', 'type'], point_suitability: 4,
        notes: 'Rail yards map well. Include "intermodal" or "rail" in name.' },
    { hc_icon_id: 'fuel_services', hc_global_category_id: 'cat_fuel_services', hc_label: 'Fuel Services',
        waze_category: 'Gas station', waze_subcategory: null, waze_place_type: 'point',
        naming_quality: 'exact', data_requirements: ['name', 'address', 'brand', 'fuel_types', 'hours'], point_suitability: 5,
        notes: 'Perfect Waze match. Include diesel fuel availability in description.' },
    { hc_icon_id: 'rest_areas', hc_global_category_id: 'cat_rest_areas', hc_label: 'Rest Areas',
        waze_category: 'Outdoors', waze_subcategory: 'Rest area', waze_place_type: 'point',
        naming_quality: 'exact', data_requirements: ['name', 'highway', 'mile_marker', 'amenities'], point_suitability: 5,
        notes: 'Exact Waze match. Include amenity details (restrooms, vending, parking spots).' },
    { hc_icon_id: 'weigh_stations', hc_global_category_id: 'cat_weigh_stations', hc_label: 'Weigh Stations',
        waze_category: 'Professional and public', waze_subcategory: 'Government', waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'highway', 'direction', 'open_status'], point_suitability: 4,
        notes: 'No exact Waze category. Government sub-category with "weigh station" in name.' },
    { hc_icon_id: 'bridge_clearance', hc_global_category_id: 'cat_bridge_clearance', hc_label: 'Bridge Clearance',
        waze_category: 'Outdoors', waze_subcategory: null, waze_place_type: 'point',
        naming_quality: 'no_match', data_requirements: ['clearance_height', 'location', 'route'], point_suitability: 1,
        notes: 'Not a Waze place category. Do NOT submit. Use Waze road attributes instead.' },
    { hc_icon_id: 'escort_meetup_zones', hc_global_category_id: 'cat_escort_meetup', hc_label: 'Escort Meetup Zones',
        waze_category: 'Parking lot', waze_subcategory: null, waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'address', 'nearby_feature'], point_suitability: 3,
        notes: 'Informal locations. Only submit well-established meetup points with permanent parking.' },

    // ── SUPPORT SERVICES ────────────────────────────────────────────────────
    { hc_icon_id: 'tire_shops', hc_global_category_id: 'cat_tire_shops', hc_label: 'Truck Tire Shops',
        waze_category: 'Car services', waze_subcategory: 'Tires', waze_place_type: 'point',
        naming_quality: 'exact', data_requirements: ['name', 'address', 'phone', 'hours', 'brands'], point_suitability: 5,
        notes: 'Perfect Waze match. Include "truck" in name for specificity.' },
    { hc_icon_id: 'roadside_assistance', hc_global_category_id: 'cat_roadside_assistance', hc_label: 'Roadside Assistance',
        waze_category: 'Car services', waze_subcategory: 'Tow truck', waze_place_type: 'point',
        naming_quality: 'close', data_requirements: ['name', 'phone', 'coverage_area'], point_suitability: 3,
        notes: 'Use tow truck as proxy. Only submit dispatch bases, not service vehicles.' },

    // ── COMMERCE ────────────────────────────────────────────────────────────
    { hc_icon_id: 'equipment_dealers', hc_global_category_id: 'cat_equipment_dealers', hc_label: 'Equipment Dealers',
        waze_category: 'Shopping and services', waze_subcategory: 'Other', waze_place_type: 'point',
        naming_quality: 'approximate', data_requirements: ['name', 'address', 'phone', 'hours'], point_suitability: 4,
        notes: 'Include "equipment" or "truck" in dealer name for search relevance.' },
    { hc_icon_id: 'truck_dealers', hc_global_category_id: 'cat_truck_dealers', hc_label: 'Truck Dealers',
        waze_category: 'Car services', waze_subcategory: 'Car dealer', waze_place_type: 'point',
        naming_quality: 'close', data_requirements: ['name', 'address', 'phone', 'hours', 'brands'], point_suitability: 5,
        notes: 'Car dealer sub-category works. Ensure "truck" in name.' },
    { hc_icon_id: 'parts_accessories', hc_global_category_id: 'cat_parts_accessories', hc_label: 'Parts & Accessories',
        waze_category: 'Car services', waze_subcategory: 'Car parts', waze_place_type: 'point',
        naming_quality: 'close', data_requirements: ['name', 'address', 'phone', 'hours'], point_suitability: 4,
        notes: 'Car parts sub-category is close. Include "truck parts" in name.' },
];

// ── Lookup helpers ──────────────────────────────────────────────────────────

const _wazeMap = new Map<string, WazeMapping>();

export function getWazeMapping(iconId: string): WazeMapping | undefined {
    if (_wazeMap.size === 0) WAZE_CATEGORY_MAP.forEach(m => _wazeMap.set(m.hc_icon_id, m));
    return _wazeMap.get(iconId);
}

export function getWazeSubmittable(): WazeMapping[] {
    return WAZE_CATEGORY_MAP.filter(m => m.point_suitability >= 3 && m.naming_quality !== 'no_match');
}

export function getWazeHighQuality(): WazeMapping[] {
    return WAZE_CATEGORY_MAP.filter(m => m.point_suitability >= 4 && (m.naming_quality === 'exact' || m.naming_quality === 'close'));
}
