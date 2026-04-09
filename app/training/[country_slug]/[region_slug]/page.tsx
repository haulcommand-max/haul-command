import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'

// ─── STYLES ─────────────────────────────────────────────────────────────
const gold = '#D4A844'
const s = {
  page: { minHeight: '100vh', background: '#07090d', color: '#e8e8e8' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '0 20px' },
}

export async function generateMetadata({ params }: { params: { country_slug: string, region_slug: string } }): Promise<Metadata> {
  // In a real implementation we would fetch formatting rules from `training_jurisdictions`
  const regionName = params.region_slug.split('-').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' ')
  
  return {
    title: `${regionName} Pilot Car & Escort Operator Training | Haul Command`,
    description: `Complete ${regionName} official qualification prep for pilot car operators. Includes state rules, certification requirements, mock exams, and reciprocity info.`,
  }
}

export default async function RegionTrainingHubPage({ params }: { params: { country_slug: string, region_slug: string } }) {
  const supabase = createClient()
  const { country_slug, region_slug } = params

  // 1. Resolve Jurisdiction
  // Placeholder query matching the training_jurisdictions architecture spec:
  // const { data: jurisdiction } = await supabase.from('training_jurisdictions').select('*').eq('region_code', region_slug).single()
  // if (!jurisdiction) return notFound()

  // Human readable mapping fallback:
  const regionName = region_slug.split('-').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' ')
  const countryName = country_slug.toUpperCase() === 'USA' ? 'United States' : country_slug.toUpperCase()

  // 2. Structured Data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
      { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.haulcommand.com/training' },
      { '@type': 'ListItem', position: 3, name: countryName, item: `https://www.haulcommand.com/training/${country_slug}` },
      { '@type': 'ListItem', position: 4, name: regionName, item: `https://www.haulcommand.com/training/${country_slug}/${region_slug}` },
    ],
  }

  const courseListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${regionName} Specific Pilot Car Training Modules`,
    description: `State-specific pilot car escort operator certification training modules for ${regionName}.`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Course',
          name: `${regionName} Escort Driver Regulatory Protocol`,
          description: `Legal qualification logic for ${regionName} including 4-year renewal logic if applicable.`,
          provider: { '@type': 'Organization', name: 'Haul Command' },
        }
      }
    ]
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={courseListSchema} />

      <div style={s.page}>

        {/* ── BREADCRUMB ─────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0' }}>
          <div style={{ ...s.container, display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/training" style={{ color: '#6b7280', textDecoration: 'none' }}>Training</Link>
            <span>›</span>
            <span style={{ color: gold }}>{regionName}</span>
          </div>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────── */}
        <section style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(2rem,5vw,4rem) 20px', position: 'relative' }}>
          <div style={{ ...s.container, position: 'relative', zIndex: 2 }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', borderRadius: 20, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                HC Certification Prep • Jurisdiction Scope: {regionName}
              </span>
            </div>

            <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#f9fafb' }}>
              {regionName} Pilot/Escort <br />
              <span style={{ color: gold }}>Qualification Prep</span>
            </h1>

            {/* Legal Claim Positioning Disclaimer */}
            <div style={{ maxWidth: 800, padding: 14, borderRadius: 8, background: 'rgba(255,165,0,0.05)', border: '1px solid rgba(255,165,0,0.15)', marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#e5e7eb', lineHeight: 1.6 }}>
                <strong>Important:</strong> This program is built from the {regionName} workbook, rule map, and official training objectives. 
                It <strong>prepares operators</strong> for the required qualification path. Haul Command is not a formally state-issued certification 
                authority unless otherwise fully authorized by DOT vendor logic. Please complete this track to access reciprocity and local prep rules.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
              <Link href={`/training/${country_slug}/${region_slug}/module-1`} style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                ▶ Start Level 1 Prep
              </Link>
              <Link href={`/training/${country_slug}/${region_slug}/official-path`} style={{ display: 'inline-flex', alignItems: 'center', padding: '14px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Review Official State Path
              </Link>
            </div>
            
          </div>
        </section>

        {/* ── COURSE TRACK ────────────────────────────────────────────── */}
        <section style={{ padding: 'clamp(2rem,4vw,3.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={s.container}>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#f9fafb' }}>Local {regionName} Learning Map</h2>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>Follows the official {regionName} session structure to ensure true readiness.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Fake state module loop (would come from training_modules) */}
              {[
                { slot: 0, title: 'Orientation & Rules', desc: `What the ${regionName} path is, required documents, and renewal logic.` },
                { slot: 1, title: 'The Escort Driver', desc: 'Qualification options, state apparel compliance, flagging procedures.' },
                { slot: 2, title: 'The Escort Vehicle', desc: 'State-level vehicle specs, required mounting hardware and licensing minimums.' },
                { slot: 3, title: 'Compliance Mock Exam', desc: `Timed 50-question simulation based on ${regionName} rules.` },
              ].map(m => (
                <article key={m.slot} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px', display: 'flex', gap: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: gold, flexShrink: 0 }}>
                    {m.slot}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#f0f2f5' }}>Module {m.slot}: {m.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{m.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── RELATED LOCAL LINKS (Internal Linking Moat) ──────────────── */}
        <section style={{ padding: 'clamp(2rem,4vw,3.5rem) 20px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={s.container}>
            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {regionName} Compliance Network
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
              <Link href={`/regulations/usa/${region_slug}`} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>📜 Local Regulations</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Strict rule requirements</span>
              </Link>
              <Link href={`/directory/usa/${region_slug}`} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>🗺 Escort Directory</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Search certified escorts in {regionName}</span>
              </Link>
              <Link href={`/training/${country_slug}/${region_slug}/reciprocity`} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>🔄 Reciprocity Rules</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Where else does this cert apply?</span>
              </Link>
              <Link href={`/rates/${region_slug}`} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>💵 Rate Index</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>What should {regionName} loads pay</span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
