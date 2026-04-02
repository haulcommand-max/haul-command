// ══════════════════════════════════════════════════════════════
// INTAKE EVENT SERVICE — wires capture-router decisions to
// the intake_events + intake_channels tables in Supabase
//
// The capture-router.ts makes the DECISION (what to show).
// This service makes the RECORD (what happened) and can
// trigger job creation from high-confidence intake events.
// ══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

// ── Types ──

export type IntakeChannelType =
  | 'ui'
  | 'api'
  | 'edi_204'
  | 'edi_214'
  | 'email'
  | 'voice'
  | 'sms'
  | 'whatsapp'
  | 'webhook'
  | 'manual';

export type ParseStatus = 'pending' | 'parsed' | 'failed' | 'review_needed';
export type ParseConfidence = 'low' | 'medium' | 'high';

export interface IntakeEventPayload {
  channel_key: string;
  source_entity_id?: string;
  raw_payload: Record<string, unknown>;
  normalized_payload?: Record<string, unknown>;
  parse_status?: ParseStatus;
  parse_confidence?: ParseConfidence;
  source_reference?: string;
  metadata?: Record<string, unknown>;
}

export interface IntakeEvent {
  id: string;
  intake_channel_id: string;
  source_entity_id: string | null;
  created_job_id: string | null;
  raw_payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown>;
  parse_status: ParseStatus;
  parse_confidence: ParseConfidence;
  source_reference: string | null;
  received_at: string;
  processed_at: string | null;
  metadata: Record<string, unknown>;
}

// ── Channel resolution cache ──
const channelCache = new Map<string, string>();

/**
 * resolveChannelId — Look up or create an intake channel by key.
 */
async function resolveChannelId(channelKey: string): Promise<string | null> {
  if (channelCache.has(channelKey)) {
    return channelCache.get(channelKey)!;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('intake_channels')
    .select('id')
    .eq('channel_key', channelKey)
    .single();

  if (data?.id) {
    channelCache.set(channelKey, data.id);
    return data.id;
  }

  // Channel doesn't exist — auto-create it
  const { data: created, error: createError } = await supabase
    .from('intake_channels')
    .insert({
      channel_key: channelKey,
      channel_type: inferChannelType(channelKey),
      display_name: channelKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      is_active: true,
      metadata: { auto_created: true, created_at: new Date().toISOString() },
    })
    .select('id')
    .single();

  if (created?.id) {
    channelCache.set(channelKey, created.id);
    return created.id;
  }

  console.error('[intake] Failed to resolve or create channel:', channelKey, error || createError);
  return null;
}

function inferChannelType(key: string): IntakeChannelType {
  if (key.includes('api')) return 'api';
  if (key.includes('email')) return 'email';
  if (key.includes('voice') || key.includes('vapi')) return 'voice';
  if (key.includes('sms')) return 'sms';
  if (key.includes('whatsapp')) return 'whatsapp';
  if (key.includes('webhook')) return 'webhook';
  if (key.includes('edi')) return 'edi_204';
  return 'ui';
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════

/**
 * recordIntakeEvent — Write one inbound signal to intake_events.
 * Returns the created event ID, or null on failure.
 */
export async function recordIntakeEvent(
  payload: IntakeEventPayload
): Promise<string | null> {
  const channelId = await resolveChannelId(payload.channel_key);
  if (!channelId) return null;

  const supabase = createClient();

  const { data, error } = await supabase
    .from('intake_events')
    .insert({
      intake_channel_id: channelId,
      source_entity_id: payload.source_entity_id || null,
      raw_payload: payload.raw_payload,
      normalized_payload: payload.normalized_payload || {},
      parse_status: payload.parse_status || 'pending',
      parse_confidence: payload.parse_confidence || 'medium',
      source_reference: payload.source_reference || null,
      metadata: payload.metadata || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('[intake] Failed to record event:', error.message);
    return null;
  }

  return data?.id || null;
}

/**
 * recordCaptureIntakeEvent — Specialized wrapper for capture-router events.
 * Called when a capture offer is SHOWN or CLICKED.
 */
export async function recordCaptureIntakeEvent(params: {
  event_type: 'offer_shown' | 'offer_clicked' | 'offer_dismissed' | 'form_submitted';
  offer_type: string;
  page_path: string;
  page_type?: string;
  visitor_role?: string;
  identity_rung?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  return recordIntakeEvent({
    channel_key: 'capture_router',
    raw_payload: {
      event_type: params.event_type,
      offer_type: params.offer_type,
      page_path: params.page_path,
      page_type: params.page_type,
      visitor_role: params.visitor_role,
      identity_rung: params.identity_rung,
      entity_id: params.entity_id,
      timestamp: new Date().toISOString(),
      ...params.metadata,
    },
    normalized_payload: {
      event_type: params.event_type,
      offer_type: params.offer_type,
      page_path: params.page_path,
    },
    parse_status: 'parsed',
    parse_confidence: 'high',
    source_reference: `capture:${params.event_type}:${params.offer_type}`,
  });
}

/**
 * fetchRecentIntakeEvents — Read recent intake events for monitoring.
 */
export async function fetchRecentIntakeEvents(
  limit: number = 50,
  channel_key?: string
): Promise<IntakeEvent[]> {
  const supabase = createClient();

  let query = supabase
    .from('intake_events')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(limit);

  if (channel_key) {
    const channelId = await resolveChannelId(channel_key);
    if (channelId) {
      query = query.eq('intake_channel_id', channelId);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[intake] Failed to fetch events:', error.message);
    return [];
  }

  return (data ?? []) as IntakeEvent[];
}

/**
 * getIntakeChannelStats — Aggregate intake channel performance.
 */
export async function getIntakeChannelStats(): Promise<
  Array<{ channel_key: string; display_name: string; event_count: number; last_event_at: string | null }>
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('intake_channels')
    .select('channel_key, display_name');

  if (error || !data) return [];

  const stats = await Promise.all(
    data.map(async (ch) => {
      const { count } = await supabase
        .from('intake_events')
        .select('*', { count: 'estimated', head: true })
        .eq('intake_channel_id', await resolveChannelId(ch.channel_key));

      const { data: latest } = await supabase
        .from('intake_events')
        .select('received_at')
        .eq('intake_channel_id', await resolveChannelId(ch.channel_key))
        .order('received_at', { ascending: false })
        .limit(1)
        .single();

      return {
        channel_key: ch.channel_key,
        display_name: ch.display_name,
        event_count: count ?? 0,
        last_event_at: latest?.received_at || null,
      };
    })
  );

  return stats;
}
