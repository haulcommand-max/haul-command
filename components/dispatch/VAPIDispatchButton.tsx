'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Loader2, Mic, MicOff, Volume2, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VapiCall {
  status: 'idle' | 'connecting' | 'active' | 'ending' | 'error';
  duration: number;
  transcript?: string;
}

interface Props {
  operatorId: string;
  operatorName: string;
  operatorPhone?: string;
  /** Override — defaults to env var NEXT_PUBLIC_VAPI_SAFETY_SENTINEL_ID */
  assistantId?: string;
  /** Compact style for directory cards */
  compact?: boolean;
  className?: string;
}

const SAFETY_DISCLAIMER = `You are connecting with an AI Dispatcher powered by Haul Command. Haul Command is a technology platform for pilot cars and is NOT a licensed FMCSA freight broker. All on-road and legal compliance decisions remain your own responsibility.`;

// ─── Main Component ───────────────────────────────────────────────────────────
export function VAPIDispatchButton({ operatorId, operatorName, operatorPhone, assistantId, compact = false, className }: Props) {
  const [call, setCall] = useState<VapiCall>({ status: 'idle', duration: 0 });
  const [muted, setMuted] = useState(false);
  const [vapiReady, setVapiReady] = useState(false);
  const [vapiError, setVapiError] = useState('');
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dynamically load VAPI Web SDK (not a bundled dep — loaded at runtime to avoid SSR issues)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Guard: only load once
    if ((window as any).__vapiLoaded) {
      setVapiReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.umd.js';
    script.async = true;
    script.onload = () => {
      (window as any).__vapiLoaded = true;
      setVapiReady(true);
    };
    script.onerror = () => setVapiError('Failed to load VAPI SDK');
    document.head.appendChild(script);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCall = async () => {
    if (!vapiReady) { setVapiError('VAPI not loaded yet'); return; }
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) { setVapiError('VAPI API key not configured'); return; }
    const aid = assistantId || process.env.NEXT_PUBLIC_VAPI_SAFETY_SENTINEL_ID;
    if (!aid) { setVapiError('No VAPI assistant configured'); return; }

    setCall({ status: 'connecting', duration: 0 });
    setVapiError('');

    try {
      const { Vapi } = (window as any);
      if (!vapiRef.current) {
        vapiRef.current = new Vapi(apiKey);
      }
      const vapi = vapiRef.current;

      vapi.on('call-start', () => {
        setCall(c => ({ ...c, status: 'active' }));
        timerRef.current = setInterval(() => {
          setCall(c => ({ ...c, duration: c.duration + 1 }));
        }, 1000);
      });

      vapi.on('call-end', () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setCall(c => ({ ...c, status: 'idle' }));
      });

      vapi.on('error', (err: any) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setVapiError(err?.message ?? 'Call error');
        setCall(c => ({ ...c, status: 'error' }));
      });

      vapi.on('message', (msg: any) => {
        if (msg.type === 'transcript' && msg.role === 'assistant') {
          setCall(c => ({ ...c, transcript: msg.transcript }));
        }
      });

      // Start the call via the VAPI SDK — middle layer preserved
      await vapi.start(aid, {
        metadata: {
          operator_id: operatorId,
          operator_name: operatorName,
          operator_phone: operatorPhone ?? '',
          platform: 'haulcommand',
          call_type: 'operator_dispatch',
        },
      });
    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setVapiError(err?.message ?? 'Failed to start call');
      setCall({ status: 'error', duration: 0 });
    }
  };

  const endCall = () => {
    setCall(c => ({ ...c, status: 'ending' }));
    try {
      vapiRef.current?.stop();
    } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => setCall({ status: 'idle', duration: 0 }), 600);
  };

  const toggleMute = () => {
    setMuted(m => !m);
    try {
      vapiRef.current?.setMuted(!muted);
    } catch {}
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Compact (directory card) mode ──────────────────────────────────────────
  if (compact) {
    return (
      <button
        id={`vapi-call-${operatorId}`}
        onClick={call.status === 'idle' || call.status === 'error' ? startCall : endCall}
        disabled={call.status === 'connecting' || call.status === 'ending' || !vapiReady}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 14px',
          background: call.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
          border: `1px solid ${call.status === 'active' ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
          borderRadius: 10,
          color: call.status === 'active' ? '#f87171' : '#34d399',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        className={className}
      >
        {call.status === 'connecting' ? (
          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
        ) : call.status === 'active' ? (
          <PhoneOff size={13} />
        ) : (
          <Phone size={13} />
        )}
        {call.status === 'connecting' ? 'Connecting...' : call.status === 'active' ? `End Call ${fmt(call.duration)}` : 'AI Dispatch Call'}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }

  // ── Full mode ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'linear-gradient(160deg, #0a0f1a, #060810)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, maxWidth: 420, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Volume2 size={20} color="#34d399" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>AI Dispatcher</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Powered by VAPI · Haul Command</p>
        </div>
      </div>

      {/* Operator target */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calling Operator</p>
        <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{operatorName}</p>
        {operatorPhone && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{operatorPhone}</p>}
      </div>

      {/* Disclaimer */}
      {call.status === 'idle' && (
        <div style={{ display: 'flex', gap: 8, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 18 }}>
          <AlertTriangle size={13} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: '#78716c', lineHeight: 1.5 }}>{SAFETY_DISCLAIMER}</p>
        </div>
      )}

      {/* Active call UI */}
      {call.status === 'active' && (
        <div style={{ marginBottom: 18 }}>
          {/* Waveform visual */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 48, marginBottom: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  borderRadius: 2,
                  background: '#34d399',
                  height: `${20 + Math.random() * 28}%`,
                  animation: `pulse-bar ${0.4 + i * 0.07}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
          <p style={{ textAlign: 'center', margin: 0, fontSize: 13, fontWeight: 700, color: '#34d399' }}>
            LIVE · {fmt(call.duration)}
          </p>
          {call.transcript && (
            <div style={{ marginTop: 10, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: 10, padding: '8px 12px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontStyle: 'italic', lineHeight: 1.5 }}>"{call.transcript}"</p>
            </div>
          )}
        </div>
      )}

      {vapiError && (
        <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
          <AlertTriangle size={13} color="#f87171" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, color: '#f87171' }}>{vapiError}</p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        {call.status === 'active' && (
          <button
            onClick={toggleMute}
            style={{ width: 42, height: 42, borderRadius: 12, background: muted ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${muted ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {muted ? <MicOff size={16} color="#f87171" /> : <Mic size={16} color="#94a3b8" />}
          </button>
        )}

        <button
          id={`vapi-call-btn-${operatorId}`}
          onClick={call.status === 'idle' || call.status === 'error' ? startCall : endCall}
          disabled={call.status === 'connecting' || call.status === 'ending' || !vapiReady}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '13px 20px',
            background: call.status === 'active'
              ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
              : 'linear-gradient(135deg, #34d399, #059669)',
            border: 'none',
            borderRadius: 14,
            color: '#000',
            fontSize: 15,
            fontWeight: 800,
            cursor: (call.status === 'connecting' || call.status === 'ending' || !vapiReady) ? 'not-allowed' : 'pointer',
            opacity: (call.status === 'connecting' || call.status === 'ending') ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {call.status === 'connecting' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> :
           call.status === 'active' ? <PhoneOff size={16} /> :
           <Phone size={16} />}
          {call.status === 'connecting' ? 'Connecting to AI...' :
           call.status === 'active' ? `End Call — ${fmt(call.duration)}` :
           call.status === 'ending' ? 'Ending...' :
           'Call Operator via AI Dispatch'}
        </button>
      </div>

      <p style={{ textAlign: 'center', margin: '14px 0 0', fontSize: 10, color: '#334155', lineHeight: 1.5 }}>
        Calls are routed through VAPI's secure middleware. Direct bypass is not permitted.
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-bar { from { opacity: 0.4; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
