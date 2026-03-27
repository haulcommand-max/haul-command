// ══════════════════════════════════════════════════════════════
// LIVEKIT DIAL-NEXT PIPELINE
// Selects next eligible entity for outbound calling
// Migrated from lib/vapi/pipeline.ts
// ══════════════════════════════════════════════════════════════

import { SupabaseClient } from '@supabase/supabase-js';
import { buildAgentConfig, createCallRoom, generateAgentToken } from './agent-dispatcher';
import { getCountryByCode } from '@/lib/localization/country-configs';

export interface DialNextResult {
  success: boolean;
  entityId?: string;
  entityType?: string;
  roomName?: string;
  agentToken?: string;
  error?: string;
}

export async function dialNext(db: SupabaseClient): Promise<DialNextResult> {
  // 1. Pull next eligible entity from the dial queue
  const { data: candidate, error: qErr } = await db
    .from('livekit_dial_queue')
    .select('*')
    .eq('status', 'queued')
    .order('priority_score', { ascending: false })
    .order('queued_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (qErr || !candidate) {
    return { success: false, error: qErr?.message || 'No candidates in queue' };
  }

  // 2. Get country config
  const countryConfig = getCountryByCode(candidate.country_code);
  if (!countryConfig) {
    return { success: false, error: `Unknown country: ${candidate.country_code}` };
  }

  // 3. Build agent config
  const agentConfig = buildAgentConfig(
    candidate.persona || 'place_claim_assist',
    candidate.country_code,
    countryConfig.primaryLanguage,
  );

  // 4. Create LiveKit room
  const roomName = await createCallRoom(candidate.entity_id, agentConfig);

  // 5. Generate agent token
  const agentToken = await generateAgentToken(roomName, `hc-callsign-${candidate.entity_id}`);

  // 6. Mark as dialing
  await db.from('livekit_dial_queue').update({
    status: 'dialing',
    room_name: roomName,
    dialed_at: new Date().toISOString(),
  }).eq('id', candidate.id);

  return {
    success: true,
    entityId: candidate.entity_id,
    entityType: candidate.entity_type,
    roomName,
    agentToken,
  };
}
