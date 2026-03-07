// lib/intelligence/claim-funnel-router.ts
//
// Haul Command — Claim Funnel Router
// Tracks entry points → role detection → verification tiering
// Principle: opt_in_only_compliant_growth

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type EntryPoint =
    | 'facebook_group_link'
    | 'bio_link'
    | 'qr_code'
    | 'referral_link'
    | 'seo_organic'
    | 'vapi_outbound'
    | 'email_campaign'
    | 'direct_search';

export type FunnelStep =
    | 'landed'
    | 'signup_started'
    | 'signup_completed'
    | 'role_selected'
    | 'profile_started'
    | 'verification_started'
    | 'verification_completed'
    | 'first_action'
    | 'activated';

export type DetectedRole = 'operator' | 'broker' | 'shipper' | 'place_owner';
export type VerificationTier = 'free' | 'verified' | 'elite';

export interface FunnelEvent {
    session_id?: string;
    user_id?: string;
    entry_point: EntryPoint;
    referral_code?: string;
    funnel_step: FunnelStep;
    landing_url?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    country_code?: string;
    device_type?: string;
    detected_role?: DetectedRole;
    role_confidence?: number;
    metadata?: Record<string, any>;
}

export interface RoleDetection {
    role: DetectedRole;
    confidence: number;
    signals: string[];
}

// ============================================================
// ROLE DETECTION ENGINE
// ============================================================

const ROLE_SIGNALS: Record<DetectedRole, { keywords: string[]; weight: number; source: string }[]> = {
    operator: [
        { keywords: ['pilot car', 'escort', 'flag car', 'lead car', 'chase car'], weight: 0.90, source: 'keyword' },
        { keywords: ['available', 'open to run', 'my area', 'based in'], weight: 0.50, source: 'keyword' },
        { keywords: ['equipment', 'height pole', 'lights', 'signs'], weight: 0.40, source: 'keyword' },
        { keywords: ['cdl', 'certification', 'permit', 'insurance'], weight: 0.35, source: 'keyword' },
    ],
    broker: [
        { keywords: ['broker', 'brokerage', 'logistics', 'freight'], weight: 0.85, source: 'keyword' },
        { keywords: ['have a load', 'posting loads', 'mc number', 'dot number'], weight: 0.75, source: 'keyword' },
        { keywords: ['rate', 'per mile', 'paying', 'budget'], weight: 0.40, source: 'keyword' },
        { keywords: ['dispatch', 'coordinate', 'arrange'], weight: 0.35, source: 'keyword' },
    ],
    shipper: [
        { keywords: ['need to ship', 'transport my', 'move my', 'ship from'], weight: 0.85, source: 'keyword' },
        { keywords: ['manufacturer', 'factory', 'plant', 'warehouse'], weight: 0.50, source: 'keyword' },
        { keywords: ['delivery', 'pickup', 'schedule'], weight: 0.30, source: 'keyword' },
    ],
    place_owner: [
        { keywords: ['truck stop', 'repair shop', 'motel', 'parking'], weight: 0.80, source: 'keyword' },
        { keywords: ['my business', 'our location', 'claim my', 'we offer'], weight: 0.75, source: 'keyword' },
        { keywords: ['owner', 'manager', 'operator of'], weight: 0.50, source: 'keyword' },
    ],
};

export function detectRole(contextText: string, landingUrl?: string): RoleDetection {
    const lower = contextText.toLowerCase();
    const scores: Record<DetectedRole, number> = {
        operator: 0,
        broker: 0,
        shipper: 0,
        place_owner: 0,
    };
    const matchedSignals: string[] = [];

    // Score from text content
    for (const [role, signals] of Object.entries(ROLE_SIGNALS) as [DetectedRole, typeof ROLE_SIGNALS.operator][]) {
        for (const signal of signals) {
            const matched = signal.keywords.some(kw => lower.includes(kw));
            if (matched) {
                scores[role] = Math.min(scores[role] + signal.weight, 1.0);
                matchedSignals.push(`${role}:${signal.source}`);
            }
        }
    }

    // Score from landing URL context
    if (landingUrl) {
        const urlLower = landingUrl.toLowerCase();
        if (urlLower.includes('/directory') || urlLower.includes('/pilot-car')) {
            scores.operator += 0.30;
            matchedSignals.push('operator:url_directory');
        }
        if (urlLower.includes('/loads') || urlLower.includes('/post')) {
            scores.broker += 0.30;
            matchedSignals.push('broker:url_loads');
        }
        if (urlLower.includes('/places') || urlLower.includes('/claim')) {
            scores.place_owner += 0.40;
            matchedSignals.push('place_owner:url_claim');
        }
    }

    // Find highest-scoring role
    const sorted = (Object.entries(scores) as [DetectedRole, number][])
        .sort((a, b) => b[1] - a[1]);

    const topRole = sorted[0];
    const totalScore = sorted.reduce((s, [_, v]) => s + v, 0);
    const confidence = totalScore > 0 ? topRole[1] / totalScore : 0;

    return {
        role: topRole[0],
        confidence: Math.round(confidence * 10000) / 10000,
        signals: matchedSignals,
    };
}

// ============================================================
// VERIFICATION TIER GATE
// ============================================================

export function determineVerificationTier(
    role: DetectedRole,
    profileCompletionScore: number,   // 0-1
    verificationsCompleted: number,
    reviewCount: number,
    monthsActive: number,
): VerificationTier {
    // Elite: high completion + verified + reviews + tenure
    if (
        profileCompletionScore >= 0.85 &&
        verificationsCompleted >= 2 &&
        reviewCount >= 5 &&
        monthsActive >= 3
    ) {
        return 'elite';
    }

    // Verified: basic verification completed
    if (verificationsCompleted >= 1 && profileCompletionScore >= 0.50) {
        return 'verified';
    }

    return 'free';
}

// ============================================================
// FUNNEL EVENT RECORDING
// ============================================================

export async function recordFunnelEvent(event: FunnelEvent): Promise<{ success: boolean; event_id?: string }> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('claim_funnel_events')
        .insert({
            session_id: event.session_id,
            user_id: event.user_id,
            entry_point: event.entry_point,
            referral_code: event.referral_code,
            funnel_step: event.funnel_step,
            landing_url: event.landing_url,
            utm_source: event.utm_source,
            utm_medium: event.utm_medium,
            utm_campaign: event.utm_campaign,
            country_code: event.country_code,
            device_type: event.device_type,
            detected_role: event.detected_role,
            role_confidence: event.role_confidence,
            metadata: event.metadata || {},
        })
        .select('id')
        .single();

    if (error) {
        console.error('[claim-funnel-router] Failed to record event:', error.message);
        return { success: false };
    }

    return { success: true, event_id: data.id };
}

// ============================================================
// FUNNEL ANALYTICS HELPERS
// ============================================================

export async function getFunnelConversionRates(
    entryPoint?: EntryPoint,
    dateFrom?: string,
    dateTo?: string,
): Promise<{
    total_landed: number;
    signup_rate: number;
    role_selection_rate: number;
    verification_rate: number;
    activation_rate: number;
    top_entry_points: { entry_point: string; count: number }[];
}> {
    const supabase = getSupabaseAdmin();

    let query = supabase.from('claim_funnel_events').select('funnel_step, entry_point');
    if (entryPoint) query = query.eq('entry_point', entryPoint);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data: events } = await query;
    const allEvents = events || [];

    const stepCounts: Record<string, number> = {};
    const entryPointCounts: Record<string, number> = {};

    for (const e of allEvents) {
        stepCounts[e.funnel_step] = (stepCounts[e.funnel_step] || 0) + 1;
        entryPointCounts[e.entry_point] = (entryPointCounts[e.entry_point] || 0) + 1;
    }

    const landed = stepCounts['landed'] || 1; // prevent division by zero

    return {
        total_landed: stepCounts['landed'] || 0,
        signup_rate: (stepCounts['signup_completed'] || 0) / landed,
        role_selection_rate: (stepCounts['role_selected'] || 0) / landed,
        verification_rate: (stepCounts['verification_completed'] || 0) / landed,
        activation_rate: (stepCounts['activated'] || 0) / landed,
        top_entry_points: Object.entries(entryPointCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([entry_point, count]) => ({ entry_point, count })),
    };
}
