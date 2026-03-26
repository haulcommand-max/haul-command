'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface RequestLog {
  id: string;
  ip?: string;
  lat?: number;
  lng?: number;
  asn?: string;
  country_code?: string;
  path?: string;
  status_code?: number;
  blocked?: boolean;
  threat_score?: number;
  created_at: string;
}

interface Dot {
  id: string; x: number; y: number;
  blocked: boolean; threat: number;
  opacity: number; createdAt: number;
  country?: string; path?: string;
}

// Equirectangular projection  
function geoToSVG(lat: number, lng: number, w: number, h: number) {
  const x = ((lng + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function AEGISDefenseDashboard() {
  const [dots, setDots] = useState<Dot[]>([]);
  const [stats, setStats] = useState({ total: 0, blocked: 0, threats: 0, countries: new Set<string>() });
  const [connected, setConnected] = useState(false);
  const [startTime] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 900; const H = 450;

  // Realtime clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fade out old dots
  useEffect(() => {
    const t = setInterval(() => {
      setDots(prev =>
        prev
          .map(d => ({ ...d, opacity: Math.max(0, d.opacity - 0.015) }))
          .filter(d => d.opacity > 0)
      );
    }, 100);
    return () => clearInterval(t);
  }, []);

  const addDot = useCallback((row: RequestLog) => {
    if (row.lat == null || row.lng == null) return;
    const { x, y } = geoToSVG(row.lat, row.lng, W, H);
    const dot: Dot = {
      id: row.id,
      x, y,
      blocked: !!row.blocked,
      threat: row.threat_score || 0,
      opacity: 1,
      createdAt: Date.now(),
      country: row.country_code,
      path: row.path,
    };
    setDots(prev => [dot, ...prev].slice(0, 300));
    setStats(prev => ({
      total: prev.total + 1,
      blocked: prev.blocked + (row.blocked ? 1 : 0),
      threats: prev.threats + (row.threat_score && row.threat_score > 70 ? 1 : 0),
      countries: new Set([...prev.countries, row.country_code || 'XX']),
    }));
  }, []);

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const sb = createClient(url, key);
    const channel = sb
      .channel('aegis-defense')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'request_log' },
        (payload: { new: RequestLog }) => {
          setConnected(true);
          addDot(payload.new);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') setConnected(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnected(false);
      });

    return () => { sb.removeChannel(channel); };
  }, [addDot]);

  const dotColor = (d: Dot) => {
    if (d.blocked) return '#ff3333';
    if (d.threat > 70) return '#ff8c00';
    return '#00c864';
  };

  const blockRate = stats.total > 0 ? ((stats.blocked / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ minHeight: '100vh', background: '#050508', fontFamily: 'Inter,monospace', color: '#fff' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '.05em' }}>AEGIS DEFENSE</div>
            <div style={{ color: '#555', fontSize: '11px' }}>Real-Time Threat Intelligence</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#555', fontSize: '10px' }}>UPTIME</div>
            <div style={{ color: '#aaa', fontSize: '13px', fontFamily: 'monospace' }}>{formatUptime(now - startTime)}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: connected ? 'rgba(0,200,100,0.1)' : 'rgba(255,50,50,0.1)', border: `1px solid ${connected ? 'rgba(0,200,100,0.3)' : 'rgba(255,50,50,0.3)'}`, borderRadius: '8px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: connected ? '#00c864' : '#ff3333', animation: connected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ color: connected ? '#00c864' : '#ff3333', fontSize: '11px', fontWeight: 600 }}>{connected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>
        </div>
      </div>

      {/* Stat bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'TOTAL REQUESTS', value: stats.total.toLocaleString(), color: '#aaa' },
          { label: 'BLOCKED', value: stats.blocked.toLocaleString(), color: '#ff3333' },
          { label: 'BLOCK RATE', value: `${blockRate}%`, color: '#ff8c00' },
          { label: 'COUNTRIES', value: stats.countries.size.toString(), color: '#3b82f6' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '16px 20px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#444', fontSize: '10px', fontWeight: 600, letterSpacing: '.08em', marginBottom: '4px' }}>{label}</div>
            <div style={{ color, fontSize: '24px', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* SVG World Map */}
      <div style={{ position: 'relative', background: '#080810', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* World map background - simple SVG grid */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', display: 'block', maxHeight: '460px' }}
        >
          {/* Grid lines */}
          {[...Array(18)].map((_, i) => (
            <line key={`lat${i}`} x1={0} y1={(i / 18) * H} x2={W} y2={(i / 18) * H}
              stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
          ))}
          {[...Array(36)].map((_, i) => (
            <line key={`lng${i}`} x1={(i / 36) * W} y1={0} x2={(i / 36) * W} y2={H}
              stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
          ))}

          {/* Equator + Prime Meridian */}
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

          {/* Request dots */}
          {dots.map(d => (
            <g key={d.id}>
              {/* Ripple for high-threat */}
              {d.threat > 70 && (
                <circle cx={d.x} cy={d.y} r={8} fill="none"
                  stroke={dotColor(d)} strokeWidth={1}
                  opacity={d.opacity * 0.4}
                />
              )}
              <circle
                cx={d.x} cy={d.y}
                r={d.blocked ? 4 : d.threat > 70 ? 3.5 : 2.5}
                fill={dotColor(d)}
                opacity={d.opacity}
              />
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: '14px', left: '16px', display: 'flex', gap: '16px' }}>
          {[
            { color: '#00c864', label: 'Clean Request' },
            { color: '#ff8c00', label: 'Suspicious (>70 score)' },
            { color: '#ff3333', label: 'Blocked / Threat' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ color: '#666', fontSize: '11px' }}>{label}</span>
            </div>
          ))}
        </div>

        {dots.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333', pointerEvents: 'none' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌐</div>
            <div style={{ fontSize: '14px' }}>Waiting for live request_log events…</div>
          </div>
        )}
      </div>

      {/* Live feed table */}
      <div style={{ padding: '20px 24px' }}>
        <div style={{ color: '#555', fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', marginBottom: '12px' }}>LIVE EVENT FEED</div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
          {dots.slice(0, 8).length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#444', fontSize: '13px' }}>No events yet…</div>
          ) : (
            dots.slice(0, 8).map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor(d), flexShrink: 0 }} />
                <span style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace', flex: 1 }}>{d.path || '/api/…'}</span>
                <span style={{ color: '#555', fontSize: '11px' }}>{d.country || '??'}</span>
                <span style={{ color: d.blocked ? '#ff3333' : '#00c864', fontSize: '11px', fontWeight: 600, minWidth: '60px', textAlign: 'right' }}>
                  {d.blocked ? '⛔ BLOCKED' : `✓ score:${d.threat}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
