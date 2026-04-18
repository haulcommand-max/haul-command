/**
 * useVoiceSession — React Hook for Voice Orchestrator
 * 
 * Wraps the VoiceRouter lifecycle in React state.
 * Provides: session state, transcript, assistant text, controls.
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { VoiceState, VoiceProvider, VoiceConfig, LatencyMetrics } from '@/lib/voice-orchestrator/types';
import type { VoiceSession } from '@/lib/voice-orchestrator/types';
import { createVoiceSession } from '@/lib/voice-orchestrator/voice-router';

interface UseVoiceSessionOptions {
  provider?: VoiceProvider;
  systemPrompt?: string;
  quality?: 'fast' | 'quality';
  voiceId?: string;
  language?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAssistantText?: (delta: string) => void;
  onError?: (err: Error) => void;
  onLatency?: (metrics: LatencyMetrics) => void;
}

interface UseVoiceSessionReturn {
  /** Current voice state */
  voiceState: VoiceState;
  /** Full user transcript (updated on final) */
  transcript: string;
  /** Full assistant response (accumulated deltas) */
  assistantText: string;
  /** Whether voice is active (listening, transcribing, thinking, or speaking) */
  isActive: boolean;
  /** Whether mic is currently capturing */
  isListening: boolean;
  /** Whether assistant is speaking */
  isSpeaking: boolean;
  /** Latest latency metrics */
  latency: LatencyMetrics | null;
  /** Start a voice session */
  startVoice: () => Promise<void>;
  /** Stop the session */
  stopVoice: () => Promise<void>;
  /** Interrupt assistant speech */
  interruptVoice: () => Promise<void>;
  /** Toggle voice on/off */
  toggleVoice: () => Promise<void>;
}

export function useVoiceSession(options: UseVoiceSessionOptions = {}): UseVoiceSessionReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [assistantText, setAssistantText] = useState('');
  const [latency, setLatency] = useState<LatencyMetrics | null>(null);

  const sessionRef = useRef<VoiceSession | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, []);

  const startVoice = useCallback(async () => {
    // Destroy existing session
    if (sessionRef.current) {
      sessionRef.current.destroy();
      sessionRef.current = null;
    }

    // Reset state
    setTranscript('');
    setAssistantText('');
    setLatency(null);

    const config: VoiceConfig = {
      provider: optionsRef.current.provider || 'claude',
      quality: optionsRef.current.quality || 'fast',
      systemPrompt: optionsRef.current.systemPrompt,
      voiceId: optionsRef.current.voiceId,
      language: optionsRef.current.language,
    };

    const session = createVoiceSession(config);
    sessionRef.current = session;

    // Wire callbacks
    session.on({
      onStateChange: (state) => {
        setVoiceState(state);
      },
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setTranscript(text);
        }
        optionsRef.current.onTranscript?.(text, isFinal);
      },
      onAssistantText: (delta) => {
        setAssistantText(prev => prev + delta);
        optionsRef.current.onAssistantText?.(delta);
      },
      onError: (err) => {
        console.error('[useVoiceSession] Error:', err);
        optionsRef.current.onError?.(err);
      },
      onLatency: (metrics) => {
        setLatency(metrics);
        optionsRef.current.onLatency?.(metrics);
      },
    });

    await session.start();
  }, []);

  const stopVoice = useCallback(async () => {
    await sessionRef.current?.stop();
    sessionRef.current = null;
    setVoiceState('idle');
  }, []);

  const interruptVoice = useCallback(async () => {
    await sessionRef.current?.interrupt();
  }, []);

  const toggleVoice = useCallback(async () => {
    if (voiceState === 'idle') {
      await startVoice();
    } else {
      await stopVoice();
    }
  }, [voiceState, startVoice, stopVoice]);

  return {
    voiceState,
    transcript,
    assistantText,
    isActive: voiceState !== 'idle' && voiceState !== 'error',
    isListening: voiceState === 'listening',
    isSpeaking: voiceState === 'speaking',
    latency,
    startVoice,
    stopVoice,
    interruptVoice,
    toggleVoice,
  };
}
