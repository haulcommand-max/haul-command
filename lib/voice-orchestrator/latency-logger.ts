/**
 * VOICE ORCHESTRATOR — Latency Logger
 * 
 * Tracks timing across the voice pipeline:
 *   mic permission → STT → first token → TTS → total roundtrip
 * 
 * Exports metrics for observability dashboard and session callbacks.
 */

import type { LatencyMetrics, VoiceProvider } from './types';

export class VoiceLatencyLogger {
  private _provider: VoiceProvider;
  private _sessionId: string;
  private _marks: Map<string, number> = new Map();
  private _metrics: LatencyMetrics = {};
  private _onMetrics?: (metrics: LatencyMetrics) => void;

  constructor(provider: VoiceProvider, onMetrics?: (metrics: LatencyMetrics) => void) {
    this._provider = provider;
    this._sessionId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this._onMetrics = onMetrics;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get metrics(): LatencyMetrics {
    return { ...this._metrics };
  }

  // ── Mark timing points ─────────────────────────────────────

  /** Mark when mic permission is requested */
  markMicRequest(): void {
    this._marks.set('mic_request', performance.now());
  }

  /** Mark when mic permission is granted */
  markMicGranted(): void {
    const request = this._marks.get('mic_request');
    if (request) {
      this._metrics.micPermissionMs = Math.round(performance.now() - request);
      this._log('mic_permission', this._metrics.micPermissionMs);
    }
  }

  /** Mark when user starts speaking */
  markSpeechStart(): void {
    this._marks.set('speech_start', performance.now());
  }

  /** Mark when user stops speaking (end of utterance) */
  markSpeechEnd(): void {
    const start = this._marks.get('speech_start');
    if (start) {
      this._metrics.userSpeechDurationMs = Math.round(performance.now() - start);
    }
    this._marks.set('speech_end', performance.now());
  }

  /** Mark when STT transcript is received */
  markTranscriptReady(): void {
    const speechEnd = this._marks.get('speech_end');
    if (speechEnd) {
      this._metrics.transcriptLatencyMs = Math.round(performance.now() - speechEnd);
      this._log('transcript_latency', this._metrics.transcriptLatencyMs);
    }
    this._marks.set('transcript_ready', performance.now());
  }

  /** Mark when first model token arrives */
  markFirstToken(): void {
    const anchor = this._marks.get('transcript_ready') || this._marks.get('speech_end');
    if (anchor) {
      this._metrics.firstTokenMs = Math.round(performance.now() - anchor);
      this._log('first_token', this._metrics.firstTokenMs);
    }
    this._marks.set('first_token', performance.now());
  }

  /** Mark when first TTS audio is playable */
  markTtsFirstAudio(): void {
    const firstToken = this._marks.get('first_token');
    if (firstToken) {
      this._metrics.ttsFirstAudioMs = Math.round(performance.now() - firstToken);
      this._log('tts_first_audio', this._metrics.ttsFirstAudioMs);
    }

    // Total roundtrip: end of speech → first assistant audio
    const speechEnd = this._marks.get('speech_end');
    if (speechEnd) {
      this._metrics.totalRoundtripMs = Math.round(performance.now() - speechEnd);
      this._log('total_roundtrip', this._metrics.totalRoundtripMs);
    }
  }

  /** Mark when assistant finishes speaking */
  markAssistantSpeechEnd(): void {
    const ttsStart = this._marks.get('first_token');
    if (ttsStart) {
      this._metrics.assistantSpeechDurationMs = Math.round(performance.now() - ttsStart);
    }
  }

  /** Mark an interruption event */
  markInterruption(): void {
    this._log('interruption', 0);
  }

  // ── Emit & Reset ───────────────────────────────────────────

  /** Emit current metrics snapshot and reset for next turn */
  emit(): LatencyMetrics {
    const snapshot = { ...this._metrics };
    this._onMetrics?.(snapshot);

    // Log summary
    console.log(
      `[Voice Latency] provider=${this._provider} session=${this._sessionId}`,
      JSON.stringify(snapshot)
    );

    // Reset for next turn
    this._marks.clear();
    this._metrics = {};

    return snapshot;
  }

  // ── Internal ───────────────────────────────────────────────

  private _log(event: string, ms: number): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`voice:${event}:${this._sessionId}`);
    }
    console.debug(
      `[Voice] ${event}: ${ms}ms (provider=${this._provider}, session=${this._sessionId})`
    );
  }
}
