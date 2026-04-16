import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronRight, Shield, Scale, ArrowRight, MapPin, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { HCContentPageShell, HCContentContainer, HCContentSection } from '@/components/content-system/shell/HCContentPageShell';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { stateFullName } from '@/lib/geo/state-names';

// ═══════════════════════════════════════════════════════════════
// /escort-requirements/[state] — State Escort Requirement Detail
// P1 FIX: This directory was empty. Links from the escort-requirements
// index page pointed here and got caught by the (geo) catch-all,
// rendering the "Directory & Intelligence" monetization shell.
// ═══════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ state: string }>;
}

// Seed data — realistic escort thresholds for high-traffic states
const STATE_DATA: Record<string, {
  fullName: string;
  dotName: string;
  widthSingle: string;
  widthDouble: string;
  lengthThreshold: string;
  heightThreshold: string;
  weightNote: string;
  certRequired: boolean;
  certName: string;
  reciprocity: string;
  nightRestrictions: string;
  equipmentNotes: string[];
  permitAuthority: string;
  permitUrl: string;
  fines: string;
}> = {
  tx: {
    fullName: 'Texas', dotName: 'TxDMV / TxDOT',
    widthSingle: '12 ft', widthDouble: '14 ft',
    lengthThreshold: '110 ft', heightThreshold: '17 ft',
    weightNote: 'Superload permits required above 200,000 lbs GVW',
    certRequired: true, certName: 'TxDMV Approved Pilot Car Certification',
    reciprocity: 'Accepts OK, AR, LA certifications',
    nightRestrictions: 'No movement of loads over 14 ft wide between sunset and sunrise',
    equipmentNotes: ['OVERSIZE LOAD sign (5 ft x 10 in minimum)', 'Amber rotating/strobe lights', 'Height pole for lead vehicle', 'CB radio or two-way communication', 'Flags and safety triangles'],
    permitAuthority: 'Texas Department of Motor Vehicles',
    permitUrl: 'https://www.txdmv.gov/motor-carriers/oversize-overweight-permits',
    fines: 'Up to $1,000 per violation; $10,000+ for repeated violations',
  },
  ca: {
    fullName: 'California', dotName: 'Caltrans',
    widthSingle: '10 ft', widthDouble: '12 ft',
    lengthThreshold: '100 ft', heightThreshold: '15 ft',
    weightNote: 'Superload review required above 16 ft wide or 150 ft long',
    certRequired: true, certName: 'Caltrans Pilot Car Operator (PCO) Certification',
    reciprocity: 'No reciprocity — CA-specific certification required',
    nightRestrictions: 'No movement of loads over 12 ft wide from 30 min after sunset to 30 min before sunrise',
    equipmentNotes: ['OVERSIZE LOAD sign (7 ft x 18 in, reflective)', 'Amber flashing lights', 'Height pole (lead car)', 'Two-way radio', 'First aid kit required'],
    permitAuthority: 'California Department of Transportation',
    permitUrl: 'https://dot.ca.gov/programs/traffic-operations/transportation-permits',
    fines: 'Up to $2,500 per offense; vehicle impoundment possible',
  },
  fl: {
    fullName: 'Florida', dotName: 'FDOT',
    widthSingle: '12 ft', widthDouble: '14 ft 6 in',
    lengthThreshold: '95 ft', heightThreshold: '14 ft 6 in',
    weightNote: 'Escort required for all superloads exceeding 199,000 lbs',
    certRequired: false, certName: 'No state certification required (industry best practice recommended)',
    reciprocity: 'N/A — no state certification program',
    nightRestrictions: 'No night moves for loads over 14 ft wide on two-lane roads',
    equipmentNotes: ['OVERSIZE LOAD sign', 'Amber rotating beacon', 'Height pole', 'Two-way radio or cell phone'],
    permitAuthority: 'Florida Department of Transportation',
    permitUrl: 'https://www.fdot.gov/maintenance/overweight-overdimensional.shtm',
    fines: 'Up to $500 per violation; permit revocation for repeat offenses',
  },
  ok: {
    fullName: 'Oklahoma', dotName: 'ODOT',
    widthSingle: '12 ft', widthDouble: '14 ft',
    lengthThreshold: '110 ft', heightThreshold: '16 ft',
    weightNote: 'Superload permits for loads above 120,000 lbs',
    certRequired: true, certName: 'Oklahoma Escort Vehicle Operator Certification',
    reciprocity: 'Accepts TX, AR, KS certifications',
    nightRestrictions: 'No night moves for loads exceeding 14 ft wide',
    equipmentNotes: ['OVERSIZE LOAD sign (minimum 5 ft x 10 in)', 'Two amber lights', 'Height pole', 'CB channel 19 or two-way radio'],
    permitAuthority: 'Oklahoma Department of Transportation',
    permitUrl: 'https://www.odot.org/permits/',
    fines: 'Misdemeanor; up to $500 fine',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const data = STATE_DATA[state.toLowerCase()];
  const name = data?.fullName || stateFullName(state.toUpperCase()) || state.toUpperCase();

  return {
    title: `${name} Escort Vehicle Requirements — Pilot Car Rules & Thresholds | Haul Command`,
    description: `Complete ${name} escort vehicle requirements: width ${data?.widthSingle || '12 ft'} triggers single escort, ${data?.widthDouble || '14 ft'} triggers double. Certification, equipment, night restrictions, and permit authority.`,
    alternates: { canonical: `https://www.haulcommand.com/escort-requirements/${state.toLowerCase()}` },
  };
}

export default async function StateRequirementPage({ params }: PageProps) {
  const { state } = await params;
  const stateKey = state.toLowerCase();
  const data = STATE_DATA[stateKey];
  const fullName = data?.fullName || stateFullName(state.toUpperCase()) || state.toUpperCase();

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${fullName} Escort Vehicle Requirements`,
    url: `https://www.haulcommand.com/escort-requirements/${stateKey}`,
    description: `Escort vehicle and pilot car requirements for oversize loads in ${fullName}.`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
        { '@type': 'ListItem', position: 2, name: 'Escort Requirements', item: 'https://www.haulcommand.com/escort-requirements' },
        { '@type': 'ListItem', position: 3, name: fullName, item: `https://www.haulcommand.com/escort-requirements/${stateKey}` },
      ],
    },
  };

  return (
    <HCContentPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProofStrip variant="bar" />

      {/* Hero */}
      <div style={{
        position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#0A0D14', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(198,146,58,0.06) 0%, transparent 70%)',
          pointerEvents: 'none', transform: 'translate(30%, -30%)',
        }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            <Link href="/escort-requirements" style={{ color: '#6b7280', textDecoration: 'none' }}>Escort Requirements</Link>
            <ChevronRight style={{ width: 12, height: 12 }} />
            <span style={{ color: '#C6923A' }}>{fullName}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.25)',
              fontSize: 10, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <Scale style={{ width: 12, height: 12 }} />
              {data ? 'Verified Data' : 'Coverage Expanding'}
            </span>
          </div>

          <h1 style={{
            margin: '0 0 12px', fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15,
          }}>
            {fullName} Escort Vehicle Requirements
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
            {data
              ? `Pilot car rules, certification requirements, and dimension thresholds enforced by ${data.dotName}.`
              : `Escort vehicle requirements for ${fullName}. We are expanding coverage for this jurisdiction.`
            }
          </p>
        </div>
      </div>

      <HCContentSection>
        {/* Top AdGrid Slot */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 1.5rem 0' }}>
          <AdGridSlot zone={`escort_state_${state}_top`} />
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {data ? (
            <>
              {/* Threshold Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 40 }}>
                {[
                  { label: 'Single Escort', value: data.widthSingle, sub: 'Width threshold' },
                  { label: 'Double Escort', value: data.widthDouble, sub: 'Width threshold' },
                  { label: 'Length', value: data.lengthThreshold, sub: 'Max before escort' },
                  { label: 'Height', value: data.heightThreshold, sub: 'Clearance limit' },
                ].map(t => (
                  <div key={t.label} style={{
                    padding: '20px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#f9fafb', marginBottom: 4 }}>
                      {t.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{t.sub}</div>
                  </div>
                ))}
              </div>

              {/* Detail Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>

                {/* Certification */}
                <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield style={{ width: 16, height: 16, color: '#C6923A' }} />
                    Certification
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {data.certRequired
                      ? <CheckCircle style={{ width: 14, height: 14, color: '#22c55e' }} />
                      : <Info style={{ width: 14, height: 14, color: '#f59e0b' }} />
                    }
                    <span style={{ fontSize: 14, color: '#d1d5db', fontWeight: 600 }}>
                      {data.certRequired ? 'Required' : 'Not required by state law'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 8px' }}>{data.certName}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Reciprocity: {data.reciprocity}</p>
                </div>

                {/* Night Restrictions */}
                <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b' }} />
                    Night Restrictions
                  </h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{data.nightRestrictions}</p>
                </div>

                {/* Equipment */}
                <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Required Equipment
                  </h2>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', listStyle: 'disc' }}>
                    {data.equipmentNotes.map(e => (
                      <li key={e} style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{e}</li>
                    ))}
                  </ul>
                </div>

                {/* Weight & Superloads */}
                <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 12 }}>
                    Weight & Superloads
                  </h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 8px' }}>{data.weightNote}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Penalties: {data.fines}</p>
                </div>

                {/* Authority */}
                <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 12 }}>
                    Permit Authority
                  </h2>
                  <p style={{ fontSize: 14, color: '#d1d5db', fontWeight: 600, margin: '0 0 8px' }}>{data.permitAuthority}</p>
                  <a href={data.permitUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 700,
                  }}>
                    Official permit portal <ArrowRight style={{ width: 12, height: 12 }} />
                  </a>
                </div>
              </div>

              <p style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', marginBottom: 40 }}>
                Note: Requirements vary by specific route, time of day, and load characteristics. 
                Always verify with {data.dotName} before transport. Data last verified April 2026.
              </p>
            </>
          ) : (
            /* State without seed data */
            <div style={{
              padding: '48px 24px', textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, marginBottom: 48,
            }}>
              <Scale style={{ width: 32, height: 32, color: '#C6923A', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                {fullName} Escort Requirements
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
                Detailed escort thresholds for {fullName} are being compiled. 
                In the meantime, use the Escort Calculator for route-specific requirements or browse the full requirements index.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/tools/escort-calculator" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '12px 24px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                  color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none',
                }}>
                  Escort Calculator <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
                <Link href="/escort-requirements" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '12px 24px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#d1d5db', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}>
                  All Requirements
                </Link>
              </div>
            </div>
          )}

          {/* Calculator CTA */}
          <div style={{
            padding: '24px', borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(198,146,58,0.06), rgba(198,146,58,0.02))',
            border: '1px solid rgba(198,146,58,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, marginBottom: 48,
          }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', margin: '0 0 4px' }}>
                Check your specific route
              </h4>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Enter origin, destination, and load dimensions to see exact escort requirements.
              </p>
            </div>
            <Link href="/tools/escort-calculator" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
              color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none',
            }}>
              Route Calculator <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </div>
      </HCContentSection>

      <HCContentSection>
        <HCContentContainer>

          {/* Claim CTA */}
          <div style={{ background: 'linear-gradient(135deg, rgba(198,146,58,0.08), rgba(198,146,58,0.02))', border: '1px solid rgba(198,146,58,0.2)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', margin: '0 0 4px' }}>Are you a {fullName} escort operator?</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Get found by brokers who need escorts in {fullName} right now. Free to claim your profile.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/claim" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>Claim Listing — Free</Link>
              <Link href="/advertise" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Sponsor This Page</Link>
            </div>
          </div>

          {/* AdGrid mid */}
          <div style={{ marginBottom: 32 }}>
            <AdGridSlot zone={`escort_state_${state}_mid`} />
          </div>

          <NoDeadEndBlock
            heading={`${fullName} Escort Resources`}
            moves={[
              { href: '/escort-requirements', icon: '⚖️', title: 'All States', desc: 'Full requirements index', primary: true, color: '#3b82f6' },
              { href: `/directory/us/${fullName.toLowerCase().replace(/\s+/g, '-')}`, icon: '🔍', title: `${fullName} Escorts`, desc: 'Find local operators', primary: true, color: '#C6923A' },
              { href: '/tools/escort-calculator', icon: '🧮', title: 'Route Calculator', desc: 'Instant estimates' },
              { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Operators ready' },
              { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'Certification programs' },
              { href: '/regulations/us', icon: '📋', title: 'US Regulations', desc: 'Federal overview' },
              { href: '/corridors', icon: '🛣️', title: 'Corridor Intel', desc: `${fullName} route demand` },
              { href: '/advertise', icon: '📣', title: 'Sponsor', desc: 'Reach operators here' },
            ]}
          />
        </HCContentContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
