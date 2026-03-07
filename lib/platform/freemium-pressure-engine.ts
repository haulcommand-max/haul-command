// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL FREEMIUM PRESSURE ENGINE
// Central Monetization Brain — sits ABOVE both App and Directory
//
// This is NOT a feature inside one surface.
// It is the market governor + revenue dial for the entire ecosystem.
//
// Responsibilities:
//  - Watches behavior → measures liquidity → applies pressure
//  - Times paywalls → tunes addiction loops
//  - Decides: who stays free, who sees upgrade prompts, who gets throttled
//  - Behavior-driven, NOT static pricing
// ═══════════════════════════════════════════════════════════════════════════════

// Country tier logic is self-contained — see getCountryTier() below

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type UserRole = 'escort' | 'broker';
export type PressureLevel = 'none' | 'soft' | 'medium' | 'aggressive' | 'hard_gate';
export type PressureSurface = 'app' | 'directory' | 'map' | 'adgrid' | 'notifications';
export type CountryTier = 'A' | 'B' | 'C' | 'D';

export interface UserBehaviorSignals {
    userId: string;
    role: UserRole;
    countryCode: string;
    corridorId?: string;

    // Activity signals
    profileViews7d: number;
    searchAppearances7d: number;
    responseSpeed_p50_hours: number;
    jobAcceptanceRate: number;
    profileCompleteness: number; // 0-1
    daysSinceSignup: number;
    lastActiveHoursAgo: number;

    // Engagement signals
    dailyOpens7d: number;
    notificationOpenRate: number;
    featureUsageScore: number; // 0-1

    // Economic signals
    revenueGenerated: number; // lifetime
    missedOpportunities7d: number;
    corridorRank: number; // 1 = top
    isPaidUser: boolean;
    currentTier: 'free' | 'starter' | 'pro' | 'enterprise';

    // Trust signals
    trustScore: number; // 0-1
    verificationLevel: 'none' | 'basic' | 'full';
    reviewCount: number;
    avgRating: number;
}

export interface CorridorHeatSignals {
    corridorId: string;
    countryCode: string;
    liquidityRatio: number; // 0-1 (supply/demand)
    activeEscorts24h: number;
    loadsPosted24h: number;
    fillTimeMedian_hours: number;
    surgeActive: boolean;
    unmetDemandIndex: number; // 0-1
    priceElasticity: number; // 0-1
}

export interface PressureDecision {
    userId: string;
    role: UserRole;
    overallPressure: PressureLevel;
    timestamp: number;

    // Per-surface decisions
    directoryPressure: DirectoryPressure;
    appPressure: AppPressure;
    notificationPressure: NotificationPressure;
    pricingPressure: PricingPressure;

    // Explanation (for admin dashboard)
    reasons: string[];
    nextEscalationHours: number;
}

export interface DirectoryPressure {
    rankingMultiplier: number; // 1.0 = normal, <1.0 = throttled
    featuredEligible: boolean;
    visibilityCap: number; // max impressions per day (0 = no cap)
    leadRoutingPriority: 'high' | 'normal' | 'low';
    adGridExposure: 'full' | 'limited' | 'none';
    showUpgradePrompt: boolean;
    upgradePromptMessage?: string;
}

export interface AppPressure {
    notificationCadence: 'high' | 'normal' | 'reduced';
    matchPriority: 'boosted' | 'normal' | 'deprioritized';
    unlockGates: string[]; // features that are gated
    streakRewardsActive: boolean;
    leaderboardBoost: number; // multiplier
    showUpgradeModal: boolean;
    upgradeModalTrigger?: string;
}

export interface NotificationPressure {
    cadence: 'aggressive' | 'normal' | 'light' | 'suppressed';
    allowedTypes: string[];
    scarcityMessagingEnabled: boolean;
    missedOpportunityAlerts: boolean;
    rankDropAlerts: boolean;
    demandSpikeAlerts: boolean;
}

export interface PricingPressure {
    showEarningsPotential: boolean;
    showMissedRevenue: boolean;
    discountOffered: number; // 0-1 (0 = no discount)
    urgencyCountdown: boolean;
    socialProof: string | null; // "45 operators in your area upgraded this month"
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class FreemiumPressureEngine {

    // ── Pressure Level Thresholds by Role ────────────────────────────────────

    private static readonly ESCORT_PRESSURE_CONFIG = {
        freeGraceDays: { A: 14, B: 21, C: 45, D: 90 },
        softPressureAfterViews: { A: 15, B: 25, C: 50, D: 100 },
        mediumPressureAfterViews: { A: 40, B: 60, C: 100, D: 200 },
        aggressivePressureAfterViews: { A: 80, B: 120, C: 200, D: 400 },
    };

    private static readonly BROKER_PRESSURE_CONFIG = {
        freePostCredits: { A: 3, B: 5, C: 10, D: 20 },
        softPressureAfterPosts: { A: 2, B: 3, C: 5, D: 10 },
        paidFromDay: { A: 7, B: 14, C: 30, D: 60 },
    };

    // ── Main Decision Function ───────────────────────────────────────────────

    /**
     * @param upgradeCount Real count of operators who upgraded in this region recently.
     *                     Pass null if not yet queryable — social proof will be suppressed.
     */
    static computePressure(
        user: UserBehaviorSignals,
        corridor: CorridorHeatSignals | null,
        upgradeCount: number | null = null,
    ): PressureDecision {
        const tier = this.getCountryTier(user.countryCode);
        const reasons: string[] = [];

        // Already paying? Reduce pressure, reward loyalty
        if (user.isPaidUser) {
            return this.buildPaidUserDecision(user, corridor, tier);
        }

        // Compute base pressure level
        let pressure: PressureLevel = 'none';

        if (user.role === 'escort') {
            pressure = this.computeEscortPressure(user, corridor, tier, reasons);
        } else {
            pressure = this.computeBrokerPressure(user, corridor, tier, reasons);
        }

        // Market guard: Never hard-gate supply in under-supplied corridors
        if (user.role === 'escort' && corridor && corridor.liquidityRatio < 0.55) {
            if (pressure === 'hard_gate') {
                pressure = 'medium';
                reasons.push('Relaxed: corridor under-supplied');
            }
            if (pressure === 'aggressive') {
                pressure = 'soft';
                reasons.push('Relaxed: corridor needs supply');
            }
        }

        return this.buildDecision(user, pressure, corridor, tier, reasons, upgradeCount);
    }

    // ── Escort Pressure Logic ────────────────────────────────────────────────

    private static computeEscortPressure(
        user: UserBehaviorSignals,
        corridor: CorridorHeatSignals | null,
        tier: CountryTier,
        reasons: string[],
    ): PressureLevel {
        const config = this.ESCORT_PRESSURE_CONFIG;
        const graceDays = config.freeGraceDays[tier];

        // Still in grace period? No pressure
        if (user.daysSinceSignup < graceDays) {
            reasons.push(`Grace period: ${graceDays - user.daysSinceSignup} days remaining`);
            return 'none';
        }

        // Profile not complete? Light nudge, not paywall pressure
        if (user.profileCompleteness < 0.6) {
            reasons.push('Profile incomplete — nudge to complete before upgrading');
            return 'none';
        }

        // Getting value? Increase pressure proportionally
        const views = user.profileViews7d;
        const softThreshold = config.softPressureAfterViews[tier];
        const mediumThreshold = config.mediumPressureAfterViews[tier];
        const aggressiveThreshold = config.aggressivePressureAfterViews[tier];

        if (views >= aggressiveThreshold) {
            reasons.push(`${views} profile views — high demand for your listing`);
            if (user.missedOpportunities7d > 3) {
                reasons.push(`${user.missedOpportunities7d} missed opportunities`);
                return 'hard_gate'; // Partial gating on specific features
            }
            return 'aggressive';
        }

        if (views >= mediumThreshold) {
            reasons.push(`${views} profile views — growing demand`);
            return 'medium';
        }

        if (views >= softThreshold) {
            reasons.push(`${views} profile views — demand detected`);
            return 'soft';
        }

        // Hot corridor boost
        if (corridor && corridor.surgeActive && user.trustScore > 0.6) {
            reasons.push('Corridor surge active — premium operators get priority');
            return 'soft';
        }

        return 'none';
    }

    // ── Broker Pressure Logic ────────────────────────────────────────────────
    // Brokers get charged sooner — they have clearer ROI

    private static computeBrokerPressure(
        user: UserBehaviorSignals,
        corridor: CorridorHeatSignals | null,
        tier: CountryTier,
        reasons: string[],
    ): PressureLevel {
        const config = this.BROKER_PRESSURE_CONFIG;
        const paidDay = config.paidFromDay[tier];

        // Past free window? Pressure increases
        if (user.daysSinceSignup > paidDay) {
            reasons.push('Free trial period ended');

            if (user.daysSinceSignup > paidDay * 2) {
                reasons.push('Extended free period — upgrade required for continued posting');
                return 'hard_gate';
            }
            return 'aggressive';
        }

        // Using the platform actively? Accelerate pressure
        if (user.featureUsageScore > 0.7 && user.daysSinceSignup > paidDay / 2) {
            reasons.push('Heavy usage detected — premium features unlock more value');
            return 'medium';
        }

        if (user.daysSinceSignup > paidDay / 3) {
            reasons.push('Trial progressing — explore premium features');
            return 'soft';
        }

        return 'none';
    }

    // ── Paid User Benefits ───────────────────────────────────────────────────

    private static buildPaidUserDecision(
        user: UserBehaviorSignals,
        corridor: CorridorHeatSignals | null,
        tier: CountryTier,
    ): PressureDecision {
        return {
            userId: user.userId,
            role: user.role,
            overallPressure: 'none',
            timestamp: Date.now(),
            reasons: ['Paid subscriber — full access, priority treatment'],
            nextEscalationHours: 0,
            directoryPressure: {
                rankingMultiplier: user.currentTier === 'enterprise' ? 1.35 :
                    user.currentTier === 'pro' ? 1.2 : 1.1,
                featuredEligible: true,
                visibilityCap: 0, // no cap
                leadRoutingPriority: user.currentTier === 'enterprise' ? 'high' : 'normal',
                adGridExposure: 'full',
                showUpgradePrompt: user.currentTier !== 'enterprise',
                upgradePromptMessage: user.currentTier === 'pro'
                    ? 'Unlock Enterprise for API access + priority matching'
                    : undefined,
            },
            appPressure: {
                notificationCadence: 'high',
                matchPriority: user.currentTier === 'enterprise' ? 'boosted' : 'normal',
                unlockGates: [],
                streakRewardsActive: true,
                leaderboardBoost: user.currentTier === 'enterprise' ? 1.1 : 1.0,
                showUpgradeModal: false,
            },
            notificationPressure: {
                cadence: 'normal',
                allowedTypes: ['match', 'demand_spike', 'rank_change', 'review', 'payment'],
                scarcityMessagingEnabled: true,
                missedOpportunityAlerts: true,
                rankDropAlerts: true,
                demandSpikeAlerts: true,
            },
            pricingPressure: {
                showEarningsPotential: true,
                showMissedRevenue: false,
                discountOffered: 0,
                urgencyCountdown: false,
                socialProof: null,
            },
        };
    }

    // ── Build Full Decision ──────────────────────────────────────────────────

    private static buildDecision(
        user: UserBehaviorSignals,
        pressure: PressureLevel,
        corridor: CorridorHeatSignals | null,
        tier: CountryTier,
        reasons: string[],
        upgradeCount: number | null = null,
    ): PressureDecision {
        return {
            userId: user.userId,
            role: user.role,
            overallPressure: pressure,
            timestamp: Date.now(),
            reasons,
            nextEscalationHours: this.getEscalationDelay(pressure, tier),
            directoryPressure: this.buildDirectoryPressure(user, pressure, corridor),
            appPressure: this.buildAppPressure(user, pressure),
            notificationPressure: this.buildNotificationPressure(user, pressure, corridor),
            pricingPressure: this.buildPricingPressure(user, pressure, tier, upgradeCount),
        };
    }

    // ── Directory Surface Pressure ───────────────────────────────────────────

    private static buildDirectoryPressure(
        user: UserBehaviorSignals,
        pressure: PressureLevel,
        corridor: CorridorHeatSignals | null,
    ): DirectoryPressure {
        const base: DirectoryPressure = {
            rankingMultiplier: 1.0,
            featuredEligible: false,
            visibilityCap: 0,
            leadRoutingPriority: 'normal',
            adGridExposure: 'full',
            showUpgradePrompt: false,
        };

        switch (pressure) {
            case 'none':
                return base;

            case 'soft':
                return {
                    ...base,
                    showUpgradePrompt: true,
                    upgradePromptMessage: `You appeared in ${user.searchAppearances7d} searches this week`,
                };

            case 'medium':
                return {
                    ...base,
                    rankingMultiplier: 0.85,
                    showUpgradePrompt: true,
                    leadRoutingPriority: 'low',
                    upgradePromptMessage: `Premium operators in your area get ${Math.round(user.profileViews7d * 1.5)}+ views per week`,
                };

            case 'aggressive':
                return {
                    ...base,
                    rankingMultiplier: 0.65,
                    visibilityCap: 50, // max 50 impressions/day
                    leadRoutingPriority: 'low',
                    showUpgradePrompt: true,
                    upgradePromptMessage: `You're missing leads. ${user.missedOpportunities7d} brokers searched your corridor this week.`,
                };

            case 'hard_gate':
                return {
                    ...base,
                    rankingMultiplier: 0.4,
                    visibilityCap: 10,
                    leadRoutingPriority: 'low',
                    adGridExposure: 'limited',
                    showUpgradePrompt: true,
                    upgradePromptMessage: 'Unlock full visibility — your corridor is hot and brokers are looking for you.',
                };
        }
    }

    // ── App Surface Pressure ─────────────────────────────────────────────────

    private static buildAppPressure(
        user: UserBehaviorSignals,
        pressure: PressureLevel,
    ): AppPressure {
        const gatedFeatures: Record<PressureLevel, string[]> = {
            none: [],
            soft: [],
            medium: ['advanced_analytics', 'export_contacts'],
            aggressive: ['advanced_analytics', 'export_contacts', 'priority_matching', 'corridor_insights'],
            hard_gate: ['advanced_analytics', 'export_contacts', 'priority_matching', 'corridor_insights', 'boost_listing', 'review_responses'],
        };

        return {
            notificationCadence: pressure === 'aggressive' || pressure === 'hard_gate' ? 'reduced' : 'normal',
            matchPriority: pressure === 'aggressive' || pressure === 'hard_gate' ? 'deprioritized' : 'normal',
            unlockGates: gatedFeatures[pressure],
            streakRewardsActive: pressure !== 'hard_gate',
            leaderboardBoost: pressure === 'none' ? 1.0 : pressure === 'soft' ? 0.95 : 0.85,
            showUpgradeModal: pressure === 'aggressive' || pressure === 'hard_gate',
            upgradeModalTrigger: pressure === 'aggressive'
                ? 'You missed a match — premium operators get priority'
                : pressure === 'hard_gate'
                    ? 'Unlock matches in your corridor now'
                    : undefined,
        };
    }

    // ── Notification Pressure ────────────────────────────────────────────────

    private static buildNotificationPressure(
        user: UserBehaviorSignals,
        pressure: PressureLevel,
        corridor: CorridorHeatSignals | null,
    ): NotificationPressure {
        const corridorHot = corridor ? corridor.unmetDemandIndex > 0.5 : false;

        return {
            cadence: pressure === 'none' ? 'normal'
                : pressure === 'soft' ? 'normal'
                    : pressure === 'medium' ? 'aggressive'
                        : 'light', // Don't spam hard-gated users
            allowedTypes: pressure === 'hard_gate'
                ? ['upgrade_offer', 'missed_opportunity']
                : ['match', 'demand_spike', 'rank_change', 'review', 'upgrade_offer', 'missed_opportunity'],
            scarcityMessagingEnabled: corridorHot && pressure !== 'none',
            missedOpportunityAlerts: pressure !== 'none',
            rankDropAlerts: pressure === 'medium' || pressure === 'aggressive',
            demandSpikeAlerts: corridorHot,
        };
    }

    // ── Pricing/Upgrade Pressure ─────────────────────────────────────────────

    private static buildPricingPressure(
        user: UserBehaviorSignals,
        pressure: PressureLevel,
        tier: CountryTier,
        upgradeCount: number | null = null,
    ): PricingPressure {
        // Discount strategy: largest discounts for medium-pressure users who need a nudge
        // Soft users aren't ready; aggressive users are almost converting anyway; hard-gated need it
        const discountMap: Record<PressureLevel, number> = {
            none: 0,
            soft: 0,        // too early — build value first, don't cheapen
            medium: 0.20,   // 20% off — nudge to convert at the tipping point
            aggressive: 0.10, // 10% — they're close, small incentive seals it
            hard_gate: 0,    // No discount at gate — they need it
        };

        // P1: Social proof uses REAL upgrade count — never fabricated.
        // If upgradeCount is null (not yet queryable), suppress social proof entirely.
        const socialProof = (pressure === 'medium' || pressure === 'aggressive')
            && upgradeCount !== null && upgradeCount > 0
            ? `${upgradeCount} operators in your area upgraded this month`
            : null;

        return {
            showEarningsPotential: pressure !== 'none',
            showMissedRevenue: pressure === 'aggressive' || pressure === 'hard_gate',
            discountOffered: discountMap[pressure],
            urgencyCountdown: pressure === 'aggressive' && tier === 'A',
            socialProof,
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static getCountryTier(countryCode: string): CountryTier {
        const goldCountries = ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'];
        const blueCountries = ['IE', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'ES', 'FR', 'IT', 'PT', 'SA', 'QA', 'MX'];
        const slateCountries = ['UY', 'PA', 'CR'];

        if (goldCountries.includes(countryCode)) return 'A';
        if (blueCountries.includes(countryCode)) return 'B';
        if (slateCountries.includes(countryCode)) return 'D';
        return 'C';
    }

    private static getEscalationDelay(pressure: PressureLevel, tier: CountryTier): number {
        const delayMap: Record<PressureLevel, Record<CountryTier, number>> = {
            none: { A: 72, B: 120, C: 168, D: 336 },
            soft: { A: 48, B: 72, C: 120, D: 240 },
            medium: { A: 24, B: 48, C: 72, D: 168 },
            aggressive: { A: 12, B: 24, C: 48, D: 120 },
            hard_gate: { A: 0, B: 0, C: 0, D: 0 },
        };
        return delayMap[pressure][tier];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADDICTION LAYER — Tight Feedback Loops
// ═══════════════════════════════════════════════════════════════════════════════

export class AddictionLayerEngine {

    // Layer 1: Economic Dopamine — money proximity signals
    static generateEconomicSignals(user: UserBehaviorSignals): string[] {
        const signals: string[] = [];

        if (user.profileViews7d > 0) {
            signals.push(`You were viewed ${user.profileViews7d} times today`);
        }
        if (user.searchAppearances7d > 0) {
            signals.push(`${Math.ceil(user.searchAppearances7d * 0.3)} brokers searched your corridor`);
        }
        if (user.missedOpportunities7d > 0) {
            signals.push(`You missed ${user.missedOpportunities7d} job${user.missedOpportunities7d > 1 ? 's' : ''} near you`);
        }

        return signals;
    }

    // Layer 2: Progress Mechanics — completion drives engagement
    static getProgressMetrics(user: UserBehaviorSignals): {
        profileStrength: number;
        corridorCoverage: number;
        trustProgression: number;
        responseSpeedGrade: string;
        streakDays: number;
    } {
        return {
            profileStrength: user.profileCompleteness,
            corridorCoverage: Math.min(1, user.featureUsageScore * 1.2),
            trustProgression: user.trustScore,
            responseSpeedGrade: user.responseSpeed_p50_hours < 0.5 ? 'A+'
                : user.responseSpeed_p50_hours < 1 ? 'A'
                    : user.responseSpeed_p50_hours < 2 ? 'B'
                        : user.responseSpeed_p50_hours < 4 ? 'C'
                            : 'D',
            streakDays: Math.floor(user.dailyOpens7d), // simplified
        };
    }

    // Layer 3: Competitive surfaces — leaderboard obsession
    static shouldShowCompetitiveSurface(user: UserBehaviorSignals): boolean {
        return user.trustScore > 0.4 && user.daysSinceSignup > 7;
    }

    // Layer 4: Scarcity & urgency — productive anxiety
    static generateScarcitySignals(
        user: UserBehaviorSignals,
        corridor: CorridorHeatSignals | null,
    ): string[] {
        const signals: string[] = [];

        if (corridor) {
            if (corridor.activeEscorts24h < 3) {
                signals.push(`Only ${corridor.activeEscorts24h} escorts active in this corridor`);
            }
            if (corridor.surgeActive) {
                signals.push('Demand spike detected in your area');
            }
            if (corridor.liquidityRatio < 0.5) {
                signals.push('Coverage gap near you — operators needed');
            }
        }

        if (user.corridorRank > 10 && user.corridorRank <= 20) {
            signals.push('Your rank is dropping in this metro');
        }

        return signals;
    }

    // Layer 5: Smart notification cadence
    static shouldSendNotification(
        user: UserBehaviorSignals,
        notificationType: string,
        localHour: number,
    ): boolean {
        // Quiet hours
        if (localHour < 7 || localHour > 21) return false;

        // Money notifications bypass the standard fatigue gate (lower bar: >5% open rate)
        if (notificationType === 'missed_opportunity' || notificationType === 'demand_spike') {
            return user.notificationOpenRate > 0.05;
        }

        // Standard notifications: respect engagement fatigue threshold
        if (user.notificationOpenRate < 0.1) return false;

        return user.notificationOpenRate > 0.2;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUOUS CYCLE ENGINE
// Trust Score → Ranking → Job Flow → Earnings → Investment → Higher Trust
// ═══════════════════════════════════════════════════════════════════════════════

export class VirtuousCycleEngine {

    static computeCycleStrength(user: UserBehaviorSignals): {
        cycleStage: 'dormant' | 'activating' | 'spinning' | 'flywheel';
        nextAction: string;
        bottleneck: string;
    } {
        const trust = user.trustScore;
        const views = user.profileViews7d;
        const revenue = user.revenueGenerated;
        const completeness = user.profileCompleteness;

        // Dormant: not enough activity to form a cycle
        if (trust < 0.3 || completeness < 0.5) {
            return {
                cycleStage: 'dormant',
                nextAction: completeness < 0.5
                    ? 'Complete your profile to appear in searches'
                    : 'Accept jobs to build your trust score',
                bottleneck: completeness < 0.5 ? 'profile_completeness' : 'trust_score',
            };
        }

        // Activating: getting views but not converting
        if (trust >= 0.3 && views > 5 && revenue === 0) {
            return {
                cycleStage: 'activating',
                nextAction: 'Respond faster to match requests to win your first job',
                bottleneck: 'conversion',
            };
        }

        // Flywheel: self-sustaining (check before spinning — conditions are a strict superset)
        if (trust >= 0.7 && revenue > 500 && user.jobAcceptanceRate > 0.7) {
            return {
                cycleStage: 'flywheel',
                nextAction: 'You\'re in the top tier — maintain response speed to keep your rank',
                bottleneck: 'none',
            };
        }

        // Spinning: jobs flowing, revenue growing
        if (trust >= 0.5 && revenue > 0 && views > 15) {
            return {
                cycleStage: 'spinning',
                nextAction: 'Upgrade to Pro for priority matching in hot corridors',
                bottleneck: 'scale',
            };
        }

        return {
            cycleStage: 'activating',
            nextAction: 'Keep responding to matches to build momentum',
            bottleneck: 'engagement',
        };
    }
}
