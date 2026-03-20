/**
 * Motive Data Sync Cron Job
 *
 * GET /api/cron/motive-sync
 *
 * Runs every 15 minutes via Vercel Cron.
 * For each Motive-connected provider:
 *   1. Refresh token if needed
 *   2. Sync vehicle positions
 *   3. Sync driver available time (HOS)
 *   4. Sync safety scores (daily)
 *   5. Sync fuel purchases (hourly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { createMotiveClient } from '@/lib/motive/client';

// Vercel cron auth token
const CRON_SECRET = process.env.CRON_SECRET || '';

export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = supabaseServer();
  const results = {
    providers_synced: 0,
    positions_updated: 0,
    scores_updated: 0,
    fuel_observations: 0,
    errors: [] as string[],
  };

  try {
    // Get all Motive-connected providers with active tokens
    const { data: tokens } = await sb
      .from('motive_tokens')
      .select('provider_id, motive_company_id, access_token, refresh_token, expires_at');

    if (!tokens?.length) {
      return NextResponse.json({ message: 'No Motive-connected providers', results });
    }

    for (const token of tokens) {
      try {
        // 1. Create client (auto-refreshes expired tokens)
        const { client, refreshed, newToken } = await createMotiveClient({
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: token.expires_at,
        });

        // Update stored token if refreshed
        if (refreshed && newToken) {
          const expiresAt = new Date(Date.now() + newToken.expires_in * 1000).toISOString();
          await sb.from('motive_tokens').update({
            access_token: newToken.access_token,
            refresh_token: newToken.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          }).eq('provider_id', token.provider_id);
        }

        // 2. Sync vehicle positions (every run)
        try {
          const locationsRes = await client.listVehicleLocations({ per_page: 100 });
          const positions = (locationsRes.vehicle_locations || [])
            .filter((vl) => vl.current_location?.lat && vl.current_location?.lon)
            .map((vl) => ({
              motive_vehicle_id: String(vl.vehicle.id),
              provider_id: token.provider_id,
              lat: vl.current_location.lat,
              lng: vl.current_location.lon,
              heading: vl.current_location.bearing,
              speed_mph: vl.current_location.speed,
              driver_name: vl.vehicle.current_driver
                ? `${vl.vehicle.current_driver.first_name} ${vl.vehicle.current_driver.last_name}`
                : null,
              vehicle_number: vl.vehicle.number,
              recorded_at: vl.current_location.located_at || new Date().toISOString(),
            }));

          if (positions.length) {
            await sb.from('motive_vehicle_positions').insert(positions);
            results.positions_updated += positions.length;
          }
        } catch (err) {
          results.errors.push(`Positions sync failed for ${token.provider_id}: ${err instanceof Error ? err.message : 'unknown'}`);
        }

        // 3. Sync available drive time (HOS)
        try {
          const hosRes = await client.listDriversAvailableTime({ per_page: 100 });
          const drivers = hosRes.available_times || [];

          if (drivers.length) {
            // Average remaining drive time across all drivers
            const totalDriveSeconds = drivers.reduce(
              (sum, d) => sum + (d.available_time.available_time?.drive || 0),
              0
            );
            const avgHoursRemaining = (totalDriveSeconds / drivers.length) / 3600;

            await sb.from('providers').update({
              motive_hos_hours_remaining: Math.round(avgHoursRemaining * 10) / 10,
              motive_last_synced_at: new Date().toISOString(),
            }).eq('id', token.provider_id);
          }
        } catch (err) {
          results.errors.push(`HOS sync failed for ${token.provider_id}: ${err instanceof Error ? err.message : 'unknown'}`);
        }

        // 4. Sync safety scores (only if we haven't synced today)
        try {
          const { data: lastScore } = await sb
            .from('motive_safety_scores')
            .select('synced_at')
            .eq('provider_id', token.provider_id)
            .order('synced_at', { ascending: false })
            .limit(1)
            .single();

          const lastSyncedToday = lastScore?.synced_at &&
            new Date(lastScore.synced_at).toDateString() === new Date().toDateString();

          if (!lastSyncedToday) {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const scorecardRes = await client.listScorecardSummaries({
              start_date: thirtyDaysAgo.toISOString().split('T')[0],
              end_date: now.toISOString().split('T')[0],
            });

            const scores = (scorecardRes.scorecard_summaries || []).map((s) => ({
              provider_id: token.provider_id,
              motive_vehicle_id: String(s.scorecard_summary.vehicle.id),
              vehicle_number: s.scorecard_summary.vehicle.number,
              overall_score: s.scorecard_summary.total_score,
              harsh_braking_score: s.scorecard_summary.harsh_braking_score,
              harsh_acceleration_score: s.scorecard_summary.harsh_acceleration_score,
              speeding_score: s.scorecard_summary.speeding_score,
              idle_time_score: s.scorecard_summary.idle_time_score,
              total_distance_miles: s.scorecard_summary.total_distance_miles,
              period_start: s.scorecard_summary.period_start,
              period_end: s.scorecard_summary.period_end,
            }));

            if (scores.length) {
              await sb.from('motive_safety_scores').insert(scores);
              results.scores_updated += scores.length;

              // Update provider's aggregate safety score
              const avgScore = scores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scores.length;
              await sb.from('providers').update({
                motive_safety_score: Math.round(avgScore * 10) / 10,
              }).eq('id', token.provider_id);
            }
          }
        } catch (err) {
          results.errors.push(`Safety sync failed for ${token.provider_id}: ${err instanceof Error ? err.message : 'unknown'}`);
        }

        // 5. Sync fuel purchases (recent, since last sync)
        try {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const fuelRes = await client.listFuelPurchases({
            start_date: oneDayAgo.toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
          });

          const fuelObs = (fuelRes.fuel_purchases || [])
            .filter((fp) => fp.fuel_purchase.price_per_gallon)
            .map((fp) => ({
              jurisdiction_code: fp.fuel_purchase.location?.state?.toUpperCase() || 'US',
              fuel_type: fp.fuel_purchase.fuel_type || 'diesel',
              price_per_gallon: fp.fuel_purchase.price_per_gallon,
              total_cost: fp.fuel_purchase.cost,
              gallons: fp.fuel_purchase.gallons,
              vendor_name: fp.fuel_purchase.vendor_name,
              vehicle_id: fp.fuel_purchase.vehicle ? String(fp.fuel_purchase.vehicle.id) : null,
              observed_at: fp.fuel_purchase.purchased_at,
            }));

          if (fuelObs.length) {
            await sb.from('motive_fuel_observations').insert(fuelObs);
            results.fuel_observations += fuelObs.length;
          }
        } catch (err) {
          results.errors.push(`Fuel sync failed for ${token.provider_id}: ${err instanceof Error ? err.message : 'unknown'}`);
        }

        // Update fleet size
        try {
          const vehiclesRes = await client.listVehicles({ per_page: 1, status: 'active' });
          const fleetSize = vehiclesRes.pagination?.total || 0;
          if (fleetSize) {
            await sb.from('providers').update({
              motive_fleet_size: fleetSize,
            }).eq('id', token.provider_id);
          }
        } catch {
          // Non-critical
        }

        results.providers_synced++;
      } catch (err) {
        results.errors.push(`Provider ${token.provider_id} failed entirely: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }
  } catch (err) {
    console.error('[Motive Sync] Cron failed:', err);
    return NextResponse.json(
      { error: 'Sync failed', message: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: 'Motive sync complete',
    results,
    timestamp: new Date().toISOString(),
  });
}
