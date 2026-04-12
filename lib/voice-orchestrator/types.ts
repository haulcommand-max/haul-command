/**
 * VOICE ORCHESTRATOR — Type Definitions & Provider Capability Map
 * 
 * Provider-agnostic voice layer that sits in front of any model.
 * Routes mic input to the correct voice path per provider:
 *   - native-realtime: Gemini Live / OpenAI Realtime (low latency, barge-in)
 *   - stt-llm-tts: Claude and any text-only provider (wrapper path)
 */

// ── Provider & Mode ────────────────────────────────────────────

export type VoiceProvider = 'gemini' | 'claude' | 'openai';

export type VoiceMode =
  | 'native-realtime'   // Gemini Live / OpenAI Realtime — full duplex audio
  | 'stt-llm-tts';      // Speech-to-text → LLM → Text-to-speech wrapper

// ── Voice State Machine ────────────────────────────────────────

export type VoiceState =
  | 'idle'           // No active session
  | 'listening'      // Mic open, capturing audio
  | 'transcribing'   // Converting speech to text (wrapper path only)
  | 'thinking'       // Model is generating response
  | 'speaking'       // Playing back assistant audio
  | 'error';         // Something went wrong

// ── Latency Metrics ────────────────────────────────────────────

export interface LatencyMetrics {
  /** Time to get mic permission (first use only) */
  micPermissionMs?: number;
  /** STT → transcript ready (wrapper path) */
  transcriptLatencyMs?: number;
  /** Transcript/audio sent → first model token */
  firstTokenMs?: number;
  /** First model token → first audible TTS output */
  ttsFirstAudioMs?: number;
  /** Full roundtrip: end of speech → first assistant audio */
  totalRoundtripMs?: number;
  /** Duration of user speech */
  userSpeechDurationMs?: number;
  /** Duration of assistant speech */
  assistantSpeechDurationMs?: number;
}

// ── Provider Capability Map ────────────────────────────────────

export interface VoiceCapability {
  mode: VoiceMode;
  /** True barge-in: user can interrupt mid-response and model hears it */
  supportsBargeIn: boolean;
  /** Streams audio/text incrementally vs batch response */
  supportsStreaming: boolean;
  /** Expected latency budget per stage (ms) */
  expectedLatencyMs: {
    stt: number;    // 0 for native (no separate STT step)
    firstToken: number;
    tts: number;    // 0 for native (no separate TTS step)
  };
  /** Fastest model for voice (low latency > quality) */
  voiceModel: string;
  /** Medium model if user wants better quality */
  qualityModel: string;
}

export const PROVIDER_VOICE_CAPABILITY: Record<VoiceProvider, VoiceCapability> = {
  gemini: {
    mode: 'native-realtime',
    supportsBargeIn: true,
    supportsStreaming: true,
    expectedLatencyMs: { stt: 0, firstToken: 200, tts: 0 },
    voiceModel: 'gemini-2.0-flash-lite',
    qualityModel: 'gemini-2.5-flash',
  },
  openai: {
    mode: 'native-realtime',
    supportsBargeIn: true,
    supportsStreaming: true,
    expectedLatencyMs: { stt: 0, firstToken: 250, tts: 0 },
    voiceModel: 'gpt-4o-mini-realtime-preview',
    qualityModel: 'gpt-4o-realtime-preview',
  },
  claude: {
    mode: 'stt-llm-tts',
    supportsBargeIn: false,
    supportsStreaming: true,
    expectedLatencyMs: { stt: 800, firstToken: 400, tts: 300 },
    voiceModel: 'claude-haiku-4-5',
    qualityModel: 'claude-sonnet-4-5',
  },
};

// ── Voice Session Interface ────────────────────────────────────

export interface VoiceSessionCallbacks {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAssistantText?: (textDelta: string) => void;
  onAssistantAudio?: (audio: ArrayBuffer) => void;
  onError?: (err: Error) => void;
  onLatency?: (metrics: LatencyMetrics) => void;
}

export interface VoiceSession {
  readonly provider: VoiceProvider;
  readonly mode: VoiceMode;
  state: VoiceState;

  /** Start the voice session (request mic, open connections) */
  start(): Promise<void>;

  /** Gracefully stop the session (close mic, flush buffers) */
  stop(): Promise<void>;

  /** Interrupt assistant speech (stop TTS/playback, optionally cancel generation) */
  interrupt(): Promise<void>;

  /** Send raw audio chunk — used by native realtime adapters */
  sendAudioChunk?(pcm16: ArrayBuffer): Promise<void>;

  /** Send transcribed text — used by wrapper adapters after STT */
  sendText?(text: string): Promise<void>;

  /** Register event callbacks */
  on(callbacks: VoiceSessionCallbacks): void;

  /** Clean up resources */
  destroy(): void;
}

// ── Voice Config ───────────────────────────────────────────────

export interface VoiceConfig {
  provider: VoiceProvider;
  /** Override auto-detected mode */
  forceMode?: VoiceMode;
  /** Use fastest or quality model */
  quality?: 'fast' | 'quality';
  /** System prompt for the voice session */
  systemPrompt?: string;
  /** Max response tokens */
  maxTokens?: number;
  /** Voice ID for TTS (provider-specific) */
  voiceId?: string;
  /** Language code (BCP-47) */
  language?: string;
}

// ── Audio Format ───────────────────────────────────────────────

export interface AudioFormat {
  sampleRate: number;
  channels: number;
  encoding: 'pcm16' | 'opus' | 'mp3';
}

export const DEFAULT_AUDIO_FORMAT: AudioFormat = {
  sampleRate: 16000,
  channels: 1,
  encoding: 'pcm16',
};

export const PLAYBACK_AUDIO_FORMAT: AudioFormat = {
  sampleRate: 24000,
  channels: 1,
  encoding: 'mp3',
};
