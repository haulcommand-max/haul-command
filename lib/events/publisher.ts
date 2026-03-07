/**
 * HAUL COMMAND — Event Publisher
 * 
 * TypeScript utility for emitting canonical events to the event journal.
 * Used by server components, API routes, and edge functions.
 * 
 * Usage:
 *   import { emitBrokerLoadPosted } from '@/lib/events/publisher';
 *   const result = await emitBrokerLoadPosted({ ... });
 */

import "server-only";
import { supabaseServer } from '@/lib/supabase/server';
import { v4 as uuid } from 'uuid';

// ── Envelope Types ──────────────────────────────────────

export interface HCEventSource {
    app: string;
    env: 'local' | 'dev' | 'staging' | 'prod';
    component: string;
    source_ref?: string | null;
}

export interface HCEventActor {
    actor_type: 'system' | 'broker' | 'operator' | 'admin' | 'anonymous';
    actor_id: string;
    org_id?: string | null;
}

export interface HCEventContext {
    country_code: string;
    region_code: string;
    city?: string | null;
    corridor_id?: string | null;
    lane_id?: string | null;
    h3_res9?: string | null;
}

export interface HCEventEnvelope {
    event_id: string;
    event_type: string;
    event_version: number;
    occurred_at: string;
    produced_at: string;
    trace_id?: string | null;
    source: HCEventSource;
    actor: HCEventActor;
    context: HCEventContext;
    payload: Record<string, unknown>;
}

// ── Builder ─────────────────────────────────────────────

const DEFAULT_SOURCE: HCEventSource = {
    app: 'haulcommand',
    env: (process.env.NODE_ENV === 'production' ? 'prod' : 'dev') as 'prod' | 'dev',
    component: 'web',
};

export function buildEvent(
    eventType: string,
    actor: HCEventActor,
    context: HCEventContext,
    payload: Record<string, unknown>,
    options: {
        source?: Partial<HCEventSource>;
        trace_id?: string;
        occurred_at?: Date;
    } = {}
): HCEventEnvelope {
    const now = new Date().toISOString();
    return {
        event_id: uuid(),
        event_type: eventType,
        event_version: 1,
        occurred_at: options.occurred_at?.toISOString() || now,
        produced_at: now,
        trace_id: options.trace_id || null,
        source: { ...DEFAULT_SOURCE, ...options.source },
        actor,
        context,
        payload,
    };
}

// ── Publishers ──────────────────────────────────────────

/**
 * Write event to journal + update read models via handler RPC
 */
export async function emitEvent(event: HCEventEnvelope): Promise<{ event_id: string }> {
    const sb = supabaseServer();
    const { data, error } = await sb.rpc('hc_event_append', { p_event: event });

    if (error) {
        console.error('[EVENT] Failed to append event:', error);
        throw new Error(`Event append failed: ${error.message}`);
    }

    return { event_id: data as string };
}

/**
 * Emit broker.load_posted and update read models (market pulse + radar)
 */
export async function emitBrokerLoadPosted(params: {
    broker_entity_id: string;
    load_id: string;
    origin: { city: string; region_code: string; country_code: string };
    destination: { city: string; region_code: string; country_code: string };
    equipment_class: string;
    rate_hint?: number | null;
    urgency?: 'asap' | 'scheduled' | 'flex';
    source_board?: string | null;
    actor_id?: string;
}): Promise<{ event_id: string; radar_updated: string; pulse_created: boolean }> {
    const sb = supabaseServer();

    const event = buildEvent(
        'broker.load_posted',
        { actor_type: 'broker', actor_id: params.actor_id || params.broker_entity_id },
        {
            country_code: params.origin.country_code,
            region_code: params.origin.region_code,
            city: params.origin.city,
        },
        {
            broker_entity_id: params.broker_entity_id,
            load_id: params.load_id,
            lane_id: params.load_id,
            origin: params.origin,
            destination: params.destination,
            equipment_class: params.equipment_class,
            rate_hint: params.rate_hint || null,
            requirements: {
                height_ft: null,
                width_ft: null,
                length_ft: null,
                weight_lbs: null,
                urgency: params.urgency || 'flex',
            },
            source_board: params.source_board || null,
        }
    );

    const { data, error } = await sb.rpc('hc_handle_broker_load_posted', { p_event: event });

    if (error) {
        console.error('[EVENT] broker.load_posted handler failed:', error);
        throw new Error(`Handler failed: ${error.message}`);
    }

    return data as { event_id: string; radar_updated: string; pulse_created: boolean };
}

/**
 * Evaluate a feature flag (server-side)
 */
export async function evalFlag(
    flagKey: string,
    subjectId: string = '',
    context: Record<string, unknown> = {}
): Promise<{ enabled: boolean; variant: string; config: Record<string, unknown>; reason: string }> {
    const sb = supabaseServer();
    const { data, error } = await sb.rpc('hc_flag_eval', {
        p_flag_key: flagKey,
        p_subject_id: subjectId,
        p_context: context,
    });

    if (error) {
        console.error('[FLAG] eval failed:', error);
        return { enabled: false, variant: 'off', config: {}, reason: 'error' };
    }

    return data as { enabled: boolean; variant: string; config: Record<string, unknown>; reason: string };
}
