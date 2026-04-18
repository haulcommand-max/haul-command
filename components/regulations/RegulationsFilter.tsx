'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RegFilterItem {
  countryCode: string;
  countryName: string;
  tier: string;
  terminology: string;     // primary local term
  thresholdCount: number;
  permitAuthority: string;
  dataQuality: string;
  confidenceState?: string;
  voiceAnswer: string;
}

interface Props {
  items: RegFilterItem[];
  /** slug prefix — /regulations or /escort-requirements */
  linkPrefix?: string;
}

const TIER_COLOR: Record<string, string> = {
  A: '#D4A843',
  B: '#60A5FA',
  C: '#94A3B8',
  D: '#64748B',
  E: '#B87333',
};

const TIER_LABEL: Record<string, string> = {
  A: 'Gold',
  B: 'Blue',
  C: 'Silver',
  D: 'Slate',
  E: 'Copper',
};

const QUALITY_DOT: Record<string, string> = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#ef4444',
};

function getFlag(code: string): string {
  const magic = 127397;
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + magic)).join('');
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RegulationsFilter({ items, linkPrefix = '/regulations' }: Props) {
  const [query, setQuery] = useState('');
  const [activeTier, setActiveTier] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter(item => {
      const matchesTier = !activeTier || item.tier === activeTier;
      const matchesQuery =
        !q ||
        item.countryName.toLowerCase().includes(q) ||
        item.countryCode.toLowerCase().includes(q) ||
        item.terminology.toLowerCase().includes(q) ||
        item.permitAuthority.toLowerCase().includes(q);
      return matchesTier && matchesQuery;
    });
  }, [query, activeTier, items]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.tier] = (counts[item.tier] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Group filtered items by tier for display
  const byTier = useMemo(() => {
    const groups: Record<string, RegFilterItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.tier]) groups[item.tier] = [];
      groups[item.tier].push(item);
    }
    return groups;
  }, [filtered]);

  const tierOrder = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div>
      {/* ── Search + Tier Filters ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 28 }}>
        {/* Search input */}
        <div style={{
          flex: '1 1 280px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '0 14px', height: 46,
        }}>
          <Search style={{ width: 15, height: 15, color: '#64748b', flexShrink: 0 }} />
          <input
            id="regulations-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search country, region, or permit authority…"
            aria-label="Search regulations by country or permit authority"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: '#e2e8f0',
              // Placeholder handled via CSS
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b' }}
              aria-label="Clear search"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Tier filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTier(null)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: 'pointer',
              background: !activeTier ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${!activeTier ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              color: !activeTier ? '#f9fafb' : '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >
            All ({items.length})
          </button>
          {tierOrder.filter(t => tierCounts[t]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTier(activeTier === t ? null : t)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                background: activeTier === t ? `${TIER_COLOR[t]}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTier === t ? `${TIER_COLOR[t]}40` : 'rgba(255,255,255,0.06)'}`,
                color: activeTier === t ? TIER_COLOR[t] : '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
            >
              {TIER_LABEL[t]} ({tierCounts[t]})
            </button>
          ))}
        </div>
      </div>

      {/* ── Result count ── */}
      {query || activeTier ? (
        <p style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>
          Showing {filtered.length} of {items.length} countries
          {query ? ` matching "${query}"` : ''}
          {activeTier ? ` · Tier ${activeTier} (${TIER_LABEL[activeTier]})` : ''}
        </p>
      ) : null}

      {/* ── Grouped results ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
          <p style={{ fontSize: 14 }}>No countries match your search.</p>
          <button
            onClick={() => { setQuery(''); setActiveTier(null); }}
            style={{
              marginTop: 12, padding: '8px 20px', borderRadius: 10, fontSize: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {tierOrder.filter(t => byTier[t]?.length).map((tierKey, tIdx) => {
            const regs = byTier[tierKey];
            const tier = TIER_COLOR[tierKey];
            return (
              <section key={tierKey} aria-label={`Tier ${tierKey} countries`}>
                {/* Tier header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: 16, paddingBottom: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <h2 style={{ fontSize: 14, fontWeight: 800, color: tier, margin: 0, letterSpacing: '-0.01em' }}>
                    Tier {tierKey} — {TIER_LABEL[tierKey]}
                  </h2>
                  <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                    {regs.length} countr{regs.length === 1 ? 'y' : 'ies'}
                  </span>
                </div>

                {/* Country cards grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 10,
                }}>
                  {regs.map(reg => (
                    <Link
                      key={reg.countryCode}
                      href={`${linkPrefix}/${reg.countryCode.toLowerCase()}`}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        padding: '14px 16px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        textDecoration: 'none', transition: 'all 0.15s',
                        height: '100%',
                      }}
                    >
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{getFlag(reg.countryCode)}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#f9fafb' }}>
                            {reg.countryName}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          padding: '2px 8px', borderRadius: 6,
                          color: TIER_COLOR[reg.tier], background: `${TIER_COLOR[reg.tier]}12`,
                          border: `1px solid ${TIER_COLOR[reg.tier]}30`,
                        }}>
                          {TIER_LABEL[reg.tier]}
                        </span>
                      </div>

                      {/* Local term */}
                      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px', fontStyle: 'italic' }}>
                        Local term: <strong style={{ color: '#94a3b8' }}>{reg.terminology}</strong>
                      </p>

                      {/* Stats row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
                        <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
                          {reg.thresholdCount} threshold{reg.thresholdCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, color: '#475569', fontWeight: 600,
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                            background: QUALITY_DOT[reg.dataQuality] || '#475569',
                          }} />
                          {reg.dataQuality} confidence
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: TIER_COLOR[reg.tier], fontWeight: 700 }}>
                          View rules →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Sponsor slot after every 2nd tier group */}
                {(tIdx + 1) % 2 === 0 && (
                  <div style={{
                    marginTop: 20, padding: '14px 18px', borderRadius: 14,
                    background: 'rgba(198,146,58,0.04)', border: '1px dashed rgba(198,146,58,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                  }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Sponsor Slot — Regulations
                      </span>
                      <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                        Reach operators checking regulations across 120+ countries.
                      </p>
                    </div>
                    <Link href="/advertise" style={{
                      padding: '7px 14px', borderRadius: 8,
                      background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.25)',
                      color: '#C6923A', fontSize: 11, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>
                      View Packages →
                    </Link>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
