'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Loader2, Mic, MicOff, Volume2, AlertTriangle } from 'lucide-react';
// import { LiveKitRoom, RoomAudioRenderer, useConnectionState, useLocalParticipant } from '@livekit/components-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  operatorId: string;
  operatorName: string;
  operatorPhone?: string;
  operatorLocation?: string; // Used for hyper-local TTS voice mapping (e.g., 'TX', 'China', 'Canada')
  compact?: boolean;
  className?: string;
}

const SAFETY_DISCLAIMER = `You are connecting with an AI Dispatcher powered by Haul Command. Haul Command is a technology platform for pilot cars and is NOT a licensed FMCSA freight broker. All on-road and legal compliance decisions remain your own responsibility.`;

// ─── Main Component ───────────────────────────────────────────────────────────
export function LiveKitDispatchButton({ operatorId, operatorName, operatorPhone, operatorLocation, compact = false, className }: Props) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ending' | 'error'>('idle');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // Connect to LiveKit via our dispatch agent API
  const startCall = async () => {
    setStatus('connecting');
    setErrorMsg('');
    try {
      // 1. Fetch a LiveKit token from the backend for this specific agent interaction
      const res = await fetch('/api/agents/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: operatorId,
          operator_name: operatorName,
          operator_phone: operatorPhone,
          operator_location: operatorLocation // Triggers hyper-local voice assignment
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to grab LiveKit token');
      }
      
      const { token } = await res.json();
      setToken(token);
      setStatus('active');
      setDuration(0);
      
      // Timer for UI
      const interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
      (window as any).__lkInterval = interval;
      
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to start LiveKit dispatch');
      setStatus('error');
    }
  };

  const endCall = () => {
    setStatus('ending');
    if ((window as any).__lkInterval) {
      clearInterval((window as any).__lkInterval);
    }
    // Timeout to simulate disconnect
    setTimeout(() => {
      setToken(null);
      setStatus('idle');
      setDuration(0);
    }, 600);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (compact) {
    return (
      <button
        onClick={status === 'idle' || status === 'error' ? startCall : endCall}
        disabled={status === 'connecting' || status === 'ending'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 14px',
          background: status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
          border: `1px solid ${status === 'active' ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.3)'}`,
          borderRadius: 10,
          color: status === 'active' ? '#f87171' : '#a78bfa',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        className={className}
      >
        {status === 'connecting' ? (
          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
        ) : status === 'active' ? (
          <PhoneOff size={13} />
        ) : (
          <Phone size={13} />
        )}
        {status === 'connecting' ? 'Connecting...' : status === 'active' ? `End Call ${fmt(duration)}` : 'LiveKit Call'}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(160deg, #0a0f1a, #060810)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, maxWidth: 420, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Volume2 size={20} color="#a78bfa" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>AI Dispatcher (LiveKit)</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Powered by LiveKit Agents</p>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calling Operator</p>
        <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{operatorName}</p>
        {operatorPhone && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{operatorPhone}</p>}
        {operatorLocation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
             <span style={{ display: 'inline-block', padding: '2px 6px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontSize: 10, fontWeight: 700, borderRadius: 4, textTransform: 'uppercase' }}>
               Hyper-Local Voice: {operatorLocation}
             </span>
          </div>
        )}
      </div>

      {status === 'idle' && (
        <div style={{ display: 'flex', gap: 8, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 18 }}>
          <AlertTriangle size={13} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: '#78716c', lineHeight: 1.5 }}>{SAFETY_DISCLAIMER}</p>
        </div>
      )}

      {status === 'active' && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 48, marginBottom: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  borderRadius: 2,
                  background: '#a78bfa',
                  height: `${20 + Math.random() * 28}%`,
                  animation: `pulse-bar ${0.4 + i * 0.07}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
          <p style={{ textAlign: 'center', margin: 0, fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
            AGENT ACTIVE · {fmt(duration)}
          </p>
        </div>
      )}

      {errorMsg && (
        <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
          <AlertTriangle size={13} color="#f87171" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, color: '#f87171' }}>{errorMsg}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {status === 'active' && (
          <button
            onClick={() => setMuted(!muted)}
            style={{ width: 42, height: 42, borderRadius: 12, background: muted ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {muted ? <MicOff size={16} color="#f87171" /> : <Mic size={16} color="#94a3b8" />}
          </button>
        )}

        <button
          onClick={status === 'idle' || status === 'error' ? startCall : endCall}
          disabled={status === 'connecting' || status === 'ending'}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '13px 20px',
            background: status === 'active'
              ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
              : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            border: 'none',
            borderRadius: 14,
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            cursor: (status === 'connecting' || status === 'ending') ? 'not-allowed' : 'pointer',
            opacity: (status === 'connecting' || status === 'ending') ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {status === 'connecting' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> :
           status === 'active' ? <PhoneOff size={16} /> :
           <Phone size={16} />}
          {status === 'connecting' ? 'Connecting to Agent...' :
           status === 'active' ? `End Call — ${fmt(duration)}` :
           status === 'ending' ? 'Ending...' :
           'Initialize LiveKit AI'}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-bar { from { opacity: 0.4; } to { opacity: 1; } }
      `}</style>

      {/* When actually implementing, you would wrap this in LiveKitRoom: 
        {token && (
          <LiveKitRoom serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} token={token} connect onDisconnected={endCall}>
             <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      */}
    </div>
  );
}
