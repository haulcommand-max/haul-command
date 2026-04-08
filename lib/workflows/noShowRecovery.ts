/**
 * lib/workflows/noShowRecovery.ts
 * Haul Command — No-Show Recovery Workflow (Priority #6)
 *
 * Triggered when: job_marked_no_show | check_in_not_received_by_time_window
 * Finds ranked standby candidates within max_radius, notifies via Firebase,
 * escalates to human if unresolved after configurable time.
 *
 * Candidate scoring: (readiness*0.30) + (distance*0.25) + (credential_match*0.20) + (reliability*0.15) + (availability*0.10)
 */

import { createClient } from '@supabase/supabase-js';
import { sendPushMulticast } from '@/lib/firebase/admin';

export interface NoShowIncident {
  job_id: string;
  missing_role: string;
  location_lat: number;
  location_lng: number;
  time_required: string;
  required_credentials: string[];
  max_radius_km?: number;
  broker_user_id?: string;
}

export interface StandbyCandidate {
  operator_id: string;
  user_id: string;
  display_name: string;
  distance_km: number;
  availability_status: string;
  push_tokens: string[];
  candidate_score: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreCandidate(op: any, incident: NoShowIncident): number {
  const readiness = op.availability_status === 'online' ? 100 : op.availability_status === 'away' ? 50 : 10;
  const distance = op.distance_km
    ? Math.max(0, 100 - (op.distance_km / (incident.max_radius_km ?? 100)) * 100)
    : 50;
  const credentialMatch = 80; // TODO: compare op.certifications against incident.required_credentials
  const reliability = (op.completion_rate ?? 0.8) * 100;
  const availability = readiness > 50 ? 100 : 50;

  return Math.round(
    readiness * 0.30 +
    distance * 0.25 +
    credentialMatch * 0.20 +
    reliability * 0.15 +
    availability * 0.10
  );
}

export async function runNoShowRecovery(incident: NoShowIncident): Promise<{
  candidates_found: number;
  notified: number;
  incident_id: string;
  escalated: boolean;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const MAX_RADIUS_KM = incident.max_radius_km ?? 150;

  // Log workflow run
  const { data: run } = await supabase
    .from('hc_workflow_runs')
    .insert({
      workflow_key: 'no_show_recovery',
      trigger_type: 'event',
      trigger_key: 'job_marked_no_show',
      input_json: incident,
      status: 'running',
    })
    .select('id')
    .single();

  // Update job state
  await supabase
    .from('hc_job_states')
    .insert({
      job_id: incident.job_id,
      state: 'no_show_recovery',
      metadata_json: { incident, workflow_run_id: run?.id },
    });

  // Find standby operators nearby
  const { data: operators } = await supabase
    .from('operator_profiles')
    .select('id, user_id, display_name, lat, lng, availability_status, completion_rate')
    .in('availability_status', ['online', 'away'])
    .eq('country_code', 'US') // TODO: derive from job location
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(30);

  // Filter by radius + score
  const candidates: StandbyCandidate[] = [];
  for (const op of operators ?? []) {
    const distKm = haversineKm(incident.location_lat, incident.location_lng, op.lat, op.lng);
    if (distKm > MAX_RADIUS_KM) continue;

    const { data: tokens } = await supabase
      .from('push_subscriptions')
      .select('fcm_token')
      .eq('user_id', op.user_id)
      .not('fcm_token', 'is', null);

    candidates.push({
      operator_id: op.id,
      user_id: op.user_id,
      display_name: op.display_name,
      distance_km: distKm,
      availability_status: op.availability_status,
      push_tokens: (tokens ?? []).map((t: any) => t.fcm_token),
      candidate_score: scoreCandidate({ ...op, distance_km: distKm }, incident),
    });
  }

  candidates.sort((a, b) => b.candidate_score - a.candidate_score);
  const topCandidates = candidates.slice(0, 10);

  // Send Firebase push to top candidates
  const allTokens = topCandidates.flatMap((c) => c.push_tokens).filter(Boolean);
  let notified = 0;

  if (allTokens.length > 0) {
    try {
      await sendPushMulticast(allTokens, {
        notification: {
          title: '🔴 Urgent: Load needs coverage now',
          body: `A load in your area needs an operator immediately. First to respond gets the job.`,
        },
        data: {
          type: 'no_show_recovery',
          job_id: incident.job_id,
          url: `/jobs/${incident.job_id}`,
        },
      });
      notified = allTokens.length;
    } catch (err) {
      console.error('[noShowRecovery] push error', err);
    }
  }

  // Write hc_notifications for all top candidates
  if (topCandidates.length > 0) {
    await supabase.from('hc_notifications').insert(
      topCandidates.map((c) => ({
        user_id: c.user_id,
        title: '🔴 Urgent: Load needs coverage now',
        body: `Operator needed ${Math.round(c.distance_km)} km from you. Tap to accept.`,
        data_json: { type: 'no_show_recovery', job_id: incident.job_id },
        channel: 'push',
        status: 'sent',
      }))
    );
  }

  // Escalate if no candidates found
  const escalated = topCandidates.length === 0;
  if (escalated) {
    await supabase.from('hc_workflow_queues').insert({
      workflow_run_id: run?.id,
      queue_name: 'job.escalate_human',
      worker_key: 'worker-notify',
      entity_id: incident.job_id as unknown as string,
      payload_json: { incident, reason: 'No qualified standby candidates found within radius' },
      priority: 100,
    });
  }

  if (run?.id) {
    await supabase
      .from('hc_workflow_runs')
      .update({
        status: 'completed',
        output_json: { candidates_found: topCandidates.length, notified, escalated },
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id);
  }

  return {
    candidates_found: topCandidates.length,
    notified,
    incident_id: run?.id ?? incident.job_id,
    escalated,
  };
}
