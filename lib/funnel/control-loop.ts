// lib/funnel/control-loop.ts
//
// Haul Command — Daily Control Loop Orchestrator
// Spec: Autonomous Funnel Blueprint v1.0.0
//
// This is the main entry point. Runs daily and:
// 1. Recomputes corridor metrics from raw data
// 2. Updates corridor liquidity scores (CLS)
// 3. Evaluates expansion governor per country
// 4. Computes budget allocations
// 5. Updates PLAI campaign decisions
// 6. Syncs VAPI pressure signals
// 7. Builds retarget audiences
// 8. Detects early warnings
// 9. Computes executive dashboard metrics

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import {
    type CorridorMetrics,
    type CorridorLiquidityResult,
    evaluateCorridor,
    evaluateExpansionGovernor,
    persistCorridorSnapshot,
} from "./corridor-governor";
import {
    type AdsDecisionInput,
    makeAdsDecision,
    softmaxAllocate,
    persistAdsDecision,
} from "./ads-decision-engine";
import {
    computeVapiKpis,
    evaluateSurge,
    evaluateLocalization,
} from "./vapi-pressure";
import {
    buildSupplyRetargetAudiences,
    buildDemandRetargetAudiences,
    syncRetargetAudiences,
} from "./retarget-engine";

// ============================================================
// TYPES
// ============================================================

export interface ControlLoopResult {
    run_date: string;
    corridors_evaluated: number;
    countries_evaluated: number;
    warnings_generated: number;
    retarget_candidates_synced: number;
    ads_decisions_made: number;
    expansion_states: Record<string, string>;
    executive_summary: ExecutiveSummary;
    duration_ms: number;
}

export interface ExecutiveSummary {
    // North star metrics
    total_activated_operators: number;
    total_load_participating: number;
    global_load_participation_rate: number;
    global_match_rate: number;
    global_repeat_poster_rate: number;
    // Distribution
    corridors_by_stage: Record<string, number>;
    countries_by_expansion_state: Record<string, number>;
    // Alerts
    critical_warnings: number;
    warning_count: number;
    // Velocity
    avg_cost_of_liquidity: number;
    corridors_with_declining_ttm: number;
}

// ============================================================
// METRIC COLLECTION FROM RAW DATA
// ============================================================

async function collectCorridorMetrics(): Promise<CorridorMetrics[]> {
    const supabase = getSupabaseAdmin();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get distinct corridors from supply records
    const { data: corridorRows } = await supabase
        .from('funnel_supply_records')
        .select('corridor_id, country_iso2')
        .not('corridor_id', 'is', null);

    // Also from demand records
    const { data: demandCorridorRows } = await supabase
        .from('funnel_demand_records')
        .select('corridor_id, country_iso2')
        .not('corridor_id', 'is', null);

    // Build unique corridor set
    const corridorMap = new Map<string, string>();
    for (const r of (corridorRows || [])) {
        if (r.corridor_id) corridorMap.set(r.corridor_id, r.country_iso2);
    }
    for (const r of (demandCorridorRows || [])) {
        if (r.corridor_id) corridorMap.set(r.corridor_id, r.country_iso2);
    }

    const metrics: CorridorMetrics[] = [];

    for (const [corridorId, countryIso2] of corridorMap.entries()) {
        // Supply counts by stage
        const stages = ['raw', 'contactable', 'contacted', 'conversation', 'claim_started', 'verified', 'activated', 'load_participating'];
        const supplyCounts: Record<string, number> = {};

        for (const stage of stages) {
            const { count } = await supabase
                .from('funnel_supply_records')
                .select('id', { count: 'exact', head: true })
                .eq('corridor_id', corridorId)
                .eq('stage', stage);
            supplyCounts[stage] = count || 0;
        }

        // Cumulative counts (each stage includes all records that reached that stage)
        const raw = Object.values(supplyCounts).reduce((s, c) => s + c, 0);
        const contactable = raw - (supplyCounts['raw'] || 0);
        const contacted = contactable - (supplyCounts['contactable'] || 0);

        // Demand counts
        const demandStages = ['identified', 'contactable', 'contacted', 'conversation', 'account_created', 'first_load', 'repeat_poster'];
        const demandCounts: Record<string, number> = {};

        for (const stage of demandStages) {
            const { count } = await supabase
                .from('funnel_demand_records')
                .select('id', { count: 'exact', head: true })
                .eq('corridor_id', corridorId)
                .eq('stage', stage);
            demandCounts[stage] = count || 0;
        }

        const demandTotal = Object.values(demandCounts).reduce((s, c) => s + c, 0);

        metrics.push({
            corridor_id: corridorId,
            country_iso2: countryIso2,
            // Supply (using current stage as latest)
            raw_records: raw,
            contactable_records: contactable,
            contacted: contacted,
            conversations_started: supplyCounts['conversation'] || 0,
            claims_started: supplyCounts['claim_started'] || 0,
            verified_operators: supplyCounts['verified'] || 0,
            activated_operators: supplyCounts['activated'] || 0,
            load_participating: supplyCounts['load_participating'] || 0,
            // Demand
            prospects_identified: demandTotal,
            prospects_contactable: demandTotal - (demandCounts['identified'] || 0),
            demand_conversations: demandCounts['conversation'] || 0,
            accounts_created: demandCounts['account_created'] || 0,
            loads_posted: demandCounts['first_load'] || 0,
            loads_matched: 0, // Would come from loads table joins
            repeat_posters: demandCounts['repeat_poster'] || 0,
        });
    }

    return metrics;
}

// ============================================================
// MAIN CONTROL LOOP
// ============================================================

export async function runDailyControlLoop(): Promise<ControlLoopResult> {
    const startTime = Date.now();
    const runDate = new Date().toISOString().slice(0, 10);

    console.log(`[CONTROL-LOOP] Starting daily run: ${runDate}`);

    // ── STEP 1: Collect corridor metrics ──
    console.log('[CONTROL-LOOP] Step 1: Collecting corridor metrics...');
    const allMetrics = await collectCorridorMetrics();
    console.log(`[CONTROL-LOOP] Found ${allMetrics.length} corridors`);

    // ── STEP 2: Evaluate each corridor ──
    console.log('[CONTROL-LOOP] Step 2: Computing CLS + warnings...');
    const corridorResults: CorridorLiquidityResult[] = [];
    let totalWarnings = 0;

    for (const metrics of allMetrics) {
        const result = evaluateCorridor(metrics);
        corridorResults.push(result);
        totalWarnings += result.warnings.length;

        // Persist snapshot
        await persistCorridorSnapshot(metrics, result);
    }

    // ── STEP 3: Evaluate expansion governor per country ──
    console.log('[CONTROL-LOOP] Step 3: Evaluating expansion governor...');
    const countryCorridors = new Map<string, CorridorLiquidityResult[]>();
    for (const r of corridorResults) {
        const existing = countryCorridors.get(r.country_iso2) || [];
        existing.push(r);
        countryCorridors.set(r.country_iso2, existing);
    }

    const expansionStates: Record<string, string> = {};
    const supabase = getSupabaseAdmin();

    for (const [country, results] of countryCorridors.entries()) {
        const decision = evaluateExpansionGovernor(country, results);
        expansionStates[country] = decision.state;

        // Persist governor state
        await supabase.from('expansion_governor').upsert({
            country_iso2: country,
            expansion_state: decision.state,
            green_corridors: decision.green_corridors,
            blue_corridors: decision.blue_corridors,
            avg_load_participation_pct: decision.avg_participation,
            avg_match_rate_pct: decision.avg_match_rate,
            avg_repeat_poster_pct: decision.avg_repeat_rate,
            last_evaluated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'country_iso2' });
    }

    // ── STEP 4: Compute budget allocations ──
    console.log('[CONTROL-LOOP] Step 4: Computing budget allocations...');
    const eligibleCorridors = corridorResults.filter(c => c.expansion_eligible);
    const opportunityScores = eligibleCorridors.map(c => ({
        corridor_id: c.corridor_id,
        opportunity_score: c.cls_score / 100, // Normalize CLS to 0-1 for allocation
    }));

    // Fetch from finance config (system_config)
    const { data: financeConfig } = await supabase.from('system_config').select('value').eq('key', 'daily_marketing_cap').maybeSingle();
    const dailyMarketingCap = financeConfig && typeof financeConfig.value === 'number' ? financeConfig.value : 1000;
    const budgetAllocations = softmaxAllocate(opportunityScores, dailyMarketingCap);

    // ── STEP 5: Make ads decisions ──
    console.log('[CONTROL-LOOP] Step 5: Making ads decisions...');
    let adsDecisions = 0;

    for (const result of corridorResults) {
        const vapiKpis = await computeVapiKpis(result.country_iso2, result.corridor_id, 14);

        // Compute cls_momentum from previous snapshot
        const { data: snaps } = await getSupabaseAdmin().from('corridor_snapshots')
            .select('cls_score')
            .eq('corridor_id', result.corridor_id)
            .order('created_at', { ascending: false })
            .limit(2);
        const cls_momentum = (snaps?.length === 2 && snaps[1].cls_score > 0) 
            ? ((snaps[0].cls_score - snaps[1].cls_score) / snaps[1].cls_score) 
            : 0;

        // Compute activation_cost_trend
        const { data: costSnaps } = await getSupabaseAdmin().from('corridor_snapshots')
            .select('activation_cost')
            .eq('corridor_id', result.corridor_id)
            .order('created_at', { ascending: false })
            .limit(2);
        
        let costTrend = 'stable_14d';
        if (costSnaps?.length === 2 && costSnaps[0].activation_cost != null && costSnaps[1].activation_cost != null) {
            if (costSnaps[0].activation_cost > costSnaps[1].activation_cost) costTrend = 'increasing';
            else if (costSnaps[0].activation_cost < costSnaps[1].activation_cost) costTrend = 'decreasing';
        }

        const input: AdsDecisionInput = {
            corridor_id: result.corridor_id,
            country_iso2: result.country_iso2,
            cls_score: result.cls_score,
            load_participation_pct: result.rates.load_participation_pct,
            match_rate_pct: result.rates.match_rate_pct,
            vapi_engagement_pct: vapiKpis.engagement_rate_pct,
            activation_cost_trend: costTrend,
            daily_marketing_cap: budgetAllocations.get(result.corridor_id) || 0,
            demand_pressure: result.rates.match_rate_pct < 50 ? 0.8 : 0.4,
            revenue_potential: result.cls_score / 100,
            cls_momentum: cls_momentum,
        };

        const adsDecision = makeAdsDecision(input);
        await persistAdsDecision(adsDecision);
        adsDecisions++;
    }

    // ── STEP 6: Sync VAPI pressure ──
    console.log('[CONTROL-LOOP] Step 6: Syncing VAPI pressure...');
    for (const result of corridorResults) {
        const hasBacklog = result.rates.match_rate_pct < 40 && result.rates.load_participation_pct > 10;
        const surgeDecision = evaluateSurge(result.corridor_id, hasBacklog, result.cls_score);

        if (surgeDecision.surge_enabled) {
            console.log(`[CONTROL-LOOP] SURGE ENABLED: ${result.corridor_id} — ${surgeDecision.reason}`);
        }

        // Check localization needs
        const vapiKpis = await computeVapiKpis(result.country_iso2, result.corridor_id, 7);
        const isNewCountry = result.cls_score < 10;
        const locActions = evaluateLocalization(vapiKpis, result.corridor_id, isNewCountry);

        for (const action of locActions) {
            console.log(`[CONTROL-LOOP] LOCALIZATION: ${action.action} for ${action.corridor_id} — ${action.reason}`);
        }
    }

    // ── STEP 7: Build retarget audiences ──
    console.log('[CONTROL-LOOP] Step 7: Building retarget audiences...');
    const supplyCandidates = await buildSupplyRetargetAudiences();
    const demandCandidates = await buildDemandRetargetAudiences();
    const allCandidates = [...supplyCandidates, ...demandCandidates];
    const retargetSynced = await syncRetargetAudiences(allCandidates);

    // ── STEP 8: Compute executive summary ──
    console.log('[CONTROL-LOOP] Step 8: Computing executive summary...');
    const stageDistribution: Record<string, number> = {};
    const expansionDistribution: Record<string, number> = {};
    let totalActivated = 0;
    let totalParticipating = 0;
    let totalPosted = 0;
    let totalMatched = 0;
    let totalRepeat = 0;
    let totalAccounts = 0;
    let costOfLiquiditySum = 0;
    let costCount = 0;
    let decliningTtm = 0;

    for (const result of corridorResults) {
        stageDistribution[result.stage] = (stageDistribution[result.stage] || 0) + 1;
    }
    for (const [, state] of Object.entries(expansionStates)) {
        expansionDistribution[state] = (expansionDistribution[state] || 0) + 1;
    }
    for (const m of allMetrics) {
        totalActivated += m.activated_operators;
        totalParticipating += m.load_participating;
        totalPosted += m.loads_posted;
        totalMatched += m.loads_matched;
        totalRepeat += m.repeat_posters;
        totalAccounts += m.accounts_created;
        if (m.activation_cost && m.activation_cost > 0) {
            costOfLiquiditySum += m.activation_cost;
            costCount++;
        }
    }

    const criticalWarnings = corridorResults.reduce((s, c) =>
        s + c.warnings.filter(w => w.severity === 'critical').length, 0);

    const executiveSummary: ExecutiveSummary = {
        total_activated_operators: totalActivated,
        total_load_participating: totalParticipating,
        global_load_participation_rate: totalActivated > 0
            ? Math.round((totalParticipating / totalActivated) * 10000) / 100
            : 0,
        global_match_rate: totalPosted > 0
            ? Math.round((totalMatched / totalPosted) * 10000) / 100
            : 0,
        global_repeat_poster_rate: totalAccounts > 0
            ? Math.round((totalRepeat / totalAccounts) * 10000) / 100
            : 0,
        corridors_by_stage: stageDistribution,
        countries_by_expansion_state: expansionDistribution,
        critical_warnings: criticalWarnings,
        warning_count: totalWarnings,
        avg_cost_of_liquidity: costCount > 0 ? Math.round(costOfLiquiditySum / costCount) : 0,
        corridors_with_declining_ttm: decliningTtm,
    };

    const duration = Date.now() - startTime;
    console.log(`[CONTROL-LOOP] Complete in ${duration}ms`);
    console.log(`[CONTROL-LOOP] Summary: ${allMetrics.length} corridors, ${Object.keys(expansionStates).length} countries, ${totalWarnings} warnings, ${retargetSynced} retarget candidates`);

    return {
        run_date: runDate,
        corridors_evaluated: allMetrics.length,
        countries_evaluated: Object.keys(expansionStates).length,
        warnings_generated: totalWarnings,
        retarget_candidates_synced: retargetSynced,
        ads_decisions_made: adsDecisions,
        expansion_states: expansionStates,
        executive_summary: executiveSummary,
        duration_ms: duration,
    };
}
