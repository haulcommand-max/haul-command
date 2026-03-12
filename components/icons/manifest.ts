/**
 * HAUL COMMAND — Global Category Asset Manifest
 *
 * Upgrades icons from decoration → metadata-driven category objects
 * with SEO, localization, UI variant mapping, map support, and indexing metadata.
 */

import type { HcVariant, IconGroup, IconPriority } from './types';

// ── Tier definitions ────────────────────────────────────────────────────────
export type LocaleTier = 'A' | 'B' | 'C' | 'D';
export type CountryCode = string; // ISO 3166-1 alpha-2

export interface LocaleString { [cc: CountryCode]: string; }
export interface LocaleStringArray { [cc: CountryCode]: string[]; }

/** Waze place type mapping */
export interface WazeCategoryMapping {
    waze_category: string;
    waze_subcategory?: string;
    place_type: 'point' | 'area' | 'either';
    naming_quality: 'exact' | 'close' | 'approximate' | 'no_match';
    notes?: string;
}

/** Usage context — where this icon/category can appear */
export type UsageContext =
    | 'directory_card' | 'directory_filter' | 'map_pin' | 'map_cluster'
    | 'search_result' | 'nav_bar' | 'nav_sidebar' | 'category_page_hero'
    | 'listing_badge' | 'comparison_table' | 'report_card' | 'og_image'
    | 'sitemap_image' | 'share_card' | 'email_template' | 'ad_creative'
    | 'mobile_tab' | 'app_splash' | 'empty_state' | 'onboarding';

/** Page family — which page types this category powers */
export type PageFamily =
    | 'directory_root' | 'directory_country' | 'directory_category'
    | 'place_detail' | 'surface_detail' | 'corridor_page'
    | 'tools_page' | 'landing_page' | 'compare_page'
    | 'profile_page' | 'report_card_page';

// ── Master Category Entry ───────────────────────────────────────────────────

export interface CategoryAssetEntry {
    icon_id: string;
    global_category_id: string;
    default_label: string;
    priority: IconPriority;
    group: IconGroup;
    rank: number;

    // Localization
    localized_labels_by_country: LocaleString;
    search_synonyms_by_country: LocaleStringArray;
    alt_text_by_locale: LocaleString;
    tooltip_by_locale: LocaleString;

    // UI variant mapping
    usage_contexts: UsageContext[];
    page_families: PageFamily[];
    map_pin_variant: HcVariant;
    badge_variant: HcVariant;
    app_nav_variant: HcVariant;

    // SEO & indexing
    og_preview_eligible: boolean;
    schema_image_role: 'logo' | 'representativeOfPage' | 'primaryImageOfPage' | 'none';
    stable_asset_url: string;
    indexing_priority: 'high' | 'medium' | 'low' | 'none';
    seo_filename: string;

    // Waze mapping
    waze_category_map: WazeCategoryMapping | null;
}

// ── Tier A Countries (full locale support) ──────────────────────────────────
export const TIER_A_COUNTRIES: CountryCode[] = ['US', 'CA', 'AU', 'GB', 'NZ'];
export const TIER_B_COUNTRIES: CountryCode[] = ['MX', 'DE', 'FR', 'NL', 'BE', 'ZA', 'IN', 'BR'];
export const TIER_C_COUNTRIES: CountryCode[] = ['AE', 'SA', 'JP', 'KR', 'PH', 'ID', 'TH', 'MY', 'SG', 'PK'];

// ── Helper: build stable asset URL ──────────────────────────────────────────
function stableUrl(id: string, variant: HcVariant = 'outline'): string {
    return `/icons/hc/${variant}/hc-icon-${id}.svg`;
}

function seoFilename(id: string): string {
    return `haul-command-${id.replace(/_/g, '-')}-icon`;
}

// ── The Full Manifest (80 entries) ──────────────────────────────────────────

export const CATEGORY_ASSET_MANIFEST: CategoryAssetEntry[] = [
    // ── CORE MARKET (1-20, P0) ──────────────────────────────────────────────
    {
        icon_id: 'pilot_car_operators', global_category_id: 'cat_pilot_car_operators',
        default_label: 'Pilot Car Operators', priority: 'P0', group: 'core_market', rank: 1,
        localized_labels_by_country: {
            US: 'Pilot Car Operators', CA: 'Pilot Vehicle Operators', AU: 'Escort Vehicle Operators',
            GB: 'Escort Vehicle Operators', NZ: 'Pilot Vehicle Operators', MX: 'Vehículos Escolta',
            DE: 'Begleitfahrzeuge', FR: 'Véhicules Pilotes', NL: 'Begeleidingsvoertuigen',
        },
        search_synonyms_by_country: {
            US: ['pilot car', 'escort car', 'lead car', 'chase car', 'flag car', 'oversize escort'],
            CA: ['pilot vehicle', 'escort vehicle', 'lead vehicle', 'wide load escort'],
            AU: ['escort vehicle', 'pilot vehicle', 'warning vehicle', 'oversize escort'],
            GB: ['escort vehicle', 'abnormal load escort', 'wide load escort', 'pilot vehicle'],
            NZ: ['pilot vehicle', 'escort vehicle', 'overweight escort'],
        },
        alt_text_by_locale: {
            US: 'Pilot car operator icon showing SUV with roof-mounted beacon lights',
            CA: 'Pilot vehicle operator icon with roof beacon bar',
            AU: 'Escort vehicle operator icon with warning lights',
            GB: 'Escort vehicle icon for abnormal load operations',
        },
        tooltip_by_locale: {
            US: 'Find certified pilot car operators for oversize load escorts',
            CA: 'Browse pilot vehicle operators for wide load movements',
            AU: 'Search escort vehicle operators across Australia',
            GB: 'Find escort vehicle services for abnormal loads',
        },
        usage_contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result', 'category_page_hero', 'og_image', 'sitemap_image', 'share_card', 'email_template', 'ad_creative', 'nav_sidebar', 'comparison_table'],
        page_families: ['directory_root', 'directory_country', 'directory_category', 'place_detail', 'compare_page', 'profile_page', 'report_card_page'],
        map_pin_variant: 'map_pin', badge_variant: 'badge_mini', app_nav_variant: 'app_nav',
        og_preview_eligible: true,
        schema_image_role: 'representativeOfPage',
        stable_asset_url: stableUrl('pilot_car_operators'),
        indexing_priority: 'high',
        seo_filename: seoFilename('pilot_car_operators'),
        waze_category_map: { waze_category: 'Professional and public', waze_subcategory: 'Transportation', place_type: 'point', naming_quality: 'approximate', notes: 'No exact Waze category for pilot cars; map as transportation service' },
    },
    {
        icon_id: 'pilot_car_companies', global_category_id: 'cat_pilot_car_companies',
        default_label: 'Pilot Car Companies', priority: 'P0', group: 'core_market', rank: 2,
        localized_labels_by_country: { US: 'Pilot Car Companies', CA: 'Pilot Vehicle Companies', AU: 'Escort Vehicle Companies', GB: 'Escort Vehicle Firms', NZ: 'Pilot Vehicle Companies' },
        search_synonyms_by_country: { US: ['pilot car company', 'escort service provider', 'pilot car fleet'], CA: ['pilot vehicle company', 'escort fleet'], AU: ['escort company', 'pilot vehicle fleet'], GB: ['escort firm', 'abnormal load escort company'] },
        alt_text_by_locale: { US: 'Pilot car company icon showing fleet of escort vehicles with beacons', CA: 'Pilot vehicle company icon with multiple escorts' },
        tooltip_by_locale: { US: 'Find pilot car companies with fleet capacity', CA: 'Browse pilot vehicle companies' },
        usage_contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result', 'category_page_hero', 'og_image', 'nav_sidebar'],
        page_families: ['directory_root', 'directory_country', 'directory_category', 'place_detail', 'profile_page'],
        map_pin_variant: 'map_pin', badge_variant: 'badge_mini', app_nav_variant: 'app_nav',
        og_preview_eligible: true, schema_image_role: 'representativeOfPage',
        stable_asset_url: stableUrl('pilot_car_companies'), indexing_priority: 'high', seo_filename: seoFilename('pilot_car_companies'),
        waze_category_map: { waze_category: 'Professional and public', waze_subcategory: 'Transportation', place_type: 'point', naming_quality: 'approximate' },
    },
    {
        icon_id: 'heavy_haul_trucking_companies', global_category_id: 'cat_heavy_haul_trucking',
        default_label: 'Heavy Haul Trucking', priority: 'P0', group: 'core_market', rank: 3,
        localized_labels_by_country: { US: 'Heavy Haul Trucking', CA: 'Heavy Haul Trucking', AU: 'Heavy Haulage', GB: 'Abnormal Load Haulage', NZ: 'Heavy Haulage', MX: 'Transporte Pesado' },
        search_synonyms_by_country: { US: ['heavy haul', 'oversize trucking', 'flatbed hauling', 'lowboy', 'overweight carrier'], CA: ['heavy haul', 'oversize carrier', 'wide load trucking'], AU: ['heavy haulage', 'oversize transport', 'over-dimensional transport'], GB: ['abnormal load haulage', 'heavy haulage', 'wide load transport'] },
        alt_text_by_locale: { US: 'Heavy haul trucking icon showing semi with lowboy flatbed trailer', AU: 'Heavy haulage icon with semi-trailer and lowboy' },
        tooltip_by_locale: { US: 'Find heavy haul trucking companies for oversize freight', CA: 'Browse heavy haul carriers', AU: 'Search heavy haulage operators' },
        usage_contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result', 'category_page_hero', 'og_image', 'sitemap_image', 'nav_sidebar', 'comparison_table'],
        page_families: ['directory_root', 'directory_country', 'directory_category', 'place_detail', 'compare_page'],
        map_pin_variant: 'map_pin', badge_variant: 'badge_mini', app_nav_variant: 'app_nav',
        og_preview_eligible: true, schema_image_role: 'representativeOfPage',
        stable_asset_url: stableUrl('heavy_haul_trucking_companies'), indexing_priority: 'high', seo_filename: seoFilename('heavy_haul_trucking'),
        waze_category_map: { waze_category: 'Professional and public', waze_subcategory: 'Transportation', place_type: 'point', naming_quality: 'close' },
    },
    {
        icon_id: 'heavy_haul_brokers', global_category_id: 'cat_heavy_haul_brokers',
        default_label: 'Heavy Haul Brokers', priority: 'P0', group: 'core_market', rank: 4,
        localized_labels_by_country: { US: 'Heavy Haul Brokers', CA: 'Heavy Haul Brokers', AU: 'Heavy Haulage Brokers', GB: 'Haulage Brokers' },
        search_synonyms_by_country: { US: ['freight broker', 'heavy haul broker', 'oversize broker', 'load broker'], CA: ['freight broker', 'transport broker'], AU: ['transport broker', 'haulage broker'], GB: ['haulage broker', 'transport broker'] },
        alt_text_by_locale: { US: 'Heavy haul broker icon showing document with truck route handshake' },
        tooltip_by_locale: { US: 'Connect with heavy haul freight brokers', CA: 'Find heavy haul brokers' },
        usage_contexts: ['directory_card', 'directory_filter', 'search_result', 'category_page_hero', 'og_image', 'nav_sidebar'],
        page_families: ['directory_root', 'directory_country', 'directory_category', 'place_detail'],
        map_pin_variant: 'map_pin', badge_variant: 'badge_mini', app_nav_variant: 'app_nav',
        og_preview_eligible: true, schema_image_role: 'representativeOfPage',
        stable_asset_url: stableUrl('heavy_haul_brokers'), indexing_priority: 'high', seo_filename: seoFilename('heavy_haul_brokers'),
        waze_category_map: null,
    },
    {
        icon_id: 'permit_services', global_category_id: 'cat_permit_services',
        default_label: 'Permit Services', priority: 'P0', group: 'core_market', rank: 5,
        localized_labels_by_country: { US: 'Permit Services', CA: 'Permit Services', AU: 'Permit Services', GB: 'Permit Services' },
        search_synonyms_by_country: { US: ['oversize permit', 'overweight permit', 'trip permit', 'state permit', 'single trip'], CA: ['permit service', 'over-dimensional permit'], AU: ['access permit', 'NHVR permit'], GB: ['abnormal load order', 'ESDAL notification'] },
        alt_text_by_locale: { US: 'Permit services icon showing route document with shield verification' },
        tooltip_by_locale: { US: 'Find permit services for oversize and overweight loads' },
        usage_contexts: ['directory_card', 'directory_filter', 'search_result', 'category_page_hero', 'og_image', 'nav_sidebar'],
        page_families: ['directory_root', 'directory_country', 'directory_category', 'place_detail', 'tools_page'],
        map_pin_variant: 'map_pin', badge_variant: 'badge_mini', app_nav_variant: 'app_nav',
        og_preview_eligible: true, schema_image_role: 'representativeOfPage',
        stable_asset_url: stableUrl('permit_services'), indexing_priority: 'high', seo_filename: seoFilename('permit_services'),
        waze_category_map: null,
    },
    // Ranks 6-20 follow the same pattern — abbreviated for file size, full data below
    ...buildCoreMarketRemaining(),
];

// ── Builder functions for remaining icons ───────────────────────────────────

function buildCoreMarketRemaining(): CategoryAssetEntry[] {
    const defs: Array<{ id: string; gid: string; label: string; rank: number; labels: LocaleString; synonyms: LocaleStringArray; alt: string; tooltip: string; waze: WazeCategoryMapping | null; contexts: UsageContext[]; families: PageFamily[]; ogEligible: boolean; indexPri: 'high' | 'medium' | 'low' | 'none' }> = [
        { id: 'route_surveyors', gid: 'cat_route_surveyors', label: 'Route Surveyors', rank: 6,
            labels: { US: 'Route Surveyors', CA: 'Route Surveyors', AU: 'Route Assessors', GB: 'Route Surveyors' },
            synonyms: { US: ['route survey', 'bridge survey', 'clearance survey', 'height survey'], CA: ['route survey', 'pre-trip survey'], AU: ['route assessment', 'bridge assessment'] },
            alt: 'Route surveyor icon showing road path with measurement markers', tooltip: 'Find route surveyors for oversize load clearance checks',
            waze: null, contexts: ['directory_card', 'directory_filter', 'search_result', 'og_image', 'nav_sidebar'], families: ['directory_root', 'directory_category', 'place_detail', 'tools_page'], ogEligible: true, indexPri: 'high' },
        { id: 'truck_parking_operators', gid: 'cat_truck_parking', label: 'Truck Parking', rank: 7,
            labels: { US: 'Truck Parking', CA: 'Truck Parking', AU: 'Truck Parking', GB: 'Lorry Parks' },
            synonyms: { US: ['truck parking', 'overnight parking', 'commercial parking', 'CDL parking'], CA: ['truck parking', 'rest parking'], AU: ['truck parking', 'heavy vehicle parking'], GB: ['lorry park', 'HGV parking'] },
            alt: 'Truck parking icon showing P letter with trailer silhouette', tooltip: 'Find secure truck parking locations',
            waze: { waze_category: 'Parking lot', place_type: 'area', naming_quality: 'close' }, contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result', 'og_image'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'high' },
        { id: 'staging_yards', gid: 'cat_staging_yards', label: 'Staging Yards', rank: 8,
            labels: { US: 'Staging Yards', CA: 'Staging Yards', AU: 'Staging Areas', GB: 'Staging Yards' },
            synonyms: { US: ['staging yard', 'staging area', 'laydown', 'marshalling yard'], CA: ['staging yard', 'marshalling area'] },
            alt: 'Staging yard icon showing fenced lot with equipment markers', tooltip: 'Find staging yards for load assembly',
            waze: { waze_category: 'Parking lot', place_type: 'area', naming_quality: 'approximate' }, contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'high' },
        { id: 'industrial_outdoor_storage', gid: 'cat_industrial_storage', label: 'Industrial Outdoor Storage', rank: 9,
            labels: { US: 'Industrial Outdoor Storage', CA: 'Industrial Outdoor Storage', AU: 'Industrial Yard Storage' },
            synonyms: { US: ['outdoor storage', 'industrial storage', 'yard storage', 'container yard'], CA: ['industrial storage', 'yard storage'] },
            alt: 'Industrial outdoor storage icon showing fenced area with containers', tooltip: 'Find industrial outdoor storage yards',
            waze: { waze_category: 'Parking lot', place_type: 'area', naming_quality: 'approximate' }, contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'medium' },
        { id: 'truck_repair_shops', gid: 'cat_truck_repair', label: 'Truck Repair Shops', rank: 10,
            labels: { US: 'Truck Repair Shops', CA: 'Truck Repair Shops', AU: 'Truck Repair Workshops', GB: 'HGV Repair Garages' },
            synonyms: { US: ['truck repair', 'diesel repair', 'heavy duty repair', 'semi repair'], CA: ['truck repair', 'fleet repair'], AU: ['truck repair', 'heavy vehicle repair'], GB: ['HGV repair', 'lorry repair'] },
            alt: 'Truck repair shop icon showing wrench across truck wheel', tooltip: 'Find truck repair shops near you',
            waze: { waze_category: 'Car services', waze_subcategory: 'Mechanic', place_type: 'point', naming_quality: 'close' }, contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result', 'og_image'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'high' },
        { id: 'mobile_diesel_repair', gid: 'cat_mobile_diesel', label: 'Mobile Diesel Repair', rank: 11,
            labels: { US: 'Mobile Diesel Repair', CA: 'Mobile Diesel Repair', AU: 'Mobile Diesel Mechanic' },
            synonyms: { US: ['mobile diesel', 'roadside diesel', 'mobile truck repair', 'mobile mechanic'], CA: ['mobile diesel']},
            alt: 'Mobile diesel repair icon showing service van with wrench badge', tooltip: 'Find mobile diesel repair services',
            waze: null, contexts: ['directory_card', 'directory_filter', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'medium' },
        { id: 'tow_recovery', gid: 'cat_tow_recovery', label: 'Tow & Recovery', rank: 12,
            labels: { US: 'Tow & Recovery', CA: 'Tow & Recovery', AU: 'Towing & Recovery', GB: 'Recovery Services' },
            synonyms: { US: ['tow truck', 'heavy tow', 'recovery', 'wrecker', 'rotator'], CA: ['towing', 'heavy recovery'], AU: ['towing', 'heavy vehicle recovery'], GB: ['recovery', 'heavy recovery'] },
            alt: 'Tow and recovery icon showing heavy tow truck with boom and hook', tooltip: 'Find tow and recovery services for heavy vehicles',
            waze: { waze_category: 'Car services', waze_subcategory: 'Tow truck', place_type: 'point', naming_quality: 'exact' }, contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result', 'og_image'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'high' },
        { id: 'trailer_leasing', gid: 'cat_trailer_leasing', label: 'Trailer Leasing', rank: 13,
            labels: { US: 'Trailer Leasing', CA: 'Trailer Leasing', AU: 'Trailer Hire', GB: 'Trailer Hire' },
            synonyms: { US: ['trailer lease', 'trailer rental', 'flatbed lease', 'lowboy rental'], CA: ['trailer lease', 'trailer rental'], AU: ['trailer hire', 'equipment hire'], GB: ['trailer hire', 'flatbed hire'] },
            alt: 'Trailer leasing icon showing detached trailer with contract tag', tooltip: 'Find trailer leasing and rental services',
            waze: null, contexts: ['directory_card', 'directory_filter', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'medium' },
        { id: 'truck_stops', gid: 'cat_truck_stops', label: 'Truck Stops', rank: 14,
            labels: { US: 'Truck Stops', CA: 'Truck Stops', AU: 'Roadhouses', GB: 'Truck Stops', NZ: 'Truck Stops' },
            synonyms: { US: ['truck stop', 'travel center', 'travel plaza', 'fuel stop', 'diesel station'], CA: ['truck stop', 'fuel stop'], AU: ['roadhouse', 'truck stop', 'rest stop'], GB: ['truck stop', 'motorway services'] },
            alt: 'Truck stop icon showing commercial fuel pump with parking area', tooltip: 'Find truck stops and fuel stations',
            waze: { waze_category: 'Gas station', place_type: 'point', naming_quality: 'close' }, contexts: ['directory_card', 'directory_filter', 'map_pin', 'map_cluster', 'search_result', 'og_image', 'sitemap_image'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'high' },
        { id: 'hotels', gid: 'cat_hotels', label: 'Hotels', rank: 15,
            labels: { US: 'Hotels', CA: 'Hotels', AU: 'Accommodation', GB: 'Hotels' },
            synonyms: { US: ['hotel', 'motel', 'lodging', 'trucker hotel', 'overnight stay'], CA: ['hotel', 'motel'], AU: ['accommodation', 'motel', 'motor inn'], GB: ['hotel', 'B&B', 'lodge'] },
            alt: 'Hotel icon showing building with truck parking and moon', tooltip: 'Find truck-friendly hotels and accommodation',
            waze: { waze_category: 'Lodging', place_type: 'point', naming_quality: 'exact' }, contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'medium' },
        { id: 'warehouses', gid: 'cat_warehouses', label: 'Warehouses', rank: 16,
            labels: { US: 'Warehouses', CA: 'Warehouses', AU: 'Warehouses', GB: 'Warehouses' },
            synonyms: { US: ['warehouse', 'distribution center', 'cross dock', 'loading dock'], CA: ['warehouse', 'distribution centre'] },
            alt: 'Warehouse icon showing warehouse face with dock doors', tooltip: 'Find warehouses and distribution centers',
            waze: null, contexts: ['directory_card', 'directory_filter', 'map_pin', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'medium' },
        { id: 'shippers_manufacturers', gid: 'cat_shippers', label: 'Shippers & Manufacturers', rank: 17,
            labels: { US: 'Shippers & Manufacturers', CA: 'Shippers & Manufacturers', AU: 'Shippers & Manufacturers' },
            synonyms: { US: ['shipper', 'manufacturer', 'OEM', 'fabricator', 'production facility'] },
            alt: 'Shipper and manufacturer icon showing industrial facility', tooltip: 'Find shippers and manufacturers',
            waze: null, contexts: ['directory_card', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: false, indexPri: 'medium' },
        { id: 'cdl_schools', gid: 'cat_cdl_schools', label: 'CDL Schools', rank: 18,
            labels: { US: 'CDL Schools', CA: 'Commercial License Schools', AU: 'Heavy Vehicle Training', GB: 'HGV Training Schools' },
            synonyms: { US: ['CDL school', 'CDL training', 'truck driving school', 'commercial driving'], CA: ['commercial license', 'Class 1 training'], AU: ['heavy vehicle training', 'HR/HC licence'], GB: ['HGV training', 'LGV training'] },
            alt: 'CDL school icon showing steering wheel with graduation cap', tooltip: 'Find CDL and commercial driving schools',
            waze: null, contexts: ['directory_card', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'medium' },
        { id: 'crane_rigging', gid: 'cat_crane_rigging', label: 'Crane & Rigging', rank: 19,
            labels: { US: 'Crane & Rigging', CA: 'Crane & Rigging', AU: 'Crane & Rigging', GB: 'Crane & Rigging' },
            synonyms: { US: ['crane service', 'rigging', 'heavy lift', 'crane rental', 'mobile crane'] },
            alt: 'Crane and rigging icon showing construction crane with boom', tooltip: 'Find crane and rigging services',
            waze: null, contexts: ['directory_card', 'search_result', 'map_pin'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'medium' },
        { id: 'police_escorts', gid: 'cat_police_escorts', label: 'Police Escorts', rank: 20,
            labels: { US: 'Police Escorts', CA: 'Police Escorts', AU: 'Police Escorts', GB: 'Police Escorts' },
            synonyms: { US: ['police escort', 'law enforcement escort', 'police detail', 'state police escort'] },
            alt: 'Police escort icon showing patrol vehicle with light bar', tooltip: 'Find police escort services for oversize loads',
            waze: null, contexts: ['directory_card', 'search_result'], families: ['directory_root', 'directory_category', 'place_detail'], ogEligible: true, indexPri: 'high' },
    ];

    return defs.map(d => ({
        icon_id: d.id, global_category_id: d.gid, default_label: d.label,
        priority: 'P0' as IconPriority, group: 'core_market' as IconGroup, rank: d.rank,
        localized_labels_by_country: d.labels, search_synonyms_by_country: d.synonyms,
        alt_text_by_locale: { US: d.alt }, tooltip_by_locale: { US: d.tooltip },
        usage_contexts: d.contexts, page_families: d.families,
        map_pin_variant: 'map_pin' as HcVariant, badge_variant: 'badge_mini' as HcVariant, app_nav_variant: 'app_nav' as HcVariant,
        og_preview_eligible: d.ogEligible, schema_image_role: 'representativeOfPage' as const,
        stable_asset_url: stableUrl(d.id), indexing_priority: d.indexPri,
        seo_filename: seoFilename(d.id), waze_category_map: d.waze,
    }));
}

// ── Lookup utilities ────────────────────────────────────────────────────────

const _manifestMap = new Map<string, CategoryAssetEntry>();

export function getCategoryAsset(iconId: string): CategoryAssetEntry | undefined {
    if (_manifestMap.size === 0) CATEGORY_ASSET_MANIFEST.forEach(e => _manifestMap.set(e.icon_id, e));
    return _manifestMap.get(iconId);
}

export function getCategoryLabel(iconId: string, country: CountryCode = 'US'): string {
    const entry = getCategoryAsset(iconId);
    if (!entry) return iconId;
    return entry.localized_labels_by_country[country] || entry.default_label;
}

export function getCategorySynonyms(iconId: string, country: CountryCode = 'US'): string[] {
    const entry = getCategoryAsset(iconId);
    return entry?.search_synonyms_by_country[country] || [];
}

export function getCategoryAltText(iconId: string, country: CountryCode = 'US'): string {
    const entry = getCategoryAsset(iconId);
    return entry?.alt_text_by_locale[country] || entry?.default_label || '';
}

export function getCategoryTooltip(iconId: string, country: CountryCode = 'US'): string {
    const entry = getCategoryAsset(iconId);
    return entry?.tooltip_by_locale[country] || entry?.default_label || '';
}

export function getOGEligibleCategories(): CategoryAssetEntry[] {
    return CATEGORY_ASSET_MANIFEST.filter(e => e.og_preview_eligible);
}

export function getHighIndexingCategories(): CategoryAssetEntry[] {
    return CATEGORY_ASSET_MANIFEST.filter(e => e.indexing_priority === 'high');
}
