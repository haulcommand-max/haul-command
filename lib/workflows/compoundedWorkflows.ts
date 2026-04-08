/**
 * lib/workflows/compoundedWorkflows.ts
 * Haul Command — Remaining Workflow Implementations
 *
 * Covers (in one file for efficiency):
 *   - Listing Rescue Tactic
 *   - Authority Cascade
 *   - Corridor Shock Detector
 *   - Country Keep-Alive
 *   - Recovery Packet Automation
 *   - Human Escalation Packet
 */

import { createClient } from '@supabase/supabase-js';

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function logRun(workflow_key: string, trigger_type = 'cron', input_json = {}) {
  const { data } = await svc()
    .from('hc_workflow_runs')
    .insert({ workflow_key, trigger_type, input_json, status: 'running' })
    .select('id').single();
  return data?.id as string | undefined;
}

async function closeRun(run_id: string | undefined, output: Record<string, unknown>) {
  if (!run_id) return;
  await svc().from('hc_workflow_runs')
    .update({ status: 'completed', output_json: output, completed_at: new Date().toISOString() })
    .eq('id', run_id);
}

// ══════════════════════════════════════════════════════════
// 1. LISTING RESCUE TACTIC
// ══════════════════════════════════════════════════════════
/**
 * Scoring: (recoverability*0.30) + (market_value*0.25) + (traffic_potential*0.20) + (claim_probability*0.25)
 */
export async function runListingRescue(options: {
  country_code?: string;
  min_recover_score?: number;
}): Promise<{ scanned: number; rescued: number }> {
  const db = svc();
  const run_id = await logRun('listing_rescue_tactic', 'cron', options);
  const minScore = options.min_recover_score ?? 60;

  // Find listings with low scores but some data (recoverable)
  const q = db.from('hc_listing_scores')
    .select('entity_id, listing_score, composite_score')
    .lt('listing_score', 60)
    .gt('listing_score', 20) // Not empty (has some data)
    .limit(100);

  const { data: weak } = await q;
  let rescued = 0;

  for (const listing of weak ?? []) {
    const recoverability = 100 - listing.listing_score;
    const marketValue = 60; // TODO: join to dom_scorecards
    const trafficPotential = 55;
    const claimProbability = listing.listing_score > 40 ? 70 : 45;

    const rescueScore = Math.round(
      recoverability * 0.30 + marketValue * 0.25 +
      trafficPotential * 0.20 + claimProbability * 0.25
    );

    if (rescueScore < minScore) continue;

    // Create gap task routing to claim or profile-completion
    await db.from('hc_gap_tasks').insert({
      task_type: 'rescue',
      workflow_key: 'listing_rescue_tactic',
      target_entity_id: listing.entity_id,
      priority_score: rescueScore,
      workflow_run_id: run_id,
      context_json: {
        listing_score: listing.listing_score,
        rescue_score: rescueScore,
        recommended_action: listing.listing_score < 40 ? 'claim_invite' : 'profile_completion',
      },
    });

    // Queue outreach packet
    await db.from('hc_workflow_queues').insert({
      workflow_run_id: run_id,
      queue_name: 'rescue.create_packet',
      worker_key: 'outreach-worker',
      entity_id: listing.entity_id,
      payload_json: { rescue_score: rescueScore, listing_score: listing.listing_score },
      priority: rescueScore,
    });

    rescued++;
  }

  await closeRun(run_id, { scanned: weak?.length ?? 0, rescued });
  return { scanned: weak?.length ?? 0, rescued };
}

// ══════════════════════════════════════════════════════════
// 2. AUTHORITY CASCADE
// ══════════════════════════════════════════════════════════
/**
 * When a regulation/corridor/glossary page updates, find dependents and refresh them.
 */
export async function runAuthorityCascade(params: {
  updated_surface_type: string;
  updated_surface_id: string;
  depth?: number;
}): Promise<{ dependents_found: number; refresh_tasks_created: number }> {
  const db = svc();
  const run_id = await logRun('authority_cascade', 'state_transition', params);

  // Find dependent pages via link graph
  const { data: links } = await db
    .from('hc_link_graph')
    .select('target_type, target_id, target_key')
    .eq('source_type', params.updated_surface_type)
    .eq('source_id', params.updated_surface_id)
    .limit(50);

  const tasks: any[] = [];
  for (const link of links ?? []) {
    tasks.push({
      task_type: 'content',
      workflow_key: 'authority_cascade',
      context_json: {
        action: 'refresh_dependent',
        target_type: link.target_type,
        target_id: link.target_id,
        triggered_by_surface: params.updated_surface_type,
        triggered_by_id: params.updated_surface_id,
      },
      priority_score: 75,
      workflow_run_id: run_id,
    });
  }

  if (tasks.length > 0) {
    await db.from('hc_gap_tasks').insert(tasks);
  }

  await closeRun(run_id, { dependents_found: links?.length ?? 0, refresh_tasks: tasks.length });
  return { dependents_found: links?.length ?? 0, refresh_tasks_created: tasks.length };
}

// ══════════════════════════════════════════════════════════
// 3. CORRIDOR SHOCK DETECTOR
// ══════════════════════════════════════════════════════════
/**
 * Detects sudden demand/supply imbalances and emits alerts + content tasks.
 */
export async function runCorridorShockDetector(): Promise<{
  shocks_detected: number;
  alerts_emitted: number;
}> {
  const db = svc();
  const run_id = await logRun('corridor_shock_detector', 'cron');

  // Find corridors with high demand but low supply
  const { data: corridors } = await db
    .from('hc_corridors')
    .select('id, corridor_label, demand_score, supply_score, origin, destination, country_code')
    .not('demand_score', 'is', null)
    .not('supply_score', 'is', null)
    .limit(100);

  const shocks: any[] = [];

  for (const c of corridors ?? []) {
    const gap = (c.demand_score ?? 0) - (c.supply_score ?? 0);
    if (gap < 30) continue; // Not a shock

    shocks.push(c);

    // Emit hc_event
    await db.from('hc_events').insert({
      event_type: 'corridor.shock_detected',
      event_source: 'corridor_shock_detector',
      entity_type: 'corridor',
      entity_id: c.id,
      country_code: c.country_code,
      payload_json: { corridor_label: c.corridor_label, demand: c.demand_score, supply: c.supply_score, gap },
    });

    // Create content task to build/refresh corridor page
    await db.from('hc_gap_tasks').insert({
      task_type: 'content',
      workflow_key: 'corridor_shock_detector',
      context_json: { corridor_id: c.id, corridor_label: c.corridor_label, gap },
      priority_score: Math.min(100, gap),
      workflow_run_id: run_id,
    });
  }

  await closeRun(run_id, { shocks_detected: shocks.length });
  return { shocks_detected: shocks.length, alerts_emitted: shocks.length };
}

// ══════════════════════════════════════════════════════════
// 4. COUNTRY KEEP-ALIVE
// ══════════════════════════════════════════════════════════
/**
 * Runs low-cost weekly refreshes on all countries so they never go cold.
 */
export async function runCountryKeepAlive(): Promise<{
  countries_refreshed: number;
  question_gaps_added: number;
}> {
  const db = svc();
  const run_id = await logRun('country_keep_alive', 'cron');

  const { data: countries } = await db
    .from('hc_country_readiness')
    .select('country_code, readiness_score, last_keep_alive_at')
    .order('readiness_score', { ascending: true }) // worst first
    .limit(20);

  let refreshed = 0;
  let questions_added = 0;

  for (const country of countries ?? []) {
    // Check if keep-alive is due (>7 days)
    if (country.last_keep_alive_at) {
      const ageDays = (Date.now() - new Date(country.last_keep_alive_at).getTime()) / 86_400_000;
      if (ageDays < 7) continue;
    }

    // Queue "find new entities" discovery action
    await db.from('hc_workflow_queues').insert({
      workflow_run_id: run_id,
      queue_name: 'country.find_new_entities',
      worker_key: 'country-worker',
      payload_json: { country_code: country.country_code, readiness_score: country.readiness_score },
      priority: 100 - (country.readiness_score ?? 50),
    });

    // Add a question gap task
    await db.from('hc_gap_tasks').insert({
      task_type: 'content',
      workflow_key: 'country_keep_alive',
      country_code: country.country_code,
      context_json: { action: 'add_question_gaps', readiness_score: country.readiness_score },
      priority_score: 100 - (country.readiness_score ?? 50),
      workflow_run_id: run_id,
    });

    // Update last_keep_alive_at
    await db.from('hc_country_readiness')
      .update({ last_keep_alive_at: new Date().toISOString() })
      .eq('country_code', country.country_code);

    refreshed++;
    questions_added++;
  }

  await closeRun(run_id, { countries_refreshed: refreshed, question_gaps_added: questions_added });
  return { countries_refreshed: refreshed, question_gaps_added: questions_added };
}

// ══════════════════════════════════════════════════════════
// 5. RECOVERY PACKET AUTOMATION
// ══════════════════════════════════════════════════════════
/**
 * Compiles GPS proof, contact trail, event history, and invoice support
 * into a single exportable packet for invoice disputes.
 */
export async function buildRecoveryPacket(params: {
  job_id: string;
  include_gps?: boolean;
  include_contact_trail?: boolean;
}): Promise<{
  packet_id: string;
  timeline_events: number;
  gps_points: number;
  contact_touches: number;
  export_url: string;
}> {
  const db = svc();
  const run_id = await logRun('recovery_packet_automation', 'manual', params);

  // Gather job history
  const { data: jobStates } = await db
    .from('hc_job_states')
    .select('*')
    .eq('job_id', params.job_id)
    .order('transitioned_at', { ascending: true });

  // Gather GPS events
  const { data: gpsEvents } = params.include_gps
    ? await db.from('hc_gps_events')
        .select('lat, lng, speed_kmh, timestamp')
        .eq('job_id', params.job_id)
        .order('timestamp', { ascending: true })
        .limit(500)
    : { data: [] };

  // Gather contact history
  const { data: outreachLog } = params.include_contact_trail
    ? await db.from('hc_outreach_log')
        .select('outreach_type, channel, status, sent_at, touch_count')
        .order('sent_at', { ascending: true })
    : { data: [] };

  // Write proof packet
  const { data: packet } = await db
    .from('hc_proof_packets')
    .insert({
      job_id: params.job_id,
      workflow_run_id: run_id,
      timeline_json: jobStates ?? [],
      gps_json: gpsEvents ?? [],
      contact_trail_json: outreachLog ?? [],
      status: 'compiled',
      compiled_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  await closeRun(run_id, {
    packet_id: packet?.id,
    timeline_events: jobStates?.length ?? 0,
    gps_points: gpsEvents?.length ?? 0,
  });

  return {
    packet_id: packet?.id ?? 'unknown',
    timeline_events: jobStates?.length ?? 0,
    gps_points: gpsEvents?.length ?? 0,
    contact_touches: outreachLog?.length ?? 0,
    export_url: `/api/recovery-packet/${packet?.id}/export`,
  };
}

// ══════════════════════════════════════════════════════════
// 6. HUMAN ESCALATION PACKET
// ══════════════════════════════════════════════════════════
/**
 * When any workflow marks escalation_required, compiles full context
 * and dispatches to admin with a complete packet instead of a vague handoff.
 */
export async function dispatchHumanEscalationPacket(params: {
  workflow_run_id: string;
  reason: string;
  admin_user_ids: string[];
}): Promise<void> {
  const db = svc();

  // Load the workflow run
  const { data: run } = await db
    .from('hc_workflow_runs')
    .select('*')
    .eq('id', params.workflow_run_id)
    .single();

  if (!run) return;

  // Update run to escalated
  await db.from('hc_workflow_runs')
    .update({ status: 'escalated' })
    .eq('id', params.workflow_run_id);

  // Compile context
  const packet = {
    workflow_key: run.workflow_key,
    trigger_type: run.trigger_type,
    entity_type: run.entity_type,
    entity_id: run.entity_id,
    started_at: run.started_at,
    duration_secs: run.completed_at
      ? (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000
      : null,
    input: run.input_json,
    output: run.output_json,
    error: run.error_json,
    reason: params.reason,
    action_url: `/dashboard/admin/workflows/${run.workflow_key}?run=${run.id}`,
  };

  // Notify all admin users
  for (const admin_id of params.admin_user_ids) {
    await db.from('hc_notifications').insert({
      user_id: admin_id,
      title: `⚠️ Escalation: ${run.workflow_key}`,
      body: `${params.reason} — tap to review the full context packet.`,
      data_json: { type: 'human_escalation', packet, url: packet.action_url },
      channel: 'push',
      status: 'queued',
    });
  }
}
