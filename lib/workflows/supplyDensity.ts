/**
 * lib/workflows/supplyDensity.ts
 * Haul Command — Supply Density Builder + Partner Hunt Engine
 * (Workflows Priority #8 + #9 — combined for efficiency)
 *
 * Supply Density: Detect thin markets → emit gap tasks
 * Partner Hunt: Scan for yard/hotel/repair/installer candidates → outreach queue
 */

import { createClient } from '@supabase/supabase-js';

export type PartnerType = 'yard' | 'hotel' | 'installer' | 'secure_parking' | 'repair' | 'meetup_zone';

export interface MarketGap {
  country_code: string;
  region_code?: string;
  city_name?: string;
  operator_count: number;
  demand_score: number;
  supply_gap_score: number;
  revenue_potential: number;
  density_gap_score: number;
  recommended_actions: ('claim' | 'content' | 'hunt' | 'partner')[];
}

export interface PartnerCandidate {
  partner_type: PartnerType;
  business_name?: string;
  country_code: string;
  region_code?: string;
  city_name?: string;
  lat?: number;
  lng?: number;
  market_gap_score: number;
  partner_score: number;
  source: string;
}

// ─── Density scoring ──────────────────────────────────────
function scoreDensityGap(params: {
  demand: number;
  supplyGap: number;
  revenuePotential: number;
  strategicValue: number;
}): number {
  return Math.round(
    params.demand * 0.35 +
    params.supplyGap * 0.35 +
    params.revenuePotential * 0.20 +
    params.strategicValue * 0.10
  );
}

// ─── Partner scoring ─────────────────────────────────────
function scorePartner(params: {
  marketGap: number;
  partnerRelevance: number;
  locationValue: number;
  conversionProbability: number;
}): number {
  return Math.round(
    params.marketGap * 0.35 +
    params.partnerRelevance * 0.25 +
    params.locationValue * 0.20 +
    params.conversionProbability * 0.20
  );
}

// ─── Supply Density Builder ────────────────────────────────
export async function runSupplyDensityBuilder(options: {
  marketScope?: string;
  minOperatorCount?: number;
}): Promise<{ gaps_detected: number; tasks_created: number; gaps: MarketGap[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: run } = await supabase
    .from('hc_workflow_runs')
    .insert({ workflow_key: 'supply_density_builder', trigger_type: 'cron', status: 'running' })
    .select('id').single();

  const MIN_OPERATORS = options.minOperatorCount ?? 5;

  // Get operator counts by country/region
  const { data: countryStats } = await supabase
    .from('operator_profiles')
    .select('country_code, region_code, city_name')
    .not('country_code', 'is', null);

  // Aggregate counts
  const countMap = new Map<string, number>();
  for (const op of countryStats ?? []) {
    const key = [op.country_code, op.region_code].filter(Boolean).join(':');
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  // Get dom_scorecards for demand data
  const { data: scorecards } = await supabase
    .from('dom_scorecards')
    .select('*')
    .in('scope_type', ['country', 'market'])
    .order('demand_score', { ascending: false })
    .limit(20);

  const gaps: MarketGap[] = [];
  const gapTasks: any[] = [];

  for (const card of scorecards ?? []) {
    const opCount = countMap.get(card.scope_key) ?? card.operator_count ?? 0;
    if (opCount >= MIN_OPERATORS) continue; // Not thin

    const supplyGap = Math.max(0, 100 - (opCount / MIN_OPERATORS) * 100);
    const densityScore = scoreDensityGap({
      demand: card.demand_score ?? 50,
      supplyGap,
      revenuePotential: card.monetization_score ?? 40,
      strategicValue: card.scope_type === 'country' ? 80 : 50,
    });

    const recommendedActions: MarketGap['recommended_actions'] = [];
    if (opCount === 0) recommendedActions.push('content', 'hunt', 'partner');
    else if (opCount < 3) recommendedActions.push('claim', 'hunt');
    else recommendedActions.push('claim', 'content');

    const gap: MarketGap = {
      country_code: card.country_code ?? card.scope_key,
      region_code: card.region_code,
      city_name: card.city_name,
      operator_count: opCount,
      demand_score: card.demand_score ?? 50,
      supply_gap_score: supplyGap,
      revenue_potential: card.monetization_score ?? 40,
      density_gap_score: densityScore,
      recommended_actions: recommendedActions,
    };

    gaps.push(gap);

    // Emit gap tasks
    for (const action of recommendedActions) {
      gapTasks.push({
        task_type: action,
        workflow_key: 'supply_density_builder',
        country_code: gap.country_code,
        region_code: gap.region_code,
        city_name: gap.city_name,
        priority_score: densityScore,
        workflow_run_id: run?.id,
        context_json: { operator_count: opCount, demand_score: gap.demand_score },
      });
    }
  }

  if (gapTasks.length > 0) {
    await supabase.from('hc_gap_tasks').insert(gapTasks);
  }

  if (run?.id) {
    await supabase.from('hc_workflow_runs')
      .update({ status: 'completed', output_json: { gaps_detected: gaps.length, tasks_created: gapTasks.length }, completed_at: new Date().toISOString() })
      .eq('id', run.id);
  }

  return { gaps_detected: gaps.length, tasks_created: gapTasks.length, gaps };
}

// ─── Partner Hunt Engine ──────────────────────────────────
export async function runPartnerHunt(options: {
  marketScope?: string;
  partnerTypes?: PartnerType[];
  minScore?: number;
}): Promise<{ candidates_found: number; queued: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: run } = await supabase
    .from('hc_workflow_runs')
    .insert({ workflow_key: 'partner_hunt_engine', trigger_type: 'cron', status: 'running' })
    .select('id').single();

  const targetTypes: PartnerType[] = options.partnerTypes ?? ['yard', 'hotel', 'secure_parking', 'repair'];
  const minScore = options.minScore ?? 60;

  // Get open gap tasks to prioritize markets
  const { data: gapTasks } = await supabase
    .from('hc_gap_tasks')
    .select('country_code, region_code, city_name, priority_score')
    .eq('task_type', 'partner')
    .eq('status', 'open')
    .order('priority_score', { ascending: false })
    .limit(10);

  const candidates: PartnerCandidate[] = [];

  for (const task of gapTasks ?? []) {
    for (const partnerType of targetTypes) {
      // Relevance scoring by type and market
      const partnerRelevance = {
        yard: 90, hotel: 70, secure_parking: 85, repair: 80,
        installer: 65, meetup_zone: 60,
      }[partnerType];

      const pScore = scorePartner({
        marketGap: task.priority_score ?? 60,
        partnerRelevance,
        locationValue: task.city_name ? 85 : 60,
        conversionProbability: 50, // Unknown until outreach
      });

      if (pScore < minScore) continue;

      candidates.push({
        partner_type: partnerType,
        country_code: task.country_code,
        region_code: task.region_code,
        city_name: task.city_name,
        market_gap_score: task.priority_score ?? 60,
        partner_score: pScore,
        source: 'gap_task_driven',
      });
    }
  }

  // Upsert candidates to partner_leads
  if (candidates.length > 0) {
    await supabase.from('hc_partner_leads').upsert(
      candidates.map((c) => ({
        partner_type: c.partner_type,
        country_code: c.country_code,
        region_code: c.region_code,
        city_name: c.city_name,
        partner_score: c.partner_score,
        market_gap_score: c.market_gap_score,
        status: 'discovered',
        source: c.source,
        workflow_run_id: run?.id,
      })),
      { onConflict: 'id' }  // allow duplicates — deduped by business_name in later steps
    );

    // Queue outreach packets
    await supabase.from('hc_workflow_queues').insert(
      candidates.slice(0, 20).map((c) => ({
        workflow_run_id: run?.id,
        queue_name: 'partner.create_packet',
        worker_key: 'outreach-worker',
        payload_json: { partner_type: c.partner_type, country_code: c.country_code, city_name: c.city_name, score: c.partner_score },
        priority: Math.round(c.partner_score),
      }))
    );
  }

  if (run?.id) {
    await supabase.from('hc_workflow_runs')
      .update({ status: 'completed', output_json: { candidates_found: candidates.length }, completed_at: new Date().toISOString() })
      .eq('id', run.id);
  }

  return { candidates_found: candidates.length, queued: Math.min(20, candidates.length) };
}
