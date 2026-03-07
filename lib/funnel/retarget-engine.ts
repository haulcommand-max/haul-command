// lib/funnel/retarget-engine.ts
//
// Haul Command — Retarget Engine (VAPI + PLAI Loop)
// Spec: Autonomous Funnel Blueprint v1.0.0
//
// Builds retarget audiences from funnel data:
// - VAPI positive but no claim (72h)
// - Claim started but not verified (48h)
// - Activated but no load activity (7d)
// - Broker viewed but not posted (72h)

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type AudienceKey =
    | 'vapi_positive_no_claim'
    | 'claim_started_not_verified'
    | 'activated_no_loads'
    | 'broker_viewed_not_posted';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface RetargetRule {
    audience_key: AudienceKey;
    funnel_side: 'supply' | 'demand';
    source_table: string;
    condition_window_hours: number;
    priority: Priority;
    max_impressions_per_day: number;
    max_voice_per_7d: number;
}

export interface RetargetCandidate {
    record_id: string;
    audience_key: AudienceKey;
    country_iso2: string;
    corridor_id?: string;
    funnel_side: 'supply' | 'demand';
    priority: Priority;
}

// ============================================================
// RETARGET RULES
// ============================================================

const RETARGET_RULES: RetargetRule[] = [
    {
        audience_key: 'vapi_positive_no_claim',
        funnel_side: 'supply',
        source_table: 'funnel_supply_records',
        condition_window_hours: 72,
        priority: 'high',
        max_impressions_per_day: 5,
        max_voice_per_7d: 2,
    },
    {
        audience_key: 'claim_started_not_verified',
        funnel_side: 'supply',
        source_table: 'funnel_supply_records',
        condition_window_hours: 48,
        priority: 'critical',
        max_impressions_per_day: 5,
        max_voice_per_7d: 2,
    },
    {
        audience_key: 'activated_no_loads',
        funnel_side: 'supply',
        source_table: 'funnel_supply_records',
        condition_window_hours: 168,  // 7 days
        priority: 'medium',
        max_impressions_per_day: 5,
        max_voice_per_7d: 2,
    },
    {
        audience_key: 'broker_viewed_not_posted',
        funnel_side: 'demand',
        source_table: 'funnel_demand_records',
        condition_window_hours: 72,
        priority: 'high',
        max_impressions_per_day: 5,
        max_voice_per_7d: 2,
    },
];

// ============================================================
// AUDIENCE BUILDER
// ============================================================

/**
 * Find supply-side records eligible for retargeting.
 */
export async function buildSupplyRetargetAudiences(): Promise<RetargetCandidate[]> {
    const supabase = getSupabaseAdmin();
    const candidates: RetargetCandidate[] = [];
    const now = Date.now();

    // 1. VAPI positive, no claim within 72h
    const vapiCutoff = new Date(now - 72 * 60 * 60 * 1000).toISOString();
    const { data: vapiPositive } = await supabase
        .from('funnel_supply_records')
        .select('id, country_iso2, corridor_id')
        .eq('stage', 'conversation')
        .lt('conversation_at', vapiCutoff)
        .is('claim_started_at', null);

    for (const r of vapiPositive || []) {
        candidates.push({
            record_id: r.id,
            audience_key: 'vapi_positive_no_claim',
            country_iso2: r.country_iso2,
            corridor_id: r.corridor_id,
            funnel_side: 'supply',
            priority: 'high',
        });
    }

    // 2. Claim started, not verified within 48h
    const claimCutoff = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    const { data: claimNoVerify } = await supabase
        .from('funnel_supply_records')
        .select('id, country_iso2, corridor_id')
        .eq('stage', 'claim_started')
        .lt('claim_started_at', claimCutoff)
        .is('verified_at', null);

    for (const r of claimNoVerify || []) {
        candidates.push({
            record_id: r.id,
            audience_key: 'claim_started_not_verified',
            country_iso2: r.country_iso2,
            corridor_id: r.corridor_id,
            funnel_side: 'supply',
            priority: 'critical',
        });
    }

    // 3. Activated, no load activity within 7d
    const activatedCutoff = new Date(now - 168 * 60 * 60 * 1000).toISOString();
    const { data: activatedNoLoads } = await supabase
        .from('funnel_supply_records')
        .select('id, country_iso2, corridor_id')
        .eq('stage', 'activated')
        .lt('activated_at', activatedCutoff)
        .is('first_load_at', null);

    for (const r of activatedNoLoads || []) {
        candidates.push({
            record_id: r.id,
            audience_key: 'activated_no_loads',
            country_iso2: r.country_iso2,
            corridor_id: r.corridor_id,
            funnel_side: 'supply',
            priority: 'medium',
        });
    }

    return candidates;
}

/**
 * Find demand-side records eligible for retargeting.
 */
export async function buildDemandRetargetAudiences(): Promise<RetargetCandidate[]> {
    const supabase = getSupabaseAdmin();
    const candidates: RetargetCandidate[] = [];
    const now = Date.now();

    // Broker viewed but no post within 72h
    const brokerCutoff = new Date(now - 72 * 60 * 60 * 1000).toISOString();
    const { data: brokerNoPost } = await supabase
        .from('funnel_demand_records')
        .select('id, country_iso2, corridor_id')
        .eq('stage', 'account_created')
        .lt('account_created_at', brokerCutoff)
        .is('first_load_at', null);

    for (const r of brokerNoPost || []) {
        candidates.push({
            record_id: r.id,
            audience_key: 'broker_viewed_not_posted',
            country_iso2: r.country_iso2,
            corridor_id: r.corridor_id,
            funnel_side: 'demand',
            priority: 'high',
        });
    }

    return candidates;
}

/**
 * Sync candidates to retarget_audiences table.
 * Upserts on (audience_key, record_id).
 */
export async function syncRetargetAudiences(candidates: RetargetCandidate[]): Promise<number> {
    const supabase = getSupabaseAdmin();
    let synced = 0;

    for (const c of candidates) {
        const { error } = await supabase.from('retarget_audiences').upsert({
            audience_key: c.audience_key,
            record_id: c.record_id,
            country_iso2: c.country_iso2,
            corridor_id: c.corridor_id,
            funnel_side: c.funnel_side,
            priority: c.priority,
        }, { onConflict: 'audience_key,record_id' });

        if (!error) synced++;
    }

    return synced;
}

/**
 * Check impression/voice frequency caps for a retarget record.
 */
export async function checkFrequencyCaps(
    recordId: string,
    audienceKey: AudienceKey
): Promise<{ canShowAd: boolean; canCall: boolean }> {
    const supabase = getSupabaseAdmin();

    const { data: audience } = await supabase
        .from('retarget_audiences')
        .select('impressions, last_impression_at, voice_touches, last_voice_at')
        .eq('record_id', recordId)
        .eq('audience_key', audienceKey)
        .single();

    if (!audience) return { canShowAd: false, canCall: false };

    const rule = RETARGET_RULES.find(r => r.audience_key === audienceKey);
    if (!rule) return { canShowAd: false, canCall: false };

    // Check daily impression cap
    const today = new Date().toISOString().slice(0, 10);
    const lastImpDate = audience.last_impression_at
        ? new Date(audience.last_impression_at).toISOString().slice(0, 10)
        : null;
    const todayImpressions = lastImpDate === today ? audience.impressions : 0;
    const canShowAd = todayImpressions < rule.max_impressions_per_day;

    // Check 7-day voice cap
    const canCall = audience.voice_touches < rule.max_voice_per_7d;

    return { canShowAd, canCall };
}

// ============================================================
// EXPORT RULES
// ============================================================

export function getRetargetRules(): RetargetRule[] {
    return RETARGET_RULES;
}
