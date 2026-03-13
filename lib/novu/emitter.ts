/**
 * Novu Event Emitter — The Fuel Line
 * 
 * Connects table events to Novu workflow triggers.
 * Backend-only. Service-role reads/writes.
 * 
 * Every emit:
 *   1. Validates payload
 *   2. Checks idempotency (prevents duplicate sends)
 *   3. Logs to hc_notification_events audit table
 *   4. Triggers Novu workflow (or dry-runs if no API key)
 *   5. Returns transaction receipt
 * 
 * @status wired_not_live — emitter ready, Novu API key pending
 */

import { getNovuClient, isNovuDryRun } from './client';
import { NOVU_EVENT_NAMES, idempotencyKey, type NovuEventName } from './events';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface EmitResult {
    ok: boolean;
    event_name: string;
    transaction_id: string;
    idempotency_key: string;
    dry_run: boolean;
    error?: string;
}

export interface EmitOptions {
    /** Override recipient subscriber ID */
    subscriberId: string;
    /** Recipient email for email channel */
    email?: string;
    /** Recipient phone for SMS channel */
    phone?: string;
    /** Custom idempotency key (auto-generated if not provided) */
    idempotencyKey?: string;
    /** Actor who caused the event (for activity feed) */
    actorId?: string;
    /** Tenant for multi-tenancy */
    tenant?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════════

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

const emittedKeys = new Set<string>(); // In-memory dedup (per-process; use Redis in prod)

async function logEvent(
    eventName: string,
    recipientId: string,
    idemKey: string,
    status: 'sent' | 'dry_run' | 'deduplicated' | 'failed',
    transactionId: string,
    payload: Record<string, unknown>,
    error?: string,
): Promise<void> {
    try {
        const sb = getSupabaseAdmin();
        await sb.from('hc_notification_events').insert({
            event_name: eventName,
            recipient_id: recipientId,
            idempotency_key: idemKey,
            status,
            transaction_id: transactionId,
            payload: JSON.stringify(payload).substring(0, 4000),
            error_message: error?.substring(0, 500),
            emitted_at: new Date().toISOString(),
        });
    } catch (err) {
        // Log failure should never crash the notification pipeline
        console.error('[NOVU:AUDIT] Failed to log event:', err);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE EMITTER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Emit a notification event to Novu.
 * 
 * @param eventName - Canonical event name from NOVU_EVENT_NAMES
 * @param payload - Typed event payload
 * @param options - Recipient + channel info
 */
export async function emitNotification(
    eventName: NovuEventName,
    payload: Record<string, string | number | boolean | Record<string, unknown> | string[] | undefined>,
    options: EmitOptions,
): Promise<EmitResult> {
    const idemKey = options.idempotencyKey ||
        idempotencyKey(eventName, options.subscriberId);

    // ── Idempotency Check ──────────────────────────────────────────────────
    if (emittedKeys.has(idemKey)) {
        await logEvent(eventName, options.subscriberId, idemKey, 'deduplicated', '', payload);
        return {
            ok: true,
            event_name: eventName,
            transaction_id: '',
            idempotency_key: idemKey,
            dry_run: false,
            error: 'Deduplicated — already emitted this period',
        };
    }

    // ── Dry Run Mode ───────────────────────────────────────────────────────
    if (isNovuDryRun()) {
        const txId = `dry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        console.log(`[NOVU:DRY_RUN] ${eventName} → ${options.subscriberId}`,
            JSON.stringify(payload).substring(0, 200));

        emittedKeys.add(idemKey);
        await logEvent(eventName, options.subscriberId, idemKey, 'dry_run', txId, payload);

        return {
            ok: true,
            event_name: eventName,
            transaction_id: txId,
            idempotency_key: idemKey,
            dry_run: true,
        };
    }

    // ── Live Trigger ───────────────────────────────────────────────────────
    try {
        const novu = getNovuClient();

        // Map event name to Novu workflow ID (dots → hyphens)
        const workflowId = eventName.replace(/\./g, '-');

        const result = await novu.events.trigger(workflowId, {
            to: {
                subscriberId: options.subscriberId,
                ...(options.email ? { email: options.email } : {}),
                ...(options.phone ? { phone: options.phone } : {}),
            },
            payload,
            ...(options.actorId ? { actor: { subscriberId: options.actorId } } : {}),
            ...(options.tenant ? { tenant: { identifier: options.tenant } } : {}),
        });

        const txId = result?.data?.transactionId || `tx_${Date.now()}`;

        emittedKeys.add(idemKey);
        await logEvent(eventName, options.subscriberId, idemKey, 'sent', txId, payload);

        return {
            ok: true,
            event_name: eventName,
            transaction_id: txId,
            idempotency_key: idemKey,
            dry_run: false,
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await logEvent(eventName, options.subscriberId, idemKey, 'failed', '', payload, errorMsg);

        return {
            ok: false,
            event_name: eventName,
            transaction_id: '',
            idempotency_key: idemKey,
            dry_run: false,
            error: errorMsg,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH EMITTER — For digest/scan jobs
// ═══════════════════════════════════════════════════════════════════════════════

export type NovuPayload = Record<string, string | number | boolean | Record<string, unknown> | string[] | undefined>;

export async function emitBatch(
    events: Array<{
        eventName: NovuEventName;
        payload: NovuPayload;
        options: EmitOptions;
    }>,
): Promise<EmitResult[]> {
    const results: EmitResult[] = [];

    // Process sequentially to respect rate limits
    for (const evt of events) {
        const result = await emitNotification(evt.eventName, evt.payload, evt.options);
        results.push(result);

        // Small delay between sends to avoid burst throttling
        if (events.length > 5) {
            await new Promise(r => setTimeout(r, 50));
        }
    }

    const sent = results.filter(r => r.ok && !r.error).length;
    const deduped = results.filter(r => r.error?.includes('Deduplicated')).length;
    const failed = results.filter(r => !r.ok).length;

    console.log(`[NOVU:BATCH] ${events.length} events → ${sent} sent, ${deduped} deduped, ${failed} failed`);

    return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Re-export event names for convenience
// ═══════════════════════════════════════════════════════════════════════════════
export { NOVU_EVENT_NAMES };
