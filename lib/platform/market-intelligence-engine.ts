// ═══════════════════════════════════════════════════════════════════════════════
// MARKET INTELLIGENCE ENGINE
// Child of: Global Freemium Pressure Engine
// Purpose: Corridor-level dynamic pricing, earnings prediction, heat-aware
//          notifications, scarcity badging, and broker urgency scoring
//
// Principle: monetize_heat → reward_speed → prevent_gaming
// ═══════════════════════════════════════════════════════════════════════════════

import type { CorridorHeatSignals, UserBehaviorSignals, CountryTier } from './freemium-pressure-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CorridorPricingResult {
    corridorId: string;
    baseRate: number;
    recommendedRate: number;
    heatMultiplier: number;
    urgencyMultiplier: number;
    reliabilityDiscount: number;
    surgeFlag: boolean;
    underpricedAlert: boolean;
    brokerPriceGuidance: { min: number; mid: number; max: number };
    guardrails: {
        maxJump24h: number;
        floorEnforced: boolean;
        antiGougingActive: boolean;
    };
}

export interface EarningsPrediction {
    userId: string;
    expectedJobs7d: number;
    expectedRevenue7d: number;
    expectedRevenueMonthly: number;
    confidenceScore: number;
    earnMoreTips: string[];
    placement: ('dashboard_top' | 'profile_screen' | 'upgrade_modal')[];
}

export interface NotificationDecision {
    shouldSend: boolean;
    priority: 'critical' | 'high' | 'normal' | 'suppressed';
    delivery: 'immediate' | 'batched_5min' | 'batched_30min' | 'none';
    reason: string;
}

export interface ScarcityBadge {
    type: 'high_demand_area' | 'shortage_zone' | 'priority_operator' | 'fast_response_elite'
    | 'limited_coverage_warning' | 'book_early_flag' | 'surge_zone_indicator';
    side: 'operator' | 'broker';
    surfaces: ('map_pins' | 'search_results' | 'profile_cards' | 'load_board_rows')[];
    expiresInMinutes: number;
}

export interface BrokerUrgencyScore {
    brokerId: string;
    loadId: string;
    urgencyScore: number; // 0-1
    actions: {
        boostVisibility: boolean;
        increaseNotificationPriority: boolean;
        enableSurgePricing: boolean;
        highlightOnMap: boolean;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CORRIDOR-LEVEL DYNAMIC PRICING BRAIN
// ═══════════════════════════════════════════════════════════════════════════════

export class CorridorPricingBrain {

    // Regional baseline rates (USD equivalent) — localized via affordability curve
    private static readonly BASELINE_RATES: Record<CountryTier, number> = {
        A: 85,  // $85/hr base (Gold markets)
        B: 55,  // $55/hr base (Blue markets)
        C: 35,  // $35/hr base (Silver markets)
        D: 20,  // $20/hr base (Slate markets)
    };

    static computeCorridorPrice(
        corridor: CorridorHeatSignals,
        tier: CountryTier,
        avgTrustScore: number,
    ): CorridorPricingResult {
        const baseRate = this.BASELINE_RATES[tier];

        // Heat multiplier: unmet demand × inverse liquidity
        const heat = corridor.unmetDemandIndex * (1 - corridor.liquidityRatio);
        const heatMultiplier = this.clamp(1 + heat * 0.6, 0.85, 1.75);

        // Urgency multiplier: based on time pressure
        const urgencyFactor = corridor.fillTimeMedian_hours > 0
            ? Math.min(1, 4 / corridor.fillTimeMedian_hours) // shorter fill time = more urgent
            : 0;
        const urgencyMultiplier = this.clamp(1 + urgencyFactor * 0.4, 1.0, 1.5);

        // Reliability discount: high-trust corridors get slight rate normalization
        const reliabilityDiscount = this.clamp(
            1 - (avgTrustScore - 0.7) * 0.15,
            0.85, 1.0,
        );

        const recommended = baseRate * heatMultiplier * urgencyMultiplier * reliabilityDiscount;
        const surgeFlag = heatMultiplier > 1.3;
        const underpricedAlert = recommended > baseRate * 1.4 && corridor.liquidityRatio < 0.5;

        return {
            corridorId: corridor.corridorId,
            baseRate,
            recommendedRate: Math.round(recommended * 100) / 100,
            heatMultiplier: Math.round(heatMultiplier * 100) / 100,
            urgencyMultiplier: Math.round(urgencyMultiplier * 100) / 100,
            reliabilityDiscount: Math.round(reliabilityDiscount * 100) / 100,
            surgeFlag,
            underpricedAlert,
            brokerPriceGuidance: {
                min: Math.round(recommended * 0.85),
                mid: Math.round(recommended),
                max: Math.round(recommended * 1.2),
            },
            guardrails: {
                maxJump24h: 0.35,
                floorEnforced: true,
                antiGougingActive: surgeFlag && heatMultiplier > 1.5,
            },
        };
    }

    private static clamp(val: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, val));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. OPERATOR EARNINGS PREDICTION WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

export class EarningsPredictionEngine {

    static predict(
        user: UserBehaviorSignals,
        corridor: CorridorHeatSignals | null,
        corridorRate: number,
    ): EarningsPrediction {
        if (!corridor) {
            return this.emptyPrediction(user.userId);
        }

        // Response speed factor (faster = more jobs)
        const responseSpeedFactor = user.responseSpeed_p50_hours <= 0.5 ? 1.3
            : user.responseSpeed_p50_hours <= 1 ? 1.15
                : user.responseSpeed_p50_hours <= 2 ? 1.0
                    : user.responseSpeed_p50_hours <= 4 ? 0.8
                        : 0.6;

        // Trust weight
        const trustWeight = 0.5 + user.trustScore * 0.5; // 0.5 to 1.0

        // Availability factor (based on daily opens = proxy for availability)
        const availabilityFactor = Math.min(1.0, user.dailyOpens7d / 5);

        // Corridor heat score (higher heat = more jobs available)
        const corridorHeatScore = corridor.loadsPosted24h > 0
            ? Math.min(3, corridor.loadsPosted24h / Math.max(1, corridor.activeEscorts24h))
            : 0;

        const expectedJobs7d = corridorHeatScore
            * responseSpeedFactor
            * trustWeight
            * availabilityFactor;

        const expectedRevenue7d = expectedJobs7d * corridorRate;

        // Confidence based on data depth
        const dataCompleteness = user.profileCompleteness;
        const historyDepth = Math.min(1, user.daysSinceSignup / 90); // matures over 90 days
        const corridorStability = 1 - Math.abs(corridor.liquidityRatio - 0.7); // peak at 0.7
        const confidence = Math.min(0.95, dataCompleteness * historyDepth * corridorStability);

        // Tips
        const tips: string[] = [];
        if (user.responseSpeed_p50_hours > 1) {
            tips.push('Respond faster — operators under 30min get 2x more matches');
        }
        if (user.profileCompleteness < 0.8) {
            tips.push('Complete your profile — full profiles get 40% more views');
        }
        if (user.trustScore < 0.5) {
            tips.push('Build trust — complete more jobs to increase your score');
        }
        if (!user.isPaidUser && expectedRevenue7d > 100) {
            tips.push('Upgrade to Pro — premium operators earn 35% more on average');
        }

        return {
            userId: user.userId,
            expectedJobs7d: Math.round(expectedJobs7d * 10) / 10,
            expectedRevenue7d: Math.round(expectedRevenue7d),
            expectedRevenueMonthly: Math.round(expectedRevenue7d * 4.3),
            confidenceScore: Math.round(confidence * 100) / 100,
            earnMoreTips: tips,
            placement: ['dashboard_top', 'profile_screen', 'upgrade_modal'],
        };
    }

    private static emptyPrediction(userId: string): EarningsPrediction {
        return {
            userId,
            expectedJobs7d: 0,
            expectedRevenue7d: 0,
            expectedRevenueMonthly: 0,
            confidenceScore: 0,
            earnMoreTips: ['Set your corridor to start seeing earnings predictions'],
            placement: ['dashboard_top'],
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. HEAT-AWARE NOTIFICATION AI
// ═══════════════════════════════════════════════════════════════════════════════

export class HeatAwareNotificationAI {

    private static readonly MAX_NOTIFICATIONS_PER_DAY = 6;
    private static readonly COOLDOWN_AFTER_IGNORE_MINUTES = 90;

    static decide(
        user: UserBehaviorSignals,
        corridor: CorridorHeatSignals | null,
        localHour: number,
        notificationsSentToday: number,
        lastIgnoredMinutesAgo: number | null,
    ): NotificationDecision {
        // Quiet hours (respect local timezone)
        if (localHour < 7 || localHour > 21) {
            return { shouldSend: false, priority: 'suppressed', delivery: 'none', reason: 'Quiet hours' };
        }

        // Daily cap
        if (notificationsSentToday >= this.MAX_NOTIFICATIONS_PER_DAY) {
            return { shouldSend: false, priority: 'suppressed', delivery: 'none', reason: 'Daily cap reached' };
        }

        // Cooldown after ignored notification
        if (lastIgnoredMinutesAgo !== null && lastIgnoredMinutesAgo < this.COOLDOWN_AFTER_IGNORE_MINUTES) {
            return { shouldSend: false, priority: 'suppressed', delivery: 'none', reason: 'Cooldown after ignored notification' };
        }

        // Compute send probability
        const corridorHeat = corridor?.unmetDemandIndex ?? 0;
        const base = corridorHeat * 0.6;
        const engagement = user.notificationOpenRate * 0.3;
        const fatiguePenalty = (1 - user.notificationOpenRate) * 0.5;
        const probability = Math.max(0, Math.min(1, base + engagement - fatiguePenalty));

        // Priority classification
        if (probability >= 0.75) {
            return { shouldSend: true, priority: 'critical', delivery: 'immediate', reason: `Hot corridor (p=${probability.toFixed(2)})` };
        }
        if (probability >= 0.55) {
            return { shouldSend: true, priority: 'high', delivery: 'batched_5min', reason: `Active corridor (p=${probability.toFixed(2)})` };
        }
        if (probability >= 0.35) {
            return { shouldSend: true, priority: 'normal', delivery: 'batched_30min', reason: `Moderate activity (p=${probability.toFixed(2)})` };
        }

        return { shouldSend: false, priority: 'suppressed', delivery: 'none', reason: `Low probability (p=${probability.toFixed(2)})` };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SUPPLY SCARCITY AUTO-BADGING
// ═══════════════════════════════════════════════════════════════════════════════

export class ScarcityAutoBadging {

    private static readonly REEVALUATE_INTERVAL_MINUTES = 10;

    static evaluate(
        corridor: CorridorHeatSignals,
        operator?: UserBehaviorSignals,
    ): ScarcityBadge[] {
        const badges: ScarcityBadge[] = [];
        const underSupply = corridor.liquidityRatio < 0.55;
        const criticalShortage = corridor.liquidityRatio < 0.35;

        // Operator-side badges
        if (operator) {
            if (criticalShortage) {
                badges.push({
                    type: 'shortage_zone',
                    side: 'operator',
                    surfaces: ['map_pins', 'search_results', 'profile_cards'],
                    expiresInMinutes: this.REEVALUATE_INTERVAL_MINUTES,
                });
            } else if (underSupply) {
                badges.push({
                    type: 'high_demand_area',
                    side: 'operator',
                    surfaces: ['map_pins', 'search_results'],
                    expiresInMinutes: this.REEVALUATE_INTERVAL_MINUTES,
                });
            }

            if (operator.responseSpeed_p50_hours < 0.5 && operator.trustScore > 0.7) {
                badges.push({
                    type: 'fast_response_elite',
                    side: 'operator',
                    surfaces: ['search_results', 'profile_cards'],
                    expiresInMinutes: 60, // longer TTL for earned badges
                });
            }

            if (operator.trustScore > 0.8 && underSupply) {
                badges.push({
                    type: 'priority_operator',
                    side: 'operator',
                    surfaces: ['map_pins', 'search_results', 'profile_cards', 'load_board_rows'],
                    expiresInMinutes: this.REEVALUATE_INTERVAL_MINUTES,
                });
            }
        }

        // Broker-side badges (always visible on corridor)
        if (criticalShortage) {
            badges.push({
                type: 'limited_coverage_warning',
                side: 'broker',
                surfaces: ['load_board_rows', 'map_pins'],
                expiresInMinutes: this.REEVALUATE_INTERVAL_MINUTES,
            });
        }

        if (corridor.surgeActive) {
            badges.push({
                type: 'surge_zone_indicator',
                side: 'broker',
                surfaces: ['map_pins', 'load_board_rows'],
                expiresInMinutes: this.REEVALUATE_INTERVAL_MINUTES,
            });
        }

        if (underSupply && !criticalShortage) {
            badges.push({
                type: 'book_early_flag',
                side: 'broker',
                surfaces: ['load_board_rows'],
                expiresInMinutes: this.REEVALUATE_INTERVAL_MINUTES,
            });
        }

        return badges;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. BROKER URGENCY SCORING LAYER
// ═══════════════════════════════════════════════════════════════════════════════

export class BrokerUrgencyScorer {

    static score(params: {
        brokerId: string;
        loadId: string;
        pickupTimeDeltaHours: number;
        loadComplexityScore: number; // 0-1
        corridorLiquidityRatio: number;
        historicalBrokerReliability: number; // 0-1
        repeatCancellations: number;
        afterHours: boolean;
    }): BrokerUrgencyScore {
        const {
            brokerId, loadId,
            pickupTimeDeltaHours, loadComplexityScore,
            corridorLiquidityRatio, historicalBrokerReliability,
            repeatCancellations, afterHours,
        } = params;

        // Broker reliability modifier (penalize unreliable brokers)
        const brokerMod = Math.max(0, historicalBrokerReliability - (repeatCancellations * 0.1));

        const urgency =
            (1 / Math.max(pickupTimeDeltaHours, 1)) * 0.35 +
            loadComplexityScore * 0.20 +
            (1 - corridorLiquidityRatio) * 0.25 +
            (afterHours ? 0.10 : 0) +
            brokerMod * 0.10;

        const normalizedUrgency = Math.max(0, Math.min(1, urgency));
        const isHigh = normalizedUrgency >= 0.65;
        const isMedium = normalizedUrgency >= 0.4;

        return {
            brokerId,
            loadId,
            urgencyScore: Math.round(normalizedUrgency * 100) / 100,
            actions: {
                boostVisibility: isHigh,
                increaseNotificationPriority: isHigh,
                enableSurgePricing: isHigh && corridorLiquidityRatio < 0.5,
                highlightOnMap: isHigh || isMedium,
            },
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ANTI-GAMING HARDENING
// ═══════════════════════════════════════════════════════════════════════════════

export class AntiGamingLayer {

    static detectAnomalies(signals: {
        reviewsLast2Minutes: number;
        reviewsFromSameIP: number;
        reviewsFromSameDevice: number;
        priceChangeFrequency24h: number;
        shortageClaimsUnverified: number;
        coordinatedBehaviorScore: number; // 0-1 (ML-derived)
    }): {
        isAnomaly: boolean;
        anomalyType: string | null;
        action: 'none' | 'flag_review' | 'freeze_surge' | 'reduce_visibility' | 'manual_review';
        trustScorePenalty: number;
    } {
        const { reviewsLast2Minutes, reviewsFromSameIP, reviewsFromSameDevice,
            priceChangeFrequency24h, shortageClaimsUnverified, coordinatedBehaviorScore } = signals;

        // Synthetic review activity
        if (reviewsLast2Minutes > 3 || reviewsFromSameIP > 5 || reviewsFromSameDevice > 3) {
            return {
                isAnomaly: true,
                anomalyType: 'synthetic_review_activity',
                action: 'flag_review',
                trustScorePenalty: 0.15,
            };
        }

        // Rapid price manipulation
        if (priceChangeFrequency24h > 10) {
            return {
                isAnomaly: true,
                anomalyType: 'rapid_price_manipulation',
                action: 'freeze_surge',
                trustScorePenalty: 0.05,
            };
        }

        // Fake shortage
        if (shortageClaimsUnverified > 3) {
            return {
                isAnomaly: true,
                anomalyType: 'fake_shortage_detection',
                action: 'reduce_visibility',
                trustScorePenalty: 0.10,
            };
        }

        // Coordinated behavior
        if (coordinatedBehaviorScore > 0.7) {
            return {
                isAnomaly: true,
                anomalyType: 'coordinated_behavior',
                action: 'manual_review',
                trustScorePenalty: 0.20,
            };
        }

        return { isAnomaly: false, anomalyType: null, action: 'none', trustScorePenalty: 0 };
    }
}
