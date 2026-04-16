import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, Shield, MapPin, Scale, Zap, Award, Globe, FileText, TrendingUp } from 'lucide-react';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { countryFullName } from '@/lib/geo/state-names';
import { US_STATES } from '@/lib/geo/state-names';
import { REGULATIONS, getRegulation } from '@/lib/regulations/global-regulations-db';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const code = country.toUpperCase();
  const name = countryFullName(country);
  const reg = getRegulation(code);
  return {
    title: `${name} Pilot Car & Escort Regulations ${new Date().getFullYear()} | Haul Command`,
    description: reg
      ? `${name} escort vehicle regulations: ${reg.escortThresholds.length} threshold tiers, permit system via ${reg.permitSystem.authority}, local terminology (${reg.terminology.primary}). Verified oversize load compliance data.`
      : `Complete guide to oversize load escort requirements in ${name}. Pilot car regulations, permit thresholds, equipment requirements, and certification standards.`,
    alternates: {
      canonical: `https://www.haulcommand.com/regulations/${country.toLowerCase()}`,
      languages: {
        'en': `https://www.haulcommand.com/regulations/${country.toLowerCase()}`,
        'x-default': `https://www.haulcommand.com/regulations/${country.toLowerCase()}`,
      },
    },
    openGraph: {
      title: `${name} Escort & Pilot Car Regulations | Haul Command`,
      description: reg?.voiceAnswer,
      url: `https://www.haulcommand.com/regulations/${country.toLowerCase()}`,
    },
  };
}

const TIER_COLOR: Record<string, string> = {
  A: '#D4A843', B: '#60A5FA', C: '#94A3B8', D: '#64748B', E: '#B87333',
};
const TIER_LABEL: Record<string, string> = {
  A: 'Gold — Full Data', B: 'Blue — Good Coverage', C: 'Silver — Partial Data',
  D: 'Slate — Limited Data', E: 'Copper — Frontier',
};

// Seed data for top US states
const US_STATE_DATA: Record<string, { width: string; length: string; escort: string; cert: string }> = {
  TX: { width: '12 ft', length: '110 ft', escort: '1 front above 14 ft', cert: 'TxDMV' },
  CA: { width: '10 ft', length: '100 ft', escort: '1 escort 10–12 ft', cert: 'Caltrans' },
  FL: { width: '12 ft', length: '95 ft', escort: '1 front above 14 ft', cert: 'FDOT' },
  OK: { width: '12 ft', length: '110 ft', escort: '1 escort above 14 ft', cert: 'State cert' },
  LA: { width: '12 ft', length: '100 ft', escort: '1 front above 14 ft', cert: 'LDOTD' },
  NY: { width: '10 ft', length: '85 ft', escort: '1 front and 1 rear above 14 ft', cert: 'NYSDOT' },
  PA: { width: '10 ft', length: '85 ft', escort: '1 escort above 13 ft', cert: 'PennDOT' },
  OH: { width: '12 ft', length: '100 ft', escort: '1 front above 14 ft', cert: 'ODOT' },
  WA: { width: '10 ft', length: '95 ft', escort: '1 front above 12 ft', cert: 'WSDOT' },
  OR: { width: '10 ft', length: '100 ft', escort: '1 front above 12 ft', cert: 'ODOT' },
};

function getFlag(code: string): string {
  const magic = 127397;
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + magic)).join('');
}

export default async function RegulationCountryPage({ params }: PageProps) {
  const { country } = await params;
  const countryCode = country.toUpperCase();
  const name = countryFullName(country);
  const isUS = countryCode === 'US';
  const reg = getRegulation(countryCode);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${name} Escort Vehicle Regulations`,
        url: `https://www.haulcommand.com/regulations/${country.toLowerCase()}`,
        description: reg?.voiceAnswer || `Escort vehicle regulations for oversize loads in ${name}.`,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
            { '@type': 'ListItem', position: 2, name: 'Regulations', item: 'https://www.haulcommand.com/regulations' },
            { '@type': 'ListItem', position: 3, name: name, item: `https://www.haulcommand.com/regulations/${country.toLowerCase()}` },
          ],
        },
      },
      ...(reg ? [{
        '@type': 'FAQPage',
        mainEntity: [{
          '@type': 'Question',
          name: `Do I need a pilot car in ${name}?`,
          acceptedAnswer: { '@type': 'Answer', text: reg.voiceAnswer },
        }],
      }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProofStrip variant="bar" />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#0A0D14', overflow: 'hidden', minHeight: 280, display: 'flex', alignItems: 'center',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '60%', height: '100%', background: 'radial-gradient(ellipse at 0% 50%, rgba(59,130,246,0.07), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem', position: 'relative', zIndex: 1, width: '100%' }}>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            <Link href="/regulations" style={{ color: '#6b7280', textDecoration: 'none' }}>Regulations</Link>
            <ChevronRight style={{ width: 10, height: 10 }} />
            <span style={{ color: '#C6923A' }}>{name}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 32 }}>{getFlag(countryCode)}</span>
            {reg && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, color: TIER_COLOR[reg.tier] || '#64748b', background: `${TIER_COLOR[reg.tier]}15`, border: `1px solid ${TIER_COLOR[reg.tier]}30` }}>
                {TIER_LABEL[reg.tier] || `Tier ${reg.tier}`}
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
              ✓ Compliance Guide
            </span>
          </div>

          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {name} Escort Vehicle <span style={{ color: '#C6923A' }}>Regulations</span>
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
            {reg?.voiceAnswer || (isUS
              ? 'State-by-state escort vehicle requirements, pilot car certification standards, and oversize load thresholds for all 50 states.'
              : `Pilot car requirements, permit thresholds, and certification standards for oversize loads in ${name}.`
            )}
          </p>
        </div>
      </section>

      {/* ── TOP SPONSOR SLOT ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <AdGridSlot zone={`regulations_country_${countryCode.toLowerCase()}_top`} />
      </div>

      {/* ── MAIN TWO-COLUMN ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 1.5rem 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 32, alignItems: 'start' }}>

          {/* ── LEFT: Country Data ── */}
          <div>
            {reg ? (
              /* ── REGULATED COUNTRY WITH FULL DATA ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Terminology + Standard Limits */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Scale style={{ width: 15, height: 15, color: '#C6923A' }} /> Overview
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                      { label: 'Local Term', value: reg.terminology.primary, sub: reg.terminology.secondary?.join(' · ') },
                      { label: 'Language', value: reg.terminology.language.toUpperCase() },
                      { label: 'Permit Authority', value: reg.permitSystem.authority },
                      { label: 'Data Quality', value: reg.dataQuality.toUpperCase(), color: reg.dataQuality === 'high' ? '#22c55e' : reg.dataQuality === 'medium' ? '#f59e0b' : '#ef4444' },
                      { label: 'Max Width (std)', value: `${reg.standardLimits.widthM}m (${(reg.standardLimits.widthM * 3.281).toFixed(1)} ft)` },
                      ...(reg.standardLimits.heightM ? [{ label: 'Max Height (std)', value: `${reg.standardLimits.heightM}m` }] : []),
                      ...(reg.standardLimits.lengthM ? [{ label: 'Max Length (std)', value: `${reg.standardLimits.lengthM}m` }] : []),
                      ...(reg.standardLimits.weightT ? [{ label: 'Max Weight (std)', value: `${reg.standardLimits.weightT}t` }] : []),
                    ].map(item => (
                      <div key={item.label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: (item as any).color || '#e2e8f0' }}>{item.value}</div>
                        {(item as any).sub && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{(item as any).sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escort Thresholds */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(198,146,58,0.14)', borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield style={{ width: 15, height: 15, color: '#C6923A' }} /> Escort Thresholds
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {reg.escortThresholds.map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', borderRadius: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{t.condition}</div>
                          {t.notes && <div style={{ fontSize: 11, color: '#64748b' }}>{t.notes}</div>}
                        </div>
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#C6923A' }}>{t.escortsRequired}×</div>
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{t.escortType.replace('_', ' ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipment Required */}
                {reg.equipment && reg.equipment.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 16px' }}>Required Equipment</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {reg.equipment.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#d1d5db' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C6923A', flexShrink: 0 }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel Restrictions */}
                {reg.restrictions && reg.restrictions.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 16, padding: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 16px' }}>⚠ Travel Restrictions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {reg.restrictions.map((r, i) => (
                        <div key={i} style={{ fontSize: 13, color: '#fca5a5', display: 'flex', gap: 10 }}>
                          <span style={{ flexShrink: 0, color: '#ef4444' }}>✗</span> {r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certification */}
                {reg.certification && (
                  <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 16, padding: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Award style={{ width: 15, height: 15, color: '#a78bfa' }} /> Certification
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: reg.certification.required ? '#22c55e' : '#64748b', background: reg.certification.required ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${reg.certification.required ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, padding: '3px 10px' }}>
                        {reg.certification.required ? '✓ Required' : 'Not Required'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{reg.certification.details}</p>
                    {reg.certification.required && (
                      <Link href="/training" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 16px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                        Get HC Certified →
                      </Link>
                    )}
                  </div>
                )}

                {/* Permit System */}
                {reg.permitSystem.url && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 10px' }}>Permit Authority</h2>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>{reg.permitSystem.authority}</p>
                    {reg.permitSystem.permitTypes && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {reg.permitSystem.permitTypes.map(pt => (
                          <span key={pt} style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>{pt}</span>
                        ))}
                      </div>
                    )}
                    <a href={reg.permitSystem.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: '#60a5fa', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                      Official Permit Portal ↗
                    </a>
                  </div>
                )}

                {/* Data transparency footer */}
                <div style={{ fontSize: 10, color: '#374151', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  Data confidence: <strong style={{ color: '#475569' }}>{reg.confidenceState?.replace(/_/g, ' ') || reg.dataQuality}</strong> · Last verified: {reg.lastVerified || 'April 2026'} · Source: {reg.permitSystem.authority}
                </div>
              </div>
            ) : isUS ? (
              /* ── US: Browse all states ── */
              <>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin style={{ width: 18, height: 18, color: '#C6923A' }} /> Browse All 50 States
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {Object.entries(US_STATES).map(([code, fullName]) => {
                      const hasData = !!US_STATE_DATA[code];
                      return (
                        <Link key={code} href={`/escort-requirements/${code.toLowerCase()}`} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 14px', borderRadius: 10,
                          background: hasData ? 'rgba(198,146,58,0.04)' : 'rgba(255,255,255,0.015)',
                          border: `1px solid ${hasData ? 'rgba(198,146,58,0.16)' : 'rgba(255,255,255,0.05)'}`,
                          textDecoration: 'none', fontSize: 13, fontWeight: 600,
                          color: hasData ? '#e2e8f0' : '#64748b',
                        }}>
                          <span style={{ fontWeight: 800, color: hasData ? '#C6923A' : '#475569' }}>{code}</span>
                          <span style={{ fontSize: 11 }}>{fullName}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Summary table for seeded states */}
                <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 16px' }}>State-by-State Overview</h2>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['State', 'Width Threshold', 'Escort Required', 'Cert Body'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(US_STATE_DATA).map(([code, d]) => (
                        <tr key={code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                            <Link href={`/escort-requirements/${code.toLowerCase()}`} style={{ color: '#C6923A', textDecoration: 'none' }}>{d.escort ? code : code}</Link>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#d1d5db' }}>{d.width}</td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 11 }}>{d.escort}</td>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 11 }}>{d.cert}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              /* ── NON-US, NO DATA IN REGULATIONS DB ── */
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
                <span style={{ fontSize: 48 }}>{getFlag(countryCode)}</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', margin: '16px 0 8px' }}>{name} — Expanding Coverage</h2>
                <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  We're compiling verified escort vehicle regulations, permit thresholds, and certification requirements for {name}.
                  Our Tier A–E coverage spans {REGULATIONS.length} countries — {name} is in our expansion queue.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/regulations" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 12, background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.22)', color: '#C6923A', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                    Browse All Countries →
                  </Link>
                  <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    Find Local Escorts
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>

            {/* Find Escorts in this country */}
            <div style={{ background: 'linear-gradient(135deg, rgba(198,146,58,0.1), rgba(198,146,58,0.03))', border: '1px solid rgba(198,146,58,0.22)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin style={{ width: 14, height: 14, color: '#C6923A' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Find Escorts</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                Find verified pilot car operators in {name}. Real availability, trust scores.
              </p>
              <Link href={`/directory?country=${countryCode}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', borderRadius: 10, width: '100%', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
                Search {name} Escorts
              </Link>
              <Link href="/available-now" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 0', borderRadius: 10, width: '100%', marginTop: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', color: '#22c55e', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                🟢 Available Now
              </Link>
            </div>

            {/* Claim Listing */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield style={{ width: 14, height: 14, color: '#22c55e' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Escort Operators</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>List your operation in {name}. Free to claim, instant trust score.</p>
              <Link href="/claim" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', color: '#22c55e', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Claim Listing — Free
              </Link>
            </div>

            {/* Route Calculator */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap style={{ width: 14, height: 14, color: '#34d399' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Route Calculator</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Enter load dimensions. Get exact {name} escort requirements instantly.</p>
              <Link href="/tools/escort-calculator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Try Free →
              </Link>
            </div>

            {/* HC Academy */}
            {reg?.certification?.required && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Award style={{ width: 14, height: 14, color: '#a78bfa' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get Certified</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>HC Academy — certifications recognized across 30+ states. Badge included.</p>
                <Link href="/training" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                  View Certifications →
                </Link>
              </div>
            )}

            {/* Data Products */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe style={{ width: 14, height: 14, color: '#38bdf8' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data Products</span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>Export {name} regulation data. API, CSV, enterprise.</p>
              <Link href="/data-products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                View Data Products →
              </Link>
            </div>

            {/* Sponsor */}
            <div style={{ background: 'rgba(198,146,58,0.04)', border: '1px dashed rgba(198,146,58,0.18)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Sponsor This Page</p>
              <p style={{ fontSize: 11, color: '#475569', margin: '0 0 10px', lineHeight: 1.4 }}>Reach operators moving loads through {name}.</p>
              <Link href="/advertise" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.22)', color: '#C6923A', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                View Packages →
              </Link>
            </div>

          </aside>
        </div>
      </div>

      {/* ── NO DEAD END ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 48px' }}>
        <NoDeadEndBlock
          heading="What Would You Like to Do Next?"
          moves={[
            { href: '/regulations', icon: '⚖️', title: 'All Regulations', desc: `${REGULATIONS.length} country index`, primary: true, color: '#C6923A' },
            { href: '/directory', icon: '🔍', title: 'Find Escorts', desc: `Verified operators in ${name}`, primary: true, color: '#D4A844' },
            { href: '/claim', icon: '✓', title: 'Claim Listing', desc: 'List your operation free' },
            { href: '/tools/escort-calculator', icon: '🧮', title: 'Route Calculator', desc: 'Instant escort requirements' },
            { href: '/escort-requirements', icon: '📋', title: 'US State Rules', desc: 'All 50 state thresholds' },
            { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'HC Academy' },
            { href: '/corridors', icon: '🛣️', title: 'Corridor Intel', desc: 'Route-specific demand' },
            { href: '/advertise', icon: '📣', title: 'Sponsor', desc: 'Reach operators here' },
          ]}
        />
      </div>
    </>
  );
}
