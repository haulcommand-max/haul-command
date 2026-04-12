'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   /brokers â€” Broker Entry & Conversion Surface
   Converts demand-side attention into load postings and registrations.
   Mobile-first. Real data proof bars. No fluff.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface ProofData {
  operators: number;
  corridors: number;
  surgeActive: number;
  topCorridors: Array<{ label: string; demand: string; loads: number; rate: number }>;
}

function useProofData(): ProofData {
  const [data, setData] = useState<ProofData>({
    operators: 0,
    corridors: 0,
    surgeActive: 0,
    topCorridors: [],
  });

  useEffect(() => {
    // Real operator count
    fetch('/api/directory/listings?limit=1')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.total && setData(prev => ({ ...prev, operators: d.total })))
      .catch(() => {});

    // Live corridor demand
    fetch('/api/v1/demand-intelligence/corridors?country_code=US')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.corridors) {
          setData(prev => ({
            ...prev,
            corridors: d.corridors.length,
            surgeActive: d.surge_active_count ?? 0,
            topCorridors: d.corridors.slice(0, 3).map((c: any) => ({
              label: c.corridor_label,
              demand: c.demand_level,
              loads: c.avg_monthly_loads,
              rate: c.avg_rate_usd,
            })),
          }));
        }
      })
      .catch(() => {});
  }, []);

  return data;
}

function DemandBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.24)', text: '#fca5a5' },
    high: { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.24)', text: '#f97316' },
    moderate: { bg: 'rgba(198, 146, 58, 0.12)', border: 'rgba(198, 146, 58, 0.24)', text: '#f1c27b' },
  };
  const c = colors[level] ?? colors.moderate;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: 999,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {level}
    </span>
  );
}

export default function BrokersPage() {
  const proof = useProofData();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'radial-gradient(circle at top left, rgba(198, 146, 58, 0.10), transparent 40%), #060b12',
      color: '#f5f7fb',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>
      {/* Hero */}
      <div style={{ padding: '48px 20px 32px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(198, 146, 58, 0.12)',
          color: '#f1c27b',
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          For heavy haul brokers
        </div>

        <h1 style={{
          margin: '16px 0 12px',
          fontSize: 'clamp(28px, 5vw, 42px)',
          lineHeight: 1.05,
          fontWeight: 900,
          letterSpacing: '-0.02em',
        }}>
          Know where supply is thin
          <span style={{ color: '#f1c27b' }}> before your shipper asks.</span>
        </h1>

        <p style={{
          margin: 0,
          fontSize: 15,
          lineHeight: 1.7,
          color: '#c7ccd7',
          maxWidth: 520,
        }}>
          Haul Command tracks escort supply and demand pressure across every major corridor in real time.
          Route smarter. Fill faster. Reduce dead-head risk.
        </p>

        {/* Proof bar */}
        {proof.operators > 0 && (
          <div style={{
            marginTop: 20,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 12,
            color: '#8f97a7',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
              <strong style={{ color: '#f5f7fb' }}>{proof.operators.toLocaleString()}</strong> operators mapped
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f1c27b' }} />
              <strong style={{ color: '#f5f7fb' }}>{proof.corridors}</strong> corridors tracked
            </div>
            {proof.surgeActive > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316' }} />
                <strong style={{ color: '#f97316' }}>{proof.surgeActive}</strong> surge active
              </div>
            )}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
          <Link aria-label="Navigation Link" href="/loads/post" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            padding: '0 24px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #c6923a, #f1c27b)',
            color: '#060b12',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 800,
          }}>
            Post a load
          </Link>
          <Link aria-label="Navigation Link" href="/login" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
            padding: '0 24px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            color: '#f5f7fb',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 800,
          }}>
            Create account
          </Link>
        </div>
      </div>

      {/* Value props */}
      <div style={{
        padding: '0 20px 32px',
        maxWidth: 700,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
      }}>
        {[
          { emoji: 'ðŸ“¡', title: 'Live pressure tracking', desc: 'See which corridors have thin escort supply before routes go unfilled.' },
          { emoji: 'âš¡', title: 'Surge alerts', desc: 'Know when demand spikes on your lanes so you can act fast or price right.' },
          { emoji: 'ðŸŽ¯', title: 'Fill risk reduction', desc: 'Match loads to corridors where escorts are available, not guessing.' },
        ].map(item => (
          <div key={item.title} style={{
            padding: 20,
            borderRadius: 18,
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <div style={{ fontSize: 24 }}>{item.emoji}</div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800, color: '#f5f7fb' }}>{item.title}</div>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: '#8f97a7' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Live corridor pressure preview */}
      {proof.topCorridors.length > 0 && (
        <div style={{ padding: '0 20px 40px', maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#8f97a7',
            marginBottom: 12,
          }}>
            Live corridor pressure
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {proof.topCorridors.map(c => (
              <div key={c.label} style={{
                padding: 16,
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f5f7fb' }}>{c.label}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <DemandBadge level={c.demand} />
                    <span style={{ fontSize: 11, color: '#8f97a7' }}>{c.loads} loads/mo Â· ${c.rate.toLocaleString()} avg</span>
                  </div>
                </div>
                <Link aria-label="Navigation Link" href="/map" style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'rgba(198, 146, 58, 0.12)',
                  color: '#f1c27b',
                  textDecoration: 'none',
                  fontSize: 11,
                  fontWeight: 800,
                }}>
                  View â†’
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div style={{
        padding: '32px 20px 48px',
        maxWidth: 700,
        margin: '0 auto',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <p style={{ fontSize: 15, color: '#c7ccd7', margin: '0 0 20px' }}>
          Stop guessing. Start dispatching with real market data.
        </p>
        <Link aria-label="Navigation Link" href="/loads/post" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          padding: '0 32px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #c6923a, #f1c27b)',
          color: '#060b12',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 800,
        }}>
          Post your first load
        </Link>
      </div>
    </div>
  );
}