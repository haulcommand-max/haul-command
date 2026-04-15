'use client';

import Link from 'next/link';
import { useState } from 'react';

const TIERS = [
  {
    id: 'tier1',
    slug: 'hc-certified',
    name: 'HC Certified',
    subtitle: 'Escort',
    tagline: 'The foundation. Meets all baseline standards.',
    icon: 'ðŸ›¡ï¸',
    color: '#c0c0c0',
    colorBg: 'rgba(192,192,192,0.08)',
    colorBorder: 'rgba(192,192,192,0.3)',
    badge: 'SILVER',
    price: 'Free with Pro',
    priceAlt: '$49 one-time',
    priceColor: '#00ff88',
    requirements: [
      'Valid escort operator license in your country/state',
      'Vehicle meets local oversize escort requirements',
      '$1M minimum liability insurance verified',
      'Completed Haul Command online training (3 modules, ~24 hours)',
      'Passed knowledge assessment (80% pass rate)',
      'Active Haul Command profile with verified phone',
    ],
    benefits: [
      'Silver HC shield on profile',
      'Eligible for all platform loads',
      'Verified operator status',
    ],
    cta: 'Get Started Free',
    ctaHref: '/training',
  },
  {
    id: 'tier2',
    slug: 'av-ready',
    name: 'HC AV-Ready',
    subtitle: 'Certified',
    tagline: 'Trained to operate alongside autonomous freight systems.',
    icon: 'ðŸ¤–',
    color: '#f5c842',
    colorBg: 'rgba(245,200,66,0.08)',
    colorBorder: 'rgba(245,200,66,0.35)',
    badge: 'GOLD · AV-READY',
    price: '$149/year',
    priceAlt: '$99 renewal',
    priceColor: '#f5c842',
    requirements: [
      'HC Certified (Tier 1) prerequisite',
      'AV Escort Specialist training (5 modules, ~40 hours)',
      'Passed AV protocol assessment (85% pass rate)',
      'Knowledge of AV behavior patterns in operating region',
      'At least 10 verified escort jobs on the platform',
      'Vehicle equipped: GPS tracker, dash cam, 2-way radio',
    ],
    benefits: [
      'Priority placement in AV corridor operator pools',
      'Direct referral to AV logistics partners (Aurora, Kodiak, etc.)',
      '"AV-Ready" filter visibility in broker search',
      'Higher rate eligibility — AV jobs pay premium',
      'Gold HC shield + "AV-READY" bar on profile',
    ],
    cta: 'Enroll — $149/yr',
    ctaHref: '/training/av-certification/enroll?tier=2',
    highlight: true,
  },
  {
    id: 'tier3',
    slug: 'elite',
    name: 'HC Elite',
    subtitle: 'Certified',
    tagline: 'The highest standard in global heavy haul escort.',
    icon: 'âš¡',
    color: '#a78bfa',
    colorBg: 'rgba(167,139,250,0.08)',
    colorBorder: 'rgba(167,139,250,0.35)',
    badge: 'PLATINUM · ELITE',
    price: '$299/year',
    priceAlt: '$199 renewal',
    priceColor: '#a78bfa',
    requirements: [
      'HC AV-Ready (Tier 2) prerequisite',
      '50+ verified jobs on platform',
      '4.8+ star rating across all jobs',
      'Background check cleared',
      'Vehicle inspection passed (photo + checklist)',
      'Insurance verified at $2M+',
      'Advanced training: superloads, oilfield, AV proximity, intl ops',
      '90%+ acceptance rate + sub-30 min response time',
    ],
    benefits: [
      'Top of all search results platform-wide',
      'First access to all new loads before general pool',
      'Dedicated account manager',
      'White-glove dispute resolution',
      'Featured in AV company partnership referrals',
      'Listed on Haul Command partner portal for AV companies',
      'Platinum HC shield + "ELITE" bar on profile',
    ],
    cta: 'Enroll — $299/yr',
    ctaHref: '/training/av-certification/enroll?tier=3',
  },
];

const AV_COMPANIES = [
  { name: 'Aurora Innovation', corridor: 'I-45 Dallas"“Houston', flag: 'ðŸ‡ºðŸ‡¸' },
  { name: 'Kodiak Robotics', corridor: 'Permian Basin US-287', flag: 'ðŸ‡ºðŸ‡¸' },
  { name: 'Waabi', corridor: 'Texas highways + Canada', flag: 'ðŸ‡ºðŸ‡¸ðŸ‡¨ðŸ‡¦' },
  { name: 'Waymo', corridor: 'Austin TX, Phoenix AZ', flag: 'ðŸ‡ºðŸ‡¸' },
  { name: 'Gatik', corridor: 'Texas + Ontario Canada', flag: 'ðŸ‡ºðŸ‡¸ðŸ‡¨ðŸ‡¦' },
  { name: 'Torc Robotics', corridor: 'I-81 Virginia + Texas', flag: 'ðŸ‡ºðŸ‡¸' },
  { name: 'Rio Tinto AutoHaul', corridor: 'Pilbara WA Australia', flag: 'ðŸ‡¦ðŸ‡º' },
  { name: 'Wayve', corridor: 'UK motorways (Nissan 2027)', flag: 'ðŸ‡¬ðŸ‡§' },
  { name: 'Einride', corridor: 'Sweden, Germany, Norway, US', flag: 'ðŸ‡¸ðŸ‡ªðŸ‡©ðŸ‡ª' },
  { name: 'WeRide', corridor: 'UAE, Singapore, China', flag: 'ðŸ‡¦ðŸ‡ªðŸ‡¸ðŸ‡¬' },
];

const MODULES = [
  { num: 1, title: 'Platform Fundamentals', dur: '30 min', tier: 'T1', desc: 'How Haul Command works, escrow, profile optimization, and communication protocols.' },
  { num: 2, title: 'Global Regulations Overview', dur: '60 min', tier: 'T1', desc: 'Escort requirements across 50+ countries — width/height thresholds, permit types, curfews, cross-border protocols.' },
  { num: 3, title: 'Load Type Mastery', dur: '60 min', tier: 'T1', desc: 'Every load type: wind, oilfield, mining, construction, aerospace, military, manufactured homes, and more.' },
  { num: 4, title: 'AV Proximity Protocols', dur: '90 min', tier: 'T2', desc: 'How AVs differ from human drivers, LiDAR/radar blind zones, company-specific protocols (Aurora, Kodiak, Waymo), 5 country modules.' },
  { num: 5, title: 'Oilfield Specialist', dur: '75 min', tier: 'T2', desc: 'US oilfield regulations (TxDMV Subchapter D), international oilfield (Aramco, ADNOC, Pilbara), all oilfield load types.' },
  { num: 6, title: 'Superloads & Extreme Moves', dur: '60 min', tier: 'T2', desc: 'Route surveys, police escort coordination, bridge engineering, NASA/SpaceX moves, DOD/SDDC protocols.' },
  { num: 7, title: 'International Operations', dur: '45 min', tier: 'T3', desc: 'US"“Mexico/Canada border handoffs, EU cross-border (ESTA), GCC protocols, Australia state-to-state, currency + insurance.' },
];

const TIER_COLORS: Record<string, string> = { T1: '#c0c0c0', T2: '#f5c842', T3: '#a78bfa' };
const TIER_LABELS: Record<string, string> = { T1: 'Tier 1', T2: 'Tier 2', T3: 'Tier 3' };

export default function AVCertificationPage() {
  const [activeTier, setActiveTier] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #07090f 0%, #0d1a2e 40%, #07090f 100%)',
        padding: '72px 24px 56px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #1a223a',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#f5c842 1px, transparent 1px), linear-gradient(90deg, #f5c842 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 20,
            background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.3)',
            color: '#f5c842', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
            marginBottom: 24,
          }}>
            ðŸŒ GLOBAL STANDARD · 50+ countries
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, margin: '0 0 16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f5c842 50%, #ff9500 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            Haul Command AV-Ready<br />Escort Certification
          </h1>
          <p style={{ color: '#8fa3c0', fontSize: 18, maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.6 }}>
            The only global certification standard for escort operators working alongside
            autonomous and semi-autonomous freight systems.
            <strong style={{ color: '#f5c842' }}> Exceed the standard. Get certified. Get chosen first.</strong>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              { val: '10', label: 'AV Companies Active' },
              { val: '120', label: 'Countries Covered' },
              { val: '7', label: 'Training Modules' },
              { val: '3', label: 'Certification Tiers' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '16px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f5c842' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#8fa3c0', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/training/av-certification/enroll?tier=2">
              <button aria-label="Interactive Button" style={{
                background: 'linear-gradient(90deg, #f5c842, #ff9500)',
                color: '#07090f', border: 'none', borderRadius: 12,
                padding: '14px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer',
              }}>
                Get AV-Ready Certified — $149/yr
              </button>
            </Link>
            <Link href="#why">
              <button aria-label="Interactive Button" style={{
                background: 'transparent', border: '1px solid rgba(245,200,66,0.3)',
                color: '#f5c842', borderRadius: 12,
                padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}>
                Why This Matters
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Why this exists */}
      <div id="why" style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px 32px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.06), rgba(255,149,0,0.04))',
          border: '1px solid rgba(245,200,66,0.2)', borderRadius: 20, padding: '40px 40px',
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f5c842', margin: '0 0 16px' }}>
            Why this certification exists
          </h2>
          <p style={{ color: '#b0bcd0', lineHeight: 1.8, margin: '0 0 20px', fontSize: 15 }}>
            No global certification standard exists for escort operators working near autonomous vehicles.
            AV companies are deploying fast — and their logistics partners (Uber Freight, Hirschbach, J.B. Hunt,
            Werner, Ryder, FedEx, Atlas Energy) need verified escorts who understand how AVs behave.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: 'ðŸ“¡', title: 'No CB Radio', body: 'AVs do not respond to Channel 19. Standard escort communication doesn\'t apply.' },
              { icon: 'ðŸ”­', title: 'Sensor Blind Zones', body: 'LiDAR, radar, and camera arcs create specific zones to avoid around AV trucks.' },
              { icon: 'ðŸ›‘', title: 'Emergency Stops', body: 'AVs may stop with zero warning signal. Minimum following distances are different.' },
              { icon: 'ðŸ”„', title: 'Merge Behavior', body: 'AVs merge earlier and wider than human drivers — your positioning changes entirely.' },
            ].map(item => (
              <div key={item.title} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4f8', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.6 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AV Companies Active Now */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 48px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#f0f4f8' }}>
          AV Companies Operating on Your Routes
        </h2>
        <p style={{ color: '#8fa3c0', fontSize: 14, margin: '0 0 24px' }}>
          All of these companies' loads still require human escorts by law. Their operations teams need certified, AV-Ready operators.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {AV_COMPANIES.map(c => (
            <div key={c.name} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 16px', transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,200,66,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{c.flag}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#f0f4f8' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#8fa3c0', marginTop: 4, lineHeight: 1.5 }}>{c.corridor}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Certification Tiers */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 64px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          Three Tiers. One Standard.
        </h2>
        <p style={{ color: '#8fa3c0', textAlign: 'center', marginBottom: 40, fontSize: 15 }}>
          Start free. Level up as you grow. Each tier unlocks premium load access and higher rates.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {TIERS.map(tier => (
            <div
              key={tier.id}
              style={{
                background: tier.colorBg,
                border: `2px solid ${activeTier === tier.id ? tier.color : tier.colorBorder}`,
                borderRadius: 22, padding: '28px 24px',
                cursor: 'pointer',
                transition: 'transform 0.2s, border-color 0.2s',
                position: 'relative',
                transform: activeTier === tier.id ? 'translateY(-4px)' : 'none',
              }}
              onClick={() => setActiveTier(activeTier === tier.id ? null : tier.id)}
            >
              {tier.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #f5c842, #ff9500)',
                  color: '#07090f', padding: '4px 16px', borderRadius: 20,
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: 40, marginBottom: 12 }}>{tier.icon}</div>
              <div style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                background: `rgba(${tier.color === '#c0c0c0' ? '192,192,192' : tier.color === '#f5c842' ? '245,200,66' : '167,139,250'},0.15)`,
                color: tier.color, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em',
                marginBottom: 12,
              }}>
                {tier.badge}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#f0f4f8' }}>
                {tier.name}
              </h3>
              <div style={{ fontSize: 13, color: '#8fa3c0', marginBottom: 16, lineHeight: 1.5 }}>
                {tier.tagline}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: tier.priceColor, marginBottom: 4 }}>
                {tier.price}
              </div>
              <div style={{ fontSize: 12, color: '#8fa3c0', marginBottom: 20 }}>{tier.priceAlt}</div>

              {activeTier === tier.id && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: tier.color, letterSpacing: '0.08em', marginBottom: 10 }}>
                    REQUIREMENTS
                  </div>
                  {tier.requirements.map((req, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: '#b0bcd0', lineHeight: 1.5 }}>
                      <span style={{ color: tier.color, flexShrink: 0 }}>âœ“</span>
                      <span>{req}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, fontWeight: 700, color: tier.color, letterSpacing: '0.08em', margin: '16px 0 10px' }}>
                    BENEFITS
                  </div>
                  {tier.benefits.map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: '#b0bcd0', lineHeight: 1.5 }}>
                      <span style={{ color: '#00ff88', flexShrink: 0 }}>â†’</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              <Link href={tier.ctaHref}>
                <button aria-label="Interactive Button" style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  background: tier.highlight ? `linear-gradient(90deg, #f5c842, #ff9500)` : `rgba(${tier.color === '#c0c0c0' ? '192,192,192' : tier.color === '#f5c842' ? '245,200,66' : '167,139,250'},0.12)`,
                  border: `1px solid ${tier.colorBorder}`,
                  color: tier.highlight ? '#07090f' : tier.color,
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}>
                  {tier.cta}
                </button>
              </Link>
              {!activeTier || activeTier !== tier.id ? (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#8fa3c0', marginTop: 10 }}>
                  Click to see requirements
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Training Curriculum */}
      <div style={{ background: '#0a0d16', borderTop: '1px solid #1a223a', borderBottom: '1px solid #1a223a', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
            7 Training Modules — Built for Operators, Not Bureaucrats
          </h2>
          <p style={{ color: '#8fa3c0', textAlign: 'center', marginBottom: 40, fontSize: 15 }}>
            Each module is practical, specific, and timed. No fluff. Just what you need to pass the job.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {MODULES.map(mod => (
              <div key={mod.num} style={{
                display: 'grid', gridTemplateColumns: '56px 1fr auto',
                gap: 16, alignItems: 'start',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '18px 20px',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${TIER_COLORS[mod.tier]}44`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `rgba(${TIER_COLORS[mod.tier] === '#c0c0c0' ? '192,192,192' : TIER_COLORS[mod.tier] === '#f5c842' ? '245,200,66' : '167,139,250'},0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: TIER_COLORS[mod.tier],
                }}>
                  {mod.num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4f8', marginBottom: 4 }}>{mod.title}</div>
                  <div style={{ fontSize: 13, color: '#8fa3c0', lineHeight: 1.6 }}>{mod.desc}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    background: `rgba(${TIER_COLORS[mod.tier] === '#c0c0c0' ? '192,192,192' : TIER_COLORS[mod.tier] === '#f5c842' ? '245,200,66' : '167,139,250'},0.12)`,
                    color: TIER_COLORS[mod.tier], fontSize: 11, fontWeight: 700, marginBottom: 6,
                  }}>
                    {TIER_LABELS[mod.tier]}
                  </div>
                  <div style={{ fontSize: 12, color: '#8fa3c0' }}>{mod.dur}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Corporate Training */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(245,200,66,0.05))',
          border: '1px solid rgba(167,139,250,0.25)', borderRadius: 22, padding: '48px 40px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸ¢</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 12px', color: '#f0f4f8' }}>
            Corporate Training Programs
          </h2>
          <p style={{ color: '#8fa3c0', fontSize: 15, maxWidth: 580, margin: '0 auto 24px', lineHeight: 1.7 }}>
            AV companies and logistics partners can purchase bulk certifications for their preferred escort networks.
            Cohort pricing from <strong style={{ color: '#f5c842' }}>$5,000"“$25,000</strong>.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {['Aurora Innovation', 'Kodiak Robotics', 'Uber Freight', 'Hirschbach', 'Ryder', 'FedEx Freight', 'Rio Tinto', 'BHP', 'Fortescue'].map(co => (
              <span key={co} style={{
                padding: '6px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12, color: '#b0bcd0',
              }}>
                {co}
              </span>
            ))}
          </div>
          <Link href="/training/corporate">
            <button aria-label="Interactive Button" style={{
              background: 'linear-gradient(90deg, #a78bfa, #7c6ef5)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px 36px', fontSize: 16, fontWeight: 800, cursor: 'pointer',
            }}>
              Inquire About Corporate Training
            </button>
          </Link>
        </div>
      </div>

      {/* Revenue comparison / ROI calculator */}
      <div style={{ background: '#0a0d16', borderTop: '1px solid #1a223a', padding: '64px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>What AV-Ready Gets You</h2>
          <p style={{ color: '#8fa3c0', fontSize: 15, marginBottom: 40 }}>
            AV corridor jobs pay a premium because supply of qualified operators is thin.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
            {[
              { label: 'Standard escort rate (avg)', val: '$2.50"“$4/mile', color: '#8fa3c0' },
              { label: 'AV corridor rate (premium)', val: '$4"“$7/mile', color: '#00ff88' },
              { label: 'Certification cost (annual)', val: '$149/year', color: '#f5c842' },
              { label: 'Break-even at +$2/mile premium', val: '~75 miles extra/year', color: '#f5c842' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '20px', textAlign: 'left',
              }}>
                <div style={{ fontSize: 12, color: '#8fa3c0', marginBottom: 8, lineHeight: 1.4 }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
          <Link href="/training/av-certification/enroll?tier=2">
            <button aria-label="Interactive Button" style={{
              background: 'linear-gradient(90deg, #f5c842, #ff9500)',
              color: '#07090f', border: 'none', borderRadius: 12,
              padding: '16px 40px', fontSize: 18, fontWeight: 900, cursor: 'pointer',
            }}>
              Get AV-Ready Certified Today
            </button>
          </Link>
          <div style={{ marginTop: 12, fontSize: 13, color: '#8fa3c0' }}>
            30-day satisfaction guarantee. Cancel anytime.
          </div>
        </div>
      </div>
    </div>
  );
}