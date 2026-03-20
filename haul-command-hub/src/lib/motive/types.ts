/**
 * Motive (GoMotive) API — Type Definitions
 *
 * Full TypeScript types for every Motive endpoint Haul Command consumes.
 * Base URL: https://api.gomotive.com
 * Docs: https://developer.gomotive.com/reference
 * App ID: 67348
 */

// ═══════════════════════════════════════════════════════════════
// Core / Shared
// ═══════════════════════════════════════════════════════════════

export interface MotivePaginationMeta {
  per_page: number;
  page_no: number;
  total: number;
}

export interface MotivePaginatedResponse<T> {
  data: T;
  pagination?: MotivePaginationMeta;
}

/** OAuth2 token response from Motive */
export interface MotiveOAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;       // seconds
  refresh_token: string;
  scope: string;
  created_at: number;       // Unix timestamp
}

/** Stored token with metadata for refresh management */
export interface MotiveStoredToken {
  access_token: string;
  refresh_token: string;
  expires_at: string;        // ISO datetime
  scope: string;
  motive_company_id?: string;
  provider_id?: string;       // HC provider linked
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════
// Company
// ═══════════════════════════════════════════════════════════════

export interface MotiveCompany {
  id: number;
  name: string;
  dot_number?: string;
  mc_number?: string;
  time_zone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface MotiveCompanyResponse {
  company: MotiveCompany;
}

// ═══════════════════════════════════════════════════════════════
// Users / Drivers
// ═══════════════════════════════════════════════════════════════

export interface MotiveUser {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
  email?: string;
  phone?: string;
  phone_ext?: string;
  status: 'active' | 'deactivated';
  role: 'fleet_admin' | 'fleet_user' | 'driver' | 'dispatcher';
  driver_company_id?: string;
  time_zone?: string;
  carrier_name?: string;
  license_number?: string;
  license_state?: string;
  current_vehicle?: {
    id: number;
    number: string;
  };
  current_location?: MotiveLocation;
}

export interface MotiveUserResponse {
  user: MotiveUser;
}

export interface MotiveUsersResponse {
  users: { user: MotiveUser }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Vehicles
// ═══════════════════════════════════════════════════════════════

export interface MotiveVehicle {
  id: number;
  number: string;
  status: 'active' | 'deactivated';
  ifta: boolean;
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  license_plate_state?: string;
  license_plate_number?: string;
  metric_units: boolean;
  fuel_type?: 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'other';
  current_driver?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  current_location?: MotiveLocation;
  eld_device?: {
    id: number;
    identifier: string;
    model: string;
  };
  external_ids?: Record<string, string>;
}

export interface MotiveVehicleResponse {
  vehicle: MotiveVehicle;
}

export interface MotiveVehiclesResponse {
  vehicles: { vehicle: MotiveVehicle }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Locations
// ═══════════════════════════════════════════════════════════════

export interface MotiveLocation {
  id?: number;
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;              // mph
  description?: string;
  located_at?: string;         // ISO datetime
  engine_hours?: number;
  odometer?: number;
  fuel_primary_remaining_percentage?: number;
  type?: string;
}

export interface MotiveVehicleLocation {
  vehicle: {
    id: number;
    number: string;
    current_driver?: {
      id: number;
      first_name: string;
      last_name: string;
    };
  };
  last_seen_at?: string;      // ISO datetime
  current_location: MotiveLocation;
}

export interface MotiveVehicleLocationsResponse {
  vehicle_locations: MotiveVehicleLocation[];
  pagination?: MotivePaginationMeta;
}

export interface MotiveDriverLocation {
  driver: {
    id: number;
    first_name: string;
    last_name: string;
    status: string;
  };
  vehicle?: {
    id: number;
    number: string;
  };
  last_seen_at?: string;
  current_location: MotiveLocation;
}

export interface MotiveDriverLocationsResponse {
  drivers: MotiveDriverLocation[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Hours of Service (HOS)
// ═══════════════════════════════════════════════════════════════

export type MotiveHOSStatus =
  | 'off_duty'
  | 'sleeper'
  | 'driving'
  | 'on_duty'
  | 'yard_move'
  | 'personal_conveyance';

export interface MotiveHOSLog {
  id: number;
  status: MotiveHOSStatus;
  start_time: string;         // ISO datetime
  end_time?: string;          // ISO datetime
  duration?: number;          // seconds
  vehicle?: {
    id: number;
    number: string;
  };
  location?: MotiveLocation;
  annotations?: string;
  origin?: string;
}

export interface MotiveHOSLogsResponse {
  hos_logs: { hos_log: MotiveHOSLog }[];
  pagination?: MotivePaginationMeta;
}

export interface MotiveDriverAvailableTime {
  driver: {
    id: number;
    first_name: string;
    last_name: string;
    status: string;
  };
  available_time: {
    drive: number;              // seconds remaining
    shift: number;
    cycle: number;
    break: number;
  };
  violations?: {
    type: string;
    start_time: string;
  }[];
  current_duty_status?: MotiveHOSStatus;
}

export interface MotiveDriversAvailableTimeResponse {
  available_times: { available_time: MotiveDriverAvailableTime }[];
  pagination?: MotivePaginationMeta;
}

export interface MotiveHOSViolation {
  driver: {
    id: number;
    first_name: string;
    last_name: string;
  };
  violation_type: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  regulation_mode?: string;
}

export interface MotiveHOSViolationsResponse {
  violations: { violation: MotiveHOSViolation }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Freight Visibility
// ═══════════════════════════════════════════════════════════════

export interface MotiveFreightVehicleLocation {
  vehicle_id: string;
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;
  located_at: string;          // ISO datetime
  company_id?: string;
}

export interface MotiveFreightVehicleLocationsResponse {
  vehicle_locations: MotiveFreightVehicleLocation[];
}

export interface MotiveFreightSubscription {
  id: string;
  vehicle_id: string;
  company_id?: string;
  expires_at: string;          // ISO datetime
  created_at: string;
}

export interface MotiveFreightSubscribeRequest {
  vehicle_id: string;
  duration_hours?: number;     // default: 24
}

export interface MotiveFreightSubscribeResponse {
  tracking_subscription: MotiveFreightSubscription;
}

export interface MotiveNearbyVehicle {
  vehicle_id: string;
  company_id: string;
  distance_miles: number;
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;
  located_at: string;
  driver?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

/** V2 nearby vehicles include scoring (proximity + HOS + direction) */
export interface MotiveNearbyVehicleV2 extends MotiveNearbyVehicle {
  score: number;
  available_drive_time_seconds?: number;
  heading_match?: boolean;
}

export interface MotiveNearbyVehiclesResponse {
  vehicles: MotiveNearbyVehicle[];
}

export interface MotiveNearbyVehiclesV2Response {
  vehicles: MotiveNearbyVehicleV2[];
}

export interface MotiveFreightCompany {
  company_id: string;
  name: string;
  dot_number?: string;
  allows_tracking: boolean;
}

export interface MotiveFreightCompaniesResponse {
  companies: MotiveFreightCompany[];
}

// ═══════════════════════════════════════════════════════════════
// Fuel Purchases
// ═══════════════════════════════════════════════════════════════

export interface MotiveFuelPurchase {
  id: number;
  cost: number;
  fuel_type?: string;
  gallons?: number;
  price_per_gallon?: number;
  reference_number?: string;
  vendor_name?: string;
  vehicle?: {
    id: number;
    number: string;
  };
  driver?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  location?: {
    lat?: number;
    lon?: number;
    description?: string;
    state?: string;
    city?: string;
  };
  purchased_at: string;        // ISO datetime
}

export interface MotiveFuelPurchasesResponse {
  fuel_purchases: { fuel_purchase: MotiveFuelPurchase }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// IFTA Reports
// ═══════════════════════════════════════════════════════════════

export interface MotiveIFTATrip {
  id: number;
  vehicle: {
    id: number;
    number: string;
  };
  jurisdiction: string;        // state/province code
  start_odometer: number;
  end_odometer: number;
  distance: number;            // miles
  fuel_purchased_gallons?: number;
  start_time: string;
  end_time: string;
}

export interface MotiveIFTATripsResponse {
  ifta_trips: { ifta_trip: MotiveIFTATrip }[];
  pagination?: MotivePaginationMeta;
}

export interface MotiveMileageSummary {
  vehicle: {
    id: number;
    number: string;
  };
  jurisdiction: string;
  total_distance: number;
  fuel_purchased: number;
}

export interface MotiveMileageSummaryResponse {
  mileage_summaries: MotiveMileageSummary[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Scorecard / Safety
// ═══════════════════════════════════════════════════════════════

export interface MotiveScorecardSummary {
  vehicle: {
    id: number;
    number: string;
  };
  total_score: number;
  harsh_acceleration_score?: number;
  harsh_braking_score?: number;
  harsh_cornering_score?: number;
  speeding_score?: number;
  seatbelt_score?: number;
  idle_time_score?: number;
  total_distance_miles?: number;
  total_drive_time_seconds?: number;
  total_idle_time_seconds?: number;
  period_start: string;
  period_end: string;
}

export interface MotiveScorecardSummaryResponse {
  scorecard_summaries: { scorecard_summary: MotiveScorecardSummary }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Driver Performance Events (Safety Events)
// ═══════════════════════════════════════════════════════════════

export type MotivePerformanceEventType =
  | 'harsh_braking'
  | 'harsh_acceleration'
  | 'harsh_cornering'
  | 'speeding'
  | 'seatbelt'
  | 'distracted_driving'
  | 'drowsy_driving'
  | 'phone_use'
  | 'smoking'
  | 'lane_departure'
  | 'following_distance'
  | 'forward_collision_warning'
  | 'stop_sign_violation'
  | 'rolling_stop';

export interface MotivePerformanceEvent {
  id: number;
  type: MotivePerformanceEventType;
  driver: {
    id: number;
    first_name: string;
    last_name: string;
  };
  vehicle: {
    id: number;
    number: string;
  };
  location?: MotiveLocation;
  start_time: string;
  end_time?: string;
  severity?: 'low' | 'medium' | 'high';
  reviewed?: boolean;
  video_url?: string;
}

export interface MotivePerformanceEventsResponse {
  driver_performance_events: { driver_performance_event: MotivePerformanceEvent }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Inspection Reports (DVIR)
// ═══════════════════════════════════════════════════════════════

export interface MotiveInspectionReport {
  id: number;
  type: 'pre_trip' | 'post_trip' | 'ad_hoc';
  status: 'satisfactory' | 'unsatisfactory' | 'condition_satisfactory';
  vehicle: {
    id: number;
    number: string;
  };
  driver: {
    id: number;
    first_name: string;
    last_name: string;
  };
  location?: MotiveLocation;
  defects?: {
    area: string;
    category: string;
    notes?: string;
  }[];
  inspection_date: string;
  submitted_at: string;
}

export interface MotiveInspectionReportsResponse {
  inspection_reports: { inspection_report: MotiveInspectionReport }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Dispatches
// ═══════════════════════════════════════════════════════════════

export type MotiveDispatchStatus =
  | 'unassigned'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface MotiveDispatchStop {
  id: number;
  type: 'pickup' | 'delivery' | 'other';
  name?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  scheduled_arrival?: string;
  actual_arrival?: string;
  actual_departure?: string;
  status: 'pending' | 'arrived' | 'departed';
}

export interface MotiveDispatch {
  id: number;
  external_id?: string;
  status: MotiveDispatchStatus;
  driver?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  vehicle?: {
    id: number;
    number: string;
  };
  stops: MotiveDispatchStop[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MotiveDispatchesResponse {
  dispatches: { dispatch: MotiveDispatch }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Geofences
// ═══════════════════════════════════════════════════════════════

export interface MotiveGeofenceEvent {
  id: number;
  type: 'entry' | 'exit';
  geofence: {
    id: number;
    name: string;
  };
  vehicle: {
    id: number;
    number: string;
  };
  driver?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  location: MotiveLocation;
  event_time: string;
}

export interface MotiveGeofenceEventsResponse {
  geofence_events: { geofence_event: MotiveGeofenceEvent }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Fault Codes
// ═══════════════════════════════════════════════════════════════

export interface MotiveFaultCode {
  id: number;
  code: string;
  description?: string;
  severity?: string;
  source?: string;
  vehicle: {
    id: number;
    number: string;
  };
  first_observed_at: string;
  last_observed_at: string;
}

export interface MotiveFaultCodesResponse {
  fault_codes: { fault_code: MotiveFaultCode }[];
  pagination?: MotivePaginationMeta;
}

// ═══════════════════════════════════════════════════════════════
// Webhooks
// ═══════════════════════════════════════════════════════════════

export type MotiveWebhookEventType =
  | 'vehicle_location_updated'
  | 'hos_violation'
  | 'dispatch_status_changed'
  | 'driver_performance_event'
  | 'fuel_purchase_created'
  | 'inspection_report_submitted'
  | 'fault_code_detected'
  | 'geofence_entry'
  | 'geofence_exit'
  | 'vehicle_gateway_disconnected'
  | 'camera_event';

export interface MotiveWebhookPayload {
  id: string;
  type: MotiveWebhookEventType;
  company_id: number;
  object_type: string;
  object_id: number;
  action: string;
  data: Record<string, unknown>;
  occurred_at: string;          // ISO datetime
  webhook_id: number;
}

// ═══════════════════════════════════════════════════════════════
// API Request Params (for client methods)
// ═══════════════════════════════════════════════════════════════

export interface MotivePaginationParams {
  page_no?: number;
  per_page?: number;
}

export interface MotiveDateRangeParams {
  start_date?: string;           // YYYY-MM-DD
  end_date?: string;
}

export interface MotiveLocationSearchParams {
  lat: number;
  lon: number;
  radius_miles?: number;
}

export interface MotiveVehiclesParams extends MotivePaginationParams {
  status?: 'active' | 'deactivated';
}

export interface MotiveLocationsParams extends MotivePaginationParams {
  vehicle_ids?: string;          // comma-separated
}

export interface MotiveHOSParams extends MotivePaginationParams, MotiveDateRangeParams {
  driver_ids?: string;           // comma-separated
}

export interface MotiveDriversAvailableTimeParams extends MotivePaginationParams {
  driver_ids?: string;
}

export interface MotiveFuelPurchasesParams extends MotivePaginationParams, MotiveDateRangeParams {
  vehicle_ids?: string;
}

export interface MotiveIFTAParams extends MotivePaginationParams, MotiveDateRangeParams {
  vehicle_ids?: string;
}

export interface MotiveScorecardParams extends MotivePaginationParams, MotiveDateRangeParams {
  vehicle_ids?: string;
}

export interface MotivePerformanceEventsParams extends MotivePaginationParams, MotiveDateRangeParams {
  driver_ids?: string;
  types?: MotivePerformanceEventType[];
}

export interface MotiveNearbyVehiclesParams {
  lat: number;
  lon: number;
  radius_miles?: number;
}

export interface MotiveFreightCompaniesParams extends MotivePaginationParams {
  dot_number?: string;
}
