/**
 * Motive Webhook Verification & Processing
 *
 * Verifies incoming webhook signatures and routes events
 * to the appropriate handlers.
 */

import type { MotiveWebhookPayload, MotiveWebhookEventType } from './types';

const MOTIVE_WEBHOOK_SECRET = process.env.MOTIVE_WEBHOOK_SECRET || '';

// ═══════════════════════════════════════════════════════════════
// Signature Verification
// ═══════════════════════════════════════════════════════════════

/**
 * Verify the webhook signature from Motive.
 * Motive signs webhooks using HMAC-SHA256 with the webhook secret.
 */
export async function verifyMotiveWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader || !MOTIVE_WEBHOOK_SECRET) {
    // In development, skip verification if no secret is configured
    if (process.env.NODE_ENV === 'development' && !MOTIVE_WEBHOOK_SECRET) {
      console.warn('[Motive Webhook] No webhook secret configured — skipping verification in dev');
      return true;
    }
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(MOTIVE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const computedHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    const expected = signatureHeader.replace(/^sha256=/, '');
    if (computedHex.length !== expected.length) return false;

    let result = 0;
    for (let i = 0; i < computedHex.length; i++) {
      result |= computedHex.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return result === 0;
  } catch {
    console.error('[Motive Webhook] Signature verification failed');
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// Event Parsing
// ═══════════════════════════════════════════════════════════════

/**
 * Parse and validate a webhook payload from Motive.
 */
export function parseMotiveWebhookPayload(body: unknown): MotiveWebhookPayload | null {
  if (!body || typeof body !== 'object') return null;

  const payload = body as Record<string, unknown>;

  // Validate required fields
  if (!payload.type || typeof payload.type !== 'string') return null;
  if (!payload.data || typeof payload.data !== 'object') return null;

  return {
    id: String(payload.id || ''),
    type: payload.type as MotiveWebhookEventType,
    company_id: Number(payload.company_id) || 0,
    object_type: String(payload.object_type || ''),
    object_id: Number(payload.object_id) || 0,
    action: String(payload.action || ''),
    data: payload.data as Record<string, unknown>,
    occurred_at: String(payload.occurred_at || new Date().toISOString()),
    webhook_id: Number(payload.webhook_id) || 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// Event Type Filtering
// ═══════════════════════════════════════════════════════════════

/** Events that Haul Command processes (ignoring irrelevant ones) */
const HC_RELEVANT_EVENTS: MotiveWebhookEventType[] = [
  'vehicle_location_updated',
  'hos_violation',
  'dispatch_status_changed',
  'driver_performance_event',
  'fuel_purchase_created',
  'inspection_report_submitted',
  'fault_code_detected',
  'geofence_entry',
  'geofence_exit',
];

/**
 * Check if an event type is relevant to Haul Command processing.
 */
export function isRelevantMotiveEvent(eventType: MotiveWebhookEventType): boolean {
  return HC_RELEVANT_EVENTS.includes(eventType);
}

/**
 * Categorize a Motive event into the HC domain it feeds.
 */
export function categorizeMotiveEvent(
  eventType: MotiveWebhookEventType,
): 'position' | 'safety' | 'compliance' | 'fuel' | 'dispatch' | 'unknown' {
  switch (eventType) {
    case 'vehicle_location_updated':
    case 'geofence_entry':
    case 'geofence_exit':
      return 'position';
    case 'driver_performance_event':
    case 'inspection_report_submitted':
    case 'fault_code_detected':
      return 'safety';
    case 'hos_violation':
      return 'compliance';
    case 'fuel_purchase_created':
      return 'fuel';
    case 'dispatch_status_changed':
      return 'dispatch';
    default:
      return 'unknown';
  }
}
