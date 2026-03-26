'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    Vapi?: any;
  }
}

interface VAPIDialerProps {
  operatorId: string;
  operatorName: string;
  operatorPhone?: string;
  loadId?: string;
  dispatchContext?: string;
  onCallStart?: () => void;
  onCallEnd?: (transcript?: string) => void;
}

type CallState = 'idle' | 'connecting' | 'active' | 'ending';

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

export default function VAPIDialer({
  operatorId,
  operatorName,
  operatorPhone,
  loadId,
  dispatchContext,
  onCallStart,
  onCallEnd,
}: VAPIDialerProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dynamically load VAPI browser SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Vapi) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.vapi.ai/vapi.min.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.Vapi && VAPI_PUBLIC_KEY) {
        vapiRef.current = new window.Vapi(VAPI_PUBLIC_KEY);
        bindVAPIEvents();
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bindVAPIEvents = useCallback(() => {
    if (!vapiRef.current) return;

    vapiRef.current.on('call-start', () => {
      setCallState('active');
      setDuration(0);
      onCallStart?.();
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    });

    vapiRef.current.on('call-end', (summary: any) => {
      setCallState('idle');
      if (timerRef.current) clearInterval(timerRef.current);
      onCallEnd?.(summary?.transcript);
    });

    vapiRef.current.on('error', (err: any) => {
      setError(err?.message || 'Call failed');
      setCallState('idle');
      if (timerRef.current) clearInterval(timerRef.current);
    });
  }, [onCallStart, onCallEnd]);

  const startCall = useCallback(async () => {
    setError(null);
    setCallState('connecting');

    // If Vapi SDK isn't loaded yet, fall back to the outbound REST API
    if (!vapiRef.current) {
      try {
        const res = await fetch('/api/vapi/outbound', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operatorId,
            operatorName,
            operatorPhone,
            loadId,
            dispatchContext: dispatchContext || `Dispatch inquiry for operator ${operatorName}`,
          }),
        });

        if (!res.ok) throw new Error('Outbound call failed');
        setCallState('active');
        onCallStart?.();
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      } catch (err: any) {
        setError(err.message);
        setCallState('idle');
      }
      return;
    }

    // Use browser SDK for rich real-time call
    try {
      await vapiRef.current.start({
        assistantId: process.env.NEXT_PUBLIC_VAPI_DISPATCH_ASSISTANT_ID,
        assistantOverrides: {
          variableValues: {
            operator_name: operatorName,
            operator_id: operatorId,
            load_id: loadId || 'N/A',
            dispatch_context: dispatchContext || '',
          },
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      setCallState('idle');
    }
  }, [operatorId, operatorName, operatorPhone, loadId, dispatchContext, onCallStart]);

  const endCall = useCallback(() => {
    setCallState('ending');
    if (vapiRef.current) {
      vapiRef.current.stop();
    } else {
      setCallState('idle');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(m => !m);
    }
  }, [isMuted]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (callState === 'active') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0a2a1a 0%, #0d2210 100%)',
        border: '1px solid rgba(0,200,100,0.4)',
        borderRadius: '20px',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(0,200,100,0.15)',
          border: '2px solid #00c864',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          animation: 'pulse 1.5s ease-in-out infinite',
          fontSize: '32px',
        }}>📞</div>

        <div style={{ color: '#00c864', fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
          AI Dispatcher Active
        </div>
        <div style={{ color: '#888', fontSize: '13px', marginBottom: '6px' }}>{operatorName}</div>
        <div style={{ color: '#00c864', fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', marginBottom: '24px' }}>
          {formatDuration(duration)}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={toggleMute}
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: isMuted ? 'rgba(255,80,80,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${isMuted ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.15)'}`,
              color: isMuted ? '#ff5050' : '#aaa', fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>

          <button
            onClick={endCall}
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff3333, #cc0000)',
              border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255,0,0,0.4)',
            }}
          >
            📵
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,200,100,0.4)} 50%{box-shadow:0 0 0 12px rgba(0,200,100,0)} }`}</style>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{
          background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
          color: '#ff6666', fontSize: '13px',
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={startCall}
        disabled={callState === 'connecting' || callState === 'ending'}
        style={{
          width: '100%', padding: '16px',
          background: callState !== 'idle'
            ? 'rgba(255,255,255,0.05)'
            : 'linear-gradient(135deg, #00c864, #00a050)',
          border: 'none', borderRadius: '14px',
          color: '#fff', fontWeight: 700, fontSize: '16px',
          cursor: callState !== 'idle' ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.2s',
          boxShadow: callState === 'idle' ? '0 4px 20px rgba(0,200,100,0.3)' : 'none',
        }}
      >
        {callState === 'connecting' ? (
          <>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              animation: 'spin 0.7s linear infinite',
            }} />
            Connecting AI Dispatcher...
          </>
        ) : callState === 'ending' ? (
          <>📵 Ending Call...</>
        ) : (
          <>📞 Call Operator via AI Dispatcher</>
        )}
      </button>

      {operatorPhone && callState === 'idle' && (
        <a
          href={`tel:${operatorPhone}`}
          style={{
            display: 'block', marginTop: '10px', padding: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', textAlign: 'center',
            color: '#888', fontSize: '13px', textDecoration: 'none',
          }}
        >
          📱 Call Direct: {operatorPhone}
        </a>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
