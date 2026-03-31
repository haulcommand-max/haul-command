'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HCBadge } from '@/components/training/HCBadge';

interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_minutes: number;
  order_index: number;
  certification_tier: 'hc_certified' | 'av_ready' | 'elite';
  is_free: boolean;
  pass_score: number;
  progress?: {
    status: string;
    score: number | null;
  } | null;
}

const TIER_CONFIG = {
  hc_certified: {
    name: 'HC Certified',
    tagline: 'The foundation',
    badge: 'silver' as const,
    price: 'Free with Pro / $49 standalone',
    duration: '~2.5 hours',
    modules: [1, 2, 3],
    color: '#A8A8A8',
    glow: 'rgba(168,168,168,0.25)',
    cta: 'Start Free',
    href: '/training/platform-fundamentals',
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
    duration: '~5.5 hours',
    modules: [1, 2, 3, 4, 5],
    color: '#F5A623',
    glow: 'rgba(245,166,35,0.3)',
    cta: 'Get AV-Ready',
    href: '/training?enroll=av_ready',
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
    duration: '~8 hours',
    modules: [1, 2, 3, 4, 5, 6, 7],
    color: '#E5E4E2',
    glow: 'rgba(229,228,226,0.2)',
    cta: 'Become Elite',
    href: '/training?enroll=elite',
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
    a: 'HC Certified takes approximately 2.5 hours across 3 modules. AV-Ready takes approximately 5.5 hours across 5 modules. You can complete modules in pieces — your progress is saved.',
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

export default function TrainingHome() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/training/modules')
      .then(r => r.json())
      .then(d => {
        if (d.modules) setModules(d.modules);
      })
      .catch(console.error);
  }, []);

  const handleEnroll = async (tier: string) => {
    setEnrolling(tier);
    try {
      const res = await fetch('/api/training/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certification_tier: tier }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.enrolled || data.already_enrolled) {
        window.location.href = `/training/${tierFirstModule(tier)}`;
      } else if (res.status === 401) {
        window.location.href = `/auth/login?return=/training`;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEnrolling(null);
    }
  };

  const tierFirstModule = (tier: string) => {
    if (tier === 'hc_certified') return 'platform-fundamentals';
    if (tier === 'av_ready') return 'platform-fundamentals';
    return 'platform-fundamentals';
  };

  const tierModuleCounts = {
    hc_certified: modules.filter(m => m.certification_tier === 'hc_certified' || TIER_CONFIG.hc_certified.modules.includes(m.order_index)).slice(0, 3),
    av_ready: modules.filter(m => TIER_CONFIG.av_ready.modules.includes(m.order_index)),
    elite: modules,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#e8e8e8',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, #0c0c0c 0%, #111118 40%, #0c0c14 100%)',
        padding: '80px 24px 60px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #1a1a2a',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(245,166,35,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Badge row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 28,
          flexWrap: 'wrap',
        }}>
          {[
            { icon: '🛡️', text: 'Built on FMCSA + SC&RA Standards' },
            { icon: '🌐', text: '120 countries' },
            { icon: '⚡', text: 'AV-Ready Certified Available' },
          ].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 20, padding: '5px 14px',
              fontSize: 12, fontWeight: 600, color: '#F5A623',
              letterSpacing: '0.02em',
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
          fontSize: 18, color: '#9a9ab0', maxWidth: 680, margin: '0 auto 36px',
          lineHeight: 1.65,
        }}>
          The only global training program built specifically for pilot car and escort operators
          working in heavy haul, wind energy, oilfield, and autonomous vehicle corridors.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link aria-label="Navigation Link" href="/training/platform-fundamentals" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #F5A623, #e08820)',
            color: '#000', fontWeight: 800, fontSize: 16,
            padding: '14px 28px', borderRadius: 12,
            textDecoration: 'none', letterSpacing: '0.01em',
            boxShadow: '0 4px 24px rgba(245,166,35,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,166,35,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px rgba(245,166,35,0.35)'; }}
          >
            🎓 Start Free — Module 1 is free
          </Link>
          <a href="#modules" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#e8e8e8', fontWeight: 600, fontSize: 16,
            padding: '14px 28px', borderRadius: 12,
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            View All Modules ↓
          </a>
        </div>
      </section>

      {/* ── CERTIFICATION TIERS ── */}
      <section id="modules" style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Choose Your Certification Level
          </h2>
          <p style={{ color: '#9a9ab0', fontSize: 16, maxWidth: 560, margin: '0 auto' }}>
            Start free with HC Certified. Upgrade to AV-Ready or Elite when you're ready to open more doors.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {(Object.entries(TIER_CONFIG) as [keyof typeof TIER_CONFIG, typeof TIER_CONFIG[keyof typeof TIER_CONFIG]][]).map(([tierKey, tier]) => {
            const isHighlight = 'highlight' in tier && tier.highlight;
            return (
              <div key={tierKey} style={{
                background: isHighlight
                  ? 'linear-gradient(160deg, #141420 0%, #1a1a0a 100%)'
                  : 'linear-gradient(160deg, #111116 0%, #0f0f14 100%)',
                border: `1px solid ${isHighlight ? 'rgba(245,166,35,0.35)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 20,
                padding: 28,
                position: 'relative',
                boxShadow: isHighlight ? `0 0 40px rgba(245,166,35,0.12)` : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {isHighlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, #F5A623, #e08820)',
                    color: '#000', fontSize: 11, fontWeight: 800,
                    padding: '4px 14px', borderRadius: 20, letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Badge + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <HCBadge tier={tier.badge} size={56} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: tier.color }}>{tier.name}</div>
                    <div style={{ fontSize: 13, color: '#7a7a8a', marginTop: 2 }}>{tier.tagline}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{tier.price}</div>
                </div>

                {/* Duration + Modules */}
                <div style={{
                  display: 'flex', gap: 12, marginBottom: 20,
                  fontSize: 12, color: '#7a7a8a',
                }}>
                  <span>⏱ {tier.duration}</span>
                  <span>📚 {tier.modules.length} modules</span>
                </div>

                {/* Benefits */}
                <div style={{ flex: 1, marginBottom: 24 }}>
                  {tier.benefits.map((b, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      marginBottom: 10, fontSize: 13, lineHeight: 1.5, color: '#b0b0c0',
                    }}>
                      <span style={{ color: tier.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button aria-label="Interactive Button"
                  id={`enroll-${tierKey}`}
                  onClick={() => handleEnroll(tierKey)}
                  disabled={enrolling === tierKey}
                  style={{
                    width: '100%',
                    background: isHighlight
                      ? 'linear-gradient(135deg, #F5A623, #e08820)'
                      : `rgba(${tierKey === 'elite' ? '229,228,226' : '168,168,168'},0.1)`,
                    color: isHighlight ? '#000' : tier.color,
                    border: `1px solid ${tier.color}40`,
                    borderRadius: 10,
                    padding: '13px 20px',
                    fontSize: 15, fontWeight: 800,
                    cursor: enrolling === tierKey ? 'wait' : 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'all 0.2s',
                    opacity: enrolling === tierKey ? 0.7 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!enrolling) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 6px 20px ${tier.glow}`;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {enrolling === tierKey ? 'Processing...' : tier.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MODULE LIST ── */}
      <section style={{
        background: '#0c0c10',
        borderTop: '1px solid #1a1a22',
        borderBottom: '1px solid #1a1a22',
        padding: '64px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            All 7 Modules
          </h2>
          <p style={{ color: '#6a6a7a', marginBottom: 40, fontSize: 15 }}>
            Each module is a standalone credential. Work through them in sequence or jump to what you need most.
          </p>

          {modules.map((m) => {
            const tierConf = TIER_CONFIG[m.certification_tier] || TIER_CONFIG.hc_certified;
            const statusColors: Record<string, string> = {
              passed: '#22c55e', in_progress: '#F5A623', failed: '#ef4444', not_started: '#6a6a7a',
            };
            const status = m.progress?.status || 'not_started';
            return (
              <Link aria-label="Navigation Link" key={m.id} href={`/training/${m.slug}`}
                style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
              >
                <div style={{
                  background: '#111118',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  transition: 'border-color 0.2s, transform 0.15s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = tierConf.color + '50';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {/* Module number */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: `${tierConf.color}18`,
                    border: `1px solid ${tierConf.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: tierConf.color,
                    flexShrink: 0,
                  }}>
                    {m.order_index}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</span>
                      {m.is_free && (
                        <span style={{
                          background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          letterSpacing: '0.06em',
                        }}>FREE</span>
                      )}
                      <span style={{
                        background: `${tierConf.color}15`, color: tierConf.color,
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        letterSpacing: '0.04em',
                      }}>{tierConf.name.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6a6a7a', lineHeight: 1.4 }}>
                      {m.description?.slice(0, 100)}{(m.description?.length || 0) > 100 ? '…' : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: '#6a6a7a' }}>⏱ {m.duration_minutes}m</div>
                    {m.progress && (
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: statusColors[status] || '#6a6a7a',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {status.replace('_', ' ')}
                        {m.progress.score !== null && ` — ${m.progress.score}%`}
                      </div>
                    )}
                    <span style={{ color: tierConf.color, fontSize: 18 }}>→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── CREDIBILITY ── */}
      <section style={{ padding: '64px 24px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Built on Real Standards.<br />Exceeds Every State Requirement.
        </h2>
        <p style={{ color: '#7a7a8a', fontSize: 16, maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.65 }}>
          The HC Certified curriculum is aligned with the Pilot Car Escort Best Practices Guidelines
          developed by the FMCSA, CVSA, and SC&RA — the same standards used by all 12 US states that
          require pilot car certification. We start where they stop and go further.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          maxWidth: 800,
          margin: '0 auto',
        }}>
          {[
            { icon: '🛡️', text: 'FMCSA Best Practices Aligned', sub: 'Federal standard' },
            { icon: '📋', text: 'SC&RA Guidelines Compliant', sub: 'Industry standard' },
            { icon: '🌍', text: '120 countries', sub: 'Global recognition' },
            { icon: '🏛️', text: 'Exceeds 12 State Standards', sub: 'WA, AZ, CO, FL, GA + more' },
          ].map((item, i) => (
            <div key={i} style={{
              background: '#111118',
              border: '1px solid rgba(245,166,35,0.15)',
              borderRadius: 14,
              padding: '20px 16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', lineHeight: 1.3, marginBottom: 4 }}>{item.text}</div>
              <div style={{ fontSize: 12, color: '#6a6a7a' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INSTRUCTORS ── */}
      <section style={{
        background: '#0c0c10',
        borderTop: '1px solid #1a1a22',
        padding: '64px 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.02em' }}>
            Trained by Operators. Built for Operators.
          </h2>
          <p style={{ color: '#7a7a8a', fontSize: 16, marginBottom: 32, lineHeight: 1.65 }}>
            Our instructor team and curriculum were developed by veteran escort operators with
            combined decades of experience across US corridors, international heavy haul routes,
            and specialized load types.
          </p>

          <div style={{
            background: 'linear-gradient(160deg, #111118 0%, #0f0f16 100%)',
            border: '1px solid rgba(245,166,35,0.12)',
            borderRadius: 20,
            padding: 32,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5A623, #e08820)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>🚛</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#F5A623', marginBottom: 4 }}>Haul Command Training Team</div>
                <div style={{ fontSize: 13, color: '#6a6a7a', marginBottom: 12 }}>Certified Pilot Escort Vehicle Operator Instructors</div>
                <p style={{ fontSize: 14, color: '#9a9ab0', lineHeight: 1.65, margin: '0 0 16px' }}>
                  Our instructor team comprises veteran escort operators with combined decades of experience
                  across US corridors, international heavy haul routes, and specialized load types including
                  wind energy, oilfield equipment, and autonomous vehicle corridors. All curriculum is built
                  on FMCSA and SC&RA Best Practices Guidelines.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Wind Energy', 'Oilfield', 'AV Corridors', 'Superloads', 'International Ops'].map(s => (
                    <span key={s} style={{
                      background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
                      color: '#F5A623', fontSize: 11, fontWeight: 600,
                      padding: '3px 10px', borderRadius: 20, letterSpacing: '0.04em',
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#7a7a8a' }}>
                <span>✓ FMCSA Best Practices trained</span>
                <span>✓ SC&RA Guidelines aligned</span>
                <span>✓ 50,000+ escort miles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ color: '#6a6a7a', marginBottom: 40 }}>Everything you need to know before you start.</p>

        {FAQS.map((faq, i) => (
          <div key={i} style={{
            background: expandedFaq === i ? '#111118' : 'transparent',
            border: '1px solid',
            borderColor: expandedFaq === i ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            marginBottom: 10,
            overflow: 'hidden',
            transition: 'all 0.2s',
          }}>
            <button aria-label="Interactive Button"
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '18px 20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                color: 'inherit',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 15, color: expandedFaq === i ? '#F5A623' : '#e8e8e8', lineHeight: 1.4 }}>
                {faq.q}
              </span>
              <span style={{
                color: '#F5A623', fontSize: 20, flexShrink: 0,
                transform: expandedFaq === i ? 'rotate(45deg)' : 'none',
                transition: 'transform 0.2s',
              }}>+</span>
            </button>
            {expandedFaq === i && (
              <div style={{
                padding: '0 20px 20px',
                fontSize: 14, lineHeight: 1.7, color: '#8a8a9a',
              }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{
        background: 'linear-gradient(160deg, #111120 0%, #0c0c18 100%)',
        borderTop: '1px solid rgba(245,166,35,0.12)',
        padding: '64px 24px',
        textAlign: 'center',
      }}>
        <HCBadge tier="gold" size={80} style={{ margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          Start Earning Your Badge Today
        </h2>
        <p style={{ color: '#7a7a8a', fontSize: 16, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>
          Module 1 is completely free. Your badge goes live the moment you pass. 
          Brokers and AV companies can verify it instantly.
        </p>
        <Link aria-label="Navigation Link" href="/training/platform-fundamentals" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, #F5A623, #e08820)',
          color: '#000', fontWeight: 800, fontSize: 18,
          padding: '16px 36px', borderRadius: 14,
          textDecoration: 'none',
          boxShadow: '0 6px 30px rgba(245,166,35,0.4)',
          letterSpacing: '0.01em',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 40px rgba(245,166,35,0.55)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(245,166,35,0.4)';
          }}
        >
          🎓 Start Module 1 — Free
        </Link>

        <div style={{ marginTop: 32 }}>
          <Link aria-label="Navigation Link" href="/training/corporate" style={{
            color: '#6a6a7a', fontSize: 14,
            textDecoration: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            Certifying a team or fleet? View Corporate Training →
          </Link>
        </div>
      </section>
    </div>
  );
}
