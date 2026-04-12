/**
 * VoiceMicButton — Provider-agnostic mic button
 * 
 * One button that works with Gemini, Claude, and OpenAI.
 * Displays voice state with animated ring + provider indicator.
 * 
 * States:
 *   idle        → mic icon, ready to press
 *   listening   → pulsing ring, recording
 *   transcribing → dotted ring, processing speech
 *   thinking    → spinning ring, waiting for model
 *   speaking    → wave animation, assistant talking
 *   error       → red ring, error state
 */
'use client';

import React, { useMemo } from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from 'lucide-react';
import type { VoiceState, VoiceProvider } from '@/lib/voice-orchestrator/types';
import { PROVIDER_VOICE_CAPABILITY } from '@/lib/voice-orchestrator/types';

interface VoiceMicButtonProps {
  /** Current voice state */
  state: VoiceState;
  /** Active provider */
  provider?: VoiceProvider;
  /** Toggle voice on/off */
  onToggle: () => void;
  /** Interrupt assistant */
  onInterrupt?: () => void;
  /** Button size in px */
  size?: number;
  /** Show provider badge */
  showProvider?: boolean;
  /** Disable the button */
  disabled?: boolean;
}

const STATE_COLORS: Record<VoiceState, { ring: string; bg: string; icon: string }> = {
  idle:         { ring: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.12)', icon: '#a78bfa' },
  listening:    { ring: 'rgba(52,211,153,0.6)',   bg: 'rgba(52,211,153,0.15)', icon: '#34d399' },
  transcribing: { ring: 'rgba(251,191,36,0.5)',   bg: 'rgba(251,191,36,0.12)', icon: '#fbbf24' },
  thinking:     { ring: 'rgba(96,165,250,0.5)',   bg: 'rgba(96,165,250,0.12)', icon: '#60a5fa' },
  speaking:     { ring: 'rgba(167,139,250,0.6)',   bg: 'rgba(167,139,250,0.15)', icon: '#a78bfa' },
  error:        { ring: 'rgba(248,113,113,0.5)',   bg: 'rgba(248,113,113,0.12)', icon: '#f87171' },
};

const PROVIDER_LABELS: Record<VoiceProvider, { label: string; color: string }> = {
  gemini: { label: 'Gemini', color: '#4285F4' },
  claude: { label: 'Claude', color: '#D97706' },
  openai: { label: 'GPT', color: '#10A37F' },
};

export function VoiceMicButton({
  state,
  provider = 'claude',
  onToggle,
  onInterrupt,
  size = 40,
  showProvider = false,
  disabled = false,
}: VoiceMicButtonProps) {
  const colors = STATE_COLORS[state];
  const capability = PROVIDER_VOICE_CAPABILITY[provider];
  const providerInfo = PROVIDER_LABELS[provider];

  const isActive = state !== 'idle' && state !== 'error';
  const isSpeaking = state === 'speaking';

  const handleClick = () => {
    if (disabled) return;
    if (isSpeaking && onInterrupt) {
      onInterrupt();
    } else {
      onToggle();
    }
  };

  const icon = useMemo(() => {
    switch (state) {
      case 'idle':
        return <Mic size={size * 0.45} />;
      case 'listening':
        return <Mic size={size * 0.45} />;
      case 'transcribing':
        return <Loader2 size={size * 0.45} className="animate-spin" />;
      case 'thinking':
        return <Loader2 size={size * 0.45} className="animate-spin" />;
      case 'speaking':
        return <Volume2 size={size * 0.45} />;
      case 'error':
        return <AlertCircle size={size * 0.45} />;
      default:
        return <Mic size={size * 0.45} />;
    }
  }, [state, size]);

  const title = useMemo(() => {
    switch (state) {
      case 'idle': return `Start voice (${providerInfo.label})`;
      case 'listening': return 'Listening... speak now';
      case 'transcribing': return 'Transcribing speech...';
      case 'thinking': return `${providerInfo.label} is thinking...`;
      case 'speaking': return 'Click to interrupt';
      case 'error': return 'Voice error — click to retry';
      default: return 'Voice';
    }
  }, [state, providerInfo.label]);

  // Pulse animation for listening state
  const pulseStyle = state === 'listening' ? {
    animation: 'voice-pulse 1.5s ease-in-out infinite',
  } : {};

  return (
    <>
      {/* Inject keyframes */}
      <style>{`
        @keyframes voice-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${colors.ring}; }
          50% { box-shadow: 0 0 0 ${size * 0.25}px transparent; }
        }
        @keyframes voice-wave {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>

      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {/* Outer ring */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '50%',
              border: `2px solid ${colors.ring}`,
              ...pulseStyle,
              ...(isSpeaking ? { animation: 'voice-wave 0.6s ease-in-out infinite' } : {}),
            }}
          />
        )}

        {/* Button */}
        <button
          aria-label={title}
          title={title}
          onClick={handleClick}
          disabled={disabled}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid ${colors.ring}`,
            background: colors.bg,
            color: colors.icon,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: disabled ? 0.5 : 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {icon}
        </button>

        {/* Provider badge */}
        {showProvider && (
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              fontSize: 7,
              fontWeight: 800,
              color: providerInfo.color,
              background: 'rgba(15,26,38,0.9)',
              padding: '1px 4px',
              borderRadius: 4,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              border: `1px solid ${providerInfo.color}40`,
              zIndex: 2,
            }}
          >
            {capability.mode === 'native-realtime' ? '⚡' : '🔄'} {providerInfo.label}
          </div>
        )}
      </div>
    </>
  );
}

export default VoiceMicButton;
