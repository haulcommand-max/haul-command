import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { HCBadge } from '@/components/training/HCBadge';
import { PageFamilyBackground } from '@/components/ui/PageFamilyBackground';
import { FAQAccordion } from '@/components/training/FAQAccordion';
import { EnrollButton } from '@/components/training/EnrollButton';
import { TrainingCatalogGrid } from '@/components/training/TrainingCatalogGrid';
import { PolicyEnforcedLinks } from '@/components/training/PolicyEnforcedLinks';

export const metadata: Metadata = {
  title: 'Haul Command | Global Pilot Car Certification & Escort Training',
  description: 'The only global training protocol for heavy haul, autonomous vehicle escorting, and wind energy pilot cars. Exceeds 12 US state standards. 120-country valid.',
  openGraph: {
    title: 'Haul Command | Double Platinum Pilot Car Certification',
    description: 'The ultimate operating system training for escorts. Get matched in minutes. Build your broker-ready compliance packet.',
  }
};

// ---- TIER CONFIG (visual â€” pricing comes from DB) ----
const TIER_DISPLAY = {
  road_ready: {
    name: 'Road Ready',
    badge: 'silver' as const,
    color: '#A8A8A8',
    glow: 'rgba(168,168,168,0.25)',
  },
  certified: {
    name: 'HC Certified',
    badge: 'silver' as const,
    color: '#A8A8A8',
    glow: 'rgba(168,168,168,0.25)',
  },
  av_ready: {
    name: 'HC AV-Ready',
    badge: 'gold' as const,
    color: '#F5A623',
    glow: 'rgba(245,166,35,0.3)',
  },
  elite: {
    name: 'HC Elite',
    badge: 'platinum' as const,
    color: '#E5E4E2',
    glow: 'rgba(229,228,226,0.2)',
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
    a: 'Course duration varies by program. Our flagship Pilot Car Operator Certification takes approximately 40 hours across 12 modules. Shorter courses like Load Securement Fundamentals take about 12 hours. You can complete modules in pieces â€” your progress is saved.',
  },
  {
    q: 'Does the HC AV-Ready certification really cover autonomous trucks?',
    a: 'Yes. The AV Integration Specialist program is the only escort operator training in existence specifically covering how to work alongside Aurora, Kodiak, Waabi, and other AV freight systems. It covers V2X communication protocols, sensor field awareness, emergency procedures, and country-specific AV regulations across all 120 countries.',
  },
  {
    q: 'What happens when my certification expires?',
    a: 'You receive reminder emails 30 days and 7 days before expiry. Renewal costs less than initial certification. Your badge shows a renewal prompt to brokers if expired so you never lose work unexpectedly.',
  },
];

export default async function TrainingHome() {
  // ---- FETCH FROM SUPABASE ----
  const supabase = createClient();

  // 1. Call the canonical training_hub_payload() RPC
  const { data: hubPayload } = await supabase.rpc('training_hub_payload');

  // 2. Fetch cross-system content edges (training â†’ glossary, regulation, tool)
  const { data: contentEdges } = await supabase
    .from('content_edges')
    .select('from_type, from_id, to_type, to_id, link_type, anchor_text, priority')
    .or('from_type.eq.training,to_type.eq.training')
    .order('priority', { ascending: false })
    .limit(30);

  // 3. Parse the payload
  const catalog = hubPayload?.catalog ?? [];
  const geoCoverage = hubPayload?.geo_coverage ?? [];
  const levels = hubPayload?.levels ?? [];

  // Group catalog by credential level for tier display
  const tierGroups: Record<string, typeof catalog> = {};
  catalog.forEach((c: any) => {
    const level = c.credential_level || 'road_ready';
    if (!tierGroups[level]) tierGroups[level] = [];
    tierGroups[level].push(c);
  });

  const countryCount = Array.isArray(geoCoverage) ? geoCoverage.length : 0;

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
      backgroundImage: 'url(/futuristic_autonomous_truck.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundColor: '#0a0a0e',
    }}>
      <div style={{ backgroundColor: 'rgba(10, 10, 14, 0.75)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* â”â”â” HERO â”â”â” */}
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
              { icon: 'ðŸ›¡ï¸', text: 'Built on FMCSA + SC&RA Standards' },
              { icon: 'ðŸŒ', text: `${countryCount || 120} countries` },
              { icon: 'âš¡', text: `${catalog.length || 8} training programs` },
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
            fontSize: 18, color: '#e2e8f0', maxWidth: 680, margin: '0 auto 36px',
            lineHeight: 1.65, textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}>
            The only global training program built specifically for pilot car and escort operators
            working in heavy haul, wind energy, oilfield, and autonomous vehicle corridors.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link aria-label="Start Free" href="/training/pilot-car-operator-certification" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #F5A623, #e08820)',
              color: '#000', fontWeight: 800, fontSize: 16,
              padding: '14px 28px', borderRadius: 12,
              textDecoration: 'none', letterSpacing: '0.01em',
              boxShadow: '0 4px 24px rgba(245,166,35,0.40)',
            }}>
              ðŸŽ“ Start Your Certification
            </Link>
            <a href="#catalog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e8e8e8', fontWeight: 600, fontSize: 16,
              padding: '14px 28px', borderRadius: 12,
              textDecoration: 'none', backdropFilter: 'blur(12px)',
            }}>
              View All Programs â†“
            </a>
          </div>
        </div>
      </PageFamilyBackground>

      {/* â”â”â” VALUE PROPOSITION â”â”â” */}
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
                <p style={{ color: '#e2e8f0', fontSize: 16, lineHeight: 1.65, marginBottom: 24 }}>
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
                <p style={{ color: '#e2e8f0', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>Activate availability, build a broker-ready packet, and master the entry path from your first module.</p>
                <Link href="/training/pilot-car-operator-certification" style={{ display: 'block', textAlign: 'center', background: '#2563eb', color: '#fff', padding: '14px 20px', borderRadius: 10, fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Start Your Certification
                </Link>
            </div>
        </div>
      </section>

      {/* â”â”â” REPORT CARD LINK â”â”â” */}
      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(17,17,26,0.9), rgba(12,12,16,0.9))', border: '1px solid #1a1a2a', padding: '48px 24px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
              <div style={{ color: '#F5A623', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 12 }}>YOUR CAREER ON THE NETWORK</div>
              <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16, color: '#fff' }}>Training Powers Your Report Card</h2>
              <p style={{ color: '#e2e8f0', maxWidth: 640, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.65 }}>
                  Every module you complete, badge you earn, and certificate you hold is directly attached to your Operator Profile. Stop storing PDFsâ€”your Profile Report Card proves your readiness to brokers automatically.
              </p>
              <Link href="/profile/report-card" style={{ display: 'inline-flex', background: 'transparent', color: '#fff', borderBottom: '2px solid #F5A623', paddingBottom: 4, fontWeight: 700, textDecoration: 'none', fontSize: 16 }}>
                  View Your Profile Report Card â†’
              </Link>
          </div>
      </section>

      {/* â”â”â” BADGE LEVELS (from DB) â”â”â” */}
      {levels.length > 0 && (
        <section id="levels" style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              Choose Your Certification Level
            </h2>
            <p style={{ color: '#e2e8f0', fontSize: 16, maxWidth: 560, margin: '0 auto', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              Earn badges that directly boost your rank and trust score on the platform.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {levels.map((level: any, i: number) => {
              const tier = TIER_DISPLAY[level.level_slug as keyof typeof TIER_DISPLAY] || TIER_DISPLAY.certified;
              const isHighlight = level.level_slug === 'av_ready';
              return (
                <div key={level.level_slug || i} style={{
                  background: isHighlight
                    ? 'linear-gradient(160deg, rgba(20,20,32,0.95) 0%, rgba(26,26,10,0.95) 100%)'
                    : 'linear-gradient(160deg, rgba(17,17,22,0.95) 0%, rgba(15,15,20,0.95) 100%)',
                  border: `1px solid ${isHighlight ? 'rgba(245,166,35,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 20, padding: 28, position: 'relative',
                  boxShadow: isHighlight ? '0 0 40px rgba(245,166,35,0.12)' : 'none',
                  display: 'flex', flexDirection: 'column', backdropFilter: 'blur(8px)'
                }}>
                  {isHighlight && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(90deg, #F5A623, #e08820)', color: '#000',
                      fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
                      letterSpacing: '0.08em', whiteSpace: 'nowrap',
                    }}>
                      â­ FUTURE-PROOF
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <HCBadge tier={tier.badge} size={56} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: tier.color }}>{level.level_name}</div>
                      <div style={{ fontSize: 13, color: '#7a7a8a', marginTop: 2 }}>+{level.rank_weight} rank points</div>
                    </div>
                  </div>
                  <p style={{ color: '#b0b0c0', fontSize: 14, lineHeight: 1.5, flex: 1 }}>
                    {level.description}
                  </p>
                  <div style={{ marginTop: 16, fontSize: 12, color: '#6a6a7a' }}>
                    Badge: <span style={{ color: tier.color, fontWeight: 700 }}>{level.badge_slug}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* â”â”â” TRAINING CATALOG (from DB) â”â”â” */}
      <section id="catalog" style={{
        background: 'rgba(12,12,16,0.95)',
        borderTop: '1px solid #1a1a22',
        borderBottom: '1px solid #1a1a22',
        padding: '64px 24px',
        backdropFilter: 'blur(10px)'
      }}>
        <TrainingCatalogGrid catalog={catalog} tierDisplay={TIER_DISPLAY} />
      </section>

      {/* â”â”â” SCALE PATH â”â”â” */}
      <section style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', marginBottom: 40 }}>The 18-Month Scale Path</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              <div style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid #1a1a2a', padding: 32, borderRadius: 16, backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: '#3b82f6', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 12 }}>PHASE 01 // ONBOARDING</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: '#fff' }}>First Job Journey</h3>
                  <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6 }}>A 14-day intensive protocol to activate availability, build a broker-ready compliance packet, and master the entry path.</p>
              </div>
              <div style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid #1a1a2a', padding: 32, borderRadius: 16, backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 12 }}>PHASE 02 // SCALE</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: '#fff' }}>18-Month Accelerator</h3>
                  <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6 }}>Elevate your Trust Score. Unlock badges, advanced specializations, and premium market load placements over time.</p>
              </div>
              <div style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid #1a1a2a', padding: 32, borderRadius: 16, backdropFilter: 'blur(8px)' }}>
                  <div style={{ color: '#ef4444', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 12 }}>PHASE 03 // ELITE</div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 12, color: '#fff' }}>Premium Elite Network</h3>
                  <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6 }}>Master route surveying, payload dynamics, and multi-state escort command. Fully verified on your immutable ID.</p>
              </div>
          </div>
      </section>

      {/* â”â”â” STANDARDS â”â”â” */}
      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Built on Real Standards.<br />Exceeds Every State Requirement.
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: 16, maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.65, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          The HC Certified curriculum is aligned with the Pilot Car Escort Best Practices Guidelines
          developed by the FMCSA, CVSA, and SC&RA â€” the same standards used by all 12 US states that
          require pilot car certification. We start where they stop and go further.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, maxWidth: 840, margin: '0 auto' }}>
          {[
            { icon: 'ðŸ›¡ï¸', text: 'FMCSA Best Practices Aligned', sub: 'Federal standard' },
            { icon: 'ðŸ“‹', text: 'SC&RA Guidelines Compliant', sub: 'Industry standard' },
            { icon: 'ðŸŒ', text: `${countryCount || 120} countries`, sub: 'Global recognition' },
            { icon: 'ðŸ›ï¸', text: 'Exceeds 12 State Standards', sub: 'WA, AZ, CO, FL, GA + more' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 14, padding: '20px 16px', textAlign: 'center', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', lineHeight: 1.3, marginBottom: 4 }}>{item.text}</div>
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* â”â”â” OPERATORS SECTION â”â”â” */}
      <section style={{ background: 'rgba(12,12,16,0.95)', borderTop: '1px solid #1a1a22', padding: '64px 24px', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em', color: '#fff' }}>
            Trained by Operators. Built for Operators.
          </h2>
          <p style={{ color: '#cbd5e1', fontSize: 16, marginBottom: 32, lineHeight: 1.65 }}>
            Our instructor team and curriculum were developed by veteran escort operators with
            combined decades of experience across US corridors, international heavy haul routes,
            and specialized load types.
          </p>
        </div>
      </section>

      {/* â”â”â” INTERNAL LINKS FROM DB â”â”â” */}
      {contentEdges && contentEdges.length > 0 && (
        <PolicyEnforcedLinks edges={contentEdges} currentType="training" />
      )}

      {/* â”â”â” FAQ â”â”â” */}
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ color: '#cbd5e1', marginBottom: 40, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Everything you need to know before you start.</p>
        <FAQAccordion faqs={FAQS} />
      </section>

      {/* â”â”â” FINAL CTA â”â”â” */}
      <section style={{
        background: 'linear-gradient(160deg, rgba(17,17,32,0.95) 0%, rgba(12,12,24,0.95) 100%)',
        borderTop: '1px solid rgba(245,166,35,0.12)',
        padding: '64px 24px', textAlign: 'center', backdropFilter: 'blur(10px)'
      }}>
        <HCBadge tier="gold" size={80} style={{ margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em', color: '#fff' }}>
          Start Earning Your Badge Today
        </h2>
        <p style={{ color: '#cbd5e1', fontSize: 16, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>
          Your badge goes live the moment you pass. 
          Brokers and AV companies can verify it instantly.
        </p>
        <Link aria-label="Start Certification" href="/training/pilot-car-operator-certification" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, #F5A623, #e08820)',
          color: '#000', fontWeight: 800, fontSize: 18,
          padding: '16px 36px', borderRadius: 14,
          textDecoration: 'none', boxShadow: '0 6px 30px rgba(245,166,35,0.4)',
          letterSpacing: '0.01em',
        }}>
          ðŸŽ“ Start Your Certification
        </Link>
      </section>
      </div>
    </div>
  );
}