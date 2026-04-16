import type { Metadata } from 'next';
import Link from 'next/link';
import { REGULATIONS, type CountryRegulation } from '@/lib/regulations/global-regulations-db';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { RegulationsFilter, type RegFilterItem } from '@/components/regulations/RegulationsFilter';
import { Globe, MapPin, Shield, ChevronRight, Award, TrendingUp, Zap, BookOpen, FileText } from 'lucide-react';

// ─── Metadata — 120-country, hreflang ────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Pilot Car & Escort Vehicle Regulations — 120 Countries | Haul Command',
  description:
    'Complete escort vehicle and pilot car regulations for oversize loads across 120+ countries. Escort thresholds, local terminology, permit authorities, and certification requirements — verified against official transport authorities.',
  keywords: [
    'pilot car regulations by country',
    'escort vehicle regulations global',
    'oversize load rules international',
    'escort vehicle requirements worldwide',
    'pilot car requirements country',
    'wide load escort regulations',
    'oversize load permit international',
    'heavy haul escort rules',
  ],
  openGraph: {
    title: 'Pilot Car & Escort Regulations — 120 Countries | Haul Command',
    description: 'Escort vehicle regulations for oversize loads across 120+ countries. Thresholds, permits, certifications.',
    url: 'https://www.haulcommand.com/regulations',
    images: [{ url: 'https://www.haulcommand.com/og/regulations.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'Escort Regulations — 120 Countries | Haul Command' },
  alternates: {
    canonical: 'https://www.haulcommand.com/regulations',
    languages: {
      'en-US': 'https://www.haulcommand.com/regulations',
      'en-GB': 'https://www.haulcommand.com/regulations/gb',
      'en-AU': 'https://www.haulcommand.com/regulations/au',
      'en-CA': 'https://www.haulcommand.com/regulations/ca',
      'de-DE': 'https://www.haulcommand.com/regulations/de',
      'nl-NL': 'https://www.haulcommand.com/regulations/nl',
      'fr-FR': 'https://www.haulcommand.com/regulations/fr',
      'pt-BR': 'https://www.haulcommand.com/regulations/br',
      'es-MX': 'https://www.haulcommand.com/regulations/mx',
      'x-default': 'https://www.haulcommand.com/regulations',
    },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  A: '#D4A843', B: '#60A5FA', C: '#94A3B8', D: '#64748B', E: '#B87333',
};
const TIER_LABEL: Record<string, string> = {
  A: 'Gold', B: 'Blue', C: 'Silver', D: 'Slate', E: 'Copper',
};
const TIER_DESC: Record<string, string> = {
  A: 'Full regulatory data · High confidence',
  B: 'Good coverage · Some gaps',
  C: 'Partial data · Expanding',
  D: 'Limited data · Contact local authority',
  E: 'Emerging market · Frontier data',
};

// Top markets for quick-launch grid (Tier A)  
const TIER_A_COUNTRIES = REGULATIONS.filter(r => r.tier === 'A');

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
function buildJsonLd(total: number) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.haulcommand.com/regulations',
        name: 'Pilot Car & Escort Vehicle Regulations — 120 Countries',
        url: 'https://www.haulcommand.com/regulations',
        description: `Complete pilot car and escort vehicle regulations for oversize loads across ${total} countries.`,
        dateModified: new Date().toISOString().split('T')[0],
        publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
            { '@type': 'ListItem', position: 2, name: 'Regulations', item: 'https://www.haulcommand.com/regulations' },
          ],
        },
      },
      {
        '@type': 'Dataset',
        name: 'Haul Command Global Escort Regulations Database',
        description: `Pilot car escort thresholds, local terminology, permit authorities, and certification requirements for ${total} countries.`,
        url: 'https://www.haulcommand.com/regulations',
        temporalCoverage: '2024/..',
        spatialCoverage: { '@type': 'Place', name: 'Global — 120+ Countries' },
        creator: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: REGULATIONS.slice(0, 20).map(reg => ({
          '@type': 'Question',
          name: `Do I need a pilot car in ${reg.countryName}?`,
          acceptedAnswer: { '@type': 'Answer', text: reg.voiceAnswer },
        })),
      },
    ],
  });
}

function getFlag(code: string): string {
  const magic = 127397;
  return code.toUpperCase().split('').map(c => String.fromCodePoint(c.charCodeAt(0) + magic)).join('');
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegulationsIndexPage() {
  const total = REGULATIONS.length;
  const tierACounts = TIER_A_COUNTRIES.length;

  // Build filter items for the client component
  const filterItems: RegFilterItem[] = REGULATIONS.map(r => ({
    countryCode: r.countryCode,
    countryName: r.countryName,
    tier: r.tier,
    terminology: r.terminology.primary,
    thresholdCount: r.escortThresholds.length,
    permitAuthority: r.permitSystem.authority,
    dataQuality: r.dataQuality,
    confidenceState: r.confidenceState,
    voiceAnswer: r.voiceAnswer,
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd(total) }} />

      {/* ── PROOF STRIP ── */}
      <ProofStrip variant="bar" />

      {/* ════════════════════════════════════════════════════════════════════
          HERO — regulations visual identity: permit/authority/official language
          Uses the existing hero image already uploaded to the project.
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: 400,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Background image — regulations hero */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/images/regulations_hero_bg_1775877308369.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }} />
        {/* Heavy dark overlay — readability_first law */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(10,13,20,0.97) 0%, rgba(10,13,20,0.85) 60%, rgba(10,13,20,0.5) 100%)',
        }} />
        {/* Grid texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.012) 60px, rgba(255,255,255,0.012) 61px),
            repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.012) 60px, rgba(255,255,255,0.012) 61px)
          `,
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem', position: 'relative', zIndex: 1, width: '100%' }}>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Haul Command</Link>
            <ChevronRight style={{ width: 10, height: 10 }} />
            <span style={{ color: '#C6923A' }}>Regulations</span>
          </nav>

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            <span style={{ background: 'rgba(198,146,58,0.15)', border: '1px solid rgba(198,146,58,0.3)', color: '#C6923A', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
              🌍 {total} Countries
            </span>
            <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
              ✓ {tierACounts} Tier A Markets — Full Data
            </span>
            <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
              Updated April 2026
            </span>
          </div>

          {/* H1 */}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px', fontStyle: 'italic' }}>
            Escort Vehicle <span style={{ color: '#C6923A', textDecoration: 'underline', textDecorationThickness: 3, textUnderlineOffset: 6 }}>Regulations</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#94a3b8', maxWidth: 640, lineHeight: 1.65, margin: '0 0 28px' }}>
            Complete guide to pilot car and escort vehicle requirements across {total} countries.
            Local terminology, escort thresholds, permit authorities, and certification requirements —
            verified against official transport authorities.
          </p>

          {/* CTA row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/tools/escort-calculator" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
              color: '#000', padding: '12px 24px', borderRadius: 12,
              fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}>
              <Zap style={{ width: 14, height: 14 }} /> Route Calculator — Free
            </Link>
            <Link href="/directory" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
              color: '#f9fafb', padding: '12px 24px', borderRadius: 12,
              fontSize: 13, fontWeight: 800, textDecoration: 'none',
            }}>
              Find Escorts →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP SPONSOR SLOT ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <AdGridSlot zone="regulations_top" />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TOP MARKETS QUICK-LAUNCH
          YP pattern: popular categories / featured markets above results
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 1.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Top Markets — Full Data
          </h2>
          <Link href="/escort-requirements" style={{ fontSize: 12, color: '#C6923A', fontWeight: 700, textDecoration: 'none' }}>
            View escort thresholds →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
          {TIER_A_COUNTRIES.map(reg => (
            <Link
              key={reg.countryCode}
              href={`/regulations/${reg.countryCode.toLowerCase()}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                padding: '12px 8px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(198,146,58,0.12)',
                textDecoration: 'none',
              }}
            >
              <span style={{ fontSize: 22 }}>{getFlag(reg.countryCode)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#e2e8f0', textAlign: 'center', lineHeight: 1.3 }}>
                {reg.countryName}
              </span>
              <span style={{ fontSize: 9, color: '#D4A843', fontWeight: 700 }}>
                {reg.escortThresholds.length} thresholds
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          CATEGORY ACTION BAR — YP subcategory_selector pattern
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Escort Requirements', href: '/escort-requirements', icon: '⚖️', accent: true },
            { label: 'Find Escorts Near Me', href: '/directory', icon: '🔍' },
            { label: 'Available Now', href: '/available-now', icon: '🟢' },
            { label: 'Get Certified', href: '/training', icon: '🎓' },
            { label: 'Corridor Intelligence', href: '/corridors', icon: '🛣️' },
            { label: 'Permit Services', href: '/directory?category=permits', icon: '📋' },
            { label: 'Sponsor This Page', href: '/advertise', icon: '📣', sponsor: true },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20,
                background: item.accent
                  ? 'linear-gradient(135deg, #C6923A, #E0B05C)'
                  : item.sponsor
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255,255,255,0.05)',
                border: item.sponsor
                  ? '1px dashed rgba(198,146,58,0.3)'
                  : item.accent ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: item.accent ? '#000' : item.sponsor ? '#C6923A' : '#d1d5db',
                fontSize: 11, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN — Two-column: regulations directory (left) + utility sidebar (right)
          YP pattern: results grid + utility sidebar
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 1.5rem 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 32, alignItems: 'start' }}>

          {/* ── LEFT: Regulations directory with client filter ── */}
          <div>
            {/* Section heading */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', margin: 0 }}>
                All Countries
              </h2>
              <span style={{ fontSize: 12, color: '#475569' }}>{total} indexed</span>
            </div>

            {/* Client search + filter island — interactive with useState */}
            <RegulationsFilter items={filterItems} linkPrefix="/regulations" />
          </div>

          {/* ── RIGHT SIDEBAR: YP utility column ── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>

            {/* Find Escorts */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(198,146,58,0.1), rgba(198,146,58,0.03))',
              border: '1px solid rgba(198,146,58,0.22)', borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin style={{ width: 14, height: 14, color: '#C6923A' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Find Escorts
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                Find verified pilot car operators in any jurisdiction. Real availability, real trust scores.
              </p>
              <Link href="/directory" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 0', borderRadius: 10, width: '100%',
                background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none',
              }}>
                Search Directory
              </Link>
              <Link href="/available-now" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 0', borderRadius: 10, width: '100%', marginTop: 8,
                background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)',
                color: '#22c55e', fontSize: 11, fontWeight: 700, textDecoration: 'none',
              }}>
                🟢 Available Now
              </Link>
            </div>

            {/* Claim Listing — prominent per YP claim_listing_panel */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield style={{ width: 14, height: 14, color: '#22c55e' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Escort Operators
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                List your escort services. Get trust score, Haul Command Proof badge, and verified leads.
              </p>
              <Link href="/claim" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 0', borderRadius: 10, width: '100%',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)',
                color: '#22c55e', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                Claim Your Listing — Free
              </Link>
            </div>

            {/* Escort Requirements entry */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileText style={{ width: 14, height: 14, color: '#60a5fa' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Escort Requirements
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                Dimension-by-dimension escort thresholds for {total}+ jurisdictions. Width, height, length, weight.
              </p>
              <Link href="/escort-requirements" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 0', borderRadius: 10, width: '100%',
                background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
                color: '#60a5fa', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                View Escort Thresholds →
              </Link>
            </div>

            {/* Route Calculator */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Route Calculator
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                Enter load dimensions + route. Get exact escort requirements for every jurisdiction.
              </p>
              <Link href="/tools/escort-calculator" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 10, width: '100%',
                background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
                color: '#34d399', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                <Zap style={{ width: 12, height: 12 }} /> Try Free →
              </Link>
            </div>

            {/* HC Academy — related_training */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Award style={{ width: 14, height: 14, color: '#a78bfa' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Haul Command Academy
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                National pilot car certification recognized across 30+ states. HC Certified badge included.
              </p>
              <Link href="/training" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 0', borderRadius: 10, width: '100%',
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                color: '#a78bfa', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                View Certifications →
              </Link>
            </div>

            {/* Data Products teaser */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe style={{ width: 14, height: 14, color: '#38bdf8' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Data Products
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                Export regulations as structured data. API access, bulk CSV, enterprise subscriptions.
              </p>
              <Link href="/data-products" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px 0', borderRadius: 10, width: '100%',
                background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)',
                color: '#38bdf8', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                View Data Products →
              </Link>
            </div>

            {/* Sponsor slot — YP advertise_panel */}
            <div style={{
              background: 'rgba(198,146,58,0.04)', border: '1px dashed rgba(198,146,58,0.18)',
              borderRadius: 16, padding: 16, textAlign: 'center',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>
                Sponsor This Page
              </p>
              <p style={{ fontSize: 11, color: '#475569', margin: '0 0 10px', lineHeight: 1.4 }}>
                Reach operators checking regulations across {total} countries.
              </p>
              <Link href="/advertise" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 8,
                background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.22)',
                color: '#C6923A', fontSize: 11, fontWeight: 800, textDecoration: 'none',
              }}>
                View Sponsor Packages →
              </Link>
            </div>

          </aside>
        </div>
      </div>

      {/* ── KNOW BEFORE YOU ROLL CTA ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 32px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(198,146,58,0.07), transparent)',
          border: '1px solid rgba(198,146,58,0.14)', borderRadius: 24, padding: '36px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <BookOpen style={{ width: 16, height: 16, color: '#C6923A' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Free Route Intelligence
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 900, color: '#f9fafb', margin: '0 0 8px', fontStyle: 'italic' }}>
            Know Before You Roll
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Enter your route and load dimensions. Get exact escort requirements across every jurisdiction — instantly.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools/escort-calculator" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f9fafb', color: '#0a0d14',
              padding: '12px 26px', borderRadius: 12, fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}>
              <Zap style={{ width: 14, height: 14 }} /> Route Calculator — Free
            </Link>
            <Link href="/escort-requirements" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.22)',
              color: '#C6923A', padding: '12px 26px', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none',
            }}>
              Escort Thresholds →
            </Link>
          </div>
        </div>
      </section>

      {/* ── NO DEAD END — 8 moves, training + sponsor paths added ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 48px' }}>
        <NoDeadEndBlock
          heading="What Would You Like to Do Next?"
          moves={[
            { href: '/directory', icon: '🔍', title: 'Find Verified Escorts', desc: 'Operators across 120 countries', primary: true, color: '#D4A844' },
            { href: '/claim', icon: '✓', title: 'Claim Your Profile', desc: 'List your operation free', primary: true, color: '#22C55E' },
            { href: '/tools/escort-calculator', icon: '🧮', title: 'Route Calculator', desc: 'Enter route, get requirements' },
            { href: '/escort-requirements', icon: '⚖️', title: 'Escort Thresholds', desc: 'Dimension-based rules by state' },
            { href: '/training', icon: '🎓', title: 'Get HC Certified', desc: 'Haul Command Academy' },
            { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Live operator availability' },
            { href: '/corridors', icon: '🛣️', title: 'Corridor Intelligence', desc: 'Route-specific escort demand' },
            { href: '/advertise', icon: '📣', title: 'Sponsor This Category', desc: 'Self-serve sponsor packages' },
          ]}
        />
      </div>

      {/* Data freshness + footer links */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 48px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#374151' }}>
            Data last updated: April 2026 · Verified against official state DOT and national transport authority sources ·{' '}
            {total} countries ·{' '}
            <Link href="/legal/terms" style={{ color: '#374151' }}>Terms</Link> ·{' '}
            <Link href="/advertise" style={{ color: '#374151' }}>Advertise</Link> ·{' '}
            <Link href="/data-products" style={{ color: '#374151' }}>Data Products</Link>
          </p>
        </div>
      </div>
    </>
  );
}