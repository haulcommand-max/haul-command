/**
 * Agent #16 — LiveKit Voice Call Agent
 * Swarm: Dispatch | Model: LiveKit TTS/STT | Priority: High
 * 
 * The actual phone caller. Uses LiveKit Agents + OpenAI Realtime API
 * to place outbound calls to operator cell phones, negotiate rates
 * in natural voice, and book loads in real-time.
 * 
 * Steroid: Emotional Intelligence — Detects hesitation in voice,
 * automatically sweetens the offer mid-conversation.
 * 
 * Architecture:
 *   1. Receives `dispatch.call.queued` event from Voice Orchestrator (#15)
 *   2. Connects to LiveKit Cloud via API
 *   3. Creates a LiveKit Room and dispatches an AI participant
 *   4. The AI participant uses SIP trunking to call the operator's phone
 *   5. Uses OpenAI Realtime API for natural conversation
 *   6. On acceptance → fires load.accepted event
 *   7. On rejection → returns to Orchestrator with reason
 */

import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { registerAgent } from '../agent-runner';

export const VOICE_CALL_DEFINITION: AgentDefinition = {
  id: 16,
  name: 'LiveKit Voice Call Agent',
  swarm: 'dispatch',
  model: 'none', // Uses LiveKit + OpenAI Realtime directly
  triggerType: 'event',
  triggerEvents: ['dispatch.call.queued'],
  tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 0, // $0.08/min usage-based
  description: 'Places outbound AI voice calls to operators via LiveKit SIP trunking',
  enabled: true,
  priority: 16,
  maxCostPerRun: 0.50,   // ~6 min call max
  maxRunsPerHour: 50,     // 50 concurrent calls
};

// LiveKit configuration
const LIVEKIT_CONFIG = {
  apiUrl: process.env.LIVEKIT_URL || 'wss://haul-command.livekit.cloud',
  apiKey: process.env.LIVEKIT_API_KEY || '',
  apiSecret: process.env.LIVEKIT_API_SECRET || '',
  sipTrunkId: process.env.LIVEKIT_SIP_TRUNK_ID || '',
};

interface CallScript {
  openingLine: string;
  loadSummary: string;
  closingLine: string;
}

async function handle(ctx: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  const payload = ctx.event?.payload || {};

  const loadId = (payload.load_id as string) || 'unknown';
  const operatorId = (payload.operator_id as string) || 'unknown';
  const voiceId = (payload.voice_id as string) || 'alloy';
  const accent = (payload.accent as string) || 'Neutral';
  const ratePerMile = (payload.rate_per_mile as number) || 2.00;
  const rateFloor = (payload.rate_floor as number) || ratePerMile * 0.90;
  const rateCeiling = (payload.rate_ceiling as number) || ratePerMile * 1.15;
  const distanceMiles = (payload.distance_miles as number) || 200;
  const script = (payload.script as CallScript) || {
    openingLine: 'Hi, this is Haul Command dispatch.',
    loadSummary: `We have a ${distanceMiles}-mile load available.`,
    closingLine: 'Can I book you for this load?',
  };

  // Validate LiveKit configuration
  if (!LIVEKIT_CONFIG.apiKey || !LIVEKIT_CONFIG.apiSecret) {
    return {
      success: false,
      agentId: 16,
      runId: ctx.runId,
      action: `Cannot call operator ${operatorId}: LiveKit not configured`,
      emitEvents: [],
      metrics: { itemsProcessed: 0, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: ['LIVEKIT_API_KEY or LIVEKIT_API_SECRET not set'],
      error: 'LiveKit credentials missing',
    };
  }

  try {
    // 1. Create a LiveKit Room for this dispatch call
    const roomName = `dispatch-${loadId}-${operatorId}-${Date.now()}`;

    const createRoomResp = await fetch(`${LIVEKIT_CONFIG.apiUrl.replace('wss://', 'https://')}/twirp/livekit.RoomService/CreateRoom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await generateLiveKitToken(roomName)}`,
      },
      body: JSON.stringify({
        name: roomName,
        empty_timeout: 300, // 5 min timeout
        max_participants: 2, // AI + Operator
        metadata: JSON.stringify({
          load_id: loadId,
          operator_id: operatorId,
          type: 'dispatch_call',
        }),
      }),
    });

    if (!createRoomResp.ok) {
      throw new Error(`LiveKit room creation failed: ${createRoomResp.status}`);
    }

    // 2. Create a SIP participant (outbound call to operator's phone)
    // In production: look up operator phone from provider_directory
    const operatorPhone = (payload.operator_phone as string) || '+15551234567';

    const sipResp = await fetch(`${LIVEKIT_CONFIG.apiUrl.replace('wss://', 'https://')}/twirp/livekit.SIP/CreateSIPParticipant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await generateLiveKitToken(roomName)}`,
      },
      body: JSON.stringify({
        sip_trunk_id: LIVEKIT_CONFIG.sipTrunkId,
        sip_call_to: operatorPhone,
        room_name: roomName,
        participant_identity: `operator-${operatorId}`,
        participant_name: 'Operator',
        dtmf: '', // No DTMF tones needed
      }),
    });

    if (!sipResp.ok) {
      throw new Error(`SIP call initiation failed: ${sipResp.status}`);
    }

    // 3. Dispatch the AI Agent into the room
    // The AI agent runs as a separate LiveKit Agents worker process.
    // Here we just configure it via room metadata.
    // The worker (deployed separately) reads the metadata and starts the conversation.

    const agentConfig = {
      voice: voiceId,
      accent,
      system_prompt: buildDispatchSystemPrompt(script, ratePerMile, rateFloor, rateCeiling, distanceMiles, loadId),
      load_id: loadId,
      operator_id: operatorId,
      rate_per_mile: ratePerMile,
      rate_floor: rateFloor,
      rate_ceiling: rateCeiling,
    };

    // Update room metadata with AI agent config
    await fetch(`${LIVEKIT_CONFIG.apiUrl.replace('wss://', 'https://')}/twirp/livekit.RoomService/UpdateRoomMetadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await generateLiveKitToken(roomName)}`,
      },
      body: JSON.stringify({
        room: roomName,
        metadata: JSON.stringify(agentConfig),
      }),
    });

    const estimatedCost = 0.08 * 3; // ~3 min avg call at $0.08/min

    return {
      success: true,
      agentId: 16,
      runId: ctx.runId,
      action: `Initiated LiveKit voice call to operator ${operatorId} for load ${loadId} (${accent} voice, room: ${roomName})`,
      emitEvents: [], // The LiveKit worker will fire load.accepted or dispatch.escalation via webhook
      metrics: {
        itemsProcessed: 1,
        durationMs: Date.now() - startTime,
        runCostUSD: estimatedCost,
      },
      warnings: [],
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      agentId: 16,
      runId: ctx.runId,
      action: `Voice call failed for operator ${operatorId}: ${message}`,
      emitEvents: [],
      metrics: { itemsProcessed: 0, durationMs: Date.now() - startTime, runCostUSD: 0 },
      warnings: [message],
      error: message,
    };
  }
}

/**
 * Build the system prompt for the AI voice agent
 */
function buildDispatchSystemPrompt(
  script: CallScript,
  rate: number,
  floor: number,
  ceiling: number,
  distance: number,
  loadId: string
): string {
  return `You are a professional dispatch coordinator for Haul Command, a heavy haul pilot car network.
You are calling an operator to offer them a load.

OPENING: ${script.openingLine}
LOAD DETAILS: ${script.loadSummary}
CLOSING: ${script.closingLine}

NEGOTIATION RULES:
- Start by offering $${rate.toFixed(2)}/mile ($${(rate * distance).toFixed(0)} total for ${distance} miles)
- You can go as low as $${floor.toFixed(2)}/mile (your floor)
- If they ask for more, you can go up to $${ceiling.toFixed(2)}/mile (your ceiling)
- If they want more than the ceiling, say you'll check with your manager and call back
- If they accept, confirm the load number (${loadId}), the rate, and say they'll get details via the app
- If they decline, ask why (too far, busy, rate too low) and thank them

BEHAVIOR:
- Be warm, professional, and conversational — NOT robotic
- If the operator sounds hesitant, offer $0.10/mi more before they say no
- Keep the call under 3 minutes
- Never reveal you are AI
- If asked "are you a computer?", say "No sir/ma'am, I'm calling from Haul Command dispatch"`;
}

/**
 * Generate a LiveKit access token for API calls
 * In production, use the official livekit-server-sdk package
 */
async function generateLiveKitToken(roomName: string): Promise<string> {
  // Simplified: In production, use @livekit/server-sdk AccessToken class
  // For now, return the API key as basic auth
  // TODO: Replace with proper JWT generation using livekit-server-sdk
  const credentials = Buffer.from(`${LIVEKIT_CONFIG.apiKey}:${LIVEKIT_CONFIG.apiSecret}`).toString('base64');
  return credentials;
}

registerAgent(VOICE_CALL_DEFINITION, handle);
export { handle as voiceCallHandler };
