import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'

export const revalidate = 3600

// ─── METADATA ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Pilot Car & Escort Operator Training — Get Certified | Haul Command',
  description:
    'Pilot car and escort operator certification for heavy haul, wind, oilfield, port, superload, and AV corridors. State-aware and global-ready training pathways for operators, brokers, and fleets. 120 countries.',
  keywords: [
    'pilot car certification', 'escort operator training', 'PEVO course',
    'pilot car training online', 'escort vehicle operator certification',
    'heavy haul training', 'oversize load escort training', 'AV escort certification',
    'pilot car training state requirements', 'HC certified training',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/training' },
  openGraph: {
    title: 'Pilot Car & Escort Operator Training | Haul Command',
    description: 'State-aware, globally-ready pilot car and escort operator certification. From free fundamentals to Elite. 120 countries.',
    url: 'https://www.haulcommand.com/training',
    siteName: 'Haul Command',
    type: 'website',
  },
}

// ─── STATIC MODULE DATA (always renders in HTML for Googlebot) ───────────────
export const MODULES = [
  {
    slot: 1,
    slug: 'pilot-car-fundamentals',
    title: 'Pilot Car Fundamentals',
    description:
      'Safety basics, escort vehicle roles, required equipment, convoy flow, terminology, and the legal framework every escort operator must know before their first move.',
    audience: 'New operators, career changers, new-to-US international operators',
    duration: '35 min',
    outcomes: ['Understand escort roles and responsibilities', 'Know required equipment by jurisdiction', 'Pass state knowledge checks'],
    tier: 'HC Certified',
    isFree: true,
  },
  {
    slot: 2,
    slug: 'route-survey-clearance-intelligence',
    title: 'Route Survey & Clearance Intelligence',
    description:
      'Heights, widths, vertical and horizontal clearance measurement, obstacle documentation, route planning workflows, and how to log and report route hazards.',
    audience: 'Operators pursuing route survey work, broker-side planners',
    duration: '40 min',
    outcomes: ['Conduct a legal route survey', 'Document clearance data accurately', 'Identify and report route hazards'],
    tier: 'HC Certified',
    isFree: false,
  },
  {
    slot: 3,
    slug: 'state-jurisdiction-compliance',
    title: 'State & Jurisdiction Compliance',
    description:
      'Permit touchpoints, signage requirements, lighting rules, escort formation rules by state, common compliance triggers, and how to stay legal across state lines.',
    audience: 'All operators running permitted loads across state lines',
    duration: '45 min',
    outcomes: ['Identify escort requirements in any US state', 'Avoid common compliance failures', 'Navigate multi-state permit chains'],
    tier: 'HC Certified',
    isFree: false,
  },
  {
    slot: 4,
    slug: 'communication-convoy-control',
    title: 'Communication, Convoy Control & Incident Response',
    description:
      'Radio discipline, position call conventions, emergency stop procedures, intersection management, lane coordination, and how to handle stoppages, breakdowns, and incidents.',
    audience: 'All operators; required for AV-Ready certification',
    duration: '40 min',
    outcomes: ['Run professional radio communication', 'Manage convoy incidents safely', 'Coordinate multi-vehicle escorts'],
    tier: 'AV-Ready',
    isFree: false,
  },
  {
    slot: 5,
    slug: 'broker-carrier-load-workflow',
    title: 'Broker, Carrier & Load Workflow',
    description:
      'Dispatch handoff discipline, load documentation, ETA and status reporting expectations, carrier and broker communication norms, and how to handle load changes mid-route.',
    audience: 'Operators working with brokers and carriers; broker-side planners',
    duration: '35 min',
    outcomes: ['Work professionally with brokers and carriers', 'Handle dispatch changes mid-load', 'Document load execution correctly'],
    tier: 'AV-Ready',
    isFree: false,
  },
  {
    slot: 6,
    slug: 'specialized-vertical-operations',
    title: 'Specialized Vertical Operations',
    description:
      'Wind energy escort specifics, superload planning, oilfield escort norms, port and TWIC-adjacent procedures, military and aerospace load handling, and renewable energy project cargo.',
    audience: 'Operators pursuing specialist and premium corridor work',
    duration: '50 min',
    outcomes: ['Qualify for wind, superload, and oilfield work', 'Understand port and TWIC procedures', 'Operate in military and aerospace contexts'],
    tier: 'Elite',
    isFree: false,
  },
  {
    slot: 7,
    slug: 'digital-operations-haul-command',
    title: 'Digital Operations & Haul Command Advantage',
    description:
      'Haul Command profile setup, badge verification, trust signals, marketplace leverage, how brokers search and rank operators, and how to use digital tools to earn more corridor work.',
    audience: 'All operators; essential for maximizing platform and marketplace earnings',
    duration: '30 min',
    outcomes: ['Maximize Haul Command profile rank', 'Earn verified badge and trust signals', 'Attract broker contact and corridor job requests'],
    tier: 'HC Certified',
    isFree: true,
  },
]

// ─── STATIC FAQ DATA (answers always in HTML — required for FAQPage schema) ──
const FAQS = [
  {
    q: 'What is pilot car training?',
    a: 'Pilot car training teaches escort vehicle operators how to safely lead or follow oversize and overweight loads on public roads. It covers equipment requirements, communication protocols, route surveying, state compliance rules, and convoy management. Haul Command Training is built on FMCSA and SC&RA Best Practices Guidelines.',
  },
  {
    q: 'Who is this training for?',
    a: 'This training is for pilot car operators, escort vehicle operators, heavy haul brokers, fleet managers, dispatchers, and enterprise teams that need certified escort capacity. It is relevant for both US-based and international operations.',
  },
  {
    q: 'Is this training required in every state or country?',
    a: 'Requirements vary. Twelve US states currently mandate pilot car certification. The HC Certified curriculum meets or exceeds the curriculum requirements for all 12 states. International requirements vary by country — see the country training pages for jurisdiction-specific details.',
  },
  {
    q: 'What does the Haul Command certification badge actually prove?',
    a: 'The HC badge verifies that you completed the HC training curriculum, which is built on FMCSA, CVSA, and SC&RA Best Practices Guidelines. It does not automatically replace state-issued certifications where those are required, but it signals professional knowledge, equipment familiarity, and platform trust to brokers and carriers.',
  },
  {
    q: 'How long does the training take?',
    a: 'Module 1 (Pilot Car Fundamentals) takes approximately 35 minutes and is free. HC Certified (modules 1–3) takes approximately 2 hours. AV-Ready (modules 1–5) takes approximately 3.5 hours. Elite (all 7 modules) takes approximately 4.5 hours total. All modules are self-paced.',
  },
  {
    q: 'Is it self-paced?',
    a: 'Yes. All Haul Command Training modules are fully self-paced. You can start, stop, and resume at any time. Progress is saved to your account.',
  },
  {
    q: 'Does this training help me get more jobs?',
    a: 'Yes. Certified operators receive a verified badge on their Haul Command profile, which is visible to brokers and carriers during search. Certified operators consistently receive more broker contact requests and qualify for higher-value loads including wind, superload, oilfield, and AV corridor work.',
  },
  {
    q: 'Can brokers verify my certification status?',
    a: 'Yes. Every HC badge includes an instant verification link. Brokers and carriers can verify your certification status without contacting you, which reduces friction and increases close rate on booking requests.',
  },
  {
    q: 'Is there training for fleets or corporate teams?',
    a: 'Yes. Haul Command offers corporate and fleet enrollment with volume pricing, team progress tracking, and compliance reporting. See the Corporate Training page for details.',
  },
  {
    q: 'Does this training cover AV corridor escort work?',
    a: 'Yes. The AV-Ready certification tier (modules 1–5) includes training on how to work alongside autonomous freight systems including Aurora, Kodiak, and Waabi platforms. It covers communication protocols, sensor field awareness, and country-specific AV regulations.',
  },
  {
    q: 'Can I take this training outside the United States?',
    a: 'Yes. Haul Command Training is designed for global operations and is available in 120 countries. Country-specific training pages are available for the US, Canada, Australia, UK, UAE, and other markets, with localized requirements and terminology.',
  },
  {
    q: 'How often do I need to renew my certification?',
    a: 'Certification renewal is annual. You receive reminder notifications 30 days and 7 days before expiry. Renewal costs less than initial certification. Your badge shows a renewal prompt to brokers if expired so you never lose work unexpectedly.',
  },
  {
    q: 'What is the difference between HC Certified, AV-Ready, and Elite?',
    a: 'HC Certified (modules 1–3) covers pilot car fundamentals, route surveying, and jurisdiction compliance — the global baseline. AV-Ready (modules 1–5) adds convoy communication and broker/carrier workflow training, plus AV corridor readiness. Elite (all 7 modules) adds specialized vertical operations including wind, superload, oilfield, port, military, and aerospace, plus full digital operations training.',
  },
]

// ─── SCHEMA BLOCKS ─────────────────────────────────────────────────────────
function buildSchema(courses: any[]) {
  const courseList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Pilot Car & Escort Operator Training — Haul Command',
    description: 'Global pilot car and escort operator certification training. HC Certified, AV-Ready, and Elite pathways. 120 countries.',
    url: 'https://www.haulcommand.com/training',
    numberOfItems: MODULES.length,
    itemListElement: MODULES.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: m.title,
        description: m.description,
        provider: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
        url: `https://www.haulcommand.com/training/${m.slug}`,
        timeRequired: `PT${m.duration.replace(' min', 'M')}`,
        isAccessibleForFree: m.isFree,
        educationalLevel: m.tier,
        teaches: m.outcomes,
      },
    })),
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
      { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.haulcommand.com/training' },
    ],
  }

  return [courseList, faqSchema, breadcrumb]
}

// ─── TIER COLOR MAP ─────────────────────────────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  'HC Certified': '#A8A8A8',
  'AV-Ready': '#F5A623',
  'Elite': '#E5E4E2',
}

const gold = '#D4A844'
const s = {
  page: { minHeight: '100vh', background: '#07090d', color: '#e8e8e8' } as const,
  container: { maxWidth: 1100, margin: '0 auto', padding: '0 20px' } as const,
}

// ─── PAGE ───────────────────────────────────────────────────────────────────
export default async function TrainingPage() {
  // Pull live course data to overlay on static modules (optional enrichment)
  let liveCourses: any[] = []
  try {
    const supabase = createClient()
    const { data } = await (supabase as any)
      .from('hc_training_courses')
      .select('slug,price_cents,currency,is_active')
      .eq('is_active', true)
    liveCourses = data ?? []
  } catch { /* graceful — static data always renders */ }

  const liveBySlug = Object.fromEntries(liveCourses.map(c => [c.slug, c]))
  const schemas = buildSchema(liveCourses)

  return (
    <>
      {schemas.map((s, i) => <JsonLd key={i} data={s} />)}

      <div style={s.page}>

        {/* ── BREADCRUMB ─────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0' }}>
          <div style={{ ...s.container, display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <span style={{ color: gold }}>Training</span>
          </div>
        </nav>

        {/* ── JUMP NAV ───────────────────────────────────────────────── */}
        <nav aria-label="Page sections" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', padding: '10px 0', overflowX: 'auto' }}>
          <div style={{ ...s.container, display: 'flex', gap: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {[
              ['#overview', 'Overview'],
              ['#modules', 'All 7 Modules'],
              ['#outcomes', 'Outcomes'],
              ['#pricing', 'Pricing'],
              ['#countries', 'Countries & States'],
              ['#faq', 'FAQ'],
              ['/training/corporate', 'Corporate Training'],
            ].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#9ca3af', textDecoration: 'none' }}>{label}</a>
            ))}
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────── */}
        <section id="overview" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(2.5rem,6vw,5rem) 20px clamp(2rem,4vw,3.5rem)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(212,168,68,0.1), transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ ...s.container, position: 'relative' }}>

            {/* Kicker */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', borderRadius: 20, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>HC Training Academy · 120 Countries</span>
            </div>

            {/* H1 — keyword-first */}
            <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#f9fafb' }}>
              Pilot Car &amp; Escort<br />
              <span style={{ color: gold }}>Operator Training</span>
            </h1>

            {/* Emotional subhead */}
            <p style={{ margin: '0 0 12px', fontSize: 'clamp(1rem,2vw,1.25rem)', fontWeight: 700, color: '#d1d5db' }}>
              Get Certified. Get Chosen First.
            </p>

            <p style={{ margin: '0 0 28px', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 600 }}>
              The only global training platform built for pilot car and escort operators working in
              heavy haul, wind energy, oilfield, superload, port, and autonomous vehicle corridors.
              State-aware. Global-ready. Free to start.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
              <Link href="/training/pilot-car-fundamentals" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                🎓 Start Free — Module 1
              </Link>
              <a href="#modules" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                See All 7 Modules ↓
              </a>
              <Link href="/training/corporate" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Fleet / Corporate Training →
              </Link>
            </div>

            {/* Proof chips */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
              {[
                '✓ Built on FMCSA + SC&RA Standards',
                '✓ Meets all 12 US state cert requirements',
                '✓ 120 countries',
                '✓ Digital badge with instant broker verification',
                '✓ Free to start — Module 1 no login required',
              ].map(t => <span key={t}>{t}</span>)}
            </div>
          </div>
        </section>

        {/* ── WHY THIS MAKES YOU MORE MONEY ─────────────────────────── */}
        <section id="outcomes" style={{ padding: 'clamp(2rem,4vw,3rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={s.container}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>
              Why This Training Makes You More Money and Easier to Trust
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Certification directly improves your position in the Haul Command marketplace.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 10 }}>
              {[
                { icon: '📈', title: 'Rank higher in directory search', desc: 'Certified operators appear above uncertified operators in broker searches.' },
                { icon: '🏅', title: 'Earn a visible verification badge', desc: 'Your badge is visible before brokers contact you — reduces friction, boosts close rate.' },
                { icon: '🚛', title: 'Qualify for higher-value loads', desc: 'Wind, superload, oilfield, port, AV, and military loads require specialist credentials.' },
                { icon: '⚡', title: 'Reduce broker hesitation', desc: 'Instant badge verification means brokers can trust you without a phone call first.' },
                { icon: '🌍', title: 'Work across more states and countries', desc: 'HC Certified meets requirements across all 12 US mandatory states and 120 countries.' },
                { icon: '🤖', title: 'Unlock AV corridor eligibility', desc: 'AV-Ready certification opens escort work alongside autonomous freight fleets.' },
              ].map(item => (
                <div key={item.title} style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROLE PATHS ─────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={s.container}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px', textAlign: 'center' }}>Who is this for?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
              {[
                { icon: '🚗', role: "I'm a Pilot Car Operator", desc: 'Get certified, rank higher, unlock better loads', href: '/training/pilot-car-fundamentals', color: gold },
                { icon: '📋', role: "I'm a Broker or Dispatcher", desc: 'Verify operator certifications, reduce risk', href: '/training/verify', color: '#3B82F6' },
                { icon: '🚛', role: "I Run a Fleet or Carrier", desc: 'Certify your escort team at volume', href: '/training/corporate', color: '#8B5CF6' },
                { icon: '🤖', role: 'AV / Enterprise Partner', desc: 'AV-Ready certified escort capacity', href: '/training/av-certification', color: '#22C55E' },
              ].map(r => (
                <Link key={r.role} href={r.href} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '16px', borderRadius: 12, textDecoration: 'none', background: `${r.color}0a`, border: `1px solid ${r.color}25` }}>
                  <span style={{ fontSize: 22 }}>{r.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: r.color, lineHeight: 1.2 }}>{r.role}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{r.desc}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color, marginTop: 4 }}>Get started →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7 MODULES IN CRAWLABLE HTML ────────────────────────────── */}
        <section id="modules" style={{ padding: 'clamp(2rem,4vw,3.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={s.container}>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>All 7 Training Modules</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              Each module is a standalone credential. Work through them in sequence or jump to what you need most.
              Modules 1 and 7 are free — no account required to start.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MODULES.map(m => {
                const live = liveBySlug[m.slug]
                const tierColor = TIER_COLOR[m.tier] ?? gold
                return (
                  <Link key={m.slug} href={`/training/${m.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <article style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                      {/* Slot number */}
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${tierColor}18`, border: `1px solid ${tierColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: tierColor, flexShrink: 0 }}>
                        {m.slot}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0f2f5' }}>{m.title}</h3>
                          {m.isFree && <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#22C55E', padding: '2px 8px', borderRadius: 20 }}>FREE</span>}
                          <span style={{ fontSize: 10, fontWeight: 700, background: `${tierColor}18`, color: tierColor, padding: '2px 8px', borderRadius: 20 }}>{m.tier.toUpperCase()}</span>
                        </div>

                        {/* Description — always in HTML */}
                        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>{m.description}</p>

                        {/* Outcomes — always in HTML */}
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {m.outcomes.map(o => (
                            <li key={o} style={{ fontSize: 11, color: '#6b7280', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                              ✓ {o}
                            </li>
                          ))}
                        </ul>

                        {/* Meta row */}
                        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                          <span>⏱ {m.duration}</span>
                          <span>👤 {m.audience}</span>
                        </div>
                      </div>

                      <span style={{ color: tierColor, fontSize: 20, flexShrink: 0 }}>→</span>
                    </article>
                  </Link>
                )
              })}
            </div>

            <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              Advanced modules also available:{' '}
              <Link href="/training/av-certification" style={{ color: gold }}>AV Corridor Readiness</Link>,{' '}
              <Link href="/training/corporate" style={{ color: gold }}>Port &amp; International Ops</Link>,{' '}
              and more launching Q3 2026.
            </p>
          </div>
        </section>

        {/* ── PRICING TIERS ──────────────────────────────────────────── */}
        <section id="pricing" style={{ padding: 'clamp(2rem,4vw,3.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={s.container}>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>Choose Your Certification Level</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>Start free with HC Certified. Upgrade to AV-Ready or Elite when you're ready to open more doors.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
              {[
                {
                  name: 'HC Certified', color: '#A8A8A8', price: 'Free with Pro / $49 standalone',
                  modules: 'Modules 1–3', duration: '~2 hours', highlight: false,
                  benefits: ['HC Certified badge on your profile', 'Recognized across all 120 countries', 'Meets all 12 US mandatory state requirements', 'Digital credential with instant verification link'],
                  href: '/training/pilot-car-fundamentals', cta: 'Start Free',
                },
                {
                  name: 'AV-Ready', color: '#F5A623', price: '$149/year',
                  modules: 'Modules 1–5', duration: '~3.5 hours', highlight: true,
                  benefits: ['Everything in HC Certified', 'AV-Ready gold badge on profile', 'Priority placement in AV corridor searches', 'Aurora + Kodiak protocol training', 'Oilfield Specialist module included'],
                  href: '/training?enroll=av_ready', cta: 'Get AV-Ready',
                },
                {
                  name: 'Elite', color: '#E5E4E2', price: '$299/year',
                  modules: 'All 7 Modules', duration: '~4.5 hours', highlight: false,
                  benefits: ['Everything in AV-Ready', 'Elite platinum badge — top of all results', 'Superload, military &amp; aerospace module', 'International operations module', 'Dedicated account support'],
                  href: '/training?enroll=elite', cta: 'Become Elite',
                },
              ].map(tier => (
                <div key={tier.name} style={{ background: tier.highlight ? 'linear-gradient(160deg,#141420,#1a1a0a)' : 'rgba(255,255,255,0.025)', border: `1px solid ${tier.highlight ? 'rgba(245,166,35,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {tier.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#F5A623,#e08820)', color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>⭐ MOST POPULAR</div>}
                  <div style={{ fontSize: 18, fontWeight: 800, color: tier.color, marginBottom: 6 }}>{tier.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{tier.price}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>{tier.modules} · {tier.duration}</div>
                  <ul style={{ flex: 1, margin: '0 0 20px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tier.benefits.map(b => (
                      <li key={b} style={{ fontSize: 13, color: '#b0b0c0', display: 'flex', gap: 8 }}>
                        <span style={{ color: tier.color, flexShrink: 0 }}>✓</span>
                        <span dangerouslySetInnerHTML={{ __html: b }} />
                      </li>
                    ))}
                  </ul>
                  <Link href={tier.href} style={{ display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 10, background: tier.highlight ? 'linear-gradient(135deg,#F5A623,#e08820)' : `${tier.color}18`, color: tier.highlight ? '#000' : tier.color, border: `1px solid ${tier.color}40`, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COUNTRY & STATE COVERAGE ───────────────────────────────── */}
        <section id="countries" style={{ padding: 'clamp(2rem,4vw,3.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={s.container}>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>Training by Country &amp; State</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              Haul Command Training is built for global operations. Each country and state page includes
              localized requirements, terminology, and compliance notes.
            </p>

            {/* Top countries */}
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#d1d5db' }}>Priority Markets</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {[
                ['United States', '/training/region/united-states'],
                ['Canada', '/training/region/canada'],
                ['Australia', '/training/region/australia'],
                ['United Kingdom', '/training/region/united-kingdom'],
                ['UAE', '/training/region/uae'],
                ['New Zealand', '/training/region/new-zealand'],
                ['South Africa', '/training/region/south-africa'],
                ['Germany', '/training/region/germany'],
                ['Netherlands', '/training/region/netherlands'],
                ['Brazil', '/training/region/brazil'],
              ].map(([label, href]) => (
                <Link key={href} href={href} style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.2)', color: gold, textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
              <Link href="/training/countries" style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', textDecoration: 'none' }}>
                All 120 Countries →
              </Link>
            </div>

            {/* US States */}
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#d1d5db' }}>US State Training &amp; Compliance</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                ['Texas', 'texas'], ['California', 'california'], ['Florida', 'florida'],
                ['Washington', 'washington'], ['Arizona', 'arizona'], ['Colorado', 'colorado'],
                ['Georgia', 'georgia'], ['Ohio', 'ohio'], ['Louisiana', 'louisiana'],
                ['Pennsylvania', 'pennsylvania'], ['Oregon', 'oregon'], ['North Carolina', 'north-carolina'],
              ].map(([label, slug]) => (
                <Link key={slug} href={`/training/region/united-states/${slug}`} style={{ padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9ca3af', textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
              <Link href="/escort-requirements" style={{ padding: '6px 13px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.18)', color: gold, textDecoration: 'none' }}>
                All State Requirements →
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ — ANSWERS ALWAYS IN HTML ───────────────────────────── */}
        <section id="faq" style={{ padding: 'clamp(2rem,4vw,3.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ ...s.container, maxWidth: 820 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#f9fafb' }}>Frequently Asked Questions</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>Everything you need to know before you start.</p>

            {/* Native <details> — crawlable, no JS required */}
            {FAQS.map((faq, i) => (
              <details key={i} style={{ marginBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <summary style={{ padding: '16px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 10, color: '#e5e7eb' }}>
                  <span style={{ color: gold, flexShrink: 0 }}>+</span>
                  {faq.q}
                </summary>
                {/* Answer always present in DOM — visible to Googlebot */}
                <p style={{ padding: '0 18px 16px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── RELATED LINKS (no dead end) ────────────────────────────── */}
        <section style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={s.container}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Related Resources</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
              {[
                { href: '/escort-requirements', label: '📋 Escort Requirements by State', desc: 'What each state mandates' },
                { href: '/glossary', label: '📚 Heavy Haul Glossary', desc: 'Terms every operator must know' },
                { href: '/directory', label: '🔍 Find Pilot Car Operators', desc: 'Search the directory' },
                { href: '/tools/escort-calculator', label: '🧮 Escort Vehicle Calculator', desc: 'How many escorts required' },
                { href: '/rates', label: '💵 Pilot Car Rate Index', desc: 'Current mileage rates by state' },
                { href: '/training/verify', label: '✓ Verify a Certification', desc: 'Check badge status instantly' },
                { href: '/training/corporate', label: '🏢 Corporate Training', desc: 'Certify your fleet' },
                { href: '/claim', label: '📌 Claim Your Listing', desc: 'Get found by brokers' },
                { href: '/loads', label: '📦 Browse Escort Jobs', label2: 'Active loads needing escorts', desc: 'Active loads needing escorts' },
                { href: '/corridors', label: '🛣 Corridor Intelligence', desc: 'Top-ranked routes' },
                { href: '/leaderboards', label: '🏆 Operator Leaderboard', desc: 'Top operators by corridor' },
                { href: '/pricing', label: '💎 Pro Membership', desc: 'Priority directory placement' },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#d1d5db' }}>{link.label}</span>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{link.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(2rem,4vw,3.5rem) 20px', textAlign: 'center' }}>
          <div style={{ ...s.container, maxWidth: 640 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 900, color: '#f9fafb' }}>Start Earning Your Badge Today</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
              Module 1 is completely free. No account required. Your verified badge goes live the moment you pass.
              Brokers and AV companies can verify it instantly.
            </p>
            <Link href="/training/pilot-car-fundamentals" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 14, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 16, fontWeight: 900, textDecoration: 'none', boxShadow: `0 6px 30px rgba(212,168,68,0.4)` }}>
              🎓 Start Module 1 — Free
            </Link>
            <div style={{ marginTop: 16 }}>
              <Link href="/training/corporate" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Certifying a team or fleet? View Corporate Training →
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
