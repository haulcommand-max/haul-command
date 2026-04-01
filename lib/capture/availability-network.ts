// ══════════════════════════════════════════════════════════════
// OPERATOR AVAILABILITY NETWORK
// Turns the directory from static SEO pages into a live supply network.
//
// Operators can set:
//   - Available now / available this week / offline
//   - Coverage area (radius or polygon)
//   - Specializations (high pole / steer / chase / route survey)
//   - Equipment on hand
//   - Preferred corridors
//
// This data feeds:
//   - Directory sort order (available operators rank higher)
//   - Map pins (available = green, offline = gray)
//   - Dispatch routing (only available operators receive waves)
//   - Broker search results (filter by availability)
//   - Coverage gap detection (where do we NOT have available supply?)
// ══════════════════════════════════════════════════════════════

export type AvailabilityStatus =
  | 'available_now'       // Green — ready for immediate dispatch
  | 'available_today'     // Yellow-green — available within hours
  | 'available_this_week' // Yellow — available for future booking
  | 'booked'              // Orange — currently on a job
  | 'offline'             // Gray — not accepting jobs
  | 'unknown';            // No data — unclaimed or unset

export type EscortSpecialization =
  | 'high_pole'
  | 'steer_car'
  | 'chase_vehicle'
  | 'route_survey'
  | 'lead_car'
  | 'rear_guard'
  | 'dual_lane'
  | 'night_escort'
  | 'superload'
  | 'bridge_inspection';

export interface OperatorAvailability {
  operatorId: string;
  status: AvailabilityStatus;
  statusUpdatedAt: string;

  // Location
  currentLat: number | null;
  currentLng: number | null;
  currentCity: string | null;
  currentState: string | null;
  currentCountry: string;     // ISO 3166-1 alpha-2

  // Coverage
  coverageRadiusMiles: number;
  coverageStates: string[];   // state/province codes
  preferredCorridors: string[]; // corridor slugs

  // Capabilities
  specializations: EscortSpecialization[];
  equipmentOnHand: string[];   // e.g., "height pole", "amber lights", "oversize signs"
  vehicleType: string | null;  // e.g., "2024 Ford F-150", "2023 Ram 1500"
  insuranceVerified: boolean;
  certificationStates: string[]; // states where certified

  // Availability windows
  availableFrom: string | null;  // ISO datetime — when they become available
  availableUntil: string | null; // ISO datetime — when they go offline
  timezone: string;              // IANA timezone

  // Pricing (optional, operator-set)
  ratePerMile: number | null;
  ratePerHour: number | null;
  minimumCharge: number | null;
  currency: string;              // ISO 4217

  // Freshness
  lastPingAt: string | null;     // from app GPS or manual check-in
  autoOfflineAfterHours: number; // auto-set to offline if no ping
  streakDays: number;            // consecutive days of check-in
}

// ── Ranking boost for available operators ──
export function availabilityBoost(status: AvailabilityStatus): number {
  switch (status) {
    case 'available_now': return 3.0;     // 3x ranking boost
    case 'available_today': return 2.0;   // 2x
    case 'available_this_week': return 1.5;
    case 'booked': return 0.8;            // Slight penalty — can't take jobs
    case 'offline': return 0.5;           // Half ranking
    case 'unknown': return 0.3;           // Unclaimed = lowest
  }
}

// ── Auto-offline logic ──
export function shouldAutoOffline(availability: OperatorAvailability, now: Date = new Date()): boolean {
  if (availability.status === 'offline' || availability.status === 'unknown') return false;
  if (!availability.lastPingAt) return true; // Never pinged

  const lastPing = new Date(availability.lastPingAt);
  const hoursSince = (now.getTime() - lastPing.getTime()) / 3600000;
  return hoursSince >= availability.autoOfflineAfterHours;
}

// ── Coverage gap detection ──
export interface CoverageGap {
  state: string;
  city: string;
  lat: number;
  lng: number;
  demandSignals: number;      // How many searches/requests in this area
  availableOperators: number;  // How many are currently available
  gapSeverity: 'critical' | 'moderate' | 'low';
}

export function calculateGapSeverity(demand: number, supply: number): CoverageGap['gapSeverity'] {
  if (supply === 0 && demand > 3) return 'critical';
  if (supply === 0 && demand > 0) return 'moderate';
  const ratio = demand / Math.max(supply, 1);
  if (ratio > 5) return 'critical';
  if (ratio > 2) return 'moderate';
  return 'low';
}
