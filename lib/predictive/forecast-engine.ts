// lib/predictive/forecast-engine.ts
//
// Haul Command — Predictive Liquidity Forecast Engine
// Spec: Predictive Liquidity Engine v1.0.0 — Part C
//
// Hybrid explainable forecaster: EWMA trend + mean reversion + event adjustments.
// Produces 7/14/21-day predictions for CLS, match rate, participation,
// demand posts, time-to-match. Risk scored + confidence bounded.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface ForecastInput {
    corridor_id: string;
    snapshot_date: string;

    // Current features
    cls: number;
    stage: string;
    match_rate: number;
    participation_rate: number;
    demand_posts_count: number;
    median_time_to_match_minutes: number;
    repeat_poster_rate: number;

    // Moving averages + deltas
    cls_ma_7d: number;
    cls_ma_14d: number;
    cls_delta_7d: number;
    match_rate_ma_7d: number;
    participation_ma_7d: number;
    demand_posts_ma_7d: number;
    time_to_match_ma_7d: number;

    // Health/engagement signals
    phantom_supply_flag: boolean;
    backlog_flag: boolean;
    critical_count_7d: number;
    participation_delta_7d: number;
    demand_posts_delta_7d: number;
    vapi_engaged_rate_7d: number;
    activation_rate_7d: number;

    // Quality
    history_days: number;
}

export interface ForecastResult {
    corridor_id: string;
    forecast_date: string;
    horizon_days: number;
    target_date: string;

    cls_pred: number;
    match_rate_pred: number;
    participation_pred: number;
    demand_posts_pred: number;
    time_to_match_minutes_pred: number;
    supply_active_pred: number;

    risk_score: number;
    risk_band: 'green' | 'yellow' | 'red';
    confidence: number;
    model_version: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const HORIZONS = [7, 14, 21];

const STAGE_BANDS: Record<string, { min: number; max: number }> = {
    seeding: { min: 5, max: 45 },
    early_liquidity: { min: 20, max: 60 },
    market_formation: { min: 35, max: 80 },
    corridor_dominance: { min: 55, max: 95 },
};

const EVENT_ADJUSTMENTS = {
    phantom_supply: { cls_penalty: 10, confidence_penalty: 0.18 },
    backlog: { cls_penalty: 6, confidence_penalty: 0.10 },
    critical_warning: { cls_penalty: 8, confidence_penalty: 0.12 },
    demand_spike: { cls_boost: 4, confidence_boost: 0.06 },
    participation_drop: { cls_penalty: 5, confidence_penalty: 0.08 },
};

const GUARDRAILS = {
    max_daily_cls_delta: 18,
    min_history_days: 21,
    confidence_base: 0.72,
    confidence_min: 0.30,
    confidence_max: 0.92,
};

// ============================================================
// UTILITY
// ============================================================

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function normalizeScore(v: number, max: number): number {
    return clamp(v / max, 0, 1);
}

// ============================================================
// CLS FORECAST (HYBRID: EWMA + MEAN REVERSION + EVENTS)
// ============================================================

function forecastCLS(input: ForecastInput, horizonDays: number): { cls_pred: number; confidence: number } {
    // ── 1. Baseline trend (EWMA) ──
    // Weight recent MA more heavily; extend delta
    const trendWeight = horizonDays <= 7 ? 0.70 : horizonDays <= 14 ? 0.55 : 0.40;
    const reversionWeight = 1 - trendWeight;

    const ewmaBaseline = input.cls_ma_7d + (input.cls_delta_7d / 7) * horizonDays * 0.5;

    // ── 2. Mean reversion toward stage band ──
    const band = STAGE_BANDS[input.stage] || STAGE_BANDS.seeding;
    const bandMid = (band.min + band.max) / 2;
    const meanReverted = clamp(ewmaBaseline * 0.7 + bandMid * 0.3, band.min, band.max);

    // ── 3. Blend ──
    let clsPred = ewmaBaseline * trendWeight + meanReverted * reversionWeight;

    // ── 4. Event adjustments ──
    let confidence = GUARDRAILS.confidence_base;

    if (input.phantom_supply_flag) {
        clsPred -= EVENT_ADJUSTMENTS.phantom_supply.cls_penalty;
        confidence -= EVENT_ADJUSTMENTS.phantom_supply.confidence_penalty;
    }
    if (input.backlog_flag) {
        clsPred -= EVENT_ADJUSTMENTS.backlog.cls_penalty;
        confidence -= EVENT_ADJUSTMENTS.backlog.confidence_penalty;
    }
    if (input.critical_count_7d >= 1) {
        clsPred -= EVENT_ADJUSTMENTS.critical_warning.cls_penalty;
        confidence -= EVENT_ADJUSTMENTS.critical_warning.confidence_penalty;
    }
    if (input.demand_posts_delta_7d > input.demand_posts_count * 0.15) {
        clsPred += EVENT_ADJUSTMENTS.demand_spike.cls_boost;
        confidence += EVENT_ADJUSTMENTS.demand_spike.confidence_boost;
    }
    if (input.participation_delta_7d <= -10) {
        clsPred -= EVENT_ADJUSTMENTS.participation_drop.cls_penalty;
        confidence -= EVENT_ADJUSTMENTS.participation_drop.confidence_penalty;
    }

    // ── 5. Data quality penalties ──
    if (input.history_days < GUARDRAILS.min_history_days) {
        confidence -= 0.20;
    }

    // ── 6. Guardrails ──
    // Max daily CLS change
    const maxClsChange = GUARDRAILS.max_daily_cls_delta * (horizonDays / 7);
    clsPred = clamp(clsPred, input.cls - maxClsChange, input.cls + maxClsChange);
    clsPred = clamp(clsPred, 0, 100);

    confidence = clamp(confidence, GUARDRAILS.confidence_min, GUARDRAILS.confidence_max);

    // Longer horizons = lower confidence
    confidence *= (1 - (horizonDays - 7) * 0.015);
    confidence = clamp(confidence, GUARDRAILS.confidence_min, GUARDRAILS.confidence_max);

    return {
        cls_pred: Math.round(clsPred * 100) / 100,
        confidence: Math.round(confidence * 1000) / 1000,
    };
}

// ============================================================
// METRIC FORECASTS (match rate, participation, demand, TTM)
// ============================================================

function forecastMetrics(input: ForecastInput, clsPred: number): {
    match_rate_pred: number;
    participation_pred: number;
    demand_posts_pred: number;
    time_to_match_minutes_pred: number;
} {
    // Match rate
    let matchRatePred = input.match_rate_ma_7d +
        0.25 * (clsPred - input.cls);
    if (input.phantom_supply_flag) matchRatePred -= 6;
    if (input.backlog_flag) matchRatePred -= 4;
    matchRatePred = clamp(matchRatePred, 10, 90);

    // Participation
    let participationPred = input.participation_ma_7d +
        0.12 * (input.vapi_engaged_rate_7d - 45) +
        0.10 * (input.activation_rate_7d - 55) -
        2.5 * input.critical_count_7d;
    participationPred = clamp(participationPred, 5, 75);

    // Demand posts
    let demandPostsPred = input.demand_posts_ma_7d +
        0.35 * (input.repeat_poster_rate - 30) +
        0.20 * (matchRatePred - input.match_rate_ma_7d);
    demandPostsPred = Math.max(0, demandPostsPred);

    // Time to match
    let ttmPred = input.time_to_match_ma_7d -
        0.8 * (matchRatePred - input.match_rate_ma_7d);
    if (input.backlog_flag) ttmPred += 25;
    ttmPred = Math.max(10, ttmPred);

    return {
        match_rate_pred: Math.round(matchRatePred * 100) / 100,
        participation_pred: Math.round(participationPred * 100) / 100,
        demand_posts_pred: Math.round(demandPostsPred * 100) / 100,
        time_to_match_minutes_pred: Math.round(ttmPred * 100) / 100,
    };
}

// ============================================================
// RISK SCORING
// ============================================================

function computeRisk(
    clsPred: number,
    matchRatePred: number,
    participationPred: number,
    criticalCount: number
): { risk_score: number; risk_band: 'green' | 'yellow' | 'red' } {
    const riskScore = clamp(
        normalizeScore(Math.max(0, 60 - clsPred), 60) * 0.40 +
        normalizeScore(Math.max(0, 55 - matchRatePred), 55) * 0.30 +
        normalizeScore(Math.max(0, 25 - participationPred), 25) * 0.20 +
        normalizeScore(criticalCount, 5) * 0.10,
        0, 1
    );

    let band: 'green' | 'yellow' | 'red' = 'green';
    if (riskScore > 0.66) band = 'red';
    else if (riskScore >= 0.33) band = 'yellow';

    return {
        risk_score: Math.round(riskScore * 100) / 100,
        risk_band: band,
    };
}

// ============================================================
// SINGLE CORRIDOR FORECAST
// ============================================================

export function generateCorridorForecast(input: ForecastInput): ForecastResult[] {
    const results: ForecastResult[] = [];

    for (const horizon of HORIZONS) {
        const { cls_pred, confidence } = forecastCLS(input, horizon);
        const metrics = forecastMetrics(input, cls_pred);
        const risk = computeRisk(cls_pred, metrics.match_rate_pred, metrics.participation_pred, input.critical_count_7d);

        const targetDate = new Date(input.snapshot_date);
        targetDate.setDate(targetDate.getDate() + horizon);

        results.push({
            corridor_id: input.corridor_id,
            forecast_date: input.snapshot_date,
            horizon_days: horizon,
            target_date: targetDate.toISOString().split('T')[0],

            cls_pred,
            match_rate_pred: metrics.match_rate_pred,
            participation_pred: metrics.participation_pred,
            demand_posts_pred: metrics.demand_posts_pred,
            time_to_match_minutes_pred: metrics.time_to_match_minutes_pred,
            supply_active_pred: 0, // Would derive from participation

            risk_score: risk.risk_score,
            risk_band: risk.risk_band,
            confidence,
            model_version: 'v1',
        });
    }

    return results;
}

// ============================================================
// BATCH FORECAST (ALL CORRIDORS)
// ============================================================

export async function runDailyForecasts(snapshotDate: string): Promise<{
    corridors_forecasted: number;
    forecasts_written: number;
    red_corridors: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // Check model enabled
    const { data: model } = await supabase
        .from('forecast_model_registry')
        .select('enabled, guardrails')
        .eq('model_key', 'cls_forecaster_v1')
        .single();

    if (!model?.enabled) {
        return { corridors_forecasted: 0, forecasts_written: 0, red_corridors: 0, duration_ms: 0 };
    }

    // Pull feature store for today
    const { data: features } = await supabase
        .from('corridor_feature_store_daily')
        .select('*')
        .eq('snapshot_date', snapshotDate);

    let written = 0;
    let redCount = 0;

    for (const f of features || []) {
        const input: ForecastInput = {
            corridor_id: f.corridor_id,
            snapshot_date: snapshotDate,
            cls: f.cls || 0,
            stage: f.stage || 'seeding',
            match_rate: f.match_rate || 0,
            participation_rate: f.participation_rate || 0,
            demand_posts_count: f.demand_posts_count || 0,
            median_time_to_match_minutes: f.median_time_to_match_minutes || 0,
            repeat_poster_rate: f.repeat_poster_rate || 0,
            cls_ma_7d: f.cls_ma_7d || 0,
            cls_ma_14d: f.cls_ma_14d || 0,
            cls_delta_7d: f.cls_delta_7d || 0,
            match_rate_ma_7d: f.match_rate_ma_7d || 0,
            participation_ma_7d: f.participation_ma_7d || 0,
            demand_posts_ma_7d: f.demand_posts_ma_7d || 0,
            time_to_match_ma_7d: f.time_to_match_ma_7d || 0,
            phantom_supply_flag: f.phantom_supply_flag || false,
            backlog_flag: f.backlog_flag || false,
            critical_count_7d: f.critical_count_7d || 0,
            participation_delta_7d: f.participation_delta_7d || 0,
            demand_posts_delta_7d: f.demand_posts_delta_7d || 0,
            vapi_engaged_rate_7d: f.vapi_engaged_rate_7d || 0,
            activation_rate_7d: f.activation_rate_7d || 0,
            history_days: 21, // Would compute from actual record count
        };

        const forecasts = generateCorridorForecast(input);

        for (const fc of forecasts) {
            const { error } = await supabase.from('corridor_liquidity_forecasts').upsert({
                corridor_id: fc.corridor_id,
                forecast_date: fc.forecast_date,
                horizon_days: fc.horizon_days,
                target_date: fc.target_date,
                cls_pred: fc.cls_pred,
                match_rate_pred: fc.match_rate_pred,
                participation_pred: fc.participation_pred,
                demand_posts_pred: fc.demand_posts_pred,
                supply_active_pred: fc.supply_active_pred,
                time_to_match_minutes_pred: fc.time_to_match_minutes_pred,
                risk_band: fc.risk_band,
                risk_score: fc.risk_score,
                model_version: fc.model_version,
                confidence: fc.confidence,
            }, { onConflict: 'corridor_id,forecast_date,horizon_days' });

            if (!error) written++;
            if (fc.risk_band === 'red') redCount++;
        }
    }

    return {
        corridors_forecasted: (features || []).length,
        forecasts_written: written,
        red_corridors: redCount,
        duration_ms: Date.now() - startTime,
    };
}
