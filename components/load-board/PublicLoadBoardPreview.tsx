'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

/* ═══════════════════════════════════════════════════════════════════
   PUBLIC LOAD BOARD PREVIEW
   Shows 3 full load cards + blurred/gated cards 4-10
   Drives sign-up urgency with HOT/WARM/COOL badges
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#060b12', bgCard: '#0f1a26', bgPanel: 'rgba(15,26,38,0.92)',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.13)',
  gold: '#f5b942', green: '#27d17f', red: '#f87171', amber: '#f59e0b',
  blue: '#3ba4ff', text: '#f0f4f8', muted: '#8fa3b8',
} as const;

// Seed loads for when DB is empty
const SEED_LOADS = [
  { id: 's1', origin_state: 'TX', dest_state: 'LA', service_required: 'Pilot Car', rate_amount: 650, urgency: 'hot', posted_at: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: 's2', origin_state: 'FL', dest_state: 'GA', service_required: 'Height Pole', rate_amount: 420, urgency: 'warm', posted_at: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: 's3', origin_state: 'CA', dest_state: 'AZ', service_required: 'Pilot Car', rate_amount: 890, urgency: 'hot', posted_at: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 's4', origin_state: 'OH', dest_state: 'PA', service_required: 'Wide Load', rate_amount: 310, urgency: 'warm', posted_at: new Date(Date.now() - 1.5 * 3600000).toISOString() },
  { id: 's5', origin_state: 'IL', dest_state: 'WI', service_required: 'Pilot Car', rate_amount: 275, urgency: 'cool', posted_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 's6', origin_state: 'NC', dest_state: 'VA', service_required: 'Route Survey', rate_amount: 500, urgency: 'hot', posted_at: new Date(Date.now() - 2.5 * 3600000).toISOString() },
  { id: 's7', origin_state: 'WA', dest_state: 'OR', service_required: 'Height Pole', rate_amount: 380, urgency: 'warm', posted_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 's8', origin_state: 'GA', dest_state: 'AL', service_required: 'Pilot Car', rate_amount: 220, urgency: 'cool', posted_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 's9', origin_state: 'TN', dest_state: 'KY', service_required: 'Pilot Car', rate_amount: 290, urgency: 'warm', posted_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 's10', origin_state: 'NV', dest_state: 'CA', service_required: 'Wide Load', rate_amount: 720, urgency: 'hot', posted_at: new Date(Date.now() - 6 * 3600000).toISOString() },
];

function timeSince(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const URGENCY_CONFIG = {
  hot: { label: 'HOT', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.35)', color: '#f87171', animation: 'pulse-hot 1.5s ease-in-out infinite' },
  warm: { label: 'WARM', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)', color: '#f59e0b', animation: 'pulse-warm 2s ease-in-out infinite' },
  cool: { label: 'COOL', bg: 'rgba(59,164,255,0.1)', border: 'rgba(59,164,255,0.25)', color: '#3ba4ff', animation: 'none' },
  planned: { label: 'PLANNED', bg: 'rgba(59,164,255,0.1)', border: 'rgba(59,164,255,0.25)', color: '#3ba4ff', animation: 'none' },
  flex: { label: 'FLEX', bg: 'rgba(143,163,184,0.08)', border: 'rgba(143,163,184,0.2)', color: '#8fa3b8', animation: 'none' },
} as const;

interface LoadPreview {
  id: string;
  origin_state: string;
  dest_state: string;
  service_required: string;
  rate_amount: number;
  urgency: string;
  posted_at: string;
}

function LoadPreviewCard({ load, index }: { load: LoadPreview; index: number }) {
  const urgKey = (load.urgency || 'cool') as keyof typeof URGENCY_CONFIG;
  const urg = URGENCY_CONFIG[urgKey] ?? URGENCY_CONFIG.cool;

  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: '16px',
      animation: `slide-in-load 0.4s ease-out both`,
      animationDelay: `${index * 60}ms`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      className="load-preview-card"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: T.text }}>
            {load.origin_state}
          </span>
          <span style={{ fontSize: 12, color: T.muted }}>→</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: T.text }}>
            {load.dest_state}
          </span>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 6,
          background: urg.bg, border: `1px solid ${urg.border}`, color: urg.color,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          animation: urg.animation,
        }}>
          {urg.label}
        </span>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: T.muted, background: 'rgba(255,255,255,0.04)', padding: '3px 9px', borderRadius: 6, border: `1px solid ${T.border}` }}>
          {load.service_required}
        </span>
        <span style={{ fontSize: 18, fontWeight: 900, color: T.gold, fontFamily: 'monospace' }}>
          ${(load.rate_amount || 0).toLocaleString()}<span style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>/day</span>
        </span>
        <span style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>
          {timeSince(load.posted_at)}
        </span>
      </div>

      {/* CTA */}
      <Link href="/login" style={{
        display: 'block', textAlign: 'center',
        padding: '8px', borderRadius: 10,
        background: 'rgba(245,185,66,0.1)', border: `1px solid rgba(245,185,66,0.25)`,
        color: T.gold, fontSize: 12, fontWeight: 800, textDecoration: 'none',
      }}>
        Sign in to Accept →
      </Link>
    </div>
  );
}

function BlurredCard({ index }: { index: number }) {
  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14,
      padding: '16px', position: 'relative', overflow: 'hidden',
      animation: `slide-in-load 0.4s ease-out both`,
      animationDelay: `${index * 60}ms`,
    }}>
      {/* Blurred content */}
      <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>?? → ??</div>
          <div style={{ fontSize: 9, padding: '3px 9px', background: 'rgba(248,113,113,0.15)', borderRadius: 6, color: '#f87171' }}>HOT</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ height: 24, width: 80, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ height: 24, width: 60, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
      </div>
      {/* Lock overlay */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        background: 'rgba(6,11,18,0.65)', backdropFilter: 'blur(2px)',
      }}>
        <div style={{ fontSize: 18 }}>🔒</div>
        <Link href="/login" style={{ fontSize: 11, fontWeight: 800, color: T.gold, textDecoration: 'none' }}>
          Sign in to view
        </Link>
      </div>
    </div>
  );
}

export function PublicLoadBoardPreview() {
  const [loads, setLoads] = useState<LoadPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    async function fetchPublicLoads() {
      try {
        const sb = createClient();
        // Try to fetch from hc_loads (anon key — only returns public rows)
        const { data, count } = await sb
          .from('hc_loads')
          .select('id, origin_state, dest_state, service_required, rate_amount, urgency, posted_at', { count: 'estimated' })
          .in('status', ['open', 'active'])
          .order('posted_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          setLoads(data);
          setLiveCount(count ?? data.length);
        } else {
          // Fallback to seed loads
          setLoads(SEED_LOADS);
          setLiveCount(SEED_LOADS.length);
        }
      } catch {
        setLoads(SEED_LOADS);
        setLiveCount(SEED_LOADS.length);
      }
      setLoading(false);
    }
    fetchPublicLoads();
  }, []);

  const preview = loads.slice(0, 3);
  const gated = loads.slice(3);

  return (
    <>
      <style>{`
        @keyframes slide-in-load {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-hot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
          50% { box-shadow: 0 0 8px 2px rgba(248,113,113,0.3); }
        }
        @keyframes pulse-warm {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50% { box-shadow: 0 0 6px 1px rgba(245,158,11,0.25); }
        }
        .load-preview-card:hover { transform: translateY(-3px); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
      `}</style>

      <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>

        {/* Hero bar */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(248,113,113,0.05) 0%, transparent 100%)',
          borderBottom: `1px solid ${T.border}`,
          padding: '32px 20px 28px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}`, animation: 'pulse-warm 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Live Load Board
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.2 }}>
            {liveCount > 0 && !loading ? `${liveCount} Loads Available Now` : 'Open Loads — Accept Jobs Today'}
          </h1>
          <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
            Sign in to view full details, accept jobs, and set availability
          </p>
        </div>

        {/* Urgency legend */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          {(['hot', 'warm', 'cool'] as const).map(u => {
            const cfg = URGENCY_CONFIG[u];
            return (
              <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', animation: cfg.animation }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: 11, color: T.muted }}>
                  {u === 'hot' ? 'Fill in <1h' : u === 'warm' ? 'Fill in <4h' : 'Flexible'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Load grid */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, height: 140, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Full preview — first 3 */}
              <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Preview — 3 of {liveCount} loads
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 14 }}>
                {preview.map((load, i) => (
                  <LoadPreviewCard key={load.id} load={load} index={i} />
                ))}
              </div>

              {/* Gated — blurred */}
              {gated.length > 0 && (
                <>
                  <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {gated.length} more loads — sign in to unlock
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
                    {gated.map((_, i) => (
                      <BlurredCard key={i} index={i + 3} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Sign-in CTA */}
          <div style={{
            padding: '32px 24px', borderRadius: 18, textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(245,185,66,0.07), rgba(245,185,66,0.02))',
            border: '1px solid rgba(245,185,66,0.25)',
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.text, marginBottom: 8 }}>
              Sign in to Accept Jobs
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Toggle available, receive push offers, track earnings, and build your trust score.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #f5b942, #e8a830)', color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                Sign In Free
              </Link>
              <Link href="/loads/post" style={{ padding: '12px 28px', borderRadius: 12, background: 'transparent', border: `1px solid ${T.borderStrong}`, color: T.muted, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Post a Load
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PublicLoadBoardPreview;
