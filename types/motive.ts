/**
 * Motive API Types — HAUL COMMAND
 *
 * Complete TypeScript types for the Motive (KeepTruckin) API.
 * Based on: https://developer.gomotive.com/reference
 */

// ═══ OAuth ═══
export interface MotiveOAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  scope: string;
  created_at: number; // unix timestamp
}

export interface MotiveOAuthState {
  profile_id: string;
  return_url?: string;
}

// ═══ Company ═══
export interface MotiveCompany {
  id: number;
  name: string;
  dot_number?: string | null;
  mc_number?: string | null;
  time_zone?: string;
  address?: MotiveAddress;
}

export interface MotiveAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// ═══ User / Driver ═══
export interface MotiveUser {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
  email?: string | null;
  phone?: string | null;
  status: 'active' | 'deactivated';
  role: 'driver' | 'admin' | 'fleet_manager';
  drivers_license_number?: string | null;
  drivers_license_state?: string | null;
  cycle?: string; // HOS cycle e.g. 'USA Property 70-hour/8-day'
  timezone?: string;
  carrier_name?: string;
  carrier_street?: string;
  carrier_city?: string;
  carrier_state?: string;
  carrier_zip?: string;
  terminal_street?: string;
  terminal_city?: string;
  terminal_state?: string;
  terminal_zip?: string;
}

// ═══ Vehicle ═══
export interface MotiveVehicle {
  id: number;
  number: string; // Unit number
  status: 'active' | 'deactivated';
  year?: string;
  make?: string;
  model?: string;
  vin?: string;
  license_plate_number?: string;
  license_plate_state?: string;
  fuel_type?: 'diesel' | 'gasoline' | 'electric' | 'other';
  metric_units?: boolean;
  eld_device?: MotiveEldDevice;
  current_location?: MotiveLocation;
}

export interface MotiveEldDevice {
  id: number;
  identifier: string;
  model: string;
  serial_number?: string;
}

// ═══ Location ═══
export interface MotiveLocation {
  id?: number;
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number; // mph
  located_at?: string; // ISO 8601
  description?: string;
  engine_hours?: number;
  odometer?: number;
  fuel?: number; // percentage
  vehicle?: { id: number; number: string };
  driver?: { id: number; first_name: string; last_name: string };
}

// ═══ HOS (Hours of Service) ═══
export interface MotiveHosLog {
  id: number;
  driver_id: number;
  vehicle_id?: number;
  date: string; // YYYY-MM-DD
  status: MotiveHosStatus;
  start_time: string; // ISO 8601
  end_time?: string;
  duration: number; // seconds
  location?: MotiveLocation;
  annotation?: string;
  origin?: 'auto' | 'manual' | 'eld';
}

export type MotiveHosStatus =
  | 'off_duty'
  | 'sleeper'
  | 'driving'
  | 'on_duty'
  | 'yard_move'
  | 'personal_conveyance';

export interface MotiveHosSummary {
  driver_id: number;
  date: string;
  driving_duration: number; // seconds
  on_duty_duration: number;
  sleeper_duration: number;
  off_duty_duration: number;
  cycle_remaining: number; // seconds remaining in cycle
  drive_remaining: number; // seconds remaining for driving
  shift_remaining: number; // seconds remaining in shift
  break_remaining: number; // seconds until break required
  violations: MotiveHosViolation[];
}

export interface MotiveHosViolation {
  type: string;
  start_time: string;
  end_time?: string;
  severity: 'warning' | 'violation';
}

// ═══ DVIR (Inspection Reports) ═══
export interface MotiveDvir {
  id: number;
  vehicle_id: number;
  driver_id: number;
  date: string;
  type: 'pre_trip' | 'post_trip' | 'en_route';
  status: 'safe' | 'unsafe' | 'resolved';
  defects: MotiveDvirDefect[];
  location?: MotiveLocation;
  odometer?: number;
}

export interface MotiveDvirDefect {
  area: string;
  category: string;
  notes?: string;
  severity: 'minor' | 'major';
}

// ═══ Fault Codes ═══
export interface MotiveFaultCode {
  id: number;
  vehicle_id: number;
  code: string;
  description?: string;
  source: string;
  first_observed_at: string;
  last_observed_at: string;
  count: number;
}

// ═══ IFTA ═══
export interface MotiveIftaTrip {
  id: number;
  vehicle_id: number;
  driver_id?: number;
  start_time: string;
  end_time: string;
  start_jurisdiction: string;
  end_jurisdiction: string;
  distance: number; // miles
  fuel_consumed?: number; // gallons
}

// ═══ Webhook Events ═══
export type MotiveWebhookEventType =
  | 'vehicle.created'
  | 'vehicle.updated'
  | 'vehicle.location'
  | 'driver.created'
  | 'driver.updated'
  | 'hos.updated'
  | 'dvir.created'
  | 'dvir.updated'
  | 'fault_code.created'
  | 'document.created';

export interface MotiveWebhookPayload {
  event: MotiveWebhookEventType;
  company_id: number;
  data: Record<string, unknown>;
  occurred_at: string;
  webhook_id: string;
}

// ═══ API Response Wrappers ═══
export interface MotiveListResponse<T> {
  users?: T[];
  vehicles?: T[];
  vehicle_locations?: T[];
  hos_logs?: T[];
  inspection_reports?: T[];
  fault_codes?: T[];
  ifta_trips?: T[];
  pagination?: MotivePagination;
}

export interface MotivePagination {
  per_page: number;
  page_no: number;
  total: number;
}
