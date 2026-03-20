/**
 * /regulations — Global Escort Vehicle Regulations Directory
 * 
 * Public page showing regulations for all 57 countries.
 * Users from any country can find:
 * - Official regulatory bodies and source URLs
 * - Escort thresholds (when pilot cars are required)
 * - Equipment requirements
 * - Local terminology 
 * - Permit systems
 * 
 * Powered by lib/regulations/global-regulations-db.ts
 */

import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { REGULATIONS, type CountryRegulation } from '@/lib/regulations/global-regulations-db';
import { OFFICIAL_REGULATORY_SOURCES, type OfficialSource } from '@/lib/regulations/official-sources';

export const metadata: Metadata = {
  title: 'Pilot Car Regulations by Country | Haul Command',
  description: 'Official pilot car and escort vehicle regulations for 57 countries. Find oversize load requirements, escort thresholds, permit authorities, and official government sources.',
};

const T = {
  bg: '#060b12', surface: '#0d1520', elevated: '#111d2b',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.14)',
  gold: '#f5b942', green: '#27d17f', blue: '#3ba4ff', red: '#f87171',
  text: '#f0f4f8', muted: '#8fa3b8', subtle: '#556070',
} as const;

const TIER_CONFIG = {
  A: { label: 'Tier A — Gold', color: '#f5b942', bg: 'rgba(245,185,66,0.06)', border: 'rgba(245,185,66,0.2)' },
  B: { label: 'Tier B — Blue', color: '#3ba4ff', bg: 'rgba(59,164,255,0.06)', border: 'rgba(59,164,255,0.2)' },
  C: { label: 'Tier C — Silver', color: '#9ca3af', bg: 'rgba(156,163,175,0.04)', border: 'rgba(156,163,175,0.15)' },
  D: { label: 'Tier D — Slate', color: '#6b7280', bg: 'rgba(107,114,128,0.04)', border: 'rgba(107,114,128,0.15)' },
} as const;

const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺', GB: '🇬🇧', NZ: '🇳🇿', ZA: '🇿🇦', DE: '🇩🇪', NL: '🇳🇱', AE: '🇦🇪', BR: '🇧🇷',
  IE: '🇮🇪', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', BE: '🇧🇪', AT: '🇦🇹', CH: '🇨🇭', ES: '🇪🇸', FR: '🇫🇷',
  IT: '🇮🇹', PT: '🇵🇹', SA: '🇸🇦', QA: '🇶🇦', MX: '🇲🇽', IN: '🇮🇳', ID: '🇮🇩', TH: '🇹🇭',
  PL: '🇵🇱', CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', SI: '🇸🇮', EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', HR: '🇭🇷', RO: '🇷🇴',
  BG: '🇧🇬', GR: '🇬🇷', TR: '🇹🇷', KW: '🇰🇼', OM: '🇴🇲', BH: '🇧🇭', SG: '🇸🇬', MY: '🇲🇾', JP: '🇯🇵', KR: '🇰🇷',
  CL: '🇨🇱', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪', VN: '🇻🇳', PH: '🇵🇭',
  UY: '🇺🇾', PA: '🇵🇦', CR: '🇨🇷',
};

function CountryCard({ reg, sources }: { reg: CountryRegulation; sources: OfficialSource[] }) {
  const tier = TIER_CONFIG[reg.tier];
  const flag = FLAG_MAP[reg.countryCode] || '🌍';
  const maxEscorts = Math.max(...reg.escortThresholds.map(t => t.escortsRequired), 0);
  const dq = reg.dataQuality;

  return (
    <div id={`reg-${reg.countryCode.toLowerCase()}`} className="ag-card-hover ag-section-enter" style={{
      background: T.surface,
      border: `1px solid ${tier.border}`,
      borderRadius: 16,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{flag}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{reg.countryName}</div>
            <div style={{ fontSize: 10, color: tier.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {reg.countryCode} · {tier.label.split(' — ')[1]}
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: dq === 'high' ? 'rgba(39,209,127,0.08)' : dq === 'medium' ? 'rgba(245,185,66,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${dq === 'high' ? 'rgba(39,209,127,0.2)' : dq === 'medium' ? 'rgba(245,185,66,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          <span style={{ fontSize: 8 }}>{dq === 'high' ? '🟢' : dq === 'medium' ? '🟡' : '🔴'}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: dq === 'high' ? T.green : dq === 'medium' ? T.gold : T.red }}>
            {dq.toUpperCase()} CONFIDENCE
          </span>
        </div>
      </div>

      {/* Local terminology */}
      <div style={{ fontSize: 11, color: T.muted }}>
        Local term: <strong style={{ color: T.text }}>{reg.terminology.primary}</strong>
        {reg.terminology.secondary && reg.terminology.secondary.length > 0 && (
          <span> · {reg.terminology.secondary.slice(0, 2).join(', ')}</span>
        )}
      </div>

      {/* Standard limits */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
      }}>
        {reg.standardLimits.widthM && (
          <span style={chipStyle}>W: {reg.standardLimits.widthM}m</span>
        )}
        {reg.standardLimits.heightM && (
          <span style={chipStyle}>H: {reg.standardLimits.heightM}m</span>
        )}
        {reg.standardLimits.lengthM && (
          <span style={chipStyle}>L: {reg.standardLimits.lengthM}m</span>
        )}
        {reg.standardLimits.weightT && (
          <span style={chipStyle}>⚖️ {reg.standardLimits.weightT}t</span>
        )}
      </div>

      {/* Escort thresholds */}
      <div style={{ background: T.elevated, borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Escort Requirements
        </div>
        {reg.escortThresholds.slice(0, 3).map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '3px 0', fontSize: 11, color: T.muted }}>
            <span style={{
              minWidth: 20, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: t.escortsRequired >= 2 ? 'rgba(239,68,68,0.12)' : 'rgba(39,209,127,0.08)',
              border: `1px solid ${t.escortsRequired >= 2 ? 'rgba(239,68,68,0.25)' : 'rgba(39,209,127,0.2)'}`,
              fontSize: 9, fontWeight: 800, color: t.escortsRequired >= 2 ? T.red : T.green,
            }}>
              {t.escortsRequired}
            </span>
            <span>{t.condition}{t.notes ? ` — ${t.notes}` : ''}</span>
          </div>
        ))}
        {reg.escortThresholds.length > 3 && (
          <div style={{ fontSize: 10, color: T.subtle, marginTop: 4 }}>
            +{reg.escortThresholds.length - 3} more thresholds
          </div>
        )}
      </div>

      {/* Permit authority */}
      <div style={{ fontSize: 11, color: T.muted }}>
        📋 <strong style={{ color: T.text }}>{reg.permitSystem.authority}</strong>
        {reg.permitSystem.digitalSystem && (
          <span style={{ marginLeft: 4, padding: '1px 6px', borderRadius: 4, background: 'rgba(59,164,255,0.08)', border: '1px solid rgba(59,164,255,0.2)', fontSize: 9, color: T.blue, fontWeight: 700 }}>
            {reg.permitSystem.digitalSystem}
          </span>
        )}
      </div>

      {/* Official sources */}
      {sources.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            📌 Official Sources
          </div>
          {sources.slice(0, 3).map((src, i) => (
            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', fontSize: 11, color: T.blue, marginBottom: 4,
              textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              🔗 {src.label}
            </a>
          ))}
        </div>
      )}

      {/* Certification */}
      {reg.certification && (
        <div style={{ fontSize: 10, color: reg.certification.required ? T.gold : T.subtle }}>
          {reg.certification.required ? '🎓 Certification required' : '📝 No formal certification required'}
        </div>
      )}
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  padding: '2px 8px', borderRadius: 6,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 10, fontWeight: 700, color: '#9ca3af',
};

export default function RegulationsPage() {
  const sourceMap = new Map<string, OfficialSource[]>();
  for (const src of OFFICIAL_REGULATORY_SOURCES) {
    const arr = sourceMap.get(src.countryCode) || [];
    arr.push(src);
    sourceMap.set(src.countryCode, arr);
  }

  const tiers: Array<{ tier: 'A' | 'B' | 'C' | 'D'; regs: CountryRegulation[] }> = [
    { tier: 'A', regs: REGULATIONS.filter(r => r.tier === 'A') },
    { tier: 'B', regs: REGULATIONS.filter(r => r.tier === 'B') },
    { tier: 'C', regs: REGULATIONS.filter(r => r.tier === 'C') },
    { tier: 'D', regs: REGULATIONS.filter(r => r.tier === 'D') },
  ];

  return (
    <main style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Hero */}
      <div style={{
        padding: '64px 20px 48px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(245,185,66,0.04), transparent)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 99,
          background: 'rgba(39,209,127,0.08)', border: '1px solid rgba(39,209,127,0.2)',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: T.green, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            57 Countries · Official Sources
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 46px)',
          fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.02em',
        }}>
          Global Pilot Car <span style={{ color: T.gold }}>Regulations</span>
        </h1>

        <p style={{ fontSize: 15, color: T.muted, maxWidth: 600, margin: '0 auto 24px', lineHeight: 1.6 }}>
          Official escort vehicle requirements, oversize load thresholds, permit authorities, and
          government sources for every country on the Haul Command network.
        </p>

        {/* Quick jump */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 700, margin: '0 auto' }}>
          {REGULATIONS.slice(0, 20).map(r => (
            <a key={r.countryCode} href={`#reg-${r.countryCode.toLowerCase()}`} style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
              color: T.muted, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              textDecoration: 'none',
            }}>
              {FLAG_MAP[r.countryCode] || ''} {r.countryCode}
            </a>
          ))}
          <span style={{ padding: '4px 10px', fontSize: 11, color: T.subtle }}>
            +{REGULATIONS.length - 20} more
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {/* Stats bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 32,
        }}>
          {[
            { label: 'Countries Covered', value: REGULATIONS.length.toString(), color: T.gold },
            { label: 'High Confidence', value: REGULATIONS.filter(r => r.dataQuality === 'high').length.toString(), color: T.green },
            { label: 'Permit Systems', value: new Set(REGULATIONS.map(r => r.permitSystem.authority)).size.toString(), color: T.blue },
            { label: 'Official Sources', value: OFFICIAL_REGULATORY_SOURCES.length.toString(), color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '14px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tier sections */}
        {tiers.map(({ tier, regs }) => {
          const tc = TIER_CONFIG[tier];
          return (
            <section key={tier} style={{ marginBottom: 40 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                padding: '10px 16px', borderRadius: 10,
                background: tc.bg, border: `1px solid ${tc.border}`,
              }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: tc.color }}>{tc.label}</span>
                <span style={{ fontSize: 11, color: T.muted }}>— {regs.length} countries</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 14,
              }}>
                {regs.map(reg => (
                  <CountryCard key={reg.countryCode} reg={reg} sources={sourceMap.get(reg.countryCode) || []} />
                ))}
              </div>
            </section>
          );
        })}

        {/* AI Copilot CTA */}
        <div className="ag-section-enter" style={{
          background: 'linear-gradient(135deg, rgba(245,185,66,0.06), rgba(59,164,255,0.04))',
          border: `1px solid rgba(245,185,66,0.2)`, borderRadius: 20, padding: '32px 24px',
          textAlign: 'center', marginTop: 32,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
            Need Specific Answers?
          </h2>
          <p style={{ fontSize: 14, color: T.muted, marginBottom: 20, maxWidth: 500, margin: '0 auto 20px' }}>
            Ask our AI Compliance Copilot about specific routes, dimensions, or state-level requirements.
          </p>
          <Link href="/tools/compliance-copilot" className="ag-press" style={{
            display: 'inline-block', padding: '14px 32px', borderRadius: 12,
            background: 'linear-gradient(135deg, #f5b942, #d97706)',
            color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
          }}>
            Ask the Compliance Copilot →
          </Link>
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 32, padding: '16px', borderRadius: 12,
          background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
          fontSize: 11, color: T.subtle, lineHeight: 1.6,
        }}>
          <strong style={{ color: T.gold }}>⚠️ Disclaimer:</strong> This information is provided as a reference guide
          and may not reflect the most current regulations. Always verify requirements with the official permit
          authority in your jurisdiction before transporting oversize loads. Regulations change frequently and may
          vary by route, load type, and local conditions. Haul Command is not liable for regulatory non-compliance.
        </div>
      </div>
    </main>
  );
}
