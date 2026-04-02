// lib/data/intake-router.ts — HAUL COMMAND Money OS Intake Router
// Wires the intake_events + intake_channels tables into the capture system.
//
// Any inbound request (email, EDI, API, voice, web form, chat) gets routed
// through this layer → writes to intake_events → triggers job composition.

import { supabaseAdmin } from '@/lib/supabase/admin';

export type IntakeChannel = 
  | 'web_form' | 'email' | 'api' | 'edi' | 'voice'
  | 'chat' | 'sms' | 'marketplace' | 'partner_referral';

export type IntakeEvent = {
  channel: IntakeChannel;
  raw_payload: Record<string, unknown>;
  sender_identity?: string;
  sender_entity_id?: string;
  country_id?: string;
  corridor_id?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
};

export type IntakeResult = {
  intake_event_id: string;
  channel: IntakeChannel;
  status: 'queued' | 'processing' | 'composed' | 'failed';
  auto_accept: boolean;
};

/**
 * Route an inbound intake event through the Money OS pipeline.
 * Writes to intake_events table and returns the event ID for downstream
 * job composition.
 *
 * This replaces the old manual quote-request flow with structured,
 * channel-aware intake that feeds into the Order Composer.
 */
export async function routeIntakeEvent(event: IntakeEvent): Promise<IntakeResult> {
  // 1. Resolve channel ID from intake_channels table
  const { data: channel } = await supabaseAdmin
    .from('intake_channels')
    .select('id, auto_accept_default')
    .eq('channel_key', event.channel)
    .single();

  if (!channel) {
    console.error(`[intake-router] Unknown channel: ${event.channel}`);
    // Fallback: still record the event
  }

  // 2. Write intake event
  const { data: inserted, error } = await supabaseAdmin
    .from('intake_events')
    .insert({
      channel_id: channel?.id || null,
      raw_payload: event.raw_payload,
      sender_identity: event.sender_identity || null,
      sender_entity_id: event.sender_entity_id || null,
      country_id: event.country_id || null,
      corridor_id: event.corridor_id || null,
      priority: event.priority || 'normal',
      intake_status: 'queued',
      metadata: event.metadata || {},
    })
    .select('id, intake_status')
    .single();

  if (error) {
    console.error('[intake-router] Failed to write intake event:', error.message);
    throw new Error(`Intake routing failed: ${error.message}`);
  }

  // 3. Check for auto-accept rules
  const autoAccept = channel?.auto_accept_default === true 
    && event.priority !== 'critical'; // Critical always needs human review

  return {
    intake_event_id: inserted.id,
    channel: event.channel,
    status: autoAccept ? 'processing' : 'queued',
    auto_accept: autoAccept,
  };
}

/**
 * Batch intake: process multiple events from the same channel.
 * Used for EDI batch uploads, email parsing, API bulk submissions.
 */
export async function routeBatchIntake(
  channel: IntakeChannel,
  events: Array<Omit<IntakeEvent, 'channel'>>
): Promise<IntakeResult[]> {
  const results: IntakeResult[] = [];
  
  for (const event of events) {
    try {
      const result = await routeIntakeEvent({ ...event, channel });
      results.push(result);
    } catch (e) {
      console.error(`[intake-router] Batch item failed:`, e);
      results.push({
        intake_event_id: '',
        channel,
        status: 'failed',
        auto_accept: false,
      });
    }
  }

  return results;
}

/**
 * Get intake pipeline status for monitoring.
 */
export async function getIntakePipelineStatus() {
  const { data, error } = await supabaseAdmin
    .from('intake_events')
    .select('intake_status')
    .in('intake_status', ['queued', 'processing']);

  if (error) return { queued: 0, processing: 0 };

  return {
    queued: data.filter((e: any) => e.intake_status === 'queued').length,
    processing: data.filter((e: any) => e.intake_status === 'processing').length,
  };
}
