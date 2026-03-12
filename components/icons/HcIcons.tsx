import React from 'react';
import { HcIconBase } from './HcIconBase';
import type { HcIconProps, IconDef, HcIconMeta } from './types';

import { CORE_MARKET_ICONS } from './defs-core-market';
import { INFRASTRUCTURE_ICONS } from './defs-infrastructure';
import { SUPPORT_SERVICES_ICONS } from './defs-support-services';
import { COMMERCE_MARKETPLACE_ICONS } from './defs-commerce';
import { COMPLIANCE_FINANCE_ICONS } from './defs-compliance';
import { PLATFORM_SURFACES_ICONS } from './defs-platform';
import { STATUS_BADGES_ICONS } from './defs-status';

/** Complete ordered list of all 80 icon definitions */
export const ALL_ICON_DEFS: IconDef[] = [
    ...CORE_MARKET_ICONS,
    ...INFRASTRUCTURE_ICONS,
    ...SUPPORT_SERVICES_ICONS,
    ...COMMERCE_MARKETPLACE_ICONS,
    ...COMPLIANCE_FINANCE_ICONS,
    ...PLATFORM_SURFACES_ICONS,
    ...STATUS_BADGES_ICONS,
].sort((a, b) => a.rank - b.rank);

/** Map from id → definition for O(1) lookup */
export const ICON_DEF_MAP: Record<string, IconDef> = {};
ALL_ICON_DEFS.forEach(d => { ICON_DEF_MAP[d.id] = d; });

/** Universal dynamic icon — renders any icon by id with any variant */
export function HcIcon({ icon, ...props }: HcIconProps & { icon: string }) {
    const def = ICON_DEF_MAP[icon];
    if (!def) return null;
    return <HcIconBase paths={def.paths} primaryFill={def.primaryFill} {...props} />;
}

/** Factory: create a named component from a definition */
function make(def: IconDef): React.FC<HcIconProps> {
    const C: React.FC<HcIconProps> = (props) => (
        <HcIconBase paths={def.paths} primaryFill={def.primaryFill} {...props} />
    );
    C.displayName = `HcIcon_${def.id}`;
    return C;
}

// ── Named Components (all 80) ──────────────────────────────────────────────
// Core Market (20)
export const HcIconPilotCarOperators = make(ICON_DEF_MAP['pilot_car_operators']);
export const HcIconPilotCarCompanies = make(ICON_DEF_MAP['pilot_car_companies']);
export const HcIconHeavyHaulTrucking = make(ICON_DEF_MAP['heavy_haul_trucking_companies']);
export const HcIconHeavyHaulBrokers = make(ICON_DEF_MAP['heavy_haul_brokers']);
export const HcIconPermitServices = make(ICON_DEF_MAP['permit_services']);
export const HcIconRouteSurveyors = make(ICON_DEF_MAP['route_surveyors']);
export const HcIconTruckParking = make(ICON_DEF_MAP['truck_parking_operators']);
export const HcIconStagingYards = make(ICON_DEF_MAP['staging_yards']);
export const HcIconIndustrialOutdoorStorage = make(ICON_DEF_MAP['industrial_outdoor_storage']);
export const HcIconTruckRepairShops = make(ICON_DEF_MAP['truck_repair_shops']);
export const HcIconMobileDieselRepair = make(ICON_DEF_MAP['mobile_diesel_repair']);
export const HcIconTowRecovery = make(ICON_DEF_MAP['tow_recovery']);
export const HcIconTrailerLeasing = make(ICON_DEF_MAP['trailer_leasing']);
export const HcIconTruckStops = make(ICON_DEF_MAP['truck_stops']);
export const HcIconHotels = make(ICON_DEF_MAP['hotels']);
export const HcIconWarehouses = make(ICON_DEF_MAP['warehouses']);
export const HcIconShippersManufacturers = make(ICON_DEF_MAP['shippers_manufacturers']);
export const HcIconCdlSchools = make(ICON_DEF_MAP['cdl_schools']);
export const HcIconCraneRigging = make(ICON_DEF_MAP['crane_rigging']);
export const HcIconPoliceEscorts = make(ICON_DEF_MAP['police_escorts']);
// Infrastructure (14)
export const HcIconSecureParking = make(ICON_DEF_MAP['secure_parking']);
export const HcIconSelfStorage = make(ICON_DEF_MAP['self_storage_operators']);
export const HcIconLaydownYards = make(ICON_DEF_MAP['laydown_yards']);
export const HcIconPortsTerminals = make(ICON_DEF_MAP['ports_terminals']);
export const HcIconRailIntermodal = make(ICON_DEF_MAP['rail_intermodal']);
export const HcIconTruckWash = make(ICON_DEF_MAP['truck_wash_detail']);
export const HcIconFuelServices = make(ICON_DEF_MAP['fuel_services']);
export const HcIconRestAreas = make(ICON_DEF_MAP['rest_areas']);
export const HcIconWeighStations = make(ICON_DEF_MAP['weigh_stations']);
export const HcIconBridgeClearance = make(ICON_DEF_MAP['bridge_clearance']);
export const HcIconRouteRestrictions = make(ICON_DEF_MAP['route_restrictions']);
export const HcIconEscortMeetupZones = make(ICON_DEF_MAP['escort_meetup_zones']);
export const HcIconOvernightStaging = make(ICON_DEF_MAP['overnight_staging']);
export const HcIconRepairInstall = make(ICON_DEF_MAP['repair_install_locations']);
// Support Services (9)
export const HcIconTrailerRepair = make(ICON_DEF_MAP['trailer_repair']);
export const HcIconTireShops = make(ICON_DEF_MAP['tire_shops']);
export const HcIconBodyFabrication = make(ICON_DEF_MAP['body_fabrication']);
export const HcIconRoadsideAssistance = make(ICON_DEF_MAP['roadside_assistance']);
export const HcIconDispatchServices = make(ICON_DEF_MAP['dispatch_services']);
export const HcIconRecruitingStaffing = make(ICON_DEF_MAP['recruiting_staffing']);
export const HcIconTrainingCertification = make(ICON_DEF_MAP['training_certification']);
export const HcIconSurveyEngineering = make(ICON_DEF_MAP['survey_engineering']);
export const HcIconUtilityCoordination = make(ICON_DEF_MAP['utility_coordination']);
// Commerce & Marketplace (9)
export const HcIconEquipmentDealers = make(ICON_DEF_MAP['equipment_dealers']);
export const HcIconTruckDealers = make(ICON_DEF_MAP['truck_dealers']);
export const HcIconTrailerDealers = make(ICON_DEF_MAP['trailer_dealers']);
export const HcIconPartsAccessories = make(ICON_DEF_MAP['parts_accessories']);
export const HcIconInstallers = make(ICON_DEF_MAP['installers']);
export const HcIconEscortEquipment = make(ICON_DEF_MAP['escort_equipment']);
export const HcIconUsedEquipment = make(ICON_DEF_MAP['used_equipment']);
export const HcIconAuctions = make(ICON_DEF_MAP['auctions']);
export const HcIconPropertyHosts = make(ICON_DEF_MAP['property_hosts']);
// Compliance & Finance (5)
export const HcIconInsurance = make(ICON_DEF_MAP['insurance']);
export const HcIconFinancingFactoring = make(ICON_DEF_MAP['financing_factoring']);
export const HcIconLegalCompliance = make(ICON_DEF_MAP['legal_compliance']);
export const HcIconPermittingAuthorities = make(ICON_DEF_MAP['permitting_authorities']);
export const HcIconInspectionServices = make(ICON_DEF_MAP['inspection_services']);
// Platform Surfaces (15)
export const HcIconLoadBoard = make(ICON_DEF_MAP['load_board']);
export const HcIconLoadAlerts = make(ICON_DEF_MAP['load_alerts']);
export const HcIconRoutePlanner = make(ICON_DEF_MAP['route_planner']);
export const HcIconReportCards = make(ICON_DEF_MAP['report_cards']);
export const HcIconDirectory = make(ICON_DEF_MAP['directory']);
export const HcIconMap = make(ICON_DEF_MAP['map']);
export const HcIconMarketplace = make(ICON_DEF_MAP['marketplace']);
export const HcIconAcademyDocs = make(ICON_DEF_MAP['academy_docs']);
export const HcIconCommunity = make(ICON_DEF_MAP['community']);
export const HcIconAdsSponsors = make(ICON_DEF_MAP['ads_sponsors']);
export const HcIconClaimsVerification = make(ICON_DEF_MAP['claims_verification']);
export const HcIconUrgentServices = make(ICON_DEF_MAP['urgent_services']);
export const HcIconMessagesChat = make(ICON_DEF_MAP['messages_chat']);
export const HcIconSavedWatchlists = make(ICON_DEF_MAP['saved_watchlists']);
export const HcIconAndMore = make(ICON_DEF_MAP['and_more']);
// Status Badges (8)
export const HcIconVerified = make(ICON_DEF_MAP['verified']);
export const HcIconClaimed = make(ICON_DEF_MAP['claimed']);
export const HcIconTopRanked = make(ICON_DEF_MAP['top_ranked']);
export const HcIconNewListing = make(ICON_DEF_MAP['new_listing']);
export const HcIconSponsored = make(ICON_DEF_MAP['sponsored']);
export const HcIconUrgent = make(ICON_DEF_MAP['urgent']);
export const HcIconAvailableNow = make(ICON_DEF_MAP['available_now']);
export const HcIconPremium = make(ICON_DEF_MAP['premium']);

// ── Registry (metadata + component ref) ────────────────────────────────────
export const HC_ICON_REGISTRY: HcIconMeta[] = ALL_ICON_DEFS.map(d => ({
    id: d.id,
    label: d.label,
    priority: d.priority,
    group: d.group,
    rank: d.rank,
    component: make(d),
}));

/** Lookup by id */
export function getHcIcon(id: string) { return HC_ICON_REGISTRY.find(e => e.id === id); }
/** All icons in a group */
export function getHcIconsByGroup(g: HcIconMeta['group']) { return HC_ICON_REGISTRY.filter(e => e.group === g); }
/** All icons at a priority */
export function getHcIconsByPriority(p: HcIconMeta['priority']) { return HC_ICON_REGISTRY.filter(e => e.priority === p); }
