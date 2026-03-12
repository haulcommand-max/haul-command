/**
 * HAUL COMMAND Ecosystem Icon Pack — Complete System
 * 80 icons · 8 variants · full registry
 *
 * Usage:
 *   import { HcIconPilotCarOperators, HcIcon, HC_ICON_REGISTRY } from '@/components/icons';
 *   <HcIconPilotCarOperators size={20} variant="duotone" />
 *   <HcIcon icon="pilot_car_operators" size={20} variant="map_pin" />
 */

// Types
export type { HcIconProps, HcIconMeta, IconPriority, IconGroup, HcVariant, IconDef } from './types';
export { HC_SVG_DEFAULTS } from './types';

// Variant renderer
export { HcIconBase } from './HcIconBase';

// All definitions
export { ALL_ICON_DEFS, ICON_DEF_MAP } from './HcIcons';

// Dynamic icon
export { HcIcon } from './HcIcons';

// Registry + lookup
export { HC_ICON_REGISTRY, getHcIcon, getHcIconsByGroup, getHcIconsByPriority } from './HcIcons';

// ── All 80 Named Components ────────────────────────────────────────────────
export {
    // Core Market (20)
    HcIconPilotCarOperators, HcIconPilotCarCompanies, HcIconHeavyHaulTrucking,
    HcIconHeavyHaulBrokers, HcIconPermitServices, HcIconRouteSurveyors,
    HcIconTruckParking, HcIconStagingYards, HcIconIndustrialOutdoorStorage,
    HcIconTruckRepairShops, HcIconMobileDieselRepair, HcIconTowRecovery,
    HcIconTrailerLeasing, HcIconTruckStops, HcIconHotels, HcIconWarehouses,
    HcIconShippersManufacturers, HcIconCdlSchools, HcIconCraneRigging, HcIconPoliceEscorts,
    // Infrastructure (14)
    HcIconSecureParking, HcIconSelfStorage, HcIconLaydownYards, HcIconPortsTerminals,
    HcIconRailIntermodal, HcIconTruckWash, HcIconFuelServices, HcIconRestAreas,
    HcIconWeighStations, HcIconBridgeClearance, HcIconRouteRestrictions,
    HcIconEscortMeetupZones, HcIconOvernightStaging, HcIconRepairInstall,
    // Support Services (9)
    HcIconTrailerRepair, HcIconTireShops, HcIconBodyFabrication,
    HcIconRoadsideAssistance, HcIconDispatchServices, HcIconRecruitingStaffing,
    HcIconTrainingCertification, HcIconSurveyEngineering, HcIconUtilityCoordination,
    // Commerce & Marketplace (9)
    HcIconEquipmentDealers, HcIconTruckDealers, HcIconTrailerDealers,
    HcIconPartsAccessories, HcIconInstallers, HcIconEscortEquipment,
    HcIconUsedEquipment, HcIconAuctions, HcIconPropertyHosts,
    // Compliance & Finance (5)
    HcIconInsurance, HcIconFinancingFactoring, HcIconLegalCompliance,
    HcIconPermittingAuthorities, HcIconInspectionServices,
    // Platform Surfaces (15)
    HcIconLoadBoard, HcIconLoadAlerts, HcIconRoutePlanner, HcIconReportCards,
    HcIconDirectory, HcIconMap, HcIconMarketplace, HcIconAcademyDocs,
    HcIconCommunity, HcIconAdsSponsors, HcIconClaimsVerification,
    HcIconUrgentServices, HcIconMessagesChat, HcIconSavedWatchlists, HcIconAndMore,
    // Status Badges (8)
    HcIconVerified, HcIconClaimed, HcIconTopRanked, HcIconNewListing,
    HcIconSponsored, HcIconUrgent, HcIconAvailableNow, HcIconPremium,
} from './HcIcons';
