/**
 * HC Route — Type Definitions
 * 
 * Complete TypeScript types for the HC Route oversize load routing engine.
 * Covers: vehicle profiles, road restrictions, hazard reports, permit routes.
 */

// ─── RESTRICTION TYPES ────────────────────────────────────────────────

export type RestrictionType =
  | 'bridge_height'
  | 'bridge_weight'
  | 'road_width'
  | 'road_weight'
  | 'turn_radius'
  | 'school_zone'
  | 'residential'
  | 'time_restricted'
  | 'seasonal'
  | 'construction'
  | 'utility_line'
  | 'no_oversize'
  | 'no_hazmat'
  | 'grade'
  | 'tunnel';

export type RestrictionSource =
  | 'nbi'            // FHWA National Bridge Inventory
  | 'osm'            // OpenStreetMap
  | 'state_dot'      // State DOT
  | 'crowd_sourced'  // Driver reports
  | 'lidar'          // LiDAR measurement
  | 'manual';        // Manual entry

export interface RoadRestriction {
  id: string;
  lat: number;
  lng: number;
  osmWayId?: number;
  roadName?: string;
  stateCode?: string;
  county?: string;
  restrictionType: RestrictionType;
  maxHeightFt?: number;
  maxWidthFt?: number;
  maxWeightLbs?: number;
  maxLengthFt?: number;
  maxAxleWeightLbs?: number;
  minTurnRadiusFt?: number;
  activeDays?: string[];
  activeStartTime?: string;
  activeEndTime?: string;
  seasonalStart?: string;
  seasonalEnd?: string;
  source: RestrictionSource;
  confidenceScore: number; // 0.0 to 1.0
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  photoUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── VEHICLE PROFILE TYPES ────────────────────────────────────────────

export type VehicleType =
  | 'mobile_home'
  | 'modular_building'
  | 'heavy_equipment'
  | 'wind_turbine_blade'
  | 'transformer'
  | 'construction_beam'
  | 'military_vehicle'
  | 'crane'
  | 'house_move'
  | 'custom';

export interface VehicleProfile {
  id: string;
  operatorId: string;
  profileName: string;
  vehicleType: VehicleType;
  totalHeightFt: number;
  totalWidthFt: number;
  totalLengthFt: number;
  grossWeightLbs: number;
  numAxles: number;
  axleWeightLbs?: number;
  minTurnRadiusFt?: number;
  heightBufferFt: number;  // Safety margin above height
  widthBufferFt: number;   // Safety margin beyond width
  requiresEscort: boolean;
  requiresPilotCar: boolean;
  requiresPoliceEscort: boolean;
  requiresUtilityNotification: boolean;
  hazmat: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── PERMIT ROUTE TYPES ───────────────────────────────────────────────

export type PermitType = 'single_trip' | 'annual' | 'multi_trip' | 'superload';

export interface PermitRouteConflict {
  type: RestrictionType;
  location: { lat: number; lng: number };
  detail: string;
  severity: 'warning' | 'critical';
}

export interface PermitRouteWaypoint {
  lat: number;
  lng: number;
  instruction: string;
  roadName: string;
  sequence: number;
}

export interface PermitRoute {
  id: string;
  operatorId: string;
  loadId?: string;
  vehicleProfileId: string;
  permitNumber: string;
  issuingState: string;
  permitType: PermitType;
  permittedHeightFt?: number;
  permittedWidthFt?: number;
  permittedLengthFt?: number;
  permittedWeightLbs?: number;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  waypoints: PermitRouteWaypoint[];
  routeValidated: boolean;
  restrictionsChecked: boolean;
  conflictCount: number;
  conflicts: PermitRouteConflict[];
  travelTimeStart?: string;
  travelTimeEnd?: string;
  noTravelDays?: string[];
  noTravelDates?: string[];
  maxSpeedMph?: number;
  permitPdfUrl?: string;
  permitRawText?: string;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

// ─── HAZARD REPORT TYPES ──────────────────────────────────────────────

export type HazardType =
  // Oversize-specific
  | 'low_bridge'
  | 'low_utility_line'
  | 'narrow_road'
  | 'tight_turn'
  | 'soft_shoulder'
  | 'steep_grade'
  | 'low_tree_branches'
  | 'construction_overhead'
  // General (Waze-style)
  | 'construction'
  | 'road_closure'
  | 'lane_closure'
  | 'accident'
  | 'police'
  | 'road_damage'
  | 'flooding'
  | 'weather'
  | 'school_zone_active'
  | 'weight_station_open'
  // Positive
  | 'good_route'
  | 'clearance_verified';

export type HazardSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface HazardReport {
  id: string;
  reporterId: string;
  operatorId?: string;
  lat: number;
  lng: number;
  roadName?: string;
  direction?: string;
  hazardType: HazardType;
  description?: string;
  measuredHeightFt?: number;
  measuredWidthFt?: number;
  photoUrls?: string[];
  severity: HazardSeverity;
  isActive: boolean;
  expiresAt?: string;
  confirmations: number;
  denials: number;
  confidenceScore: number;
  reportedAt: string;
  lastConfirmedAt?: string;
}

// ─── ROUTING ENGINE TYPES ─────────────────────────────────────────────

export interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  vehicleProfile: VehicleProfile;
  permitRoute?: PermitRoute;  // If following a specific permit route
  avoidHazards: boolean;
  includeAlternatives: boolean;
}

export type AlertLevel = 'stop' | 'caution' | 'slow' | 'info' | 'verified';

export interface RouteAlert {
  level: AlertLevel;
  message: string;
  location: { lat: number; lng: number };
  distanceAheadMiles: number;
  restriction?: RoadRestriction;
  hazard?: HazardReport;
}

export interface RouteResult {
  success: boolean;
  distance: number;           // miles
  duration: number;           // minutes
  geometry: any;              // GeoJSON LineString
  alerts: RouteAlert[];
  restrictionsAvoided: number;
  hazardsOnRoute: number;
  permitCompliant: boolean;
  alternativeRoutes?: RouteResult[];
}
