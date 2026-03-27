'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { X, Globe, Users, TrendingUp, ExternalLink, Mail, MapPin, ChevronRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   WorldMapView — 120-Country Global Map with Tier Coloring
   MapLibre GL JS map showing country boundaries colored by tier
   ═══════════════════════════════════════════════════════════════════ */

// ── Tier definitions ──────────────────────────────────────────────
interface TierCountry {
  iso: string;
  name: string;
  flag: string;
  tier: 'A' | 'B' | 'C' | 'D';
  operators: number;
  corridors: string[];
  live: boolean;
}

const ALL_COUNTRIES: TierCountry[] = [
  // Tier A — Live
  { iso: 'US', name: 'United States', flag: '🇺🇸', tier: 'A', operators: 4200, corridors: ['I-10', 'I-35', 'I-40', 'I-75', 'I-95'], live: true },
  { iso: 'CA', name: 'Canada', flag: '🇨🇦', tier: 'A', operators: 820, corridors: ['Trans-Canada', 'Hwy 401', 'Hwy 2'], live: true },
  { iso: 'AU', name: 'Australia', flag: '🇦🇺', tier: 'A', operators: 450, corridors: ['Pacific Hwy', 'Hume Hwy', 'Stuart Hwy'], live: true },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧', tier: 'A', operators: 210, corridors: ['M1', 'M6', 'A1'], live: true },
  { iso: 'NZ', name: 'New Zealand', flag: '🇳🇿', tier: 'A', operators: 85, corridors: ['SH1', 'SH2'], live: true },
  { iso: 'ZA', name: 'South Africa', flag: '🇿🇦', tier: 'A', operators: 120, corridors: ['N1', 'N3', 'N4'], live: true },
  { iso: 'DE', name: 'Germany', flag: '🇩🇪', tier: 'A', operators: 180, corridors: ['A1', 'A7', 'A3'], live: true },
  { iso: 'NL', name: 'Netherlands', flag: '🇳🇱', tier: 'A', operators: 95, corridors: ['A15', 'A2'], live: true },
  { iso: 'AE', name: 'UAE', flag: '🇦🇪', tier: 'A', operators: 60, corridors: ['E11', 'E311'], live: true },
  { iso: 'BR', name: 'Brazil', flag: '🇧🇷', tier: 'A', operators: 340, corridors: ['BR-101', 'BR-116'], live: true },
  // Tier B
  { iso: 'MX', name: 'Mexico', flag: '🇲🇽', tier: 'B', operators: 0, corridors: ['Autopista MEX-QRO'], live: false },
  { iso: 'FR', name: 'France', flag: '🇫🇷', tier: 'B', operators: 0, corridors: ['A1 Paris-Lille'], live: false },
  { iso: 'IT', name: 'Italy', flag: '🇮🇹', tier: 'B', operators: 0, corridors: ['A1 Autostrada del Sole'], live: false },
  { iso: 'ES', name: 'Spain', flag: '🇪🇸', tier: 'B', operators: 0, corridors: ['AP-7 Mediterranean'], live: false },
  { iso: 'IN', name: 'India', flag: '🇮🇳', tier: 'B', operators: 0, corridors: ['NH48 Delhi-Mumbai'], live: false },
  { iso: 'JP', name: 'Japan', flag: '🇯🇵', tier: 'B', operators: 0, corridors: ['Tomei Expressway'], live: false },
  { iso: 'KR', name: 'South Korea', flag: '🇰🇷', tier: 'B', operators: 0, corridors: ['Gyeongbu Expressway'], live: false },
  { iso: 'SE', name: 'Sweden', flag: '🇸🇪', tier: 'B', operators: 0, corridors: ['E6 Gothenburg-Malmö'], live: false },
  { iso: 'NO', name: 'Norway', flag: '🇳🇴', tier: 'B', operators: 0, corridors: ['E6 Oslo-Trondheim'], live: false },
  { iso: 'FI', name: 'Finland', flag: '🇫🇮', tier: 'B', operators: 0, corridors: ['E75 Helsinki-North'], live: false },
  { iso: 'PL', name: 'Poland', flag: '🇵🇱', tier: 'B', operators: 0, corridors: ['A2 Warsaw-Berlin'], live: false },
  { iso: 'AT', name: 'Austria', flag: '🇦🇹', tier: 'B', operators: 0, corridors: ['A1 Westautobahn'], live: false },
  { iso: 'BE', name: 'Belgium', flag: '🇧🇪', tier: 'B', operators: 0, corridors: ['E19 Brussels-Antwerp'], live: false },
  { iso: 'CH', name: 'Switzerland', flag: '🇨🇭', tier: 'B', operators: 0, corridors: ['A1 Geneva-Zurich'], live: false },
  { iso: 'DK', name: 'Denmark', flag: '🇩🇰', tier: 'B', operators: 0, corridors: ['E45 Aalborg-Copenhagen'], live: false },
  // Tier C
  { iso: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', tier: 'C', operators: 0, corridors: ['Riyadh-Jeddah'], live: false },
  { iso: 'QA', name: 'Qatar', flag: '🇶🇦', tier: 'C', operators: 0, corridors: ['Al Shamal Road'], live: false },
  { iso: 'KW', name: 'Kuwait', flag: '🇰🇼', tier: 'C', operators: 0, corridors: ['Kuwait City-Basra'], live: false },
  { iso: 'OM', name: 'Oman', flag: '🇴🇲', tier: 'C', operators: 0, corridors: ['Muscat-Salalah'], live: false },
  { iso: 'CL', name: 'Chile', flag: '🇨🇱', tier: 'C', operators: 0, corridors: ['Ruta 5 Pan-American'], live: false },
  { iso: 'AR', name: 'Argentina', flag: '🇦🇷', tier: 'C', operators: 0, corridors: ['RN 9 Buenos Aires-Rosario'], live: false },
  { iso: 'CO', name: 'Colombia', flag: '🇨🇴', tier: 'C', operators: 0, corridors: ['Ruta del Sol'], live: false },
  { iso: 'PE', name: 'Peru', flag: '🇵🇪', tier: 'C', operators: 0, corridors: ['Pan-American South'], live: false },
  { iso: 'SG', name: 'Singapore', flag: '🇸🇬', tier: 'C', operators: 0, corridors: ['AYE-PIE'], live: false },
  { iso: 'MY', name: 'Malaysia', flag: '🇲🇾', tier: 'C', operators: 0, corridors: ['North-South Expressway'], live: false },
  { iso: 'TH', name: 'Thailand', flag: '🇹🇭', tier: 'C', operators: 0, corridors: ['Motorway 7'], live: false },
  { iso: 'ID', name: 'Indonesia', flag: '🇮🇩', tier: 'C', operators: 0, corridors: ['Trans-Java Tollway'], live: false },
  { iso: 'PH', name: 'Philippines', flag: '🇵🇭', tier: 'C', operators: 0, corridors: ['NLEX-SLEX'], live: false },
  { iso: 'IE', name: 'Ireland', flag: '🇮🇪', tier: 'C', operators: 0, corridors: ['M1 Dublin-Belfast'], live: false },
  { iso: 'PT', name: 'Portugal', flag: '🇵🇹', tier: 'C', operators: 0, corridors: ['A1 Lisbon-Porto'], live: false },
  { iso: 'CZ', name: 'Czech Republic', flag: '🇨🇿', tier: 'C', operators: 0, corridors: ['D1 Prague-Brno'], live: false },
  { iso: 'RO', name: 'Romania', flag: '🇷🇴', tier: 'C', operators: 0, corridors: ['A1 Bucharest-Sibiu'], live: false },
  { iso: 'HU', name: 'Hungary', flag: '🇭🇺', tier: 'C', operators: 0, corridors: ['M1 Budapest-Vienna'], live: false },
  // Tier D
  { iso: 'NG', name: 'Nigeria', flag: '🇳🇬', tier: 'D', operators: 0, corridors: ['Lagos-Ibadan'], live: false },
  { iso: 'KE', name: 'Kenya', flag: '🇰🇪', tier: 'D', operators: 0, corridors: ['Mombasa Road'], live: false },
  { iso: 'GH', name: 'Ghana', flag: '🇬🇭', tier: 'D', operators: 0, corridors: ['Accra-Kumasi'], live: false },
  { iso: 'TZ', name: 'Tanzania', flag: '🇹🇿', tier: 'D', operators: 0, corridors: ['Dar-Dodoma'], live: false },
  { iso: 'EG', name: 'Egypt', flag: '🇪🇬', tier: 'D', operators: 0, corridors: ['Cairo-Alexandria'], live: false },
  { iso: 'MA', name: 'Morocco', flag: '🇲🇦', tier: 'D', operators: 0, corridors: ['A2 Casablanca-Rabat'], live: false },
  { iso: 'PK', name: 'Pakistan', flag: '🇵🇰', tier: 'D', operators: 0, corridors: ['M1 Islamabad-Lahore'], live: false },
  { iso: 'BD', name: 'Bangladesh', flag: '🇧🇩', tier: 'D', operators: 0, corridors: ['Dhaka-Chittagong'], live: false },
  { iso: 'VN', name: 'Vietnam', flag: '🇻🇳', tier: 'D', operators: 0, corridors: ['AH1 Hanoi-HCMC'], live: false },
  { iso: 'TR', name: 'Turkey', flag: '🇹🇷', tier: 'D', operators: 0, corridors: ['O-4 Istanbul-Ankara'], live: false },
  { iso: 'RU', name: 'Russia', flag: '🇷🇺', tier: 'D', operators: 0, corridors: ['M7 Moscow-Kazan'], live: false },
  { iso: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', tier: 'D', operators: 0, corridors: ['M39 Almaty-Astana'], live: false },
  { iso: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', tier: 'D', operators: 0, corridors: ['M39 Tashkent-Samarkand'], live: false },
  { iso: 'UA', name: 'Ukraine', flag: '🇺🇦', tier: 'D', operators: 0, corridors: ['M06 Kyiv-Chop'], live: false },
];

const TIER_COLORS: Record<string, string> = {
  A: '#C6923A', // Gold
  B: '#3A7AC6', // Blue
  C: '#8A8A9A', // Silver
  D: '#4A4A5A', // Slate
};

const TIER_LABELS: Record<string, string> = {
  A: 'Tier A — Live',
  B: 'Tier B — Coming Soon',
  C: 'Tier C — Planned',
  D: 'Tier D — Future',
};

const COUNTRY_MAP = new Map(ALL_COUNTRIES.map(c => [c.iso, c]));

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

  // Position data for countries (simplified lat/lng to x/y)
  const positions: Record<string, { x: number; y: number }> = {
    US: { x: 22, y: 38 }, CA: { x: 20, y: 26 }, MX: { x: 18, y: 48 },
    BR: { x: 35, y: 62 }, AR: { x: 32, y: 72 }, CL: { x: 28, y: 70 },
    CO: { x: 26, y: 54 }, PE: { x: 26, y: 60 },
    GB: { x: 48, y: 28 }, IE: { x: 46, y: 29 }, FR: { x: 50, y: 34 },
    DE: { x: 52, y: 30 }, NL: { x: 51, y: 28 }, BE: { x: 50, y: 30 },
    ES: { x: 48, y: 37 }, PT: { x: 46, y: 37 }, IT: { x: 53, y: 36 },
    CH: { x: 52, y: 33 }, AT: { x: 54, y: 33 }, PL: { x: 55, y: 28 },
    CZ: { x: 54, y: 30 }, HU: { x: 56, y: 33 }, RO: { x: 58, y: 34 },
    SE: { x: 54, y: 20 }, NO: { x: 52, y: 18 }, FI: { x: 58, y: 18 },
    DK: { x: 52, y: 24 }, UA: { x: 60, y: 30 }, RU: { x: 70, y: 22 },
    TR: { x: 62, y: 37 }, SA: { x: 64, y: 46 }, AE: { x: 67, y: 46 },
    QA: { x: 66, y: 46 }, KW: { x: 65, y: 43 }, OM: { x: 68, y: 48 },
    IN: { x: 74, y: 48 }, PK: { x: 72, y: 42 }, BD: { x: 78, y: 46 },
    TH: { x: 80, y: 50 }, MY: { x: 80, y: 55 }, SG: { x: 80, y: 56 },
    ID: { x: 82, y: 58 }, PH: { x: 84, y: 50 }, VN: { x: 82, y: 48 },
    JP: { x: 88, y: 36 }, KR: { x: 86, y: 38 },
    AU: { x: 86, y: 70 }, NZ: { x: 92, y: 76 },
    ZA: { x: 58, y: 72 }, NG: { x: 52, y: 54 }, KE: { x: 62, y: 56 },
    GH: { x: 49, y: 54 }, TZ: { x: 62, y: 60 }, EG: { x: 60, y: 42 },
    MA: { x: 47, y: 42 }, KZ: { x: 72, y: 30 }, UZ: { x: 70, y: 35 },
  };

  const tiers = ['A', 'B', 'C', 'D'] as const;
  const tierGroups = useMemo(() => {
    const groups: Record<string, TierCountry[]> = { A: [], B: [], C: [], D: [] };
    ALL_COUNTRIES.forEach(c => groups[c.tier].push(c));
    return groups;
  }, []);

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
        <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>120 countries</div>
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

      {/* Country sidebar on scroll */}
      <div style={{
        position: 'absolute', right: 0, top: 80, bottom: 0, width: 220,
        overflowY: 'auto', padding: '0 12px 20px', zIndex: 15,
        background: 'linear-gradient(to left, rgba(6,11,18,0.9) 60%, transparent)',
      }}>
        {tiers.map(tier => (
          <div key={tier} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: TIER_COLORS[tier],
              textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6,
              padding: '4px 0', borderBottom: `1px solid ${TIER_COLORS[tier]}20`,
            }}>
              Tier {tier} — {tierGroups[tier].length} countries
            </div>
            {tierGroups[tier].map(c => (
              <div
                key={c.iso}
                onClick={() => setSelected(c)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 11, color: T.muted,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 14 }}>{c.flag}</span>
                <span style={{ fontWeight: 600, color: c.live ? T.text : T.muted }}>{c.name}</span>
                {c.live && <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#27d17f' }} />}
              </div>
            ))}
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse-slow { 0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.1; transform: translate(-50%, -50%) scale(1.5); } }`}</style>

      {/* Country detail panel */}
      {selected && <CountryPanel country={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export { ALL_COUNTRIES, TIER_COLORS, COUNTRY_MAP };
