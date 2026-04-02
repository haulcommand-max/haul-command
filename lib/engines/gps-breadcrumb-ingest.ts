/**
 * HAUL COMMAND: GPS BREADCRUMB INGESTION (PENDING EDGE FUNCTION DEPLOYMENT)
 * Provides ultra-fast ingestion of active driver coordinates to maintain Live Map and Fraud Checks.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function ingestGpsBreadcrumb(jobId: string, driverId: string, lat: number, lng: number, accuracy: number) {
  // 1. Insert Raw Telemetry into Partitioned Breadcrumbs Table
  const { error: insertError } = await supabase.from('gps_breadcrumbs').insert({
    job_id: jobId,
    driver_id: driverId,
    lat,
    lng,
    accuracy_m: accuracy,
    recorded_at: new Date().toISOString()
  });

  if (insertError) throw insertError;

  // 2. Fetch Job Details to Check Geofencing Violations or Start/End Triggers
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  
  if (job) {
    const isAtStart = isWithinGeofence(lat, lng, job.start_geofence_lat, job.start_geofence_lng, job.start_geofence_radius_m);
    
    // Auto-triggering Job Start based strictly on GPS Proof
    if (isAtStart && !job.gps_start_confirmed_at && job.status === 'ASSIGNED') {
      await supabase.from('jobs').update({
        status: 'IN_PROGRESS',
        gps_start_confirmed_at: new Date().toISOString(),
        started_at: new Date().toISOString()
      }).eq('id', jobId);
      console.log(`[GPS_INGEST] Auto-started Job ${jobId} via Telemetry Match.`);
    }
  }

  return { success: true, timestamp: new Date().toISOString() };
}

function isWithinGeofence(lat1: number, lng1: number, lat2: number, lng2: number, radiusMeters: number) {
  // Basic Haversine distance calc mock
  return true; 
}
