// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE HEALTH MONITOR v1
// Real-time health heartbeat per country × corridor × metro
//
// Prevents: ghost towns, overloaded metros, slow fills, silent demand deserts
//
// Computes:
//   - supply_count_7d / demand_count_7d
//   - fill_rate
//   - median_time_to_fill
//   - active_operator_density
//   - broker_posting_velocity
//
// Outputs:
//   - liquidity_status: [undersupplied, balanced, oversupplied]
//   - risk_flags when fill_rate < threshold
//   - expansion_signals when demand > supply consistently
//
// Feeds into: internal dashboard, corridor intelligence, AdGrid targeting,
// growth automation triggers, notification intelligence
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { COUNTRY_REGISTRY } from '../config/country-registry';
import { HCServerTrack } from '../analytics/posthog-server';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type LiquidityStatus = 'undersupplied' | 'balanced' | 'oversupplied';
export type HealthLevel = 'healthy' | 'warning' | 'critical' | 'dead';

export interface MarketHealthSnapshot {
    // Identity
    entityType: 'country' | 'corridor' | 'metro';
    entityId: string;         // country code, corridor ID, or metro slug
    countryCode: string;
    displayName: string;

    // Supply metrics (7-day rolling)
    supplyCount7d: number;       // unique active operators
    supplyTrend7d: number;       // % change from prior 7d
    newOperators7d: number;      // new registrations
    churningOperators7d: number; // operators gone inactive

    // Demand metrics (7-day rolling)
    demandCount7d: number;          // total loads posted
    demandTrend7d: number;         // % change from prior 7d
    brokerPostingVelocity: number; // loads/day average
    urgentLoads7d: number;         // loads with < 24hr urgency

    // Fill metrics
    fillRate: number;                  // 0-1 (fills / total loads)
    medianTimeToFillHours: number;     // median hours to first response
    fillRateTrend7d: number;           // % change in fill rate
    abandonedLoadsPct: number;         // loads that expired without fill

    // Density
    activeOperatorDensity: number;     // operators per 100km² or per corridor
    demandPerOperator: number;         // loads per operator (overload signal)

    // Computed statuses
    liquidityStatus: LiquidityStatus;
    healthLevel: HealthLevel;
    riskFlags: RiskFlag[];
    expansionSignals: ExpansionSignal[];

    // Meta
    snapshotTimestamp: string;
    dataWindowDays: number;
}

export interface RiskFlag {
    type: 'fill_rate_critical' | 'fill_rate_warning' | 'operator_churn'
    | 'demand_collapse' | 'oversupply_waste' | 'time_to_fill_degraded'
    | 'abandoned_loads_high';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric: string;
    threshold: number;
    actual: number;
}

export interface ExpansionSignal {
    type: 'demand_exceeds_supply' | 'high_urgency_volume' | 'positive_broker_velocity'
    | 'competitor_gap' | 'seasonal_ramp';
    message: string;
    strength: 'weak' | 'moderate' | 'strong';
    recommendedAction: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// THRESHOLDS — Tunable per deployment
// ═══════════════════════════════════════════════════════════════════════════════

export const HEALTH_THRESHOLDS = {
    // Fill rate
    fillRate: {
        healthy: 0.65,    // ≥65% fill = healthy
        warning: 0.40,    // 40-65% = warning
        critical: 0.20,   // <20% = critical
        dead: 0.05,       // <5% = dead marketplace
    },
    // Time to fill
    medianFillHours: {
        fast: 4,
        normal: 12,
        slow: 24,
        critical: 48,
    },
    // Liquidity ratio (demand / supply)
    liquidityRatio: {
        undersupplied: 3.0,   // >3 loads per operator = undersupplied
        balanced_low: 1.0,
        balanced_high: 3.0,
        oversupplied: 0.5,    // <0.5 loads per operator = oversupplied
    },
    // Churn
    churnPctWarning: 0.10,    // >10% operator churn in 7d
    churnPctCritical: 0.25,   // >25% churn = emergency
    // Abandoned loads
    abandonedWarning: 0.15,   // >15% loads abandoned
    abandonedCritical: 0.30,  // >30% abandoned = dead demand
    // Expansion signals
    demandToSupplyExpansion: 5.0, // >5× demand/supply = expand
    urgentLoadsPctStrong: 0.30,   // >30% urgent loads = strong signal
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export class MarketHealthMonitor {

    // ── Compute Health for a Single Entity ──────────────────────────────────

    static computeHealth(metrics: {
        supplyCount7d: number;
        supplyPrior7d: number;
        newOperators7d: number;
        churningOperators7d: number;
        demandCount7d: number;
        demandPrior7d: number;
        urgentLoads7d: number;
        fills7d: number;
        medianFillHours: number;
        priorFillRate?: number;
        abandonedLoads7d: number;
        areaKm2?: number;
        entityType: 'country' | 'corridor' | 'metro';
        entityId: string;
        countryCode: string;
        displayName: string;
    }): MarketHealthSnapshot {
        const m = metrics;

        // Supply trends
        const supplyTrend = m.supplyPrior7d > 0
            ? ((m.supplyCount7d - m.supplyPrior7d) / m.supplyPrior7d) * 100
            : 0;

        // Demand trends
        const demandTrend = m.demandPrior7d > 0
            ? ((m.demandCount7d - m.demandPrior7d) / m.demandPrior7d) * 100
            : 0;

        const brokerVelocity = m.demandCount7d / 7;

        // Fill metrics
        const totalLoads = m.demandCount7d || 1;
        const fillRate = m.fills7d / totalLoads;
        const fillRateTrend = m.priorFillRate !== undefined && m.priorFillRate > 0
            ? ((fillRate - m.priorFillRate) / m.priorFillRate) * 100
            : 0;
        const abandonedPct = m.abandonedLoads7d / totalLoads;

        // Density
        const density = m.areaKm2 && m.areaKm2 > 0
            ? (m.supplyCount7d / m.areaKm2) * 10000 // per 100km²
            : m.supplyCount7d;
        const demandPerOp = m.supplyCount7d > 0
            ? m.demandCount7d / m.supplyCount7d
            : m.demandCount7d;

        // Liquidity status
        const liquidityStatus = this.computeLiquidityStatus(demandPerOp);

        // Health level
        const healthLevel = this.computeHealthLevel(fillRate, m.medianFillHours, abandonedPct);

        // Risk flags
        const riskFlags = this.detectRiskFlags(fillRate, m.medianFillHours, abandonedPct,
            m.churningOperators7d, m.supplyCount7d, demandTrend);

        // Expansion signals
        const expansionSignals = this.detectExpansionSignals(
            demandPerOp, m.urgentLoads7d, totalLoads, brokerVelocity, demandTrend,
        );

        return {
            entityType: m.entityType,
            entityId: m.entityId,
            countryCode: m.countryCode,
            displayName: m.displayName,
            supplyCount7d: m.supplyCount7d,
            supplyTrend7d: Math.round(supplyTrend * 10) / 10,
            newOperators7d: m.newOperators7d,
            churningOperators7d: m.churningOperators7d,
            demandCount7d: m.demandCount7d,
            demandTrend7d: Math.round(demandTrend * 10) / 10,
            brokerPostingVelocity: Math.round(brokerVelocity * 10) / 10,
            urgentLoads7d: m.urgentLoads7d,
            fillRate: Math.round(fillRate * 1000) / 1000,
            medianTimeToFillHours: Math.round(m.medianFillHours * 10) / 10,
            fillRateTrend7d: Math.round(fillRateTrend * 10) / 10,
            abandonedLoadsPct: Math.round(abandonedPct * 1000) / 1000,
            activeOperatorDensity: Math.round(density * 100) / 100,
            demandPerOperator: Math.round(demandPerOp * 10) / 10,
            liquidityStatus,
            healthLevel,
            riskFlags,
            expansionSignals,
            snapshotTimestamp: new Date().toISOString(),
            dataWindowDays: 7,
        };
    }

    // ── Compute for All 52 Countries ────────────────────────────────────────

    static computeGlobalHealth(
        countryMetrics: Map<string, {
            supply: number; supplyPrior: number; newOps: number; churnOps: number;
            demand: number; demandPrior: number; urgent: number;
            fills: number; medianFillHrs: number; abandoned: number;
        }>,
    ): MarketHealthSnapshot[] {
        const snapshots: MarketHealthSnapshot[] = [];

        for (const country of COUNTRY_REGISTRY) {
            const m = countryMetrics.get(country.code);
            if (!m) {
                // Empty country — flag as dead
                snapshots.push(this.computeHealth({
                    supplyCount7d: 0, supplyPrior7d: 0, newOperators7d: 0, churningOperators7d: 0,
                    demandCount7d: 0, demandPrior7d: 0, urgentLoads7d: 0,
                    fills7d: 0, medianFillHours: 0, abandonedLoads7d: 0,
                    entityType: 'country', entityId: country.code,
                    countryCode: country.code, displayName: country.name,
                }));
                continue;
            }

            snapshots.push(this.computeHealth({
                supplyCount7d: m.supply, supplyPrior7d: m.supplyPrior,
                newOperators7d: m.newOps, churningOperators7d: m.churnOps,
                demandCount7d: m.demand, demandPrior7d: m.demandPrior,
                urgentLoads7d: m.urgent,
                fills7d: m.fills, medianFillHours: m.medianFillHrs,
                abandonedLoads7d: m.abandoned,
                entityType: 'country', entityId: country.code,
                countryCode: country.code, displayName: country.name,
            }));
        }

        return snapshots;
    }

    // ── Persist Snapshot to DB ───────────────────────────────────────────────

    static async persistSnapshots(snapshots: MarketHealthSnapshot[]): Promise<void> {
        const admin = getAdmin();

        const rows = snapshots.map(s => ({
            entity_type: s.entityType,
            entity_id: s.entityId,
            country_code: s.countryCode,
            display_name: s.displayName,
            supply_count_7d: s.supplyCount7d,
            supply_trend_7d: s.supplyTrend7d,
            demand_count_7d: s.demandCount7d,
            demand_trend_7d: s.demandTrend7d,
            fill_rate: s.fillRate,
            median_time_to_fill_hours: s.medianTimeToFillHours,
            liquidity_status: s.liquidityStatus,
            health_level: s.healthLevel,
            risk_flags: s.riskFlags,
            expansion_signals: s.expansionSignals,
            snapshot_data: s,
            snapshot_at: s.snapshotTimestamp,
        }));

        const { error } = await admin.from('marketplace_health_snapshots').insert(rows);
        if (error) console.error('[MarketHealthMonitor] Persist error:', error.message);
    }

    // ── Feed PostHog with Health Metrics ─────────────────────────────────────

    static trackInPostHog(snapshots: MarketHealthSnapshot[]): void {
        for (const s of snapshots) {
            if (s.healthLevel === 'critical' || s.healthLevel === 'dead') {
                HCServerTrack.corridorHealthSnapshot({
                    corridorId: s.entityId,
                    countryCode: s.countryCode,
                    liquidityRatio: s.demandPerOperator,
                    fillRate: s.fillRate,
                    activeOperators: s.supplyCount7d,
                    loadVolume24h: Math.round(s.brokerPostingVelocity),
                    medianFillTimeHours: s.medianTimeToFillHours,
                });
            }
        }
    }

    // ── Get Growth Automation Triggers ───────────────────────────────────────

    static getGrowthTriggers(snapshots: MarketHealthSnapshot[]): Array<{
        countryCode: string;
        entityId: string;
        triggerType: 'recruit_operators' | 'recruit_brokers' | 'boost_demand' | 'reduce_supply_cost';
        urgency: 'low' | 'medium' | 'high';
        message: string;
    }> {
        const triggers = [];

        for (const s of snapshots) {
            // Undersupplied → recruit operators
            if (s.liquidityStatus === 'undersupplied' && s.demandCount7d > 5) {
                triggers.push({
                    countryCode: s.countryCode,
                    entityId: s.entityId,
                    triggerType: 'recruit_operators' as const,
                    urgency: s.healthLevel === 'critical' ? 'high' as const : 'medium' as const,
                    message: `${s.displayName}: ${s.demandPerOperator.toFixed(1)}× demand/supply ratio. Need ${Math.ceil(s.demandCount7d / 2)} more operators.`,
                });
            }

            // Oversupplied → need brokers/demand
            if (s.liquidityStatus === 'oversupplied' && s.supplyCount7d > 5) {
                triggers.push({
                    countryCode: s.countryCode,
                    entityId: s.entityId,
                    triggerType: 'recruit_brokers' as const,
                    urgency: 'medium' as const,
                    message: `${s.displayName}: Oversupplied with ${s.supplyCount7d} operators but only ${s.demandCount7d} loads/week.`,
                });
            }

            // High fill time degradation
            if (s.medianTimeToFillHours > HEALTH_THRESHOLDS.medianFillHours.critical) {
                triggers.push({
                    countryCode: s.countryCode,
                    entityId: s.entityId,
                    triggerType: 'boost_demand' as const,
                    urgency: 'high' as const,
                    message: `${s.displayName}: Median fill time is ${s.medianTimeToFillHours}h — above ${HEALTH_THRESHOLDS.medianFillHours.critical}h threshold.`,
                });
            }
        }

        return triggers;
    }

    // ── Private Helpers ─────────────────────────────────────────────────────

    private static computeLiquidityStatus(demandPerOp: number): LiquidityStatus {
        if (demandPerOp > HEALTH_THRESHOLDS.liquidityRatio.undersupplied) return 'undersupplied';
        if (demandPerOp < HEALTH_THRESHOLDS.liquidityRatio.oversupplied) return 'oversupplied';
        return 'balanced';
    }

    private static computeHealthLevel(fillRate: number, medianFillHrs: number, abandonedPct: number): HealthLevel {
        if (fillRate < HEALTH_THRESHOLDS.fillRate.dead) return 'dead';
        if (fillRate < HEALTH_THRESHOLDS.fillRate.critical || abandonedPct > HEALTH_THRESHOLDS.abandonedCritical) return 'critical';
        if (fillRate < HEALTH_THRESHOLDS.fillRate.warning || medianFillHrs > HEALTH_THRESHOLDS.medianFillHours.critical) return 'warning';
        return 'healthy';
    }

    private static detectRiskFlags(
        fillRate: number, medianFillHrs: number, abandonedPct: number,
        churnOps: number, totalOps: number, demandTrend: number,
    ): RiskFlag[] {
        const flags: RiskFlag[] = [];
        const T = HEALTH_THRESHOLDS;

        if (fillRate < T.fillRate.critical) {
            flags.push({
                type: 'fill_rate_critical', severity: 'critical',
                message: `Fill rate critically low at ${(fillRate * 100).toFixed(1)}%`,
                metric: 'fill_rate', threshold: T.fillRate.critical, actual: fillRate,
            });
        } else if (fillRate < T.fillRate.warning) {
            flags.push({
                type: 'fill_rate_warning', severity: 'high',
                message: `Fill rate declining: ${(fillRate * 100).toFixed(1)}%`,
                metric: 'fill_rate', threshold: T.fillRate.warning, actual: fillRate,
            });
        }

        if (medianFillHrs > T.medianFillHours.critical) {
            flags.push({
                type: 'time_to_fill_degraded', severity: 'high',
                message: `Median fill time ${medianFillHrs.toFixed(1)}h exceeds ${T.medianFillHours.critical}h threshold`,
                metric: 'median_fill_hours', threshold: T.medianFillHours.critical, actual: medianFillHrs,
            });
        }

        const churnPct = totalOps > 0 ? churnOps / totalOps : 0;
        if (churnPct > T.churnPctCritical) {
            flags.push({
                type: 'operator_churn', severity: 'critical',
                message: `${(churnPct * 100).toFixed(1)}% operator churn in 7 days`,
                metric: 'churn_pct', threshold: T.churnPctCritical, actual: churnPct,
            });
        } else if (churnPct > T.churnPctWarning) {
            flags.push({
                type: 'operator_churn', severity: 'medium',
                message: `${(churnPct * 100).toFixed(1)}% operator churn in 7 days`,
                metric: 'churn_pct', threshold: T.churnPctWarning, actual: churnPct,
            });
        }

        if (abandonedPct > T.abandonedCritical) {
            flags.push({
                type: 'abandoned_loads_high', severity: 'critical',
                message: `${(abandonedPct * 100).toFixed(1)}% of loads abandoned without fill`,
                metric: 'abandoned_pct', threshold: T.abandonedCritical, actual: abandonedPct,
            });
        }

        if (demandTrend < -30) {
            flags.push({
                type: 'demand_collapse', severity: 'high',
                message: `Demand dropped ${Math.abs(demandTrend).toFixed(1)}% week-over-week`,
                metric: 'demand_trend', threshold: -30, actual: demandTrend,
            });
        }

        return flags;
    }

    private static detectExpansionSignals(
        demandPerOp: number, urgentLoads: number, totalLoads: number,
        brokerVelocity: number, demandTrend: number,
    ): ExpansionSignal[] {
        const signals: ExpansionSignal[] = [];

        if (demandPerOp > HEALTH_THRESHOLDS.demandToSupplyExpansion) {
            signals.push({
                type: 'demand_exceeds_supply',
                message: `${demandPerOp.toFixed(1)}× demand/supply ratio — strong expansion opportunity`,
                strength: demandPerOp > 10 ? 'strong' : 'moderate',
                recommendedAction: 'Launch targeted operator recruitment campaign',
            });
        }

        const urgentPct = totalLoads > 0 ? urgentLoads / totalLoads : 0;
        if (urgentPct > HEALTH_THRESHOLDS.urgentLoadsPctStrong) {
            signals.push({
                type: 'high_urgency_volume',
                message: `${(urgentPct * 100).toFixed(0)}% of loads are urgent — premium pricing opportunity`,
                strength: 'strong',
                recommendedAction: 'Enable surge pricing and instant-match notifications',
            });
        }

        if (demandTrend > 20 && brokerVelocity > 2) {
            signals.push({
                type: 'positive_broker_velocity',
                message: `Demand growing ${demandTrend.toFixed(0)}% with ${brokerVelocity.toFixed(1)} loads/day`,
                strength: demandTrend > 40 ? 'strong' : 'moderate',
                recommendedAction: 'Scale operator outreach and enable load boost features',
            });
        }

        return signals;
    }
}
