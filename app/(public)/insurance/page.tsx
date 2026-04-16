import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { VendorCard } from '@/components/marketplace/VendorCard';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { Shield, ChevronRight, Award, Zap, FileText, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Heavy Haul & Pilot Car Insurance | Haul Command',
  description:
    'Specialized commercial auto, cargo, and general liability insurance for pilot car and heavy haul escort operators. Vetted partners, fast quotes, coverage tailored to oversize load requirements.',
  keywords: [
    'pilot car insurance', 'escort vehicle insurance', 'heavy haul insurance',
    'oversize load insurance', 'commercial auto escort', 'cargo insurance heavy haul',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/insurance' },
  openGraph: {
    title: 'Heavy Haul & Pilot Car Insurance | Haul Command',
    description: 'Vetted insurance partners for escort vehicle and heavy haul operators.',
    url: 'https://www.haulcommand.com/insurance',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Heavy Haul & Pilot Car Insurance | Haul Command',
      url: 'https://www.haulcommand.com/insurance',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
          { '@type': 'ListItem', position: 2, name: 'Insurance', item: 'https://www.haulcommand.com/insurance' },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What insurance does a pilot car operator need?',
          acceptedAnswer: { '@type': 'Answer', text: 'Pilot car operators typically need commercial auto liability, general liability, and sometimes cargo insurance. Coverage requirements vary by state and load type. Most states require minimum $1 million liability coverage.' },
        },
      ],
    },
  ],
};

const VENDORS = [
  {
    name: 'Progressive Commercial',
    category: 'Primary Auto & General Liability',
    description: 'Industry-leading policies for pilot cars and heavy haul specialized transport. Immediate quotes tailored to state regulations and cross-border transport requirements.',
    offerText: 'Fast quotes for Haul Command Operators',
    link: 'https://www.progressivecommercial.com',
    isFeatured: true,
  },
  {
    name: 'Reliance Partners',
    category: 'Cargo & Specialized Coverage',
    description: 'Expert specialized trucking and pilot car insurance tailored to complex routes and varying multi-state authority regulations.',
    offerText: 'Free Coverage Audit',
    link: 'https://reliancepartners.com/',
  },
];

export default function InsurancePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProofStrip variant="bar" />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: 320, display: 'flex', alignItems: 'center',
        overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0A0D14',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(34,197,94,0.07), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem', position: 'relative', zIndex: 1, width: '100%' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Haul Command</Link>
            <ChevronRight style={{ width: 10, height: 10 }} />
            <span style={{ color: '#22c55e' }}>Insurance</span>
          </nav>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>✓ Vetted Partners</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>Heavy Haul Specialized</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 14px', fontStyle: 'italic' }}>
            Pilot Car <span style={{ color: '#22c55e' }}>Insurance</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.1rem)', color: '#94a3b8', maxWidth: 560, lineHeight: 1.65, margin: '0 0 24px' }}>
            The heavy haul ecosystem demands specific coverages. Vetted commercial insurance partners who
            understand pilot car and escort vehicle requirements — no generic policies.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="#partners" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
              View Partners →
            </Link>
            <Link href="/claim" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#f9fafb', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
              Claim Your Listing
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP SPONSOR ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <AdGridSlot zone="insurance_top" />
      </div>

      {/* ── CATEGORY ACTION BAR ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Get a Quote', href: 'https://www.progressivecommercial.com', icon: '💰', accent: true },
            { label: 'Claim Your Profile', href: '/claim', icon: '✓' },
            { label: 'Escort Requirements', href: '/escort-requirements', icon: '⚖️' },
            { label: 'Get Certified', href: '/training', icon: '🎓' },
            { label: 'Find Escorts', href: '/directory', icon: '🔍' },
            { label: 'Sponsor This Page', href: '/advertise', icon: '📣', sponsor: true },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: item.accent ? 'linear-gradient(135deg, #22c55e, #16a34a)' : item.sponsor ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)', border: item.sponsor ? '1px dashed rgba(198,146,58,0.3)' : item.accent ? 'none' : '1px solid rgba(255,255,255,0.08)', color: item.accent ? '#000' : item.sponsor ? '#C6923A' : '#d1d5db', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── MAIN TWO-COLUMN ── */}
      <div id="partners" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 1.5rem 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 32, alignItems: 'start' }}>

          {/* LEFT: Insurance Partners */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', margin: 0 }}>Insurance Partners</h2>
              <span style={{ fontSize: 12, color: '#475569' }}>{VENDORS.length} vetted providers</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {VENDORS.map((v, i) => (
                <VendorCard key={i} {...v} />
              ))}
            </div>

            {/* Coverage types info block */}
            <div style={{ marginTop: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 16px' }}>Coverage Types for Pilot Car Operators</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { icon: '🚗', title: 'Commercial Auto Liability', desc: 'Minimum $1M required by most states. Covers bodily injury and property damage during escort operations.' },
                  { icon: '📦', title: 'Cargo Insurance', desc: 'Covers damage to the load being escorted. Often required by carriers and brokers for high-value loads.' },
                  { icon: '🏢', title: 'General Liability', desc: 'Covers third-party claims not related to vehicle operation. Required for most company agreements.' },
                  { icon: '⛑️', title: 'Occupational Accident', desc: 'Covers medical costs and lost income for independent contractors during escort operations.' },
                ].map(item => (
                  <div key={item.title} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mid sponsor */}
            <div style={{ marginTop: 24 }}>
              <AdGridSlot zone="insurance_mid" />
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03))', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield style={{ width: 14, height: 14, color: '#22c55e' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Quote</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Get an instant quote from Progressive Commercial — the industry leader for pilot car coverage.</p>
              <a href="https://www.progressivecommercial.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', borderRadius: 10, width: '100%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
                Get Quote Now
              </a>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileText style={{ width: 14, height: 14, color: '#60a5fa' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compliance</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Know your state's insurance minimums and escort requirements before you quote.</p>
              <Link href="/escort-requirements" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                State Requirements →
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Award style={{ width: 14, height: 14, color: '#a78bfa' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get Certified</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Certified pilots often qualify for lower insurance rates. HC Academy recognized in 30+ states.</p>
              <Link href="/training" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                View Certifications →
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap style={{ width: 14, height: 14, color: '#C6923A' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Claim Free Listing</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Get found by brokers. Trust score, verified badge, and insurance status displayed on your profile.</p>
              <Link href="/claim" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.22)', color: '#C6923A', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Claim Listing — Free
              </Link>
            </div>

            <div style={{ background: 'rgba(198,146,58,0.04)', border: '1px dashed rgba(198,146,58,0.18)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Sponsor This Page</p>
              <p style={{ fontSize: 11, color: '#475569', margin: '0 0 10px', lineHeight: 1.4 }}>Reach pilot car operators seeking insurance coverage.</p>
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
          heading="Explore More Resources"
          moves={[
            { href: '/claim', icon: '✓', title: 'Claim Your Profile', desc: 'List your operation free', primary: true, color: '#22C55E' },
            { href: '/directory', icon: '🔍', title: 'Find Escorts', desc: 'Verified carriers in your area', primary: true, color: '#D4A844' },
            { href: '/escort-requirements', icon: '⚖️', title: 'State Requirements', desc: 'Insurance minimums by state' },
            { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'HC Academy certification' },
            { href: '/tools/escort-calculator', icon: '🧮', title: 'Route Calculator', desc: 'Free cost estimator' },
            { href: '/regulations', icon: '🌍', title: 'Global Regulations', desc: '120 country compliance' },
            { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Live operator feed' },
            { href: '/advertise', icon: '📣', title: 'Sponsor', desc: 'Reach operators here' },
          ]}
        />
      </div>
    </>
  );
}