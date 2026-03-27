import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AV Company Partnerships — Haul Command',
  description:
    'Partner with Haul Command to connect your autonomous trucking operations with AV-Ready certified escort operators. White-label, preferred provider, and data partnership models.',
  keywords: [
    'autonomous truck escort dispatch',
    'AV logistics partner',
    'Aurora Innovation escort partner',
    'Kodiak escort network',
    'pilot car autonomous vehicle platform',
  ],
};

const STATS = [
  { val: '1.5M+', label: 'Verified operators tracked globally' },
  { val: '57', label: 'Countries covered' },
  { val: '219', label: 'Active corridors' },
  { val: '47 min', label: 'Median fill time' },
];

const PITCH_PAGES = [
  {
    num: '01',
    headline: 'Your trucks are autonomous. Your escorts shouldn\'t be random.',
    body: 'When your oversize loads hit Texas highways, you need certified escorts who understand how the Aurora Driver behaves. No CB radio. Different merge patterns. Different emergency protocols. Haul Command has them — verified, AV-Ready certified, on your corridors.',
    accent: '#ff9500',
  },
  {
    num: '02',
    headline: 'The problem today',
    body: null,
    bullets: [
      'AV oversize loads still require human escorts by law in every operating state',
      'Logistics partners (Uber Freight, Hirschbach) scramble for escorts last-minute',
      'No existing certification standard exists for AV-adjacent escort work',
      'Random escorts don\'t understand AV behavior patterns = safety risk',
      'No single platform aggregates verified AV-Ready operators by corridor',
    ],
    accent: '#ef4444',
  },
  {
    num: '03',
    headline: 'The Haul Command solution',
    body: null,
    bullets: [
      'AV-Ready Certified operator network — trained on your truck\'s specific protocols',
      'Pre-vetted operators on your specific corridors, available within 47 minutes',
      'Single API call or dashboard to dispatch a certified escort',
      'Escrow-protected payment — automatic on job completion, no disputes',
      'Real-time tracking — your ops team sees the escort live alongside your truck',
    ],
    accent: '#00ff88',
  },
  {
    num: '04',
    headline: 'Proof',
    body: null,
    stats: true,
    accent: '#f5c842',
  },
];

export default function AVPartnersPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #07090f 0%, #0f1a10 40%, #07090f 100%)',
        padding: '80px 24px 64px', textAlign: 'center',
        borderBottom: '1px solid #1a2e1a',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, #00ff88 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 20,
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)',
            color: '#00ff88', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 24,
          }}>
            🤝 AV COMPANY PARTNERSHIP PROGRAM
          </div>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 54px)', fontWeight: 900, margin: '0 0 16px',
            background: 'linear-gradient(135deg, #fff 0%, #00ff88 60%, #00ccff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1,
          }}>
            The escort network<br />for autonomous freight
          </h1>
          <p style={{ color: '#8fa3c0', fontSize: 18, maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Your autonomous trucks are changing everything. Except the requirement for human escorts.
            Haul Command is the platform that makes that requirement effortless.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/training/corporate">
              <button style={{
                background: 'linear-gradient(90deg, #00ff88, #00ccff)',
                color: '#07090f', border: 'none', borderRadius: 12,
                padding: '14px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer',
              }}>
                Become a Partner →
              </button>
            </Link>
            <a href="mailto:partners@haulcommand.com">
              <button style={{
                background: 'transparent', border: '1px solid rgba(0,255,136,0.3)',
                color: '#00ff88', borderRadius: 12,
                padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              }}>
                Schedule a Call
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* Pitch deck pages */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 24px' }}>
        {PITCH_PAGES.map((page) => (
          <div key={page.num} style={{
            borderLeft: `3px solid ${page.accent}`,
            paddingLeft: 28, marginBottom: 56,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 800, color: page.accent,
              letterSpacing: '0.12em', marginBottom: 12,
            }}>PAGE {page.num}</div>
            <h2 style={{
              fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 900,
              color: '#f0f4f8', margin: '0 0 20px', lineHeight: 1.2,
            }}>{page.headline}</h2>
            {page.body && (
              <p style={{ color: '#b0bcd0', fontSize: 16, lineHeight: 1.8, maxWidth: 680, margin: 0 }}>
                {page.body}
              </p>
            )}
            {page.bullets && (
              <div style={{ display: 'grid', gap: 12 }}>
                {page.bullets.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: `rgba(${page.accent === '#ef4444' ? '239,68,68' : '0,255,136'},0.05)`,
                    border: `1px solid rgba(${page.accent === '#ef4444' ? '239,68,68' : '0,255,136'},0.12)`,
                    borderRadius: 12, padding: '14px 16px',
                  }}>
                    <span style={{ color: page.accent, fontWeight: 900, flexShrink: 0, fontSize: 16 }}>
                      {page.accent === '#ef4444' ? '✕' : '✓'}
                    </span>
                    <span style={{ color: '#b0bcd0', fontSize: 15, lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
            {page.stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {STATS.map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)',
                    borderRadius: 14, padding: '20px 20px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#f5c842' }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: '#8fa3c0', marginTop: 6, lineHeight: 1.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Partnership options */}
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Three ways to partner</h2>
          <p style={{ color: '#8fa3c0', marginBottom: 32, fontSize: 15 }}>
            Start where you are. Scale as you grow.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[
              {
                letter: 'A', title: 'White-Label Integration',
                desc: '"[YourBrand] Escort Connect" — powered by Haul Command. Your branding. Your logistics partners. We handle dispatch, verification, and payment.',
                price: 'Flat API fee + revenue share', accent: '#f5c842',
              },
              {
                letter: 'B', title: 'Preferred Provider',
                desc: 'Haul Command becomes your preferred escort dispatch. Your logistics partners get priority access to your corridor\'s AV-Ready certified operators.',
                price: 'Platform access + corridor licensing', accent: '#00ff88',
              },
              {
                letter: 'C', title: 'Data Partnership',
                desc: 'Share route data → we pre-position certified operators before your trucks arrive. Predictive availability = sub-47-minute fill times.',
                price: 'Data licensing + SLA guarantee', accent: '#00ccff',
              },
            ].map(opt => (
              <div key={opt.letter} style={{
                background: `rgba(${opt.accent === '#f5c842' ? '245,200,66' : opt.accent === '#00ff88' ? '0,255,136' : '0,204,255'},0.05)`,
                border: `1px solid rgba(${opt.accent === '#f5c842' ? '245,200,66' : opt.accent === '#00ff88' ? '0,255,136' : '0,204,255'},0.2)`,
                borderRadius: 20, padding: '28px 24px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `rgba(${opt.accent === '#f5c842' ? '245,200,66' : opt.accent === '#00ff88' ? '0,255,136' : '0,204,255'},0.15)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 900, color: opt.accent, marginBottom: 16,
                }}>{opt.letter}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#f0f4f8', marginBottom: 10 }}>{opt.title}</div>
                <div style={{ fontSize: 14, color: '#b0bcd0', lineHeight: 1.7, marginBottom: 16 }}>{opt.desc}</div>
                <div style={{ fontSize: 12, color: opt.accent, fontWeight: 600 }}>💰 {opt.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 64, textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,204,255,0.05))',
          border: '1px solid rgba(0,255,136,0.2)', borderRadius: 22, padding: '48px',
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 16px' }}>
            Ready to connect your fleet?
          </h2>
          <p style={{ color: '#8fa3c0', marginBottom: 28, fontSize: 15 }}>
            We work with AV companies and logistics partners directly. Response within 24 hours.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/training/corporate">
              <button style={{
                background: 'linear-gradient(90deg, #00ff88, #00ccff)',
                color: '#07090f', border: 'none', borderRadius: 12,
                padding: '14px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer',
              }}>
                Submit Partnership Inquiry
              </button>
            </Link>
            <a href="mailto:partners@haulcommand.com" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent', border: '1px solid rgba(0,255,136,0.3)',
                color: '#00ff88', borderRadius: 12, padding: '14px 24px', fontSize: 16, cursor: 'pointer',
              }}>
                partners@haulcommand.com
              </button>
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link href="/training/av-certification" style={{ color: '#8fa3c0', fontSize: 14, textDecoration: 'none' }}>
            ← AV-Ready Certification for Individual Operators
          </Link>
        </div>
      </div>
    </div>
  );
}
