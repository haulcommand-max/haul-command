// ══════════════════════════════════════════════════════════════
// ANTI-GAMING HARDENING ENGINE
// Spec: HC_DOMINATION_PATCH_V1 Phase 6
// Purpose: Prevent manipulation of scores, reviews, listings,
//          and coverage data. Trust is the product.
// ══════════════════════════════════════════════════════════════

// ── Threat Model ──

export type ThreatType =
    | "fake_reviews"
    | "fake_listings"
    | "location_spoofing"
    | "score_manipulation"
    | "coverage_inflation"
    | "review_bombing"
    | "sock_puppets"
    | "bid_manipulation"
    | "data_scraping"
    | "spam_claims";

export interface ThreatDetection {
    type: ThreatType;
    severity: "low" | "medium" | "high" | "critical";
    confidence: number; // 0-1
    evidence: string[];
    suggestedAction: ThreatAction;
    detectedAt: string;
}

export type ThreatAction =
    | "flag_for_review"
    | "auto_suppress"
    | "rate_limit"
    | "require_verification"
    | "ban_account"
    | "shadow_suppress"
    | "alert_admin";

// ── Review Integrity ──

export interface ReviewIntegrityCheck {
    reviewId: string;
    signals: ReviewSignal[];
    integrityScore: number; // 0-100, higher = more trustworthy
    verdict: "pass" | "suspect" | "fraud";
}

export interface ReviewSignal {
    name: string;
    weight: number;
    value: number; // 0-1, higher = more suspicious
    details: string;
}

export function checkReviewIntegrity(
    review: {
        userId: string;
        reviewerAge: number; // days since account creation
        reviewerReviewCount: number;
        reviewerDevice: string;
        textLength: number;
        hasPhotos: boolean;
        submittedAt: string;
        targetId: string;
    },
    contextSignals: {
        reviewsInLastHour: number;
        sameIpReviews: number;
        sameDeviceReviews: number;
        targetRecentReviewCount: number;
        avgRatingDeviation: number; // how far from average
    }
): ReviewIntegrityCheck {
    const signals: ReviewSignal[] = [];

    // New account reviewing (< 24h)
    if (review.reviewerAge < 1) {
        signals.push({ name: "new_account", weight: 0.20, value: 1.0, details: `Account created ${review.reviewerAge} days ago` });
    } else if (review.reviewerAge < 7) {
        signals.push({ name: "new_account", weight: 0.20, value: 0.5, details: `Account is ${review.reviewerAge} days old` });
    }

    // Review velocity (too many reviews from one IP)
    if (contextSignals.sameIpReviews > 3) {
        signals.push({ name: "ip_cluster", weight: 0.25, value: Math.min(contextSignals.sameIpReviews / 10, 1), details: `${contextSignals.sameIpReviews} reviews from same IP` });
    }

    // Burst reviews on target (review bomb detection)
    if (contextSignals.targetRecentReviewCount > 10) {
        signals.push({ name: "review_bomb", weight: 0.25, value: Math.min(contextSignals.targetRecentReviewCount / 30, 1), details: `${contextSignals.targetRecentReviewCount} reviews on target in 24h` });
    }

    // Rating deviation (suspiciously different from average)
    if (contextSignals.avgRatingDeviation > 3) {
        signals.push({ name: "rating_outlier", weight: 0.15, value: contextSignals.avgRatingDeviation / 5, details: `Rating deviates ${contextSignals.avgRatingDeviation} stars from avg` });
    }

    // Very short text (low-effort review)
    if (review.textLength < 20) {
        signals.push({ name: "low_effort", weight: 0.10, value: 0.8, details: `Review text only ${review.textLength} chars` });
    }

    // No photos (less credible for service reviews)
    if (!review.hasPhotos) {
        signals.push({ name: "no_evidence", weight: 0.05, value: 0.3, details: "No photos attached" });
    }

    // Compute integrity score (100 = fully trustworthy)
    const suspicionScore = signals.reduce((acc, s) => acc + (s.weight * s.value), 0);
    const integrityScore = Math.round((1 - Math.min(suspicionScore, 1)) * 100);

    let verdict: ReviewIntegrityCheck["verdict"];
    if (integrityScore >= 70) verdict = "pass";
    else if (integrityScore >= 40) verdict = "suspect";
    else verdict = "fraud";

    return { reviewId: review.userId + "_" + review.targetId, signals, integrityScore, verdict };
}

// ── Location Verification ──

export function detectLocationSpoofing(
    claimedLocation: { lat: number; lng: number },
    ipGeoLocation: { lat: number; lng: number; accuracy: string },
    deviceTimezone: string,
    expectedTimezone: string
): ThreatDetection | null {
    const distance = approxDistanceKm(claimedLocation, ipGeoLocation);
    const timezoneMismatch = deviceTimezone !== expectedTimezone;

    if (distance > 500 && timezoneMismatch) {
        return {
            type: "location_spoofing",
            severity: "high",
            confidence: 0.85,
            evidence: [
                `IP location ${distance}km from claimed location`,
                `Timezone mismatch: device=${deviceTimezone}, expected=${expectedTimezone}`,
            ],
            suggestedAction: "require_verification",
            detectedAt: new Date().toISOString(),
        };
    }

    if (distance > 200) {
        return {
            type: "location_spoofing",
            severity: "medium",
            confidence: 0.6,
            evidence: [`IP location ${distance}km from claimed location`],
            suggestedAction: "flag_for_review",
            detectedAt: new Date().toISOString(),
        };
    }

    return null;
}

function approxDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const dLat = (b.lat - a.lat) * 111;
    const dLng = (b.lng - a.lng) * 111 * Math.cos(a.lat * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
}

// ── Rate Limiting ──

export interface RateLimitConfig {
    action: string;
    windowMs: number;
    maxAttempts: number;
    penaltyAction: ThreatAction;
}

export const RATE_LIMITS: RateLimitConfig[] = [
    { action: "review_submit", windowMs: 3600_000, maxAttempts: 3, penaltyAction: "rate_limit" },
    { action: "claim_listing", windowMs: 86400_000, maxAttempts: 5, penaltyAction: "require_verification" },
    { action: "profile_update", windowMs: 3600_000, maxAttempts: 10, penaltyAction: "flag_for_review" },
    { action: "search_api", windowMs: 60_000, maxAttempts: 60, penaltyAction: "rate_limit" },
    { action: "lead_accept", windowMs: 60_000, maxAttempts: 20, penaltyAction: "flag_for_review" },
    { action: "coverage_update", windowMs: 86400_000, maxAttempts: 10, penaltyAction: "auto_suppress" },
];

export function checkRateLimit(
    action: string,
    attemptCount: number,
    windowMs: number
): { allowed: boolean; remaining: number; resetMs: number; penalty?: ThreatAction } {
    const config = RATE_LIMITS.find(r => r.action === action);
    if (!config) return { allowed: true, remaining: 999, resetMs: 0 };
    const allowed = attemptCount < config.maxAttempts;
    return {
        allowed,
        remaining: Math.max(0, config.maxAttempts - attemptCount),
        resetMs: config.windowMs - windowMs,
        penalty: allowed ? undefined : config.penaltyAction,
    };
}

// ── Score Tampering Detection ──

export function detectScoreTampering(
    scoreHistory: { score: number; timestamp: string }[],
    windowHours: number = 24
): ThreatDetection | null {
    if (scoreHistory.length < 2) return null;

    const cutoff = Date.now() - (windowHours * 3600_000);
    const recent = scoreHistory.filter(s => new Date(s.timestamp).getTime() >= cutoff);

    if (recent.length < 2) return null;

    const maxChange = Math.max(...recent.map((s, i, arr) =>
        i > 0 ? Math.abs(s.score - arr[i - 1].score) : 0
    ));

    if (maxChange > 30) {
        return {
            type: "score_manipulation",
            severity: maxChange > 50 ? "critical" : "high",
            confidence: Math.min(maxChange / 80, 0.95),
            evidence: [`Score changed ${maxChange} points in ${windowHours}h`],
            suggestedAction: "alert_admin",
            detectedAt: new Date().toISOString(),
        };
    }

    return null;
}

// ── Sock Puppet Detection ──

export function detectSockPuppets(
    accounts: { userId: string; ip: string; device: string; createdAt: string; email: string }[]
): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const ipGroups = new Map<string, typeof accounts>();
    const deviceGroups = new Map<string, typeof accounts>();

    for (const acc of accounts) {
        if (!ipGroups.has(acc.ip)) ipGroups.set(acc.ip, []);
        ipGroups.get(acc.ip)!.push(acc);
        if (!deviceGroups.has(acc.device)) deviceGroups.set(acc.device, []);
        deviceGroups.get(acc.device)!.push(acc);
    }

    for (const [ip, group] of ipGroups) {
        if (group.length >= 3) {
            threats.push({
                type: "sock_puppets",
                severity: group.length >= 5 ? "critical" : "high",
                confidence: Math.min(group.length / 8, 0.95),
                evidence: [`${group.length} accounts sharing IP ${ip.slice(0, 8)}***`],
                suggestedAction: group.length >= 5 ? "ban_account" : "require_verification",
                detectedAt: new Date().toISOString(),
            });
        }
    }

    return threats;
}
