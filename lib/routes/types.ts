/**
 * Heavy Haul Route Intelligence — Shared Types
 * Purpose-built for oversize/overweight load transport.
 */

export interface LoadDimensions {
  width_m: number;
  height_m: number;
  length_m: number;
  weight_kg: number;
}

export interface PermitRoute {
  id: string;
  load_id: string;
  country_code: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  route_geojson: GeoJSON.LineString | GeoJSON.MultiLineString;
  total_distance_km: number;
  permit_number: string | null;
  valid_from: string | null;
  valid_until: string | null;
  travel_windows: TravelWindow[] | null;
  load_dimensions: LoadDimensions | null;
  notes: string | null;
  created_at: string;
}

export interface TravelWindow {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  start_hour: number; // 0-23
  end_hour: number;
}

export interface ClearancePoint {
  id: string;
  lat: number;
  lng: number;
  country_code: string;
  clearance_posted_m: number | null;
  clearance_actual_m: number | null;
  clearance_source: 'osm' | 'dot' | 'crowdsourced' | 'permit';
  obstacle_type: 'bridge' | 'overpass' | 'railroad' | 'power_line' | 'tunnel';
  road_name: string | null;
  verified_by_count: number;
  last_verified_at: string | null;
  notes: string | null;
}

export interface ClearanceWarning extends ClearancePoint {
  margin_m: number; // how close the load is to hitting it
  risk_level: 'safe' | 'tight' | 'danger' | 'blocked';
}

export interface WeightRestriction {
  id: string;
  lat: number;
  lng: number;
  country_code: string;
  road_name: string | null;
  max_gross_weight_kg: number | null;
  max_axle_weight_kg: number | null;
  restriction_type: 'permanent' | 'seasonal' | 'emergency';
  active_from: string | null;
  active_until: string | null;
  notes: string | null;
}

export interface ConvoyPosition {
  id: string;
  load_id: string;
  operator_id: string;
  role: 'lead_pilot' | 'rear_pilot' | 'load_driver' | 'supervisor';
  lat: number;
  lng: number;
  speed_kmh: number | null;
  heading_degrees: number | null;
  on_permit_route: boolean;
  updated_at: string;
  // Joined fields
  display_name?: string;
  avatar_url?: string;
}

export interface RouteDeviation {
  id: string;
  load_id: string;
  operator_id: string;
  deviation_lat: number;
  deviation_lng: number;
  distance_from_route_m: number;
  severity: 'info' | 'warning' | 'critical';
  detected_at: string;
  resolved_at: string | null;
  resolution: string | null;
}

export interface RouteCheckpoint {
  id: string;
  lat: number;
  lng: number;
  country_code: string;
  checkpoint_type: 'weigh_station' | 'dot_checkpoint' | 'port_of_entry' | 'toll' | 'low_clearance_warning' | 'timing_issue' | 'road_condition';
  name: string | null;
  description: string | null;
  severity: 'info' | 'caution' | 'warning' | 'critical';
  verified_count: number;
  last_reported_at: string;
}

export interface RouteCalculationRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  load_dimensions: LoadDimensions;
  country_code: string;
  avoid_tolls?: boolean;
  prefer_highways?: boolean;
}

export interface RouteCalculationResult {
  route_geojson: GeoJSON.LineString;
  total_distance_km: number;
  estimated_duration_hours: number;
  clearance_warnings: ClearanceWarning[];
  weight_warnings: WeightRestriction[];
  checkpoints_on_route: RouteCheckpoint[];
  suggested_travel_windows: TravelWindow[];
  risk_summary: {
    total_clearance_warnings: number;
    blocked_clearances: number;
    weight_violations: number;
    checkpoint_count: number;
    overall_risk: 'low' | 'moderate' | 'high' | 'blocked';
  };
}

export interface IntelSubmission {
  load_id: string;
  clearance_concerns: string | null;
  strict_checkpoints: boolean;
  checkpoint_lat: number | null;
  checkpoint_lng: number | null;
  timing_issues: string | null;
}
