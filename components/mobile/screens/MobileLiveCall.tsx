'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, PhoneOff, Volume2, VolumeX,
  Radio, Wifi, WifiOff, Users, Clock,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   MobileLiveCall — LiveKit-powered in-app voice channel
   Flow:
   1. Fetch LiveKit access token from /api/voice/token?room=<roomId>
   2. Connect to LiveKit Cloud room via WebSocket
   3. Render PTT (push-to-talk) or open mic UI
   4. Show participant list, signal quality, call duration
   
   Designed for: Broker ↔ Operator direct voice without phone number exposure
   LiveKit SDK: livekit-client (already in package.json)
   ══════════════════════════════════════════════════════════════════════════ */

type CallState = 'idle' | 'connecting' | 'connected' | 'error' | 'ended';
type AudioMode = 'open' | 'ptt';

interface Participant {
  identity: string;
  displayName: string;
  isSpeaking: boolean;
  isMuted: boolean;
  connectionQuality: 'poor' | 'good' | 'excellent';
}

interface MobileLiveCallProps {
  roomId: string;
  userId: string;
  displayName: string;
  remoteDisplayName?: string;
  onEnd?: () => void;
}

const QUALITY_COLOR = { poor: '#f87171', good: '#FBBF24', excellent: '#34d399' } as const;

function SignalDots({ quality }: { quality: Participant['connectionQuality'] }) {
  const levels = { poor: 1, good: 2, excellent: 3 };
  const active = levels[quality];
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
      {[1, 2, 3].map(l => (
        <div key={l} style={{
          width: 3, borderRadius: 1,
          height: l * 4 + 4,
          background: l <= active ? QUALITY_COLOR[quality] : 'rgba(255,255,255,0.1)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

function Avatar({ name, speaking }: { name: string; speaking: boolean }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: speaking ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.06)',
      border: `3px solid ${speaking ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, fontWeight: 800, color: speaking ? '#34d399' : '#94a3b8',
      transition: 'all 0.3s',
      boxShadow: speaking ? '0 0 20px rgba(52,211,153,0.3)' : 'none',
      position: 'relative' as const,
    }}>
      {initials}
      {speaking && (
        <div style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          border: '2px solid rgba(52,211,153,0.4)',
          animation: 'pulse-ring 1.5s ease infinite',
        }} />
      )}
    </div>
  );
}

export default function MobileLiveCall({
  roomId,
  userId,
  displayName,
  remoteDisplayName = 'Connecting...',
  onEnd,
}: MobileLiveCallProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [audioMode, setAudioMode] = useState<AudioMode>('open');
  const [muted, setMuted] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [quality, setQuality] = useState<Participant['connectionQuality']>('good');

  // Mock participants — in production, these come from LiveKit room.participants
  const [participants, setParticipants] = useState<Participant[]>([
    { identity: 'remote', displayName: remoteDisplayName, isSpeaking: false, isMuted: false, connectionQuality: 'excellent' },
  ]);

  const roomRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const pttTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Duration counter
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const connect = useCallback(async () => {
    setCallState('connecting');
    setErrorMsg('');

    try {
      // 1. Get LiveKit token from server
      const tokenRes = await fetch(`/api/voice/token?room=${roomId}&identity=${userId}&name=${encodeURIComponent(displayName)}`);
      if (!tokenRes.ok) throw new Error('Failed to get voice token');
      const { token, url } = await tokenRes.json();

      // 2. Connect with livekit-client (dynamic import to avoid SSR issues)
      const { Room, RoomEvent, Track } = await import('livekit-client');
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: { noiseSuppression: true, echoCancellation: true },
      });

      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, () => {});
      room.on(RoomEvent.ParticipantConnected, (p: any) => {
        setParticipants(prev => [...prev.filter(x => x.identity !== p.identity), {
          identity: p.identity,
          displayName: p.name ?? p.identity,
          isSpeaking: false,
          isMuted: false,
          connectionQuality: 'good',
        }]);
      });
      room.on(RoomEvent.ParticipantDisconnected, (p: any) => {
        setParticipants(prev => prev.filter(x => x.identity !== p.identity));
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) => {
        const ids = new Set(speakers.map((s: any) => s.identity));
        setParticipants(prev => prev.map(p => ({ ...p, isSpeaking: ids.has(p.identity) })));
      });
      room.on(RoomEvent.ConnectionQualityChanged, (q: any) => {
        const qs = typeof q === 'string' ? q : String(q);
        setQuality(qs === 'excellent' ? 'excellent' : qs === 'good' ? 'good' : 'poor');
      });
      room.on(RoomEvent.Disconnected, () => {
        setCallState('ended');
      });

      await room.connect(url ?? 'wss://haul-command.livekit.cloud', token);
      await room.localParticipant.setMicrophoneEnabled(audioMode === 'open');

      setCallState('connected');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Connection failed');
      setCallState('error');
    }
  }, [roomId, userId, displayName, audioMode]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setCallState('ended');
    setDuration(0);
    onEnd?.();
  }, [onEnd]);

  const toggleMute = useCallback(async () => {
    if (!roomRef.current) return;
    const local = roomRef.current.localParticipant;
    const next = !muted;
    await local.setMicrophoneEnabled(!next);
    setMuted(next);
  }, [muted]);

  // PTT handlers
  const pttStart = useCallback(async () => {
    if (!roomRef.current || audioMode !== 'ptt') return;
    setPttActive(true);
    await roomRef.current.localParticipant.setMicrophoneEnabled(true);
  }, [audioMode]);

  const pttEnd = useCallback(async () => {
    if (!roomRef.current || audioMode !== 'ptt') return;
    setPttActive(false);
    // Small trailing buffer before muting
    pttTimeoutRef.current = setTimeout(async () => {
      if (roomRef.current) await roomRef.current.localParticipant.setMicrophoneEnabled(false);
    }, 300);
  }, [audioMode]);

  const remoteParticipant = participants[0];

  return (
    <div style={{
      background: 'linear-gradient(160deg, #060c1a 0%, #040810 100%)',
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', system-ui, sans-serif", color: '#fff',
      userSelect: 'none',
    }}>

      {/* Status bar area */}
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={14} color={callState === 'connected' ? '#34d399' : '#475569'} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {callState === 'connected' ? 'Live Voice' : callState === 'connecting' ? 'Connecting...' : 'Haul Command Voice'}
          </span>
        </div>
        {callState === 'connected' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SignalDots quality={quality} />
            <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 20px' }}>

        {callState === 'idle' && (
          <>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'rgba(52,211,153,0.08)', border: '2px solid rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Volume2 size={40} color="#34d399" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px' }}>Voice Call</h2>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Secure, direct — no phone number needed</p>
            </div>

            {/* Audio mode toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, gap: 4 }}>
              {(['open', 'ptt'] as const).map(m => (
                <button key={m} onClick={() => setAudioMode(m)} style={{
                  padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: audioMode === m ? 'rgba(52,211,153,0.12)' : 'transparent',
                  color: audioMode === m ? '#34d399' : '#64748b',
                  border: `1px solid ${audioMode === m ? 'rgba(52,211,153,0.3)' : 'transparent'}`,
                }}>
                  {m === 'open' ? '🎙 Open Mic' : '📻 Push-to-Talk'}
                </button>
              ))}
            </div>

            <button
              onClick={connect}
              style={{
                background: 'linear-gradient(135deg, #34d399, #059669)',
                border: 'none', borderRadius: 18, padding: '16px 48px',
                color: '#000', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 0 32px rgba(52,211,153,0.25)',
              }}
            >
              Start Call
            </button>
          </>
        )}

        {callState === 'connecting' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '3px solid rgba(52,211,153,0.3)',
              borderTopColor: '#34d399', animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Connecting to voice room...</p>
          </>
        )}

        {callState === 'connected' && (
          <>
            {/* Remote participant avatar */}
            <Avatar name={remoteParticipant?.displayName ?? remoteDisplayName} speaking={remoteParticipant?.isSpeaking ?? false} />
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>{remoteParticipant?.displayName ?? remoteDisplayName}</h2>
              <p style={{ color: '#34d399', fontSize: 13, margin: 0, fontWeight: 600 }}>
                {remoteParticipant?.isSpeaking ? '● Speaking' : 'On call'}
              </p>
            </div>

            {/* Participants row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12 }}>
              <Users size={12} /> {participants.length + 1} in room
              <span style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {formatDuration(duration)}
              </span>
            </div>

            {/* PTT mode button */}
            {audioMode === 'ptt' && (
              <button
                onPointerDown={pttStart}
                onPointerUp={pttEnd}
                onPointerLeave={pttEnd}
                style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: pttActive ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `3px solid ${pttActive ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: pttActive ? '0 0 30px rgba(52,211,153,0.3)' : 'none',
                }}
              >
                <Mic size={32} color={pttActive ? '#34d399' : '#64748b'} />
                <span style={{ fontSize: 10, fontWeight: 800, color: pttActive ? '#34d399' : '#475569', letterSpacing: '0.1em' }}>
                  {pttActive ? 'TALKING' : 'HOLD'}
                </span>
              </button>
            )}
          </>
        )}

        {callState === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📡</div>
            <h3 style={{ color: '#f87171', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Connection Failed</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>{errorMsg}</p>
            <button onClick={connect} style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 12, padding: '10px 24px', color: '#f87171', fontWeight: 700, cursor: 'pointer',
            }}>Try Again</button>
          </div>
        )}

        {callState === 'ended' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Call Ended</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Duration: {formatDuration(duration)}</p>
            <button onClick={() => { setCallState('idle'); setDuration(0); }} style={{
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: 12, padding: '10px 24px', color: '#34d399', fontWeight: 700, cursor: 'pointer',
            }}>New Call</button>
          </div>
        )}
      </div>

      {/* Bottom controls — only when connected */}
      {callState === 'connected' && (
        <div style={{ padding: '0 32px 48px', display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'center' }}>
          {/* Mute */}
          <button onClick={toggleMute} style={controlBtn(muted, '#f87171')}>
            {muted ? <MicOff size={20} color="#f87171" /> : <Mic size={20} color="#fff" />}
          </button>

          {/* Hang up */}
          <button onClick={disconnect} style={{
            width: 70, height: 70, borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(239,68,68,0.4)',
          }}>
            <PhoneOff size={26} color="#fff" />
          </button>

          {/* Speaker */}
          <button onClick={() => setSpeakerOff(s => !s)} style={controlBtn(speakerOff, '#f87171')}>
            {speakerOff ? <VolumeX size={20} color="#f87171" /> : <Volume2 size={20} color="#fff" />}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
      `}</style>
    </div>
  );
}

function controlBtn(active: boolean, activeColor: string): React.CSSProperties {
  return {
    width: 52, height: 52, borderRadius: '50%',
    background: active ? `${activeColor}18` : 'rgba(255,255,255,0.08)',
    border: `1px solid ${active ? activeColor + '40' : 'rgba(255,255,255,0.1)'}`,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  };
}
