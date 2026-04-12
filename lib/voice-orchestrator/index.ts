/**
 * VOICE ORCHESTRATOR — Barrel Export
 * 
 * Provider-agnostic voice layer for Haul Command.
 * One mic button → any model.
 */

// Types & capabilities
export type {
  VoiceProvider,
  VoiceMode,
  VoiceState,
  VoiceSession,
  VoiceSessionCallbacks,
  VoiceConfig,
  VoiceCapability,
  LatencyMetrics,
  AudioFormat,
} from './types';

export {
  PROVIDER_VOICE_CAPABILITY,
  DEFAULT_AUDIO_FORMAT,
  PLAYBACK_AUDIO_FORMAT,
} from './types';

// State machine
export { VoiceStateMachine } from './state-machine';

// Latency logger
export { VoiceLatencyLogger } from './latency-logger';

// Router (factory)
export {
  createVoiceSession,
  isNativeVoiceProvider,
  getVoiceModel,
} from './voice-router';

// Adapters
export { ClaudeVoiceAdapter } from './adapters/claude-voice';
