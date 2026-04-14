import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, Shield, MapPin, Scale, ArrowRight, BookOpen, FileText } from 'lucide-react';

import { HCContentPageShell, HCContentContainer, HCContentSection } from '@/components/content-system/shell/HCContentPageShell';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { countryFullName } from '@/lib/geo/state-names';
import { US_STATES } from '@/lib/geo/state-names';

// ═══════════════════════════════════════════════════════════════
// /regulations/[country] — Country Regulation Hub
// P0 FIX: This page didn't exist. Visiting /regulations/us
// fell through to a catch-all that rendered as a directory shell.
// ═══════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const name = countryFullName(country);
  return {
    title: `${name} Escort Vehicle Regulations & Requirements | Haul Command`,
    description: `Complete guide to oversize load escort requirements in ${name}. Pilot car regulations, permit thresholds, equipment requirements, and escort certification standards.`,
    alternates: { canonical: `https://www.haulcommand.com/regulations/${country.toLowerCase()}` },
  };
}

// Seed regulation data for US states
const US_STATE_REGULATIONS: Record<string, {
  name: string;
  widthThreshold: string;
  lengthThreshold: string;
  escortRequired: string;
  certification: string;
  notes: string;
}> = {
  TX: { name: 'Texas', widthThreshold: '12 ft', lengthThreshold: '110 ft', escortRequired: '1 front, 1 rear above 14 ft wide', certification: 'TxDMV approved', notes: 'Law enforcement required above 16 ft wide during peak hours' },
  CA: { name: 'California', widthThreshold: '10 ft', lengthThreshold: '100 ft', escortRequired: '1 escort 10-12 ft, 2 escorts above 12 ft', certification: 'Caltrans Pilot Car Operator permit', notes: 'State-specific certification required, no reciprocity' },
  FL: { name: 'Florida', widthThreshold: '12 ft', lengthThreshold: '95 ft', escortRequired: '1 front above 14 ft, 2 escorts above 16 ft', certification: 'FDOT approved', notes: 'Night moves prohibited for loads over 14 ft wide' },
  OK: { name: 'Oklahoma', widthThreshold: '12 ft', lengthThreshold: '110 ft', escortRequired: '1 escort above 14 ft', certification: 'State certification accepted', notes: 'Multi-state reciprocity with TX and AR' },
  LA: { name: 'Louisiana', widthThreshold: '12 ft', lengthThreshold: '100 ft', escortRequired: '1 front above 14 ft', certification: 'LDOTD recognized', notes: 'Hurricane season may require advance routing approval' },
  NY: { name: 'New York', widthThreshold: '10 ft', lengthThreshold: '85 ft', escortRequired: '1 front and 1 rear above 14 ft', certification: 'NYSDOT pilot car certification', notes: 'NYC has separate permitting authority' },
  PA: { name: 'Pennsylvania', widthThreshold: '10 ft', lengthThreshold: '85 ft', escortRequired: '1 escort above 13 ft', certification: 'PennDOT approved', notes: 'Bridge-specific height restrictions common' },
  OH: { name: 'Ohio', widthThreshold: '12 ft', lengthThreshold: '100 ft', escortRequired: '1 front above 14 ft', certification: 'ODOT approved', notes: 'Turnpike has separate escort requirements' },
  WA: { name: 'Washington', widthThreshold: '10 ft', lengthThreshold: '95 ft', escortRequired: '1 front above 12 ft', certification: 'WSDOT pilot car certification', notes: 'Does not accept OR or CA certifications' },
  OR: { name: 'Oregon', widthThreshold: '10 ft', lengthThreshold: '100 ft', escortRequired: '1 front above 12 ft, 2 escorts above 14 ft', certification: 'ODOT pilot vehicle operator', notes: 'Does not accept WA or CA certifications' },
};

export default async function RegulationCountryPage({ params }: PageProps) {
  const { country } = await params;
  const countryCode = country.toUpperCase();
  const name = countryFullName(country);
  const isUS = countryCode === 'US';

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${name} Escort Vehicle Regulations`,
    url: `https://www.haulcommand.com/regulations/${country.toLowerCase()}`,
    description: `Complete guide to oversize load escort requirements in ${name}.`,
  };

  return (
    <HCContentPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div style={{
        position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#0A0D14', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', transform: 'translate(-30%, -30%)',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            <Link href="/regulations" style={{ color: '#6b7280', textDecoration: 'none' }}>Regulations</Link>
            <ChevronRight style={{ width: 12, height: 12 }} />
            <span style={{ color: '#3b82f6' }}>{name}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
              fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <Scale style={{ width: 12, height: 12 }} />
              Compliance Guide
            </span>
          </div>

          <h1 style={{
            margin: '0 0 12px', fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15,
          }}>
            {name} Escort Vehicle Regulations
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
            {isUS
              ? 'State-by-state escort vehicle requirements, pilot car certification standards, and oversize load thresholds for all 50 states.'
              : `Escort vehicle requirements, permit thresholds, and oversize load regulations for ${name}.`
            }
          </p>
        </div>
      </div>

      {/* Content */}
      <HCContentSection>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {isUS ? (
            <>
              {/* US State regulation table */}
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield style={{ width: 18, height: 18, color: '#C6923A' }} />
                  State Escort Thresholds
                </h2>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%', borderCollapse: 'collapse', fontSize: 13,
                  }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                        {['State', 'Width Threshold', 'Length Threshold', 'Escort Required', 'Certification'].map(h => (
                          <th key={h} style={{
                            textAlign: 'left', padding: '12px 16px',
                            fontSize: 10, fontWeight: 800, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(US_STATE_REGULATIONS).map(([code, reg]) => (
                        <tr key={code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f9fafb' }}>
                            <Link href={`/escort-requirements?state=${code}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                              {reg.name}
                            </Link>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#d1d5db' }}>{reg.widthThreshold}</td>
                          <td style={{ padding: '12px 16px', color: '#d1d5db' }}>{reg.lengthThreshold}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{reg.escortRequired}</td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>{reg.certification}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p style={{ fontSize: 12, color: '#64748b', marginTop: 16, fontStyle: 'italic' }}>
                  Note: Thresholds vary by route, time of day, and specific load characteristics. 
                  Always verify with the relevant state DOT before transport. Use the Escort Calculator for route-specific requirements.
                </p>
              </div>

              {/* All 50 states grid */}
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin style={{ width: 16, height: 16, color: '#3b82f6' }} />
                  Browse by State
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                  {Object.entries(US_STATES).map(([code, fullName]) => (
                    <Link key={code} href={`/escort-requirements?state=${code}`} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px', borderRadius: 10,
                      background: US_STATE_REGULATIONS[code] ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${US_STATE_REGULATIONS[code] ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)'}`,
                      textDecoration: 'none', fontSize: 13, fontWeight: 600,
                      color: US_STATE_REGULATIONS[code] ? '#93c5fd' : '#64748b',
                    }}>
                      <span style={{ fontWeight: 800 }}>{code}</span>
                      <span>{fullName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Non-US country */
            <div style={{
              padding: '48px 24px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, marginBottom: 48,
            }}>
              <Scale style={{ width: 32, height: 32, color: '#3b82f6', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                {name} Regulation Coverage Coming Soon
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
                We are currently compiling escort vehicle regulations, permit thresholds, and certification requirements for {name}. 
                Check the main regulations hub for available countries.
              </p>
              <Link href="/regulations" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '12px 24px', borderRadius: 12,
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                color: '#3b82f6', fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                View All Countries <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          )}

          {/* Tools CTA */}
          <div style={{
            padding: '24px', borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02))',
            border: '1px solid rgba(59,130,246,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, marginBottom: 48,
          }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', margin: '0 0 4px' }}>
                Calculate escort requirements for your route
              </h4>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Get instant cost estimates and escort configuration based on dimensions and jurisdiction.
              </p>
            </div>
            <Link href="/tools/escort-calculator" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
              color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none',
            }}>
              Escort Calculator <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </div>
      </HCContentSection>

      {/* No Dead End */}
      <HCContentSection>
        <HCContentContainer>
          <NoDeadEndBlock
            heading="Explore Compliance Resources"
            moves={[
              { href: '/regulations', icon: '⚖️', title: 'All Regulations', desc: 'Country index', primary: true, color: '#3b82f6' },
              { href: '/escort-requirements', icon: '📋', title: 'Escort Requirements', desc: 'State-by-state rules' },
              { href: '/tools/escort-calculator', icon: '🧮', title: 'Rate Calculator', desc: 'Instant estimates' },
              { href: '/directory', icon: '🔍', title: 'Find Escorts', desc: 'Verified operators' },
              { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'Certification programs' },
              { href: '/blog', icon: '📰', title: 'Intelligence', desc: 'Industry reports' },
            ]}
          />
        </HCContentContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
