/**
 * HAUL COMMAND: TIER 1 DISPUTE AUTO-RESOLVER
 * Replaces manual broker-operator arguments. If a dispute is filed but the GPS breadcrumbs 
 * explicitly prove the Start and Dropoff Geofences were triggered smoothly, we automatically close it.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function processDisputeResolutions() {
  console.log('[DISPUTE_NURSE] Scanning OPEN Tier 1 Disputes for Auto-Resolution...');

  // Target Tier 1 (Auto-resolve capable) disputes older than 48 hours without resolution
  const { data: disputes, error } = await supabase
    .from('disputes')
    .select('*, jobs(*)')
    .eq('tier', 1)
    .eq('status', 'OPENED')
    .eq('auto_resolved', false);

  if (error || !disputes) return;

  for (const dispute of disputes) {
    const job = dispute.jobs;

    // RULE 1: If job has full GPS verification on start & end, auto-resolve in favor of the driver
    if (job.gps_start_confirmed_at && job.gps_end_confirmed_at && job.off_route_alerts === 0) {
      console.log(`[DISPUTE_NURSE] Resolving Dispute ${dispute.id} based on pure GPS telemetry.`);
      
      await supabase.from('disputes').update({
        status: 'RESOLVED',
        resolution: 'AUTOMATED_GPS_VERIFICATION_PASSED',
        auto_resolved: true,
        resolved_at: new Date().toISOString()
      }).eq('id', dispute.id);

      // Trigger Stripe Capture edge function since dispute is resolved
      await supabase.functions.invoke('payments-capture', { body: { jobId: job.id } });

    } else if (new Date(dispute.escalate_at) < new Date()) {
      // RULE 2: If we lack GPS and the 48 hour auto-escalate deadline passed, elevate to Mediation
      await supabase.from('disputes').update({
        status: 'MEDIATION',
        tier: 3 // Human Mediation
      }).eq('id', dispute.id);
    }
  }
}
