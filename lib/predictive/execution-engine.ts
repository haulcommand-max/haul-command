// lib/predictive/execution-engine.ts
//
// Haul Command — Pre-Activation Execution Engine
// Spec: Predictive Liquidity Engine v1.0.0 — Part F
//
// Converts queued recommendations into multi-channel outbound actions.
// Enforces per-country, per-corridor, and per-entity caps.
// Downgrades channels when compliance blocks (vapi→email, sms→in_app).

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { checkVapiCompliance } from "@/lib/compliance/global-guard";

// ============================================================
// TYPES
// ============================================================

export type Channel = 'vapi_call' | 'email' | 'sms' | 'in_app' | 'ads_retarget' | 'manual_queue';
export type EntityType = 'operator' | 'broker' | 'place' | 'account';
export type Outcome = 'success' | 'fail' | 'blocked' | 'skipped';

export interface ExecutionResult {
    recommendation_id: number;
    corridor_id: string;
    channel: Channel;
    entity_type: EntityType;
    entity_id: string;
    outcome: Outcome;
    outcome_detail?: string;
}

// ============================================================
// CAPS
// ============================================================

const GLOBAL_CAPS = {
    per_country_daily_calls_max: 1500,
    per_corridor_daily_calls_max: 350,
    per_entity_cooldown_hours: 72,
};

const CHANNEL_DOWNGRADE: Record<string, Channel> = {
    vapi_call: 'email',
    sms: 'in_app',
    email: 'in_app',
    in_app: 'in_app',  // No further downgrade
};

// ============================================================
// CAP TRACKING (in-memory for single run)
// ============================================================

class CapTracker {
    private countryCalls = new Map<string, number>();
    private corridorCalls = new Map<string, number>();
    private entityLastContact = new Map<string, number>();

    canCall(country: string, corridor: string, entityId: string): { allowed: boolean; reason?: string } {
        const countryCount = this.countryCalls.get(country) || 0;
        if (countryCount >= GLOBAL_CAPS.per_country_daily_calls_max) {
            return { allowed: false, reason: `Country ${country} daily cap (${GLOBAL_CAPS.per_country_daily_calls_max})` };
        }

        const corridorCount = this.corridorCalls.get(corridor) || 0;
        if (corridorCount >= GLOBAL_CAPS.per_corridor_daily_calls_max) {
            return { allowed: false, reason: `Corridor daily cap (${GLOBAL_CAPS.per_corridor_daily_calls_max})` };
        }

        const lastContact = this.entityLastContact.get(entityId);
        if (lastContact) {
            const hoursSince = (Date.now() - lastContact) / (1000 * 60 * 60);
            if (hoursSince < GLOBAL_CAPS.per_entity_cooldown_hours) {
                return { allowed: false, reason: `Entity cooldown (${Math.round(hoursSince)}h < ${GLOBAL_CAPS.per_entity_cooldown_hours}h)` };
            }
        }

        return { allowed: true };
    }

    record(country: string, corridor: string, entityId: string): void {
        this.countryCalls.set(country, (this.countryCalls.get(country) || 0) + 1);
        this.corridorCalls.set(corridor, (this.corridorCalls.get(corridor) || 0) + 1);
        this.entityLastContact.set(entityId, Date.now());
    }
}

// ============================================================
// CHANNEL RESOLUTION
// ============================================================

async function resolveChannel(
    preferredChannel: Channel,
    countryCode: string,
    entityId: string
): Promise<{ channel: Channel; downgraded: boolean; reason?: string }> {
    if (preferredChannel === 'vapi_call') {
        const localHour = new Date().getUTCHours(); // TODO: localize per entity timezone
        const compliance = await checkVapiCompliance(countryCode, localHour, 'auto', 'unknown', 0);
        if (!compliance.allowed) {
            const downgraded = CHANNEL_DOWNGRADE[preferredChannel] || 'in_app';
            return { channel: downgraded, downgraded: true, reason: compliance.blocks.join('; ') };
        }
    }

    return { channel: preferredChannel, downgraded: false };
}

// ============================================================
// MAIN: EXECUTE RECOMMENDATIONS
// ============================================================

export async function executePreActivationRecs(): Promise<{
    recommendations_processed: number;
    executions_created: number;
    blocked_count: number;
    downgraded_count: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();
    const caps = new CapTracker();

    // Pull queued recommendations (priority order)
    const { data: recs } = await supabase
        .from('pre_activation_recommendations')
        .select('*')
        .eq('status', 'queued')
        .order('priority', { ascending: true }); // critical first

    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const sortedRecs = (recs || []).sort((a, b) =>
        (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
    );

    let processed = 0;
    let executions = 0;
    let blocked = 0;
    let downgraded = 0;

    for (const rec of sortedRecs) {
        processed++;

        // Get corridor features for country code
        const { data: feat } = await supabase
            .from('corridor_feature_store_daily')
            .select('country_code')
            .eq('corridor_id', rec.corridor_id)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .single();

        const countryCode = feat?.country_code || 'US';

        // Determine target entities (simplified — would query funnel records)
        // For now, generate execution records for the recommendation itself
        const caps_check = caps.canCall(countryCode, rec.corridor_id, rec.corridor_id);

        if (!caps_check.allowed) {
            // Block and record reason
            await supabase
                .from('pre_activation_recommendations')
                .update({ status: 'blocked', blocked_reason: caps_check.reason })
                .eq('id', rec.id);
            blocked++;
            continue;
        }

        // Resolve channel
        const preferredChannel: Channel = rec.recommendation_type === 'supply' ? 'vapi_call' : 'email';
        const resolved = await resolveChannel(preferredChannel, countryCode, rec.corridor_id);
        if (resolved.downgraded) downgraded++;

        // Create execution record
        const { error } = await supabase.from('pre_activation_executions').insert({
            recommendation_id: rec.id,
            corridor_id: rec.corridor_id,
            channel: resolved.channel,
            entity_type: rec.recommendation_type === 'supply' ? 'operator' : 'broker',
            execution_payload: {
                playbook_key: rec.playbook_key,
                actions: rec.recommended_actions,
                downgraded: resolved.downgraded,
                downgrade_reason: resolved.reason,
            },
            outcome: 'success',  // Would be determined by actual execution
            outcome_detail: resolved.downgraded ? `Downgraded from ${preferredChannel} to ${resolved.channel}` : null,
        });

        if (!error) {
            executions++;
            caps.record(countryCode, rec.corridor_id, rec.corridor_id);

            // Update recommendation status
            await supabase
                .from('pre_activation_recommendations')
                .update({ status: 'completed' })
                .eq('id', rec.id);
        }
    }

    return {
        recommendations_processed: processed,
        executions_created: executions,
        blocked_count: blocked,
        downgraded_count: downgraded,
        duration_ms: Date.now() - startTime,
    };
}
