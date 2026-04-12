import Link from 'next/link';
import { Metadata } from 'next';
import { HCBadge } from '@/components/training/HCBadge';
import { PageFamilyBackground } from '@/components/ui/PageFamilyBackground';
import { FAQAccordion } from '@/components/training/FAQAccordion';
import { EnrollButton } from '@/components/training/EnrollButton';
import { ModuleList, HardcodedModule } from '@/components/training/ModuleList';

export const metadata: Metadata = {
  title: 'Haul Command | Global Pilot Car Certification & Escort Training',
  description: 'The only global training protocol for heavy haul, autonomous vehicle escorting, and wind energy pilot cars. Exceeds 12 US state standards. 120-country valid.',
  openGraph: {
    title: 'Haul Command | Double Platinum Pilot Car Certification',
    description: 'The ultimate operating system training for escorts. Get matched in minutes. Build your broker-ready compliance packet.',
  }
};

const TIER_CONFIG = {
  hc_certified: {
    name: 'HC Certified',
    tagline: 'The foundation',
    badge: 'silver' as const,
    price: 'Free with Pro / $49 standalone',
    duration: '~24 hours',
    modules: [1, 2, 3],
    color: '#A8A8A8',
    glow: 'rgba(168,168,168,0.25)',
    cta: 'Start Free',
    benefits: [
      'HC Certified badge on your profile',
      'Recognized across all 120 countries',
      'Built on FMCSA + SC&RA Best Practices',
      'Digital credential with verification link',
    ],
  },
  av_ready: {
    name: 'HC AV-Ready',
    tagline: 'For the future of freight',
    badge: 'gold' as const,
    price: '$149/year',
    duration: '~40 hours',
    modules: [1, 2, 3, 4, 5],
    color: '#F5A623',
    glow: 'rgba(245,166,35,0.3)',
    cta: 'Get AV-Ready',
    highlight: true,
    benefits: [
      'Everything in HC Certified',
      'AV-Ready badge (gold) on your profile',
      'Priority placement in AV corridor searches',
      'Aurora + Kodiak protocol training',
      'Oilfield Specialist module',
      'Direct referral to AV logistics partners',
    ],
  },
  elite: {
    name: 'HC Elite',
    tagline: 'The highest standard',
    badge: 'platinum' as const,
    price: '$299/year',
    duration: '~56 hours',
    modules: [1, 2, 3, 4, 5, 6, 7],
    color: '#E5E4E2',
    glow: 'rgba(229,228,226,0.2)',
    cta: 'Become Elite',
    benefits: [
      'Everything in AV-Ready',
      'Elite platinum badge on profile',
      'Top of all search results',
      'Superload + military + aerospace module',
      'International operations module',
      'Dedicated account support',
    ],
  },
};

const FAQS = [
  {
    q: 'Is the HC Certified credential accepted by states that require pilot car certification?',
    a: 'The HC Certified curriculum is built on the FMCSA and SC&RA Best Practices Guidelines, which form the basis of every US state certification program. It meets or exceeds the curriculum requirements for all 12 states that mandate pilot car certification. Always check with your specific state DOT for official reciprocity acceptance.',
  },
  {
    q: 'Who built the curriculum?',
    a: 'The curriculum was developed using publicly available FHWA pilot escort training materials, FMCSA guidelines, SC&RA Best Practices, and state-specific regulatory requirements, reviewed by veteran escort operators with decades of field experience.',
  },
  {
    q: 'How long does it take to get certified?',
    a: 'HC Certified takes approximately 24 hours across 3 modules. AV-Ready takes approximately 40 hours across 5 modules. You can complete modules in pieces — your progress is saved.',
  },
  {
    q: 'Does the HC AV-Ready certification really cover autonomous trucks?',
    a: 'Yes. Module 4 is the only escort operator training in existence specifically covering how to work alongside Aurora, Kodiak, Waabi, and other AV freight systems. It covers communication protocols, sensor field awareness, emergency procedures, and country-specific AV regulations across all 120 countries.',
  },
  {
    q: 'What happens when my certification expires?',
    a: 'You receive reminder emails 30 days and 7 days before expiry. Renewal costs less than initial certification. Your badge shows a renewal prompt to brokers if expired so you never lose work unexpectedly.',
  },
];

const CANONICAL_MODULES: HardcodedModule[] = [
  {
    id: 'mod_1', slug: 'platform-fundamentals', title: 'Platform Fundamentals & Compliance Matrix',
    description: 'Learn the core UI of Haul Command, how to secure loads, upload your state COIs, and operate defensively within the platform. The undisputed starting point.',
    duration_minutes: 120, order_index: 1, certification_tier: 'hc_certified', is_free: true
  },
  {
    id: 'mod_2', slug: 'state-restrictions-curfew', title: 'State Restrictions & Curfew Navigation',
    description: 'In-depth analysis of municipal curfews, routing restrictions, and how to verify load dimensions against DOT permits securely.',
    duration_minutes: 240, order_index: 2, certification_tier: 'hc_certified', is_free: false
  },
  {
    id: 'mod_3', slug: 'pre-trip-rigging', title: 'Pre-Trip Rigging & Front Pilot Command',
    description: 'Visual sweeps, required equipment, lighting protocols, and commanding the front end of an oversize formation.',
    duration_minutes: 180, order_index: 3, certification_tier: 'hc_certified', is_free: false
  },
  {
    id: 'mod_4', slug: 'av-protocol', title: 'AV Protocol & Sensor Field Proximity',
    description: 'The first global guide to operating alongside Aurora, Kodiak, and autonomous Class 8 platforms. Understand LiDAR, sensor cone blind spots, and fail-safe protocols.',
    duration_minutes: 320, order_index: 4, certification_tier: 'av_ready', is_free: false
  },
  {
    id: 'mod_5', slug: 'oilfield-navigation', title: 'Rural / Oilfield Navigation & Radio Discipline',
    description: 'Off-grid routing, harsh environment radio protocol, CB terminology, and avoiding fatal mud/ice hazards in upstream logistics.',
    duration_minutes: 200, order_index: 5, certification_tier: 'av_ready', is_free: false
  },
  {
    id: 'mod_6', slug: 'superload-dynamics', title: 'Superload Dynamics & Rear Steer Coordination',
    description: 'Escorting loads exceeding 200,000 lbs. Managing deflections, bridge integrity speeds, and coordinating with a rear tiller/steerman.',
    duration_minutes: 400, order_index: 6, certification_tier: 'elite', is_free: false
  },
  {
    id: 'mod_7', slug: 'cross-border-logistics', title: 'Cross-Border Logistics & Multi-State Continuity',
    description: 'Master customs clearances, pilot handoffs at state lines, international jurisdictions (US/MX/CA, EU, Oceania), and continuous chain of command.',
    duration_minutes: 360, order_index: 7, certification_tier: 'elite', is_free: false
  }
];

export default function TrainingHome() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Haul Command Pilot Car Certification",
    "description": "Global certification program for pilot car and escort operators. Covers AV-ready routing, superload dynamics, and compliance.",
    "provider": {
      "@type": "Organization",
      "name": "Haul Command",
      "url": "https://www.haulcommand.com"
    },
    "coursePrerequisites": "None. Suitable for new and veteran operators.",
    "hasCourseInstance": [
      {
        "@type": "CourseInstance",
        "courseMode": "Online",
        "courseWorkload": "PT24H"
      }
    ]
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  return (
    <div style={{
      minHeight: '100vh',
      color: '#e8e8e8',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <PageFamilyBackground
        family="training"
        intensity="heavy"
        gradientAnchor="top"
        height="clamp(420px, 58vh, 720px)"
        asSection
      >
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%',
          padding: '80px 24px 60px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 600, height: 300, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(245,166,35,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { icon: '🛡️', text: 'Built on FMCSA + SC&RA Standards' },
              { icon: '🌐', text: '120 countries' },
              { icon: '⚡', text: 'AV-Ready Certified Available' },
            ].map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.25)',
                borderRadius: 20, padding: '5px 14px',
                fontSize: 12, fontWeight: 600, color: '#F5A623',
                letterSpacing: '0.02em',
                backdropFilter: 'blur(8px)',
              }}>
                <span>{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 64px)',
            fontWeight: 900,
            margin: '0 0 20px',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #F5A623 60%, #fff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Get Certified.<br />Get Chosen First.
          </h1>

          <p style={{
            fontSize: 18, color: 'rgba(200,210,230,0.85)', maxWidth: 680, margin: '0 auto 36px',
            lineHeight: 1.65,
          }}>
            The only global training program built specifically for pilot car and escort operators
            working in heavy haul, wind energy, oilfield, and autonomous vehicle corridors.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link aria-label="Start Free" href="/training/platform-fundamentals" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #F5A623, #e08820)',
              color: '#000', fontWeight: 800, fontSize: 16,
              padding: '14px 28px', borderRadius: 12,
              textDecoration: 'none', letterSpacing: '0.01em',
              boxShadow: '0 4px 24px rgba(245,166,35,0.40)',
            }}>
              🎓 Start Free — Module 1 is free
            </Link>
            <a href="#modules" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e8e8e8', fontWeight: 600, fontSize: 16,
              padding: '14px 28px', borderRadius: 12,
              textDecoration: 'none', backdropFilter: 'blur(12px)',
            }}>
              View All Modules ↓
            </a>
          </div>
        </div>
      </PageFamilyBackground>

      <section style={{
        background: 'rgba(12,12,16,0.95)',
        borderBottom: '1px solid #1a1a22',
        padding: '64px 24px',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 300 }}>
                <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em', color: '#fff' }}>
                    The Cost of Ignorance is <span style={{ color: '#ef4444' }}>Unsettled Escrows.</span>
                </h2>
                <p style={{ color: '#9a9ab0', fontSize: 16, lineHeight: 1.65, marginBottom: 24 }}>
                    Haul Command isn't just an academy; it's a Settlement OS. Unverified operators are screened out immediately. Completing your first free module enables your <strong>14-day First Job Journey</strong>, helping you build a broker-ready compliance packet fast so you can start working.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ background: '#111118', padding: '16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>100%</div>
                        <div style={{ fontSize: 11, color: '#6a6a7a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Dispute Protected</div>
                    </div>
                    <div style={{ background: '#111118', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: 8 }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444' }}>3.4x</div>
                        <div style={{ fontSize: 11, color: '#6a6a7a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Higher Close Rate</div>
                    </div>
                </div>
            </div>
            <div style={{ flex: 1, minWidth: 300, background: 'linear-gradient(145deg, rgba(37,99,235,0.1), transparent)', border: '1px solid rgba(37,99,235,0.2)', padding: 40, borderRadius: 20 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Start Your 14-Day Readiness</h3>
                <p style={{ color: '#9a9ab0', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>Activate availability, build a broker-ready packet, and master the entry path from Module 1.</p>
                <Link href="/training/platform-fundamentals" style={{ display: 'block', textAlign: 'center', background: '#2563eb', color: '#fff', padding: '14px 20px', borderRadius: 10, fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Access Module 1
                </Link>
            </div>
        </div>
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(17,17,26,0.9), rgba(12,12,16,0.9))', border: '1px solid #1a1a2a', padding: '48px 24px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
              <div style={{ color: '#F5A623', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 12 }}>YOUR CAREER ON THE NETWORK</div>
              <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, color: '#fff' }}>Training Powers Your Report Card</h2>
              <p style={{ color: '#9a9ab0', maxWidth: 640, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.65 }}>
                  Every module you complete, badge you earn, and certificate you hold is directly attached to your Operator Profile. Stop storing PDFs—your Profile Report Card proves your readiness to brokers automatically.
              </p>
              <Link href="/profile/report-card" style={{ display: 'inline-flex', background: 'transparent', color: '#fff', borderBottom: '2px solid #F5A623', paddingBottom: 4, fontWeight: 700, textDecoration: 'none', fontSize: 16 }}>
                  View Your Profile Report Card →
              </Link>
          </div>
      </section>

      <section id="training-tiers" style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Choose Your Certification Level
          </h2>
          <p style={{ color: '#9a9ab0', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
            Start free with HC Certified. Upgrade to AV-Ready or Elite when you're ready to open more doors.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {Object.entries(TIER_CONFIG).map(([tierKey, tier]) => (
            <div key={tierKey} style={{
              background: tier.highlight
                ? 'linear-gradient(160deg, rgba(20,20,32,0.95) 0%, rgba(26,26,10,0.95) 100%)'
                : 'linear-gradient(160deg, rgba(17,17,22,0.95) 0%, rgba(15,15,20,0.95) 100%)',
              border: `1px solid ${tier.highlight ? 'rgba(245,166,35,0.35)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 20, padding: 28, position: 'relative',
              boxShadow: tier.highlight ? `0 0 40px rgba(245,166,35,0.12)` : 'none',
              display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)'
            }}>
              {tier.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, #F5A623, #e08820)', color: '#000',
                  fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                  letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>
                  ⭐ MOST POPULAR
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <HCBadge tier={tier.badge} size={56} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: tier.color }}>{tier.name}</div>
                  <div style={{ fontSize: 13, color: '#7a7a8a', marginTop: 2 }}>{tier.tagline}</div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{tier.price}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 12, color: '#7a7a8a' }}>
                <span>⏱ {tier.duration}</span>
                <span>📚 {tier.modules.length} modules</span>
              </div>
              <div style={{ flex: 1, marginBottom: 24 }}>
                {tier.benefits.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10, fontSize: 13, lineHeight: 1.5, color: '#b0b0c0' }}>
                    <span style={{ color: tier.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <EnrollButton tierKey={tierKey} cta={tier.cta} color={tier.color} glow={tier.glow} isHighlight={tier.highlight} />
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>The 18-Month Scale Path</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid #1a1a2a', padding: 32, borderRadius: 16, backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: '#3b82f6', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 12 }}>PHASE 01 // ONBOARDING</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: '#fff' }}>First Job Journey</h3>
                  <p style={{ color: '#9a9ab0', fontSize: 14, lineHeight: 1.6 }}>A 14-day intensive protocol to activate availability, build a broker-ready compliance packet, and master the entry path.</p>
              </div>
              <div style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid #1a1a2a', padding: 32, borderRadius: 16, backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 12 }}>PHASE 02 // SCALE</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: '#fff' }}>18-Month Accelerator</h3>
                  <p style={{ color: '#9a9ab0', fontSize: 14, lineHeight: 1.6 }}>Elevate your Trust Score. Unlock badges, advanced specializations, and premium market load placements over time.</p>
              </div>
              <div style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid #1a1a2a', padding: 32, borderRadius: 16, backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: '#ef4444', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 12 }}>PHASE 03 // ELITE</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: '#fff' }}>Premium Elite Network</h3>
                  <p style={{ color: '#9a9ab0', fontSize: 14, lineHeight: 1.6 }}>Master route surveying, payload dynamics, and multi-state escort command. Fully verified on your immutable ID.</p>
              </div>
          </div>
      </section>

      <section id="modules" style={{
        background: 'rgba(12,12,16,0.95)',
        borderTop: '1px solid #1a1a22',
        borderBottom: '1px solid #1a1a22',
        padding: '64px 24px',
        backdropFilter: 'blur(10px)'
      }}>
        <ModuleList modules={CANONICAL_MODULES} />
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em', color: '#fff' }}>
          Built on Real Standards.<br />Exceeds Every State Requirement.
        </h2>
        <p style={{ color: '#7a7a8a', fontSize: 16, maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.65 }}>
          The HC Certified curriculum is aligned with the Pilot Car Escort Best Practices Guidelines
          developed by the FMCSA, CVSA, and SC&RA — the same standards used by all 12 US states that
          require pilot car certification. We start where they stop and go further.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, maxWidth: 800, margin: '0 auto' }}>
          {[
            { icon: '🛡️', text: 'FMCSA Best Practices Aligned', sub: 'Federal standard' },
            { icon: '📋', text: 'SC&RA Guidelines Compliant', sub: 'Industry standard' },
            { icon: '🌍', text: '120 countries', sub: 'Global recognition' },
            { icon: '🏛️', text: 'Exceeds 12 State Standards', sub: 'WA, AZ, CO, FL, GA + more' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', lineHeight: 1.3, marginBottom: 4 }}>{item.text}</div>
              <div style={{ fontSize: 12, color: '#6a6a7a' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'rgba(12,12,16,0.95)', borderTop: '1px solid #1a1a22', padding: '64px 24px', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em', color: '#fff' }}>
            Trained by Operators. Built for Operators.
          </h2>
          <p style={{ color: '#7a7a8a', fontSize: 16, marginBottom: 32, lineHeight: 1.65 }}>
            Our instructor team and curriculum were developed by veteran escort operators with
            combined decades of experience across US corridors, international heavy haul routes,
            and specialized load types.
          </p>
        </div>
      </section>

      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: '#fff' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ color: '#6a6a7a', marginBottom: 40 }}>Everything you need to know before you start.</p>
        <FAQAccordion faqs={FAQS} />
      </section>

      <section style={{
        background: 'linear-gradient(160deg, rgba(17,17,32,0.95) 0%, rgba(12,12,24,0.95) 100%)',
        borderTop: '1px solid rgba(245,166,35,0.12)',
        padding: '64px 24px', textAlign: 'center', backdropFilter: 'blur(10px)'
      }}>
        <HCBadge tier="gold" size={80} style={{ margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em', color: '#fff' }}>
          Start Earning Your Badge Today
        </h2>
        <p style={{ color: '#7a7a8a', fontSize: 16, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>
          Module 1 is completely free. Your badge goes live the moment you pass. 
          Brokers and AV companies can verify it instantly.
        </p>
        <Link aria-label="Start Free" href="/training/platform-fundamentals" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, #F5A623, #e08820)',
          color: '#000', fontWeight: 800, fontSize: 18,
          padding: '16px 36px', borderRadius: 14,
          textDecoration: 'none', boxShadow: '0 6px 30px rgba(245,166,35,0.4)',
          letterSpacing: '0.01em',
        }}>
          🎓 Start Module 1 — Free
        </Link>
      </section>
    </div>
  );
}
