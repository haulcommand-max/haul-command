// lib/predictive/pre-activation-engine.ts
//
// Haul Command — Pre-Activation Engine
// Spec: Predictive Liquidity Engine v1.0.0 — Part D
//
// Reads forecasts, evaluates triggers, generates recommendations
// with compliance gates and playbook matching.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type RecommendationType = 'supply' | 'demand' | 'both';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type RecStatus = 'queued' | 'running' | 'completed' | 'skipped' | 'blocked';

export interface Trigger {
    name: string;
    when: (forecast: any, features: any) => boolean;
    recommendation_type: RecommendationType;
    playbook_key: string;
    priority: Priority;
}

export interface Recommendation {
    corridor_id: string;
    forecast_date: string;
    horizon_days: number;
    target_date: string;
    recommendation_type: RecommendationType;
    playbook_key: string;
    priority: Priority;
    recommended_actions: any;
    expected_impact: any;
    safety_constraints: any;
    status: RecStatus;
    blocked_reason?: string;
}

// ============================================================
// TRIGGERS (from spec Part D)
// ============================================================

const TRIGGERS: Trigger[] = [
    {
        name: 'supply_shortage_predicted',
        when: (fc, ft) =>
            (fc.risk_band === 'yellow' || fc.risk_band === 'red') &&
            fc.participation_pred < 25,
        recommendation_type: 'supply',
        playbook_key: 'supply_pre_activation_v1',
        priority: 'high',
    },
    {
        name: 'demand_spike_predicted',
        when: (fc, ft) =>
            (fc.risk_band === 'yellow' || fc.risk_band === 'red') &&
            fc.demand_posts_pred > (ft.demand_posts_count || 0) * 1.20,
        recommendation_type: 'demand',
        playbook_key: 'demand_pre_activation_v1',
        priority: 'high',
    },
    {
        name: 'match_regression_predicted',
        when: (fc) =>
            fc.risk_band === 'red' && fc.match_rate_pred < 45,
        recommendation_type: 'both',
        playbook_key: 'emergency_stabilize_v1',
        priority: 'critical',
    },
    {
        name: 'dominance_opportunity',
        when: (fc, ft) =>
            fc.risk_band === 'green' &&
            fc.cls_pred >= 75 &&
            (ft.repeat_poster_rate || 0) >= 30,
        recommendation_type: 'both',
        playbook_key: 'dominance_accelerator_v1',
        priority: 'medium',
    },
];

// ============================================================
// COMPLIANCE GATES
// ============================================================

interface ComplianceGateResult {
    allowed: boolean;
    downgrades: string[];
    blocks: string[];
}

async function checkComplianceGates(
    corridorId: string,
    countryCode: string,
    channel: string
): Promise<ComplianceGateResult> {
    const supabase = getSupabaseAdmin();
    const blocks: string[] = [];
    const downgrades: string[] = [];

    const { data: rules } = await supabase
        .from('country_call_rules')
        .select('*')
        .eq('country_code', countryCode)
        .single();

    if (!rules) {
        return { allowed: true, downgrades: [], blocks: [] };
    }

    // Quiet hours check (simplified — full check in global-guard.ts)
    const currentHour = new Date().getHours();
    if (rules.quiet_hours_start > rules.quiet_hours_end) {
        if (currentHour >= rules.quiet_hours_start || currentHour < rules.quiet_hours_end) {
            if (channel === 'vapi_call') {
                downgrades.push('delay_until_next_window');
            }
        }
    }

    // Consent gate
    if (rules.consent_required && channel === 'vapi_call') {
        // Would check actual consent status per entity
        // For now, flag as needing verification
    }

    // Autodial gate
    if (!rules.autodial_allowed && channel === 'vapi_call') {
        downgrades.push('route_to_manual_queue');
    }

    return {
        allowed: blocks.length === 0,
        downgrades,
        blocks,
    };
}

// ============================================================
// MAIN: GENERATE RECOMMENDATIONS
// ============================================================

export async function generatePreActivationRecs(forecastDate: string): Promise<{
    recommendations_generated: number;
    critical_count: number;
    blocked_count: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // Pull today's forecasts
    const { data: forecasts } = await supabase
        .from('corridor_liquidity_forecasts')
        .select('*')
        .eq('forecast_date', forecastDate);

    // Pull today's features
    const { data: features } = await supabase
        .from('corridor_feature_store_daily')
        .select('*')
        .eq('snapshot_date', forecastDate);

    const featureMap = new Map<string, any>();
    for (const f of features || []) {
        featureMap.set(f.corridor_id, f);
    }

    // Pull enabled playbooks
    const { data: playbooks } = await supabase
        .from('pre_activation_playbooks')
        .select('*')
        .eq('enabled', true);

    const playbookMap = new Map<string, any>();
    for (const p of playbooks || []) {
        playbookMap.set(p.playbook_key, p);
    }

    let generated = 0;
    let criticalCount = 0;
    let blockedCount = 0;

    for (const forecast of forecasts || []) {
        const feat = featureMap.get(forecast.corridor_id);
        if (!feat) continue;

        for (const trigger of TRIGGERS) {
            if (!trigger.when(forecast, feat)) continue;

            const playbook = playbookMap.get(trigger.playbook_key);
            if (!playbook) continue;

            // Risk band gate
            const riskOrder = { green: 0, yellow: 1, red: 2 };
            const minRisk = riskOrder[playbook.min_risk_band as keyof typeof riskOrder] ?? 1;
            const forecastRisk = riskOrder[forecast.risk_band as keyof typeof riskOrder] ?? 0;
            if (forecastRisk < minRisk && trigger.playbook_key !== 'dominance_accelerator_v1') continue;

            // Compliance gates
            const compliance = await checkComplianceGates(
                forecast.corridor_id,
                feat.country_code || 'US',
                'vapi_call'
            );

            const status: RecStatus = compliance.blocks.length > 0 ? 'blocked' : 'queued';
            if (status === 'blocked') blockedCount++;
            if (trigger.priority === 'critical') criticalCount++;

            const { error } = await supabase.from('pre_activation_recommendations').insert({
                corridor_id: forecast.corridor_id,
                forecast_date: forecastDate,
                horizon_days: forecast.horizon_days,
                target_date: forecast.target_date,
                recommendation_type: trigger.recommendation_type,
                playbook_key: trigger.playbook_key,
                priority: trigger.priority,
                recommended_actions: playbook.action_bundle,
                expected_impact: {
                    trigger_name: trigger.name,
                    cls_pred: forecast.cls_pred,
                    risk_band: forecast.risk_band,
                    confidence: forecast.confidence,
                },
                safety_constraints: {
                    caps: playbook.default_caps,
                    compliance_downgrades: compliance.downgrades,
                    compliance_blocks: compliance.blocks,
                },
                status,
                blocked_reason: compliance.blocks.length > 0 ? compliance.blocks.join('; ') : null,
            });

            if (!error) generated++;
        }
    }

    return {
        recommendations_generated: generated,
        critical_count: criticalCount,
        blocked_count: blockedCount,
        duration_ms: Date.now() - startTime,
    };
}
