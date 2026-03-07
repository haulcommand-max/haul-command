// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL LIQUIDITY AUTOPILOT
// Self-balances supply and demand before humans notice
//
// Parent systems:
//   - Global Freemium Pressure Engine
//   - Market Intelligence Engine
//
// Control modes:
//   1. observe_only — collect signals, no intervention (default for new markets)
//   2. assisted — recommend actions, require approval
//   3. full_autopilot — system acts automatically
// ═══════════════════════════════════════════════════════════════════════════════

import type { CountryTier, CorridorHeatSignals, UserBehaviorSignals } from './freemium-pressure-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type LiquidityState = 'critical_shortage' | 'soft_shortage' | 'healthy' | 'oversupplied';
export type ControlMode = 'observe_only' | 'assisted' | 'full_autopilot';

export interface TierConfig {
    countries: string[];
    minLiquidityRatio: number;
    healthyBand: [number, number];
    interventionAggressiveness: 'high' | 'medium' | 'cautious' | 'minimal';
    predictionHorizonDays: number;
    pricingFlexibility: 'high' | 'medium' | 'conservative' | 'minimal';
}

export interface LiquidityStateResult {
    corridorId: string;
    countryCode: string;
    state: LiquidityState;
    liquidityRatio: number;
    intervention: AutonomousIntervention;
    timestamp: number;
}

export interface AutonomousIntervention {
    supplyActions: SupplyAction[];
    demandActions: DemandAction[];
    stabilityActions: StabilityAction[];
    reason: string;
}

export interface SupplyAction {
    type: 'boost_visibility' | 'send_heat_notifications' | 'relax_free_limits'
    | 'enable_priority_matching' | 'send_nudges' | 'highlight_opportunity'
    | 'tighten_low_trust_visibility' | 'increase_quality_weighting'
    | 'reduce_free_exposure' | 'normal_ranking';
    intensity: number; // 0-1
    delivery: 'immediate' | 'batched' | 'standard';
}

export interface DemandAction {
    type: 'enable_surge_pricing' | 'show_coverage_warning' | 'increase_urgency_weight'
    | 'mild_price_adjustment' | 'encourage_advance_booking'
    | 'standard_pricing' | 'normal_matching'
    | 'highlight_fast_fill' | 'apply_price_stabilization';
    intensity: number;
}

export interface StabilityAction {
    type: 'slow_price_changes' | 'dampen_visibility_swings'
    | 'bias_reliable_supply' | 'extend_free_grace' | 'reduce_upgrade_pressure';
    reason: string;
}

export interface ShortageForcast {
    corridorId: string;
    shortageProbability7d: number;
    shortageProbability14d: number;
    demandSpikeProbability: number;
    preWarmActions: PreWarmAction[];
}

export interface PreWarmAction {
    type: 'pre_alert_nearby_operators' | 'temporary_visibility_boost'
    | 'broker_expectation_banner' | 'soft_price_ramp';
    triggerWhenProbabilityGt: number;
}

export interface RebalanceSuggestion {
    operatorId: string;
    fromCorridorId: string;
    toCorridorId: string;
    expectedEarningsDelta: number;
    distanceTradeoffKm: number;
    competitionLevel: 'low' | 'medium' | 'high';
    message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY TIER GOVERNOR
// ═══════════════════════════════════════════════════════════════════════════════

export const TIER_CONFIGS: Record<CountryTier, TierConfig> = {
    A: {
        countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'],
        minLiquidityRatio: 0.75,
        healthyBand: [0.75, 0.92],
        interventionAggressiveness: 'high',
        predictionHorizonDays: 21,
        pricingFlexibility: 'high',
    },
    B: {
        countries: ['IE', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'ES', 'FR', 'IT', 'PT', 'SA', 'QA', 'MX'],
        minLiquidityRatio: 0.65,
        healthyBand: [0.65, 0.88],
        interventionAggressiveness: 'medium',
        predictionHorizonDays: 30,
        pricingFlexibility: 'medium',
    },
    C: {
        countries: ['PL', 'CZ', 'SK', 'HU', 'SI', 'EE', 'LV', 'LT', 'HR', 'RO', 'BG', 'GR', 'TR', 'KW', 'OM', 'BH', 'SG', 'MY', 'JP', 'KR', 'CL', 'AR', 'CO', 'PE'],
        minLiquidityRatio: 0.55,
        healthyBand: [0.55, 0.82],
        interventionAggressiveness: 'cautious',
        predictionHorizonDays: 45,
        pricingFlexibility: 'conservative',
    },
    D: {
        countries: ['UY', 'PA', 'CR'],
        minLiquidityRatio: 0.45,
        healthyBand: [0.45, 0.75],
        interventionAggressiveness: 'minimal',
        predictionHorizonDays: 60,
        pricingFlexibility: 'minimal',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE LIQUIDITY STATE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class LiquidityStateEngine {

    private static readonly RECOMPUTE_INTERVAL_MINUTES = 5;

    /** Classify corridor liquidity state */
    static classify(corridor: CorridorHeatSignals): LiquidityState {
        const ratio = corridor.liquidityRatio;

        if (ratio < 0.45) return 'critical_shortage';
        if (ratio < 0.65) return 'soft_shortage';
        if (ratio < 0.90) return 'healthy';
        return 'oversupplied';
    }

    /** Full evaluation: classify + determine interventions */
    static evaluate(
        corridor: CorridorHeatSignals,
        tier: CountryTier,
        controlMode: ControlMode,
    ): LiquidityStateResult {
        const state = this.classify(corridor);
        const config = TIER_CONFIGS[tier];

        // In observe_only mode, record but don't act
        if (controlMode === 'observe_only') {
            return {
                corridorId: corridor.corridorId,
                countryCode: corridor.countryCode,
                state,
                liquidityRatio: corridor.liquidityRatio,
                intervention: { supplyActions: [], demandActions: [], stabilityActions: [], reason: 'Observe only mode' },
                timestamp: Date.now(),
            };
        }

        const intervention = this.computeInterventions(state, corridor, config);

        return {
            corridorId: corridor.corridorId,
            countryCode: corridor.countryCode,
            state,
            liquidityRatio: corridor.liquidityRatio,
            intervention,
            timestamp: Date.now(),
        };
    }

    // ── Autonomous Intervention Engine ───────────────────────────────────────

    private static computeInterventions(
        state: LiquidityState,
        corridor: CorridorHeatSignals,
        config: TierConfig,
    ): AutonomousIntervention {
        switch (state) {
            case 'critical_shortage':
                return this.criticalShortageActions(corridor, config);
            case 'soft_shortage':
                return this.softShortageActions(corridor, config);
            case 'healthy':
                return this.healthyActions();
            case 'oversupplied':
                return this.oversupplyActions(config);
        }
    }

    private static criticalShortageActions(
        corridor: CorridorHeatSignals,
        config: TierConfig,
    ): AutonomousIntervention {
        const intensity = config.interventionAggressiveness === 'high' ? 0.9
            : config.interventionAggressiveness === 'medium' ? 0.7
                : config.interventionAggressiveness === 'cautious' ? 0.5
                    : 0.3;

        return {
            supplyActions: [
                { type: 'boost_visibility', intensity: 0.35 * intensity, delivery: 'immediate' },
                { type: 'send_heat_notifications', intensity, delivery: 'immediate' },
                { type: 'relax_free_limits', intensity, delivery: 'immediate' },
                { type: 'enable_priority_matching', intensity, delivery: 'immediate' },
            ],
            demandActions: [
                { type: 'enable_surge_pricing', intensity: intensity * 0.8 },
                { type: 'show_coverage_warning', intensity },
                { type: 'increase_urgency_weight', intensity: 0.25 },
            ],
            stabilityActions: [],
            reason: `Critical shortage: liquidity ${corridor.liquidityRatio.toFixed(2)} < 0.45`,
        };
    }

    private static softShortageActions(
        corridor: CorridorHeatSignals,
        config: TierConfig,
    ): AutonomousIntervention {
        const intensity = config.interventionAggressiveness === 'high' ? 0.6
            : config.interventionAggressiveness === 'medium' ? 0.45
                : config.interventionAggressiveness === 'cautious' ? 0.3
                    : 0.15;

        return {
            supplyActions: [
                { type: 'boost_visibility', intensity: 0.15 * intensity, delivery: 'standard' },
                { type: 'send_nudges', intensity, delivery: 'batched' },
                { type: 'highlight_opportunity', intensity, delivery: 'standard' },
            ],
            demandActions: [
                { type: 'mild_price_adjustment', intensity: intensity * 0.5 },
                { type: 'encourage_advance_booking', intensity },
            ],
            stabilityActions: [],
            reason: `Soft shortage: liquidity ${corridor.liquidityRatio.toFixed(2)} in range [0.45, 0.65)`,
        };
    }

    private static healthyActions(): AutonomousIntervention {
        return {
            supplyActions: [
                { type: 'normal_ranking', intensity: 0, delivery: 'standard' },
            ],
            demandActions: [
                { type: 'standard_pricing', intensity: 0 },
                { type: 'normal_matching', intensity: 0 },
            ],
            stabilityActions: [],
            reason: 'Healthy corridor: standard operations',
        };
    }

    private static oversupplyActions(config: TierConfig): AutonomousIntervention {
        return {
            supplyActions: [
                { type: 'tighten_low_trust_visibility', intensity: 0.5, delivery: 'standard' },
                { type: 'increase_quality_weighting', intensity: 0.4, delivery: 'standard' },
                { type: 'reduce_free_exposure', intensity: 0.3, delivery: 'standard' },
            ],
            demandActions: [
                { type: 'highlight_fast_fill', intensity: 0.5 },
                { type: 'apply_price_stabilization', intensity: 0.4 },
            ],
            stabilityActions: [],
            reason: 'Oversupplied: tighten quality gates, stabilize pricing',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE CORRIDOR FORECASTER
// ═══════════════════════════════════════════════════════════════════════════════

export class PredictiveForecaster {

    static forecast(
        corridorId: string,
        tier: CountryTier,
        signals: {
            historicalLoadVolume30d: number[];  // daily counts
            seasonalIndex: number; // 0-1 (1 = peak season)
            constructionCalendarActive: boolean;
            portActivityProxy: number; // 0-1
            weatherDisruptionRisk: number; // 0-1
        },
    ): ShortageForcast {
        const config = TIER_CONFIGS[tier];

        // Simple trend analysis on historical data
        const recentAvg = signals.historicalLoadVolume30d.slice(-7)
            .reduce((a, b) => a + b, 0) / 7;
        const olderAvg = signals.historicalLoadVolume30d.slice(0, 14)
            .reduce((a, b) => a + b, 0) / 14;
        const trend = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;

        // Shortage probability factors
        const trendFactor = Math.max(0, trend) * 0.3; // rising demand = shortage risk
        const seasonFactor = signals.seasonalIndex * 0.25;
        const constructionFactor = signals.constructionCalendarActive ? 0.15 : 0;
        const portFactor = signals.portActivityProxy * 0.15;
        const weatherFactor = signals.weatherDisruptionRisk * 0.15;

        const shortageProbability7d = Math.min(0.95,
            trendFactor + seasonFactor + constructionFactor + portFactor + weatherFactor,
        );
        const shortageProbability14d = Math.min(0.95, shortageProbability7d * 1.3);
        const demandSpikeProbability = Math.min(0.95,
            (signals.seasonalIndex > 0.7 ? 0.4 : 0) +
            (trend > 0.2 ? 0.3 : 0) +
            (signals.portActivityProxy > 0.7 ? 0.2 : 0),
        );

        // Pre-warm actions
        const preWarmActions: PreWarmAction[] = [];
        if (shortageProbability7d > 0.65) {
            preWarmActions.push(
                { type: 'pre_alert_nearby_operators', triggerWhenProbabilityGt: 0.65 },
                { type: 'temporary_visibility_boost', triggerWhenProbabilityGt: 0.65 },
                { type: 'broker_expectation_banner', triggerWhenProbabilityGt: 0.7 },
                { type: 'soft_price_ramp', triggerWhenProbabilityGt: 0.75 },
            );
        }

        return {
            corridorId,
            shortageProbability7d: Math.round(shortageProbability7d * 100) / 100,
            shortageProbability14d: Math.round(shortageProbability14d * 100) / 100,
            demandSpikeProbability: Math.round(demandSpikeProbability * 100) / 100,
            preWarmActions,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLY REBALANCER
// ═══════════════════════════════════════════════════════════════════════════════

export class SupplyRebalancer {

    private static readonly MAX_NUDGES_PER_OPERATOR_PER_DAY = 2;

    static findRebalanceOpportunities(
        idleOperators: Array<{
            userId: string;
            currentCorridorId: string;
            trustScore: number;
            willingToTravel: boolean;
            idleHours: number;
            nudgesReceivedToday: number;
        }>,
        hotCorridors: Array<{
            corridorId: string;
            expectedRate: number;
            distanceFromOperatorKm: number;
            competitionLevel: 'low' | 'medium' | 'high';
        }>,
    ): RebalanceSuggestion[] {
        const suggestions: RebalanceSuggestion[] = [];

        for (const operator of idleOperators) {
            // Skip if operator doesn't qualify
            if (!operator.willingToTravel) continue;
            if (operator.trustScore < 0.6) continue;
            if (operator.idleHours < 12) continue;
            if (operator.nudgesReceivedToday >= this.MAX_NUDGES_PER_OPERATOR_PER_DAY) continue;

            // Find best corridor match
            const bestCorridor = hotCorridors
                .filter(c => c.distanceFromOperatorKm < 200)
                .sort((a, b) => {
                    // Score: rate * inverse_competition / distance
                    const scoreA = a.expectedRate * (a.competitionLevel === 'low' ? 1.5 : a.competitionLevel === 'medium' ? 1.0 : 0.7) / Math.max(10, a.distanceFromOperatorKm);
                    const scoreB = b.expectedRate * (b.competitionLevel === 'low' ? 1.5 : b.competitionLevel === 'medium' ? 1.0 : 0.7) / Math.max(10, b.distanceFromOperatorKm);
                    return scoreB - scoreA;
                })[0];

            if (bestCorridor) {
                suggestions.push({
                    operatorId: operator.userId,
                    fromCorridorId: operator.currentCorridorId,
                    toCorridorId: bestCorridor.corridorId,
                    expectedEarningsDelta: bestCorridor.expectedRate * 0.4, // estimated daily gain
                    distanceTradeoffKm: bestCorridor.distanceFromOperatorKm,
                    competitionLevel: bestCorridor.competitionLevel,
                    message: `There's a shortage ${Math.round(bestCorridor.distanceFromOperatorKm)}km from you. Estimated daily earnings: $${Math.round(bestCorridor.expectedRate * 0.4)}+ more than your current area.`,
                });
            }
        }

        return suggestions;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKET STABILITY GUARD
// ═══════════════════════════════════════════════════════════════════════════════

export class MarketStabilityGuard {

    static assess(params: {
        priceStdDev7d: number;
        fillTimeVariance: number;
        liquiditySwing: number; // absolute change in ratio over 24h
    }): {
        volatilityIndex: number;
        isVolatile: boolean;
        isFragile: boolean;
        actions: StabilityAction[];
    } {
        const volatility =
            params.priceStdDev7d * 0.4 +
            params.fillTimeVariance * 0.3 +
            params.liquiditySwing * 0.3;

        const isVolatile = volatility > 0.5;
        const isFragile = volatility > 0.7;

        const actions: StabilityAction[] = [];

        if (isVolatile) {
            actions.push(
                { type: 'slow_price_changes', reason: 'Volatile market: dampen price swings' },
                { type: 'dampen_visibility_swings', reason: 'Prevent ranking oscillation' },
                { type: 'bias_reliable_supply', reason: 'Prioritize proven operators during instability' },
            );
        }

        if (isFragile) {
            actions.push(
                { type: 'extend_free_grace', reason: 'Fragile market: retain supply at all costs' },
                { type: 'reduce_upgrade_pressure', reason: 'Fragile market: prioritize matches over revenue' },
            );
        }

        return {
            volatilityIndex: Math.round(volatility * 100) / 100,
            isVolatile,
            isFragile,
            actions,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-MANIPULATION HARDENING
// ═══════════════════════════════════════════════════════════════════════════════

export class AntiManipulation {

    static detect(signals: {
        // Supply-side manipulation
        coordinatedSupplyWithholding: boolean;
        supplyWithholdingAccountCount: number;
        geoSpoofingDetected: boolean;

        // Demand-side manipulation
        brokerSpamBurstDetected: boolean;
        brokerSpamPostsPerHour: number;
        rapidAccountCreations24h: number;

        // Corridor manipulation
        fakeShortageSignals: number;
    }): {
        corridorAction: 'none' | 'freeze_surge' | 'reduce_visibility' | 'flag_review';
        accountAction: 'none' | 'trust_penalty' | 'leaderboard_exclusion' | 'manual_review';
        trustScorePenalty: number;
        reasons: string[];
    } {
        const reasons: string[] = [];
        let corridorAction: 'none' | 'freeze_surge' | 'reduce_visibility' | 'flag_review' = 'none';
        let accountAction: 'none' | 'trust_penalty' | 'leaderboard_exclusion' | 'manual_review' = 'none';
        let penalty = 0;

        if (signals.coordinatedSupplyWithholding && signals.supplyWithholdingAccountCount > 3) {
            corridorAction = 'freeze_surge';
            accountAction = 'manual_review';
            penalty = 0.25;
            reasons.push(`Coordinated supply withholding detected (${signals.supplyWithholdingAccountCount} accounts)`);
        }

        if (signals.geoSpoofingDetected) {
            accountAction = 'leaderboard_exclusion';
            penalty = Math.max(penalty, 0.30);
            reasons.push('Geo spoofing detected');
        }

        if (signals.brokerSpamBurstDetected && signals.brokerSpamPostsPerHour > 20) {
            corridorAction = corridorAction === 'none' ? 'reduce_visibility' : corridorAction;
            accountAction = 'trust_penalty';
            penalty = Math.max(penalty, 0.15);
            reasons.push(`Broker spam burst: ${signals.brokerSpamPostsPerHour} posts/hr`);
        }

        if (signals.rapidAccountCreations24h > 10) {
            accountAction = 'manual_review';
            penalty = Math.max(penalty, 0.20);
            reasons.push(`Rapid account creation: ${signals.rapidAccountCreations24h} in 24h`);
        }

        if (signals.fakeShortageSignals > 3) {
            corridorAction = 'freeze_surge';
            penalty = Math.max(penalty, 0.10);
            reasons.push(`Fake shortage signals: ${signals.fakeShortageSignals}`);
        }

        return {
            corridorAction,
            accountAction,
            trustScorePenalty: penalty,
            reasons,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROL MODE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class ControlModeManager {

    /** Determine if a corridor qualifies for full autopilot */
    static evaluateAutopilotReadiness(params: {
        corridorDataPoints: number;
        trustGraphMaturity: 'insufficient' | 'developing' | 'sufficient' | 'mature';
        anomalyRate30d: number;
        daysSinceFirstActivity: number;
    }): {
        recommendedMode: ControlMode;
        reason: string;
    } {
        // Full autopilot requires:
        // - 500+ data points
        // - Sufficient trust graph maturity
        // - Anomaly rate below 8%
        if (
            params.corridorDataPoints > 500 &&
            (params.trustGraphMaturity === 'sufficient' || params.trustGraphMaturity === 'mature') &&
            params.anomalyRate30d < 0.08
        ) {
            return {
                recommendedMode: 'full_autopilot',
                reason: `${params.corridorDataPoints} data points, trust graph ${params.trustGraphMaturity}, anomaly rate ${(params.anomalyRate30d * 100).toFixed(1)}%`,
            };
        }

        // Assisted mode for developing corridors
        if (
            params.corridorDataPoints > 100 &&
            params.trustGraphMaturity !== 'insufficient' &&
            params.anomalyRate30d < 0.15
        ) {
            return {
                recommendedMode: 'assisted',
                reason: `${params.corridorDataPoints} data points — recommend actions with approval`,
            };
        }

        // Default: observe only
        return {
            recommendedMode: 'observe_only',
            reason: `New market: ${params.corridorDataPoints} data points, collecting signals`,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUCCESS METRICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface AutopilotSuccessMetrics {
    northStar: {
        corridorLiquidityStability: number; // target: low variance
        medianTimeToFill: number; // target: decreasing
        operatorWeeklyActiveRate: number; // target: >60%
        brokerRepeatRate: number; // target: >40%
    };
    earlyWarning: {
        supplyChurn14d: number; // ceiling: 15%
        brokerPostFailure: number; // ceiling: 12%
        liquidityCollapseThreshold: number; // floor: 0.40
        notificationOptOutCeiling: number; //ceiling: 20%
    };
}
