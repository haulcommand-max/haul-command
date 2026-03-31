'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { X, Globe, Users, TrendingUp, Mail, MapPin, ChevronRight, Search, Shield } from 'lucide-react';
import {
  ALL_COUNTRIES, COUNTRY_POSITIONS, COUNTRY_NOTES,
  TIER_COLORS, TIER_LABELS, COUNTRY_MAP,
  type TierCountry,
} from './worldMapData';

/* ═══════════════════════════════════════════════════════════════════
   WorldMapView — 120-Country Global Map with Tier Coloring
   Dot-map visualization with search, tier sidebar, and country panels
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#060b12', card: '#0f1a26', border: 'rgba(255,255,255,0.07)',
  gold: '#C6923A', text: '#f0f4f8', muted: '#8fa3b8',
} as const;

/* ── Slide-in Country Panel ─────────────────────────────────────── */
function CountryPanel({
  country, onClose
}: { country: TierCountry; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlist = async () => {
    if (!email) return;
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, country: country.iso, source: 'world_map' }),
      });
    } catch { /* ok */ }
    setSubmitted(true);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, maxWidth: '90vw',
      background: T.card, borderLeft: `1px solid ${T.border}`,
      zIndex: 9999, padding: '24px 20px', overflowY: 'auto',
      animation: 'slideInRight 0.25s ease-out',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      <button onClick={onClose} style={{
        position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
        color: T.muted, cursor: 'pointer', padding: 4,
      }}><X size={18} /></button>

      {/* Header */}
      <div style={{ fontSize: 40, marginBottom: 8 }}>{country.flag}</div>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: '0 0 6px' }}>{country.name}</h2>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800,
        background: `${TIER_COLORS[country.tier]}18`,
        border: `1px solid ${TIER_COLORS[country.tier]}40`,
        color: TIER_COLORS[country.tier],
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>{TIER_LABELS[country.tier]}</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0' }}>
        <div style={{ background: T.bg, borderRadius: 12, padding: '12px', border: `1px solid ${T.border}` }}>
          <Users size={14} style={{ color: T.gold, marginBottom: 4 }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{country.operators.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase' }}>Operators</div>
        </div>
        <div style={{ background: T.bg, borderRadius: 12, padding: '12px', border: `1px solid ${T.border}` }}>
          <TrendingUp size={14} style={{ color: T.gold, marginBottom: 4 }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{country.corridors.length}</div>
          <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase' }}>Corridors</div>
        </div>
      </div>

      {/* Corridors */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          Top Corridors
        </div>
        {country.corridors.map(c => (
          <div key={c} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            background: T.bg, borderRadius: 10, marginBottom: 6, border: `1px solid ${T.border}`,
            fontSize: 13, color: T.text,
          }}>
            <MapPin size={12} style={{ color: T.gold }} />
            {c}
          </div>
        ))}
      </div>

      {/* Regulatory Note */}
      {COUNTRY_NOTES[country.iso] && (
        <div style={{ marginBottom: 16, padding: '10px 12px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Shield size={12} style={{ color: T.gold }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Regulatory Summary</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{COUNTRY_NOTES[country.iso]}</p>
        </div>
      )}

      {/* CTA */}
      {country.live ? (
        <Link href={`/directory/${country.iso.toLowerCase()}`} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '14px', borderRadius: 14, textDecoration: 'none',
          background: `linear-gradient(135deg, ${T.gold}, #8A6428)`,
          color: '#000', fontSize: 14, fontWeight: 800,
        }}>
          View Directory <ChevronRight size={16} />
        </Link>
      ) : submitted ? (
        <div style={{
          padding: '14px', borderRadius: 14, textAlign: 'center',
          background: 'rgba(39,209,127,0.1)', border: '1px solid rgba(39,209,127,0.3)',
          color: '#27d17f', fontSize: 13, fontWeight: 700,
        }}>
          ✓ You're on the waitlist for {country.name}!
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 10, lineHeight: 1.5 }}>
            🚀 Launching soon — join the waitlist to be first notified
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 13,
                background: T.bg, border: `1px solid ${T.border}`, color: T.text,
                outline: 'none',
              }}
            />
            <button onClick={handleWaitlist} style={{
              padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${T.gold}, #8A6428)`,
              color: '#000', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
            }}>
              <Mail size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Legend ──────────────────────────────────────────────────────── */
function MapLegend() {
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 20, zIndex: 20,
      background: 'rgba(6,11,18,0.88)', backdropFilter: 'blur(12px)',
      border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 18px',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: T.muted, marginBottom: 8 }}>Coverage Tiers</div>
      {Object.entries(TIER_COLORS).map(([tier, color]) => (
        <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
          <span style={{ fontSize: 11, color: T.muted }}>{TIER_LABELS[tier]}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: '#1a2430' }} />
        <span style={{ fontSize: 11, color: T.muted }}>No Coverage</span>
      </div>
    </div>
  );
}

/* ── SVG World Map (simplified) ──────────────────────────────────── */
// Using a simplified approach: rendered as a positioned dot-map with country labels
// For a full GeoJSON map, MapLibre would be used, but this ensures it works everywhere

export function WorldMapView() {
  const [selected, setSelected] = useState<TierCountry | null>(null);
  const [search, setSearch] = useState('');

  const positions = COUNTRY_POSITIONS;

  const tiers = ['A', 'B', 'C', 'D'] as const;
  const tierGroups = useMemo(() => {
    const groups: Record<string, TierCountry[]> = { A: [], B: [], C: [], D: [] };
    ALL_COUNTRIES.forEach(c => groups[c.tier].push(c));
    return groups;
  }, []);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return ALL_COUNTRIES;
    const q = search.toLowerCase();
    return ALL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q)
    );
  }, [search]);

  const filteredGroups = useMemo(() => {
    const groups: Record<string, TierCountry[]> = { A: [], B: [], C: [], D: [] };
    filteredCountries.forEach(c => groups[c.tier].push(c));
    return groups;
  }, [filteredCountries]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#060b12', overflow: 'hidden' }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(59,164,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,164,255,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* Map title */}
      <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Globe size={16} style={{ color: T.gold }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Global Coverage
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>{ALL_COUNTRIES.length} countries</div>
      </div>

      {/* Country count badge */}
      <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 20 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
        }}>
          {tiers.map(tier => (
            <div key={tier} style={{
              padding: '6px 10px', borderRadius: 10, textAlign: 'center',
              background: `${TIER_COLORS[tier]}10`, border: `1px solid ${TIER_COLORS[tier]}25`,
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: TIER_COLORS[tier] }}>{tierGroups[tier].length}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Tier {tier}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Country dots */}
      {ALL_COUNTRIES.map(country => {
        const pos = positions[country.iso];
        if (!pos) return null;
        const color = TIER_COLORS[country.tier];
        const size = country.tier === 'A' ? 14 : country.tier === 'B' ? 10 : 7;

        return (
          <div
            key={country.iso}
            onClick={() => setSelected(country)}
            style={{
              position: 'absolute',
              left: `${pos.x}%`, top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer', zIndex: 10,
            }}
          >
            {/* Pulse ring for Tier A */}
            {country.tier === 'A' && (
              <div style={{
                position: 'absolute', inset: -4,
                borderRadius: '50%', border: `1px solid ${color}`,
                animation: 'pulse-slow 2s ease-in-out infinite',
                opacity: 0.3,
              }} />
            )}
            {/* Dot */}
            <div style={{
              width: size, height: size, borderRadius: '50%',
              background: color, boxShadow: `0 0 ${size}px ${color}60`,
              transition: 'transform 0.2s',
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.5)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
            />
            {/* Label for Tier A */}
            {country.tier === 'A' && (
              <div style={{
                position: 'absolute', top: size + 4, left: '50%', transform: 'translateX(-50%)',
                fontSize: 8, fontWeight: 800, color, whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                {country.iso}
              </div>
            )}
          </div>
        );
      })}

      {/* Planned corridor lines for Tier B-D */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
        {/* Example corridors */}
        {[
          // Mexico-US corridor
          { from: 'MX', to: 'US', tier: 'B' },
          // Europe corridors
          { from: 'FR', to: 'DE', tier: 'B' },
          { from: 'ES', to: 'FR', tier: 'B' },
          // Asia corridors
          { from: 'IN', to: 'AE', tier: 'C' },
          { from: 'JP', to: 'KR', tier: 'B' },
          // Africa corridors
          { from: 'NG', to: 'GH', tier: 'D' },
          { from: 'KE', to: 'TZ', tier: 'D' },
        ].map((line, i) => {
          const from = positions[line.from];
          const to = positions[line.to];
          if (!from || !to) return null;
          const color = TIER_COLORS[line.tier];
          return (
            <line
              key={i}
              x1={`${from.x}%`} y1={`${from.y}%`}
              x2={`${to.x}%`} y2={`${to.y}%`}
              stroke={color} strokeWidth="1" strokeOpacity="0.25"
              strokeDasharray="4 4"
            />
          );
        })}
      </svg>

      <MapLegend />

      {/* Country sidebar with search */}
      <div style={{
        position: 'absolute', right: 0, top: 80, bottom: 0, width: 240,
        overflowY: 'auto', padding: '0 12px 20px', zIndex: 15,
        background: 'linear-gradient(to left, rgba(6,11,18,0.92) 70%, transparent)',
      }}>
        {/* Search bar */}
        <div style={{ position: 'sticky', top: 0, paddingTop: 4, paddingBottom: 8, background: 'rgba(6,11,18,0.95)', zIndex: 2 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 120 countries…"
              aria-label="Search countries"
              style={{
                width: '100%', padding: '8px 10px 8px 30px', borderRadius: 10, fontSize: 11,
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
                color: T.text, outline: 'none',
              }}
            />
          </div>
        </div>

        {tiers.map(tier => {
          const items = filteredGroups[tier];
          if (items.length === 0) return null;
          return (
            <div key={tier} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 9, fontWeight: 800, color: TIER_COLORS[tier],
                textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6,
                padding: '4px 0', borderBottom: `1px solid ${TIER_COLORS[tier]}20`,
              }}>
                Tier {tier} — {items.length} countries
              </div>
              {items.map(c => (
                <div
                  key={c.iso}
                  onClick={() => setSelected(c)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                    borderRadius: 8, cursor: 'pointer', fontSize: 11, color: T.muted,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 14 }}>{c.flag}</span>
                  <span style={{ fontWeight: 600, color: c.live ? T.text : T.muted }}>{c.name}</span>
                  {c.live && <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#27d17f' }} />}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes pulse-slow { 0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.1; transform: translate(-50%, -50%) scale(1.5); } }`}</style>

      {/* Country detail panel */}
      {selected && <CountryPanel country={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export { ALL_COUNTRIES, TIER_COLORS, COUNTRY_MAP } from './worldMapData';
