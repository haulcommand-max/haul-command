// ══════════════════════════════════════════════════════════════
// LIVEKIT AGENT DISPATCHER
// Replaces VAPI pipeline.ts with LiveKit Agents framework
// STT (Deepgram) → LLM (Gemini/Claude) → TTS (ElevenLabs)
// ══════════════════════════════════════════════════════════════

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

export interface AgentConfig {
  persona: string;
  script: string;
  countryCode: string;
  language: string;
  sttEngine: 'deepgram' | 'whisper';
  llmEngine: 'gemini-2.5-pro' | 'claude-3.5-sonnet';
  ttsEngine: 'elevenlabs';
  voiceId: string;
  tools: string[];
}

// Voice ID mapping by language
export const VOICE_MAP: Record<string, string> = {
  en: 'pNInz6obpgDQGcFmaJgB', // ElevenLabs Adam
  es: 'onwK4e9ZLuTAKqWW03F9', // Spanish male
  pt: 'pqHfZKP75CvOlQylNhV4', // Portuguese male
  de: 'SAz9YHcvj6GT2YYXdXww', // German male
  fr: 'CwhRBWXzGAHq8TQ4Fs17', // French male
  ar: 'g5CIjZEefAph4nQFvHAz', // Arabic male
  ja: 'bVMeCyTHy58xNoL34h3p', // Japanese male
  ko: 'AZnzlk1XvdvUeBnXmlld', // Korean male
  it: 'VR6AewLTigWG4xSOukaG', // Italian male
  nl: 'pFZP5JQG7iQjIQuC4Bku', // Dutch male
  sv: 'TX3LPaxmHKxFdv7VOQHJ', // Swedish male
};

// STT engine selection by language (Deepgram for well-supported, Whisper for others)
export function selectSTT(language: string): 'deepgram' | 'whisper' {
  const deepgramSupported = ['en', 'es', 'pt', 'de', 'fr', 'it', 'nl', 'ja', 'ko', 'hi'];
  return deepgramSupported.includes(language) ? 'deepgram' : 'whisper';
}

// LLM selection: data-heavy calls use Gemini, EQ-heavy use Claude
export function selectLLM(persona: string): 'gemini-2.5-pro' | 'claude-3.5-sonnet' {
  const eqHeavyPersonas = ['operator_claim_assist', 'place_claim_assist'];
  return eqHeavyPersonas.includes(persona) ? 'claude-3.5-sonnet' : 'gemini-2.5-pro';
}

// Generate a LiveKit room token for the agent
export async function generateAgentToken(roomName: string, agentIdentity: string): Promise<string> {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: agentIdentity,
    ttl: '10m',
  });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  return await token.toJwt();
}

// Create a room for an outbound call
export async function createCallRoom(entityId: string, agentConfig: AgentConfig): Promise<string> {
  const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  const roomName = `hc-call-${entityId}-${Date.now()}`;

  await roomService.createRoom({
    name: roomName,
    emptyTimeout: 300, // 5 min timeout
    maxParticipants: 3, // agent + callee + monitor
    metadata: JSON.stringify({
      entityId,
      persona: agentConfig.persona,
      countryCode: agentConfig.countryCode,
      language: agentConfig.language,
      createdAt: new Date().toISOString(),
    }),
  });

  return roomName;
}

// Build the full agent config from persona and country
export function buildAgentConfig(persona: string, countryCode: string, language: string): AgentConfig {
  return {
    persona,
    script: `skills/livekit/scripts/${persona.replace('_assist', '_outbound')}.md`,
    countryCode,
    language,
    sttEngine: selectSTT(language),
    llmEngine: selectLLM(persona),
    ttsEngine: 'elevenlabs',
    voiceId: VOICE_MAP[language] || VOICE_MAP['en'],
    tools: ['claim_intake', 'compliance_check', 'send_claim_link'],
  };
}
