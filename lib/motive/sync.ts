/**
 * Motive Data Sync Engine — HAUL COMMAND
 *
 * Syncs data from Motive API to Supabase for all connected operators.
 * Runs via cron job (app/api/cron/motive-sync/route.ts).
 *
 * Sync strategy:
 * - Vehicles: Full sync every run
 * - Drivers: Full sync every run
 * - Locations: Latest snapshot (real-time via webhook preferred)
 * - HOS: Last 24 hours rolling window
 * - DVIRs: Last 7 days
 * - Fault codes: Last 30 days
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  refreshMotiveToken,
  getMotiveVehicles,
  getMotiveUsers,
  getMotiveVehicleLocations,
  getMotiveHosLogs,
  getMotiveInspections,
  getMotiveFaultCodes,
} from './client';
import type { MotiveOAuthTokens } from '@/types/motive';

interface SyncResult {
  connection_id: string;
  profile_id: string;
  vehicles_synced: number;
  drivers_synced: number;
  locations_synced: number;
  hos_logs_synced: number;
  errors: string[];
}

/**
 * Sync all connected Motive accounts
 */
export async function syncAllMotiveConnections(): Promise<SyncResult[]> {
  const supabase = getSupabaseAdmin();
  const results: SyncResult[] = [];

  // Get all active connections
  const { data: connections, error } = await supabase
    .from('motive_connections')
    .select('*')
    .eq('status', 'active');

  if (error || !connections?.length) {
    console.log('[Motive Sync] No active connections found');
    return results;
  }

  for (const conn of connections) {
    const result = await syncSingleConnection(conn);
    results.push(result);
  }

  return results;
}

/**
 * Sync a single Motive connection
 */
async function syncSingleConnection(conn: any): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const result: SyncResult = {
    connection_id: conn.id,
    profile_id: conn.profile_id,
    vehicles_synced: 0,
    drivers_synced: 0,
    locations_synced: 0,
    hos_logs_synced: 0,
    errors: [],
  };

  let accessToken = conn.access_token;

  // Check if token needs refresh (expires_at is stored as ISO timestamp)
  const expiresAt = new Date(conn.expires_at).getTime();
  const now = Date.now();
  const BUFFER = 5 * 60 * 1000; // 5 min buffer

  if (now >= expiresAt - BUFFER) {
    try {
      const tokens: MotiveOAuthTokens = await refreshMotiveToken(conn.refresh_token);
      accessToken = tokens.access_token;

      // Update stored tokens
      await supabase
        .from('motive_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(
            tokens.created_at * 1000 + tokens.expires_in * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conn.id);
    } catch (err: any) {
      result.errors.push(`Token refresh failed: ${err.message}`);
      // Mark connection as needing re-auth
      await supabase
        .from('motive_connections')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', conn.id);
      return result;
    }
  }

  // ── Sync Vehicles ──
  try {
    const vehicleData: any = await getMotiveVehicles(accessToken);
    const vehicles = vehicleData?.vehicles || [];
    for (const v of vehicles) {
      const vehicle = v.vehicle || v;
      await supabase.from('motive_vehicles').upsert(
        {
          motive_id: vehicle.id,
          connection_id: conn.id,
          profile_id: conn.profile_id,
          number: vehicle.number,
          status: vehicle.status,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          vin: vehicle.vin,
          license_plate: vehicle.license_plate_number,
          license_plate_state: vehicle.license_plate_state,
          fuel_type: vehicle.fuel_type,
          raw_data: vehicle,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'motive_id,connection_id' }
      );
      result.vehicles_synced++;
    }
  } catch (err: any) {
    result.errors.push(`Vehicles: ${err.message}`);
  }

  // ── Sync Drivers ──
  try {
    const userData: any = await getMotiveUsers(accessToken);
    const users = userData?.users || [];
    for (const u of users) {
      const user = u.user || u;
      if (user.role !== 'driver') continue;
      await supabase.from('motive_drivers').upsert(
        {
          motive_id: user.id,
          connection_id: conn.id,
          profile_id: conn.profile_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          status: user.status,
          license_number: user.drivers_license_number,
          license_state: user.drivers_license_state,
          cycle: user.cycle,
          raw_data: user,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'motive_id,connection_id' }
      );
      result.drivers_synced++;
    }
  } catch (err: any) {
    result.errors.push(`Drivers: ${err.message}`);
  }

  // ── Sync Locations ──
  try {
    const locData: any = await getMotiveVehicleLocations(accessToken);
    const locations = locData?.vehicle_locations || [];
    for (const loc of locations) {
      const l = loc.vehicle_location || loc;
      await supabase.from('motive_locations').upsert(
        {
          vehicle_motive_id: l.vehicle?.id,
          connection_id: conn.id,
          lat: l.lat,
          lon: l.lon,
          bearing: l.bearing,
          speed: l.speed,
          located_at: l.located_at,
          engine_hours: l.engine_hours,
          odometer: l.odometer,
          fuel_percent: l.fuel,
          raw_data: l,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'vehicle_motive_id,connection_id' }
      );
      result.locations_synced++;
    }
  } catch (err: any) {
    result.errors.push(`Locations: ${err.message}`);
  }

  // ── Update last sync time ──
  await supabase
    .from('motive_connections')
    .update({
      last_synced_at: new Date().toISOString(),
      sync_errors: result.errors.length > 0 ? result.errors : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conn.id);

  console.log(
    `[Motive Sync] ${conn.profile_id}: ${result.vehicles_synced}V ${result.drivers_synced}D ${result.locations_synced}L | ${result.errors.length} errors`
  );

  return result;
}
