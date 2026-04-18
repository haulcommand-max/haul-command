/**
 * CLAUDE VOICE ADAPTER — STT → Claude Streaming → TTS
 * 
 * Since Claude has no native audio API, this adapter wraps:
 *   1. Browser mic → capture audio
 *   2. Client-side VAD → detect end of speech
 *   3. OpenAI Whisper → transcribe to text
 *   4. Claude Messages API → stream text response
 *   5. OpenAI Speech API → synthesize audio
 *   6. Browser → play audio
 * 
 * Implements the VoiceSession interface from types.ts.
 */

import type {
  VoiceSession,
  VoiceSessionCallbacks,
  VoiceState,
  VoiceProvider,
  VoiceMode,
} from '../types';
import { VoiceStateMachine } from '../state-machine';
import { VoiceLatencyLogger } from '../latency-logger';

// ── Configuration ──────────────────────────────────────────────

interface ClaudeVoiceConfig {
  /** System prompt for Claude */
  systemPrompt?: string;
  /** Model to use (default: claude-haiku-4-5 for speed) */
  model?: string;
  /** Max response tokens */
  maxTokens?: number;
  /** OpenAI TTS voice ID */
  ttsVoice?: string;
  /** TTS speed (0.25 - 4.0) */
  ttsSpeed?: number;
  /** Silence duration to detect end of speech (ms) */
  silenceThresholdMs?: number;
  /** Language for STT */
  language?: string;
}

const DEFAULTS: Required<ClaudeVoiceConfig> = {
  systemPrompt: 'You are the Haul Command AI assistant. Be concise and helpful. You are speaking, not writing — keep responses short and conversational.',
  model: 'claude-haiku-4-5',
  maxTokens: 1024,
  ttsVoice: 'alloy',
  ttsSpeed: 1.0,
  silenceThresholdMs: 800,
  language: 'en',
};

// ── Adapter ────────────────────────────────────────────────────

export class ClaudeVoiceAdapter implements VoiceSession {
  readonly provider: VoiceProvider = 'claude';
  readonly mode: VoiceMode = 'stt-llm-tts';

  private _config: Required<ClaudeVoiceConfig>;
  private _sm: VoiceStateMachine;
  private _logger: VoiceLatencyLogger;
  private _callbacks: VoiceSessionCallbacks = {};

  // Audio capture
  private _mediaStream: MediaStream | null = null;
  private _mediaRecorder: MediaRecorder | null = null;
  private _audioChunks: Blob[] = [];

  // Silence detection
  private _analyser: AnalyserNode | null = null;
  private _audioContext: AudioContext | null = null;
  private _silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private _silenceCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Playback
  private _audioQueue: ArrayBuffer[] = [];
  private _isPlaying = false;
  private _currentAudio: HTMLAudioElement | null = null;

  // Abort controllers for cancellation
  private _sttAbort: AbortController | null = null;
  private _chatAbort: AbortController | null = null;
  private _ttsAbort: AbortController | null = null;

  // Conversation history for multi-turn
  private _conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(config: ClaudeVoiceConfig = {}) {
    this._config = { ...DEFAULTS, ...config };
    this._sm = new VoiceStateMachine('stt-llm-tts');
    this._logger = new VoiceLatencyLogger('claude', (m) => this._callbacks.onLatency?.(m));

    this._sm.onChange((state) => {
      this._callbacks.onStateChange?.(state);
    });
  }

  get state(): VoiceState {
    return this._sm.state;
  }

  // ── VoiceSession Interface ─────────────────────────────────

  on(callbacks: VoiceSessionCallbacks): void {
    this._callbacks = { ...this._callbacks, ...callbacks };
  }

  async start(): Promise<void> {
    if (this._sm.state !== 'idle') {
      console.warn('[ClaudeVoice] Cannot start — not idle');
      return;
    }

    try {
      // Request mic permission
      this._logger.markMicRequest();
      this._audioContext = new AudioContext({ sampleRate: 16000 });
      this._mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      this._logger.markMicGranted();

      // Set up silence detection
      this._setupSilenceDetection();

      // Start recording
      this._startRecording();

      this._sm.transition('listening');
      this._logger.markSpeechStart();
    } catch (err) {
      this._sm.forceTransition('error');
      this._callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async stop(): Promise<void> {
    this._cleanup();
    this._sm.forceTransition('idle');
  }

  async interrupt(): Promise<void> {
    // Cancel any in-flight requests
    this._sttAbort?.abort();
    this._chatAbort?.abort();
    this._ttsAbort?.abort();

    // Stop audio playback
    if (this._currentAudio) {
      this._currentAudio.pause();
      this._currentAudio = null;
    }
    this._audioQueue = [];
    this._isPlaying = false;

    this._logger.markInterruption();
    this._sm.forceTransition('idle');
  }

  async sendText(text: string): Promise<void> {
    // Manual text input (e.g., if STT happens externally)
    await this._processTranscript(text);
  }

  destroy(): void {
    this._cleanup();
    this._sm.destroy();
    this._conversationHistory = [];
  }

  // ── Audio Capture ──────────────────────────────────────────

  private _startRecording(): void {
    if (!this._mediaStream) return;

    // Use webm/opus for compact recording
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this._audioChunks = [];
    this._mediaRecorder = new MediaRecorder(this._mediaStream, { mimeType });

    this._mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this._audioChunks.push(e.data);
      }
    };

    this._mediaRecorder.onstop = () => {
      // Audio captured — proceed to STT
      const audioBlob = new Blob(this._audioChunks, { type: mimeType });
      if (audioBlob.size > 0) {
        this._handleSpeechEnd(audioBlob);
      }
    };

    // Capture in 250ms chunks for responsiveness
    this._mediaRecorder.start(250);
  }

  // ── Silence Detection (Client-side VAD) ────────────────────

  private _setupSilenceDetection(): void {
    if (!this._audioContext || !this._mediaStream) return;

    const source = this._audioContext.createMediaStreamSource(this._mediaStream);
    this._analyser = this._audioContext.createAnalyser();
    this._analyser.fftSize = 2048;
    this._analyser.smoothingTimeConstant = 0.8;
    source.connect(this._analyser);

    const bufferLength = this._analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    let isSpeaking = false;

    // Check audio level every 100ms
    this._silenceCheckInterval = setInterval(() => {
      if (!this._analyser || this._sm.state !== 'listening') return;

      this._analyser.getFloatTimeDomainData(dataArray);

      // Calculate RMS amplitude
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = 20 * Math.log10(Math.max(rms, 1e-10));

      // Threshold: -40dB = speaking, below = silence
      const SPEECH_THRESHOLD = -40;

      if (db > SPEECH_THRESHOLD) {
        isSpeaking = true;
        // Clear any pending silence timer
        if (this._silenceTimer) {
          clearTimeout(this._silenceTimer);
          this._silenceTimer = null;
        }
      } else if (isSpeaking && !this._silenceTimer) {
        // Start silence timer
        this._silenceTimer = setTimeout(() => {
          // Silence detected — stop recording
          isSpeaking = false;
          this._logger.markSpeechEnd();

          if (this._mediaRecorder?.state === 'recording') {
            this._mediaRecorder.stop();
          }
        }, this._config.silenceThresholdMs);
      }
    }, 100);
  }

  // ── STT → Claude → TTS Pipeline ───────────────────────────

  private async _handleSpeechEnd(audioBlob: Blob): Promise<void> {
    if (!this._sm.transition('transcribing')) return;

    try {
      // Step 1: Transcribe
      const transcript = await this._transcribe(audioBlob);
      if (!transcript.trim()) {
        // Empty transcript — go back to listening
        this._resumeListening();
        return;
      }

      this._logger.markTranscriptReady();
      this._callbacks.onTranscript?.(transcript, true);

      // Step 2: Send to Claude
      await this._processTranscript(transcript);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this._sm.forceTransition('error');
      this._callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private async _transcribe(audioBlob: Blob): Promise<string> {
    this._sttAbort = new AbortController();

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('language', this._config.language);

    const res = await fetch('/api/ai/stt', {
      method: 'POST',
      body: formData,
      signal: this._sttAbort.signal,
    });

    if (!res.ok) throw new Error(`STT failed: ${res.status}`);

    const data = await res.json();
    return data.text || '';
  }

  private async _processTranscript(transcript: string): Promise<void> {
    if (!this._sm.transition('thinking')) return;

    // Add to conversation history
    this._conversationHistory.push({ role: 'user', content: transcript });

    this._chatAbort = new AbortController();

    try {
      const res = await fetch('/api/ai/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this._conversationHistory,
          model: this._config.model,
          systemPrompt: this._config.systemPrompt,
          maxTokens: this._config.maxTokens,
        }),
        signal: this._chatAbort.signal,
      });

      if (!res.ok) throw new Error(`Voice chat failed: ${res.status}`);
      if (!res.body) throw new Error('No response body');

      // Stream response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let sentenceBuffer = '';
      let firstToken = true;
      let ttsPromises: Promise<void>[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.delta || parsed.text || '';

            if (delta) {
              if (firstToken) {
                this._logger.markFirstToken();
                firstToken = false;
              }

              fullResponse += delta;
              sentenceBuffer += delta;
              this._callbacks.onAssistantText?.(delta);

              // Chunk into sentences for TTS
              const sentenceEnd = sentenceBuffer.match(/[.!?]\s/);
              if (sentenceEnd && sentenceBuffer.length > 20) {
                const sentence = sentenceBuffer.slice(0, sentenceEnd.index! + 1);
                sentenceBuffer = sentenceBuffer.slice(sentenceEnd.index! + 2);
                ttsPromises.push(this._synthesizeAndQueue(sentence));
              }
            }
          } catch { /* skip non-JSON lines */ }
        }
      }

      // Synthesize remaining text
      if (sentenceBuffer.trim()) {
        ttsPromises.push(this._synthesizeAndQueue(sentenceBuffer.trim()));
      }

      // Store assistant response in history
      this._conversationHistory.push({ role: 'assistant', content: fullResponse });

      // Wait for all TTS to complete
      await Promise.all(ttsPromises);

      // Play queued audio
      await this._playQueue();

    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      throw err;
    }
  }

  // ── TTS ────────────────────────────────────────────────────

  private async _synthesizeAndQueue(text: string): Promise<void> {
    this._ttsAbort = new AbortController();

    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: this._config.ttsVoice,
          speed: this._config.ttsSpeed,
        }),
        signal: this._ttsAbort.signal,
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const audio = await res.arrayBuffer();
      this._audioQueue.push(audio);
      this._callbacks.onAssistantAudio?.(audio);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      console.error('[ClaudeVoice] TTS error:', err);
    }
  }

  private async _playQueue(): Promise<void> {
    if (this._audioQueue.length === 0) {
      this._resumeListening();
      return;
    }

    this._sm.transition('speaking');
    this._isPlaying = true;

    let firstChunk = true;

    for (const buffer of this._audioQueue) {
      if (!this._isPlaying) break;

      if (firstChunk) {
        this._logger.markTtsFirstAudio();
        firstChunk = false;
      }

      await this._playAudioBuffer(buffer);
    }

    this._audioQueue = [];
    this._isPlaying = false;
    this._logger.markAssistantSpeechEnd();
    this._logger.emit();

    // Return to idle (user can start a new turn)
    this._sm.transition('idle');
  }

  private _playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve) => {
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this._currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        this._currentAudio = null;
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        this._currentAudio = null;
        resolve();
      };

      audio.play().catch(() => resolve());
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  private _resumeListening(): void {
    // Restart recording for next turn
    if (this._mediaStream && this._sm.state !== 'idle') {
      this._sm.forceTransition('idle');
    } else {
      this._sm.transition('idle');
    }
  }

  private _cleanup(): void {
    // Stop silence detection
    if (this._silenceCheckInterval) {
      clearInterval(this._silenceCheckInterval);
      this._silenceCheckInterval = null;
    }
    if (this._silenceTimer) {
      clearTimeout(this._silenceTimer);
      this._silenceTimer = null;
    }

    // Stop recording
    if (this._mediaRecorder?.state === 'recording') {
      this._mediaRecorder.stop();
    }
    this._mediaRecorder = null;

    // Stop mic
    this._mediaStream?.getTracks().forEach(t => t.stop());
    this._mediaStream = null;

    // Close audio context
    this._audioContext?.close().catch(() => {});
    this._audioContext = null;
    this._analyser = null;

    // Abort requests
    this._sttAbort?.abort();
    this._chatAbort?.abort();
    this._ttsAbort?.abort();

    // Stop playback
    this._currentAudio?.pause();
    this._currentAudio = null;
    this._audioQueue = [];
    this._isPlaying = false;
  }
}
