export const dynamic = "force-dynamic";
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import RelatedLinks from '@/components/seo/RelatedLinks';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { RouteCalcMobileGate } from '@/components/mobile/gates/RouteCalcMobileGate';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { EscortRequirementsSearch, type JurisdictionItem } from '@/components/regulations/EscortRequirementsSearch';
import { Globe, MapPin, Shield, ChevronRight, BookOpen, Zap, TrendingUp, Award } from 'lucide-react';

// ─── Metadata — 120-country scope, global authority ──────────────────────────
export const metadata: Metadata = {
  title: 'Escort Vehicle Requirements by Country & State | Haul Command',
  description:
    'Pilot car and escort vehicle requirements for oversize loads across 120+ countries and all 50 US states. Width, height, length, and weight thresholds — updated real time. Find certified escorts near you.',
  keywords: [
    'escort vehicle requirements by country',
    'pilot car requirements by state',
    'oversize load escort requirements',
    'wide load escort requirements',
    'superload escort requirements',
    'escort vehicle certification requirements',
    'international oversize load regulations',
    'heavy haul escort requirements',
    'pilot car rules global',
    'oversize load permit escort',
  ],
  openGraph: {
    title: 'Escort Vehicle Requirements — 120 Countries | Haul Command',
    description: 'Pilot car and escort vehicle requirements for oversize loads across 120+ countries. Width, height, weight thresholds. Find certified escorts instantly.',
    url: 'https://www.haulcommand.com/escort-requirements',
    images: [{ url: 'https://www.haulcommand.com/og/escort-requirements.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'Escort Requirements — 120 Countries | Haul Command' },
  alternates: {
    canonical: 'https://www.haulcommand.com/escort-requirements',
    languages: {
      'en-US': 'https://www.haulcommand.com/escort-requirements',
      'en-GB': 'https://www.haulcommand.com/regulations/gb',
      'en-AU': 'https://www.haulcommand.com/regulations/au',
      'en-CA': 'https://www.haulcommand.com/regulations/ca',
      'de-DE': 'https://www.haulcommand.com/regulations/de',
      'nl-NL': 'https://www.haulcommand.com/regulations/nl',
      'fr-FR': 'https://www.haulcommand.com/regulations/fr',
      'pt-BR': 'https://www.haulcommand.com/regulations/br',
      'es-MX': 'https://www.haulcommand.com/regulations/mx',
      'x-default': 'https://www.haulcommand.com/escort-requirements',
    },
  },
};

// ─── Country maps ─────────────────────────────────────────────────────────────
const FLAG: Record<string, string> = {
  US:'🇺🇸', CA:'🇨🇦', AU:'🇦🇺', GB:'🇬🇧', NZ:'🇳🇿', ZA:'🇿🇦', DE:'🇩🇪', NL:'🇳🇱',
  AE:'🇦🇪', BR:'🇧🇷', IE:'🇮🇪', SE:'🇸🇪', NO:'🇳🇴', DK:'🇩🇰', FI:'🇫🇮', BE:'🇧🇪',
  AT:'🇦🇹', CH:'🇨🇭', ES:'🇪🇸', FR:'🇫🇷', IT:'🇮🇹', PT:'🇵🇹', SA:'🇸🇦', QA:'🇶🇦',
  MX:'🇲🇽', IN:'🇮🇳', ID:'🇮🇩', TH:'🇹🇭', JP:'🇯🇵', KR:'🇰🇷', PL:'🇵🇱', CZ:'🇨🇿',
  SK:'🇸🇰', HU:'🇭🇺', SI:'🇸🇮', EE:'🇪🇪', LV:'🇱🇻', LT:'🇱🇹', HR:'🇭🇷', RO:'🇷🇴',
  BG:'🇧🇬', GR:'🇬🇷', TR:'🇹🇷', KW:'🇰🇼', OM:'🇴🇲', BH:'🇧🇭', SG:'🇸🇬', MY:'🇲🇾',
  CL:'🇨🇱', AR:'🇦🇷', CO:'🇨🇴', PE:'🇵🇪', VN:'🇻🇳', PH:'🇵🇭', UY:'🇺🇾', PA:'🇵🇦', CR:'🇨🇷',
};
const NAME: Record<string, string> = {
  US:'United States', CA:'Canada', AU:'Australia', GB:'United Kingdom', NZ:'New Zealand',
  ZA:'South Africa', DE:'Germany', NL:'Netherlands', AE:'UAE', BR:'Brazil', IE:'Ireland',
  SE:'Sweden', NO:'Norway', DK:'Denmark', FI:'Finland', BE:'Belgium', AT:'Austria',
  CH:'Switzerland', ES:'Spain', FR:'France', IT:'Italy', PT:'Portugal', SA:'Saudi Arabia',
  QA:'Qatar', MX:'Mexico', IN:'India', ID:'Indonesia', TH:'Thailand', JP:'Japan',
  KR:'South Korea', PL:'Poland', CZ:'Czechia', SK:'Slovakia', HU:'Hungary', SI:'Slovenia',
  EE:'Estonia', LV:'Latvia', LT:'Lithuania', HR:'Croatia', RO:'Romania', BG:'Bulgaria',
  GR:'Greece', TR:'Turkey', KW:'Kuwait', OM:'Oman', BH:'Bahrain', SG:'Singapore',
  MY:'Malaysia', CL:'Chile', AR:'Argentina', CO:'Colombia', PE:'Peru', VN:'Vietnam',
  PH:'Philippines', UY:'Uruguay', PA:'Panama', CR:'Costa Rica',
};
const TIER_A = ['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR'];

interface Jurisdiction {
  jurisdiction_code: string;
  jurisdiction_name: string;
  country_code: string;
  jurisdiction_type: string;
  rule_count: number;
}

// ─── JSON-LD — upgraded to Dataset + FAQPage + BreadcrumbList ────────────────
function buildJsonLd(totalJ: number, countryCount: number, totalR: number) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://www.haulcommand.com/escort-requirements',
        name: 'Escort Vehicle Requirements by Country and State — Haul Command',
        url: 'https://www.haulcommand.com/escort-requirements',
        description: `Pilot car and escort vehicle requirements for oversize loads across ${countryCount} countries and ${totalJ} jurisdictions.`,
        dateModified: new Date().toISOString().split('T')[0],
        publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
            { '@type': 'ListItem', position: 2, name: 'Escort Requirements', item: 'https://www.haulcommand.com/escort-requirements' },
          ],
        },
      },
      {
        '@type': 'Dataset',
        name: 'Haul Command Global Escort Vehicle Requirements Database',
        description: `Comprehensive database of pilot car and escort vehicle requirements for oversize loads across ${countryCount} countries and ${totalJ} jurisdictions, including ${totalR} specific dimension-based rules.`,
        url: 'https://www.haulcommand.com/escort-requirements',
        temporalCoverage: '2024/..',
        spatialCoverage: { '@type': 'Place', name: 'Global — 120+ Countries' },
        creator: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
        license: 'https://www.haulcommand.com/terms',
        keywords: ['pilot car', 'escort vehicle', 'oversize load', 'wide load', 'heavy haul', 'transport regulations'],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'What triggers the need for an escort vehicle?', acceptedAnswer: { '@type': 'Answer', text: 'Escort vehicles are required when load dimensions exceed legal limits. Common triggers: width over 10–12 ft, height over 14–15 ft, length over 75–100 ft, or weight requiring a superload permit. Thresholds vary by country and jurisdiction.' }},
          { '@type': 'Question', name: 'How many pilot cars do I need for an oversize load?', acceptedAnswer: { '@type': 'Answer', text: 'Most US states require one pilot car for loads over 12–14 ft wide, two for loads over 16 ft. Superloads often require police escorts. Requirements vary internationally.' }},
          { '@type': 'Question', name: 'Do pilot car drivers need certification?', acceptedAnswer: { '@type': 'Answer', text: `Many jurisdictions require pilot car operators to hold a state or national certification. Haul Command covers ${totalJ} jurisdictions — check your jurisdiction-specific page for exact certification requirements and reciprocity agreements.` }},
          { '@type': 'Question', name: 'What equipment does a pilot car need?', acceptedAnswer: { '@type': 'Answer', text: 'Standard equipment: OVERSIZE LOAD sign (min 5 ft × 10 in, 8 in black letters on yellow), amber rotating/strobe lights, height pole (lead vehicle), two-way radio or CB, flags, and safety equipment. Requirements vary by jurisdiction.' }},
        ],
      },
    ],
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function EscortRequirementsIndex() {
  const supabase = supabaseServer();
  const { data } = await supabase.rpc('hc_list_all_jurisdictions');
  const jurisdictions: Jurisdiction[] = data || [];

  // Group by country
  const byCountry: Record<string, Jurisdiction[]> = {};
  for (const j of jurisdictions) {
    if (!byCountry[j.country_code]) byCountry[j.country_code] = [];
    byCountry[j.country_code].push(j);
  }
  const countryOrder = Object.keys(byCountry).sort((a, b) => {
    const ai = TIER_A.indexOf(a), bi = TIER_A.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return (NAME[a] || a).localeCompare(NAME[b] || b);
  });
  const totalJ = jurisdictions.length;
  const totalR = jurisdictions.reduce((s, j) => s + Number(j.rule_count), 0);
  const tierACountries = countryOrder.filter(cc => TIER_A.includes(cc));

  // Build serializable items for the client search island
  const searchItems: JurisdictionItem[] = jurisdictions.map(j => ({
    jurisdiction_code: j.jurisdiction_code,
    jurisdiction_name: j.jurisdiction_name,
    country_code: j.country_code,
    country_name: NAME[j.country_code] || j.country_code,
    jurisdiction_type: j.jurisdiction_type,
    rule_count: j.rule_count,
  }));

  return (
    <RouteCalcMobileGate>
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd(totalJ, countryOrder.length, totalR) }} />

      {/* ── PROOF STRIP ── */}
      <ProofStrip variant="bar" />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Visual Identity: regulations/authority visual language
          Dark overlay, cinematic, permit/authority feel.
          Per visual_identity_system.page_family_backgrounds.regulations
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(160deg, #0a0d14 0%, #0f1520 40%, #0a0d14 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
        minHeight: 420,
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Background texture — authority/permit visual identity */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(198,146,58,0.07) 0%, transparent 50%),
            radial-gradient(circle at 80% 30%, rgba(59,130,246,0.04) 0%, transparent 40%),
            repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.008) 60px, rgba(255,255,255,0.008) 61px),
            repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.008) 60px, rgba(255,255,255,0.008) 61px)
          `,
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem', position: 'relative', zIndex: 1, width: '100%' }}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Haul Command</Link>
            <ChevronRight style={{ width: 10, height: 10 }} />
            <span style={{ color: '#C6923A' }}>Escort Requirements</span>
          </nav>

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            <span style={{ background: 'rgba(198,146,58,0.15)', border: '1px solid rgba(198,146,58,0.3)', color: '#C6923A', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              🌍 {countryOrder.length} Countries
            </span>
            <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
              ✓ {totalJ} Jurisdictions
            </span>
            <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
              {totalR} Rules Indexed
            </span>
          </div>

          {/* H1 */}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px', fontStyle: 'italic' }}>
            Escort <span style={{ color: '#C6923A', textDecoration: 'underline', textDecorationThickness: 3, textUnderlineOffset: 6 }}>Requirements</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#94a3b8', maxWidth: 640, lineHeight: 1.65, margin: '0 0 28px' }}>
            Dimension-based escort rules for oversize loads across {countryOrder.length} countries and {totalJ} jurisdictions.
            Width, height, length, and weight thresholds — verified against official transport authorities.
          </p>

          {/* ── YP PATTERN: Search bar rendered by client island below ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 580 }}>
            <Link href="/tools/escort-calculator" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
              color: '#000', padding: '0 20px', height: 48, borderRadius: 12,
              fontSize: 13, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              <Zap style={{ width: 14, height: 14 }} /> Route Calculator — Free
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          YP PATTERN: Top-of-results sponsor slot (position 1)
          Haul Command Sponsor Grid — self-serve inventory
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <AdGridSlot zone="requirements_top" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TIER A GEOGRAPHY QUICK-LAUNCH
          YP pattern: Popular categories / top markets surfaced immediately
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 1.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Top Markets
          </h2>
          <Link href="/regulations" style={{ fontSize: 12, color: '#C6923A', fontWeight: 700, textDecoration: 'none' }}>
            View all regulations →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {tierACountries.map(cc => (
            <Link
              key={cc}
              href={`/escort-requirements/${cc === 'US' ? 'us' : cc.toLowerCase()}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 10px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 24 }}>{FLAG[cc] || '🌍'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', textAlign: 'center' }}>{NAME[cc] || cc}</span>
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
                {byCountry[cc]?.length || 0} jurisdictions
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CATEGORY ACTION BAR
          YP pattern: subcategory_selector — role / load type / availability
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 1.5rem 0' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Find Escorts Near Me', href: '/directory', icon: '🔍', accent: true },
            { label: 'Available Now', href: '/available-now', icon: '🟢' },
            { label: 'By Certification', href: '/training', icon: '🎓' },
            { label: 'By Route', href: '/corridors', icon: '🛣️' },
            { label: 'By Equipment', href: '/equipment', icon: '🚧' },
            { label: 'Sponsor This Page', href: '/advertise', icon: '📣', sponsor: true },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 20,
                background: item.accent
                  ? 'linear-gradient(135deg, #C6923A, #E0B05C)'
                  : item.sponsor
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(255,255,255,0.05)',
                border: item.sponsor
                  ? '1px dashed rgba(198,146,58,0.3)'
                  : item.accent ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: item.accent ? '#000' : item.sponsor ? '#C6923A' : '#d1d5db',
                fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT — TWO COLUMN: Directory (left) + Info (right)
          YP pattern: results grid + utility sidebar
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 32, alignItems: 'start' }}>

          {/* ── LEFT: Jurisdiction Directory ── */}
          <div>
            {/* AI Answer Block — informational support for directory */}
            <div style={{ marginBottom: 32 }}>
              <StaticAnswerBlock
                question="What are escort vehicle requirements for oversize loads?"
                answer={`Escort vehicle (pilot car) requirements vary by jurisdiction. Loads exceeding specific width, height, length, or weight thresholds require one or more escort vehicles. Haul Command covers ${totalJ} jurisdictions across ${countryOrder.length} countries with ${totalR} specific rules. Most US states require at least one pilot car for loads exceeding 12–14 feet wide.`}
                confidence="verified_but_review_due"
                ctaLabel="Check Your Route Requirements"
                ctaUrl="/tools/escort-calculator"
              />
            </div>

            {/* Jurisdiction directory — client island handles search + filter */}
            <EscortRequirementsSearch
              items={searchItems}
              flags={FLAG}
              names={NAME}
              tierA={TIER_A}
            />

            {/* ── SNIPPET INJECTOR — AI search capture ── */}
            <div style={{ marginTop: 32 }}>
              <SnippetInjector
                blocks={['definition', 'faq', 'quick_table', 'steps']}
                term="escort vehicle"
                geo="Global"
                country="GLOBAL"
              />
            </div>
          </div>

          {/* ── RIGHT SIDEBAR: YP-pattern utility column ── */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

            {/* Find Escorts CTA — primary monetization surface */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(198,146,58,0.12), rgba(198,146,58,0.04))',
              border: '1px solid rgba(198,146,58,0.25)', borderRadius: 16, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <MapPin style={{ width: 16, height: 16, color: '#C6923A' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Find Escorts
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.55 }}>
                Find verified pilot car operators in any jurisdiction. Real availability, real trust scores.
              </p>
              <Link href="/directory" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 0', borderRadius: 10, width: '100%',
                background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                color: '#000', fontSize: 13, fontWeight: 900, textDecoration: 'none',
              }}>
                Search Directory
              </Link>
              <Link href="/available-now" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 0', borderRadius: 10, width: '100%', marginTop: 8,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                color: '#22c55e', fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
                🟢 Available Now
              </Link>
            </div>

            {/* Claim CTA — prominent in sidebar per YP claim_listing_panel */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
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
                padding: '9px 0', borderRadius: 10, width: '100%',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                color: '#22c55e', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                Claim Your Listing — Free
              </Link>
            </div>

            {/* Route Calculator CTA */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#60a5fa' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Route Calculator
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                Enter load dimensions + route. Get exact escort requirements across every jurisdiction on your route.
              </p>
              <Link href="/tools/escort-calculator" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 0', borderRadius: 10, width: '100%',
                background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
                color: '#60a5fa', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                <Zap style={{ width: 12, height: 12 }} /> Try Free →
              </Link>
            </div>

            {/* HC Academy — training entry per category_hub.related_training */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Award style={{ width: 14, height: 14, color: '#a78bfa' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Haul Command Academy
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                Get HC Certified. Nationally recognized pilot car certification recognized across 30+ states.
              </p>
              <Link href="/training" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '9px 0', borderRadius: 10, width: '100%',
                background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                color: '#a78bfa', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                View Certifications →
              </Link>
            </div>

            {/* Haul Command Data Products teaser */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 16, padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe style={{ width: 14, height: 14, color: '#34d399' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Data Products
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                Export jurisdiction rules as structured data. API access, bulk CSV, pro subscriptions.
              </p>
              <Link href="/data-products" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '9px 0', borderRadius: 10, width: '100%',
                background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)',
                color: '#34d399', fontSize: 12, fontWeight: 800, textDecoration: 'none',
              }}>
                View Data Products →
              </Link>
            </div>

            {/* Self-serve sponsor slot — YP advertise_panel */}
            <div style={{
              background: 'rgba(198,146,58,0.04)', border: '1px dashed rgba(198,146,58,0.2)',
              borderRadius: 16, padding: 18, textAlign: 'center',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                Sponsor This Page
              </p>
              <p style={{ fontSize: 11, color: '#475569', margin: '0 0 10px', lineHeight: 1.45 }}>
                Reach operators and carriers checking requirements across {countryOrder.length} countries.
              </p>
              <Link href="/advertise" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(198,146,58,0.12)', border: '1px solid rgba(198,146,58,0.25)',
                color: '#C6923A', fontSize: 11, fontWeight: 800, textDecoration: 'none',
              }}>
                View Sponsor Packages →
              </Link>
            </div>

          </aside>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          KNOW BEFORE YOU ROLL — tool CTA (kept from original, upgraded)
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 32px' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(198,146,58,0.08), transparent)',
          border: '1px solid rgba(198,146,58,0.15)', borderRadius: 24,
          padding: '40px', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen style={{ width: 18, height: 18, color: '#C6923A' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Free Route Intelligence
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#f9fafb', margin: '0 0 10px', fontStyle: 'italic' }}>
            Know Before You Roll
          </h2>
          <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 520, margin: '0 auto 22px', lineHeight: 1.65 }}>
            Enter your origin, destination, and load dimensions. Get exact escort requirements for every jurisdiction on your route — instantly.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/tools/escort-calculator" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#f9fafb', color: '#0a0d14',
              padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 900, textDecoration: 'none',
            }}>
              <Zap style={{ width: 15, height: 15 }} /> Route Calculator — Free
            </Link>
            <Link href="/directory" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(198,146,58,0.12)', border: '1px solid rgba(198,146,58,0.25)',
              color: '#C6923A', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 800, textDecoration: 'none',
            }}>
              Find an Escort →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          RELATED LINKS + NO DEAD END
          Existing strong SEO components — kept and positioned correctly
      ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 16px' }}>
        <RelatedLinks
          pageType="regulation"
          heading="Related escort resources and tools"
        />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 48px' }}>
        <NoDeadEndBlock
          heading="What Would You Like to Do Next?"
          moves={[
            { href: '/directory', icon: '🔍', title: 'Find Verified Escorts', desc: 'Operators ready for dispatch', primary: true, color: '#D4A844' },
            { href: '/claim', icon: '✓', title: 'Claim Your Listing', desc: 'List your escort services', primary: true, color: '#22C55E' },
            { href: '/tools/escort-calculator', icon: '🧮', title: 'Route Calculator', desc: 'Enter route, get requirements' },
            { href: '/regulations', icon: '🌍', title: 'Global Regulations', desc: '120 country escort rules' },
            { href: '/training', icon: '🎓', title: 'Get HC Certified', desc: 'Haul Command Academy' },
            { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Operators broadcasting live' },
            { href: '/corridors', icon: '🛣️', title: 'Corridor Intelligence', desc: 'Route-specific escort demand' },
            { href: '/advertise', icon: '📣', title: 'Sponsor This Category', desc: 'Self-serve sponsor packages' },
          ]}
        />
      </div>

      {/* Data freshness stamp */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 48px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#374151' }}>
            Data last updated: April 2026 · Verified against official state DOT and national transport authority sources ·{' '}
            {totalJ} jurisdictions · {totalR} rules · {countryOrder.length} countries ·{' '}
            <Link href="/legal/terms" style={{ color: '#374151' }}>Terms</Link> ·{' '}
            <Link href="/advertise" style={{ color: '#374151' }}>Advertise</Link>
          </p>
        </div>
      </div>
    </>
    </RouteCalcMobileGate>
  );
}

