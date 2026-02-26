/**
 * Intel Event Capture
 *
 * Single capture point for all behavioral events and observations.
 * Every marketplace route calls this to emit signals that kill priors.
 *
 * Writes to:
 *  - intel_events            (all behavioral exhaust)
 *  - permit_friction_observations (friction-specific observations)
 *  - crowd_intel_events      (crowdsourced reports)
 *
 * Non-blocking: failures log but never break caller.
 */

import { createClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────

export type IntelEventType =
    // Marketplace exhaust
    | 'search_submitted'
    | 'load_posted'
    | 'match_generated'
    | 'offer_accepted'
    | 'offer_declined'
    | 'route_planned'
    | 'route_changed'
    | 'late_fill'
    | 'unfilled_timeout'
    // Friction proxies
    | 'permit_delay_reported'
    | 'permit_rejection'
    | 'permit_resubmission'
    | 'route_denied_reroute'
    // Crowdsourced
    | 'checkpoint_delay'
    | 'low_bridge_clearance'
    | 'movement_window_blocked'
    | 'police_escort_unexpected'
    | 'office_slowdown';

export interface IntelEvent {
    eventType: IntelEventType;
    countryCode: string;
    regionCode?: string;
    corridorSlug?: string;
    payload?: Record<string, unknown>;
    sessionId?: string;
    profileId?: string;
}

export interface FrictionObservation {
    countryCode: string;
    regionCode?: string;
    corridorSlug?: string;
    observationType: string;
    value?: number;
    source: 'behavioral' | 'crowdsourced' | 'structured';
    trustWeight?: number;
    sessionId?: string;
    profileId?: string;
}

// ── Friction proxy event types (auto-generate observations) ────────────────

const FRICTION_PROXY_EVENTS: Record<string, string> = {
    offer_declined: 'friction_proxy',
    late_fill: 'fill_difficulty',
    unfilled_timeout: 'fill_failure',
    route_changed: 'route_instability',
    permit_delay_reported: 'permit_delay',
    permit_rejection: 'permit_rejection',
    permit_resubmission: 'permit_rework',
    route_denied_reroute: 'route_denial',
    checkpoint_delay: 'checkpoint_delay',
    low_bridge_clearance: 'clearance_hazard',
    movement_window_blocked: 'restriction_hit',
    police_escort_unexpected: 'escort_surprise',
    office_slowdown: 'office_delay',
};

// Crowdsourced event types (flow to crowd_intel_events)
const CROWD_EVENTS = new Set<IntelEventType>([
    'checkpoint_delay',
    'low_bridge_clearance',
    'movement_window_blocked',
    'police_escort_unexpected',
    'office_slowdown',
    'permit_delay_reported',
    'route_denied_reroute',
]);

// ── Capture Functions ──────────────────────────────────────────────────────

function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

/**
 * Emit an intel event. Non-blocking — never throws.
 * Automatically generates friction observations for proxy events.
 * Automatically routes crowdsourced events to crowd_intel_events.
 */
export async function captureIntelEvent(event: IntelEvent): Promise<void> {
    try {
        const supabase = getSupabase();

        // 1. Always write to intel_events
        await supabase.from('intel_events').insert({
            event_type: event.eventType,
            country_code: event.countryCode,
            region_code: event.regionCode || null,
            corridor_slug: event.corridorSlug || null,
            payload: event.payload || {},
            session_id: event.sessionId || null,
            profile_id: event.profileId || null,
        });

        // 2. If this is a friction proxy, auto-generate an observation
        const obsType = FRICTION_PROXY_EVENTS[event.eventType];
        if (obsType) {
            await captureFrictionObservation({
                countryCode: event.countryCode,
                regionCode: event.regionCode,
                corridorSlug: event.corridorSlug,
                observationType: obsType,
                value: (event.payload?.value as number) ?? 1,
                source: CROWD_EVENTS.has(event.eventType) ? 'crowdsourced' : 'behavioral',
                trustWeight: CROWD_EVENTS.has(event.eventType) ? 0.7 : 1.0,
                sessionId: event.sessionId,
                profileId: event.profileId,
            });
        }

        // 3. If crowdsourced, also write to crowd_intel_events
        if (CROWD_EVENTS.has(event.eventType)) {
            await supabase.from('crowd_intel_events').insert({
                country_code: event.countryCode,
                region_code: event.regionCode || null,
                corridor_slug: event.corridorSlug || null,
                event_type: event.eventType,
                payload: event.payload || {},
                reporter_id: event.profileId || null,
                trust_weight: 0.7,
            });
        }
    } catch (err) {
        console.warn('[intel/capture] Failed to emit event:', event.eventType, err);
    }
}

/**
 * Record a direct friction observation. Non-blocking.
 */
export async function captureFrictionObservation(obs: FrictionObservation): Promise<void> {
    try {
        const supabase = getSupabase();
        await supabase.from('permit_friction_observations').insert({
            country_code: obs.countryCode,
            region_code: obs.regionCode || null,
            corridor_slug: obs.corridorSlug || null,
            observation_type: obs.observationType,
            value: obs.value || null,
            source: obs.source,
            trust_weight: obs.trustWeight || 1.0,
            session_id: obs.sessionId || null,
            profile_id: obs.profileId || null,
        });
    } catch (err) {
        console.warn('[intel/capture] Failed to record friction observation:', err);
    }
}

// ── Observation Counting (for basis determination) ─────────────────────────

export interface ObservationSummary {
    frictionObservations30d: number;
    scarcityObservations30d: number;
    behavioralEvents30d: number;
    crowdReports30d: number;
    frictionBasis: 'priors' | 'mixed' | 'observed';
    scarcityBasis: 'priors' | 'mixed' | 'observed';
}

/**
 * Get observation counts + basis determination for a region.
 * Falls back to zero counts (= priors basis) if no aggregates exist.
 */
export async function getObservationSummary(
    countryCode: string,
    regionCode?: string,
    corridorSlug?: string,
): Promise<ObservationSummary> {
    try {
        const supabase = getSupabase();
        const { data } = await supabase
            .from('intel_observation_counts')
            .select('*')
            .eq('country_code', countryCode)
            .eq('region_code', regionCode || '')
            .eq('corridor_slug', corridorSlug || '')
            .maybeSingle();

        if (data) {
            return {
                frictionObservations30d: data.friction_observations_30d,
                scarcityObservations30d: data.scarcity_observations_30d,
                behavioralEvents30d: data.behavioral_events_30d,
                crowdReports30d: data.crowd_reports_30d,
                frictionBasis: data.friction_basis,
                scarcityBasis: data.scarcity_basis,
            };
        }
    } catch (err) {
        console.warn('[intel/capture] Failed to fetch observation summary:', err);
    }

    // Default: no observations = priors
    return {
        frictionObservations30d: 0,
        scarcityObservations30d: 0,
        behavioralEvents30d: 0,
        crowdReports30d: 0,
        frictionBasis: 'priors',
        scarcityBasis: 'priors',
    };
}

/**
 * Determine basis from observation count.
 */
export function determineBasis(count: number): 'priors' | 'mixed' | 'observed' {
    if (count < 25) return 'priors';
    if (count < 250) return 'mixed';
    return 'observed';
}
