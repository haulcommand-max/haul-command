'use client';

import React, { useState, useCallback } from 'react';

/* ─── LiveKit Voice Panel ────────────────────────────────── */
/*
  This component mounts the LiveKit AI WebRTC agent for voice
  interaction on /voice/[country]/[query-slug] pages.

  States: idle → connecting → connected → error
  Fallback: Page works fully without voice connection.
*/

type VoiceState = 'idle' | 'connecting' | 'connected' | 'error';

interface LiveKitVoicePanelProps {
  country: string;
  query: string;
  className?: string;
}

export default function LiveKitVoicePanel({ country, query, className = '' }: LiveKitVoicePanelProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);

  const handleConnect = useCallback(async () => {
    setState('connecting');
    setErrorMsg(null);

    try {
      // In production, this would:
      // 1. Call /api/voice/token to get a LiveKit room token
      // 2. Initialize the LiveKit client and connect to the room
      // 3. Start audio streaming to the AI agent

      // For now, simulate the connection flow
      const response = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: country.toUpperCase(), query }),
      });

      if (!response.ok) {
        throw new Error('Voice service temporarily unavailable. Try text-based answers above.');
      }

      // If we get here, the token endpoint exists and responded
      setState('connected');
    } catch (err) {
      // Graceful fallback — page still works
      setState('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Voice connection failed. The text-based answer above is still available.'
      );
    }
  }, [country, query]);

  const handleDisconnect = useCallback(() => {
    setState('idle');
    setTranscript([]);
    setErrorMsg(null);
  }, []);

  return (
    <div className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎙️</span>
          <span className="text-white font-bold text-sm">Voice Assistant</span>
          {state === 'connected' && (
            <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-[9px] font-bold">LIVE</span>
            </span>
          )}
        </div>
        <span className="text-[9px] text-gray-600 font-mono">
          Powered by LiveKit AI
        </span>
      </div>

      {/* Panel Body */}
      <div className="p-5">
        {/* ── Idle State ── */}
        {state === 'idle' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(59,130,246,0.15)]">
              <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-base mb-1">Ask by Voice</h3>
            <p className="text-gray-500 text-xs mb-5 max-w-sm mx-auto">
              Click to connect with our AI voice agent. Ask any regulatory question
              about heavy haul operations in {country.toUpperCase()}.
            </p>
            <button
              onClick={handleConnect}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all ag-magnetic shadow-[0_0_20px_rgba(59,130,246,0.25)]"
            >
              🎙️ Start Voice Session
            </button>
            <p className="text-[10px] text-gray-600 mt-3">
              Requires microphone access · Works in Chrome, Edge, Safari
            </p>
          </div>
        )}

        {/* ── Connecting State ── */}
        {state === 'connecting' && (
          <div className="text-center py-8">
            {/* Pulsing rings animation */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-blue-500/20 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="absolute inset-0 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Connecting to AI Agent…</h3>
            <p className="text-gray-500 text-xs">Establishing secure voice channel</p>
          </div>
        )}

        {/* ── Connected State ── */}
        {state === 'connected' && (
          <div className="space-y-4">
            {/* Active call visualization */}
            <div className="flex items-center justify-center gap-1 py-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-400 rounded-full"
                  style={{
                    height: `${12 + Math.random() * 24}px`,
                    animation: `ag-slide-up-in 0.3s ease-out ${i * 50}ms forwards`,
                    opacity: 0.5 + Math.random() * 0.5,
                  }}
                />
              ))}
            </div>

            {/* Transcript */}
            {transcript.length > 0 && (
              <div className="bg-white/[0.02] rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar">
                {transcript.map((line, i) => (
                  <p key={i} className="text-gray-400 text-xs mb-1">{line}</p>
                ))}
              </div>
            )}

            <p className="text-center text-gray-500 text-xs">
              Speak your question. The AI agent will respond in real-time.
            </p>

            <div className="flex justify-center">
              <button
                onClick={handleDisconnect}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-2.5 rounded-xl font-bold text-xs transition-all"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {state === 'error' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📡</span>
            </div>
            <h3 className="text-white font-bold text-sm mb-1">Voice Unavailable</h3>
            <p className="text-gray-500 text-xs mb-4 max-w-sm mx-auto">
              {errorMsg || 'The voice service is temporarily unavailable. The text-based answers above are still fully available.'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleConnect}
                className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all"
              >
                Retry
              </button>
              <button
                onClick={handleDisconnect}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-gray-400 px-5 py-2.5 rounded-xl text-xs transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
