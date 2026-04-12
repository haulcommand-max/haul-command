/**
 * VOICE ORCHESTRATOR — Voice Router
 * 
 * Routes mic input to the correct adapter based on the active model provider.
 * Factory function that returns the appropriate VoiceSession implementation.
 */

import type { VoiceSession, VoiceConfig, VoiceProvider } from './types';
import { ClaudeVoiceAdapter } from './adapters/claude-voice';

// ── Factory ────────────────────────────────────────────────────

/**
 * Create a voice session for the given provider.
 * 
 * Usage:
 *   const session = createVoiceSession({ provider: 'claude' });
 *   session.on({ onTranscript: (text) => console.log(text) });
 *   await session.start();
 */
export function createVoiceSession(config: VoiceConfig): VoiceSession {
  const { provider } = config;

  switch (provider) {
    case 'claude':
      return new ClaudeVoiceAdapter({
        systemPrompt: config.systemPrompt,
        model: config.quality === 'quality' ? 'claude-sonnet-4-5' : 'claude-haiku-4-5',
        maxTokens: config.maxTokens,
        ttsVoice: config.voiceId || 'alloy',
        language: config.language,
      });

    case 'gemini':
      // Phase 3: GeminiLiveAdapter
      // For now, fall back to Claude wrapper with Gemini as backend
      console.warn('[VoiceRouter] Gemini native voice not yet implemented — using Claude wrapper');
      return new ClaudeVoiceAdapter({
        systemPrompt: config.systemPrompt,
        model: 'claude-haiku-4-5', // Fallback
        maxTokens: config.maxTokens,
        ttsVoice: config.voiceId || 'alloy',
        language: config.language,
      });

    case 'openai':
      // Phase 4: OpenAIRealtimeAdapter
      // For now, fall back to Claude wrapper
      console.warn('[VoiceRouter] OpenAI native voice not yet implemented — using Claude wrapper');
      return new ClaudeVoiceAdapter({
        systemPrompt: config.systemPrompt,
        model: 'claude-haiku-4-5', // Fallback
        maxTokens: config.maxTokens,
        ttsVoice: config.voiceId || 'alloy',
        language: config.language,
      });

    default:
      throw new Error(`Unknown voice provider: ${provider}`);
  }
}

/**
 * Check if a provider supports native voice (no STT/TTS wrapper needed).
 */
export function isNativeVoiceProvider(provider: VoiceProvider): boolean {
  return provider === 'gemini' || provider === 'openai';
}

/**
 * Get the recommended voice model for a provider.
 */
export function getVoiceModel(provider: VoiceProvider, quality: 'fast' | 'quality' = 'fast'): string {
  const models: Record<VoiceProvider, { fast: string; quality: string }> = {
    gemini: { fast: 'gemini-2.0-flash-lite', quality: 'gemini-2.5-flash' },
    openai: { fast: 'gpt-4o-mini-realtime-preview', quality: 'gpt-4o-realtime-preview' },
    claude: { fast: 'claude-haiku-4-5', quality: 'claude-sonnet-4-5' },
  };
  return models[provider][quality];
}
