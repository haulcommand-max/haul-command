import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'

export const revalidate = 3600 // Cache for 1 hour

// --- METADATA --------------------------------------------------------------
export const metadata: Metadata = {
  title: 'Corridor Intelligence & Safety Library | Haul Command',
  description:
    'The ultimate intelligence repository for heavy haul logistics. Articles, tutorials, and standardized guidance on High Pole operations, Bridge Strikes, Reciprocity, and Flagger compliance.',
  keywords: [
    'Oversize Load Bridge Strikes', 'High Pole Pilot Car instructions', 'Pilot Car Reciprocity states',
    'WITPAC Wind Pilot Car', 'Flagger compliance apparel', 'Pilot Car Escort training articles',
    'heavy haul logistics news', 'escort driver best practices',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/library' },
  openGraph: {
    title: 'Corridor Intelligence & Safety Library',
    description: 'Masterclass intelligence for the global heavy haul escort ecosystem.',
    url: 'https://www.haulcommand.com/library',
    siteName: 'Haul Command',
    type: 'website',
  },
}

// --- PLATFORM CATEGORY & ARTICLE INVENTORY ----------------------------------
// Initial release architecture for the SEO logistics library.
const CATEGORIES = [
  'All',
  'Bridge Strikes & Clearances',
  'Interstate Reciprocity',
  'High Pole & Wind (WITPAC)',
  'Flagger & Work Zones',
  'Defensive Driving',
]

const ARTICLES = [
  {
    slug: 'oversize-load-bridge-hits-prevention',
    title: 'Oversize Load Bridge Hits: The $100M Problem & How to Prevent It',
    category: 'Bridge Strikes & Clearances',
    readTime: '6 min read',
    excerpt: 'Bridge strikes result in millions of dollars in infrastructure damage. Learn how proper route surveys, precise high-pole operation, and 3D corridor clearance mapping eliminate strike risks completely.',
  },
  {
    slug: 'pilot-car-certification-reciprocity-guide',
    title: 'Where Can I Use My Certification? (State-by-State Reciprocity)',
    category: 'Interstate Reciprocity',
    readTime: '5 min read',
    excerpt: 'Navigating state lines? See our complete updated guide on which states accept Washington, Florida, and Utah pilot car certifications, and how the HC Badge bridges the gap.',
  },
  {
    slug: 'high-pole-basics-measurement-strikes',
    title: 'High Pole Basics: Professional Setup and Measurement',
    category: 'High Pole & Wind (WITPAC)',
    readTime: '8 min read',
    excerpt: 'Master the setup of professional-grade non-conductive high poles, striker tip calibration, and communication protocols for wind and superload operations.',
  },
  {
    slug: 'mutcd-flagger-apparel-requirements',
    title: 'Dress for Success: MUTCD Flagger Clothing Requirements',
    category: 'Flagger & Work Zones',
    readTime: '4 min read',
    excerpt: 'Ensure you are fully compliant with federal MUTCD and state DOT standards. A breakdown of Class 2 vs Class 3 High-Vis apparel for daytime and nighttime operations.',
  },
  {
    slug: 'avoiding-fraudulent-pilot-certificates',
    title: 'How to Spot Fraudulent Pilot Car Qualifications',
    category: 'Interstate Reciprocity',
    readTime: '5 min read',
    excerpt: 'Illegitimate PDF certs put brokers and fleets at immense risk. Learn how Haul Command\'s digital badge verification system completely eliminates fraudulent credentials from the dispatch cycle.',
  },
  {
    slug: 'winter-driving-heavy-haul',
    title: 'Winter Defensive Driving for Oversize Load Convoys',
    category: 'Defensive Driving',
    readTime: '7 min read',
    excerpt: 'Black ice, chain laws, and convoy separation distance. A complete guide to modifying your escort and heavy haul driving habits in severe winter weather.',
  },
]

// --- STYLES ----------------------------------------------------------------
const gold = '#D4A844'
const s = {
  page: { minHeight: '100vh', background: '#07090d', color: '#e8e8e8' } as const,
  container: { maxWidth: 1100, margin: '0 auto', padding: '0 20px' } as const,
  categoryBadge: {
    padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#9ca3af', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s',
  },
  activeCategory: {
    background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)',
    color: gold, boxShadow: '0 0 10px rgba(212,168,68,0.1)',
  }
}

// --- PAGE -------------------------------------------------------------------
export default function IntelligenceLibraryPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Haul Command Intelligence & Safety Library',
    description: 'Expert articles and resources for pilot car operators and heavy haul brokers.',
    url: 'https://www.haulcommand.com/library',
    blogPost: ARTICLES.map(a => ({
      '@type': 'BlogPosting',
      headline: a.title,
      abstract: a.excerpt,
      url: `https://www.haulcommand.com/library/${a.slug}`,
    })),
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <div style={s.page}>

        {/* -- HERO ----------------------------------------------------- */}
        <section style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(2.5rem,6vw,5rem) 20px clamp(2rem,4vw,3.5rem)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(139,92,246,0.1), transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ ...s.container, position: 'relative' }}>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Library</span>
            </div>

            <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#f9fafb' }}>
              Corridor Intelligence<br />
              <span style={{ color: '#A78BFA' }}>&amp; Safety Library</span>
            </h1>

            <p style={{ margin: '0 0 24px', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 600 }}>
              The definitive repository for pilot car best practices, heavy haul compliance, and logistics operator intelligence. Built to master the world&apos;s most difficult routes.
            </p>

          </div>
        </section>

        {/* -- CATEGORY FILTER ----------------------------------------- */}
        <section style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, background: 'rgba(7,9,13,0.9)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
          <div style={{ ...s.container, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat, i) => (
              <div key={cat} style={{ ...s.categoryBadge, ...(i === 0 ? s.activeCategory : {}) }}>
                {cat}
              </div>
            ))}
          </div>
        </section>

        {/* -- ARTICLE GRID -------------------------------------------- */}
        <section style={{ padding: 'clamp(2rem,4vw,4rem) 20px' }}>
          <div style={{ ...s.container, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {ARTICLES.map(article => (
              <Link key={article.slug} href={`/library/${article.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                <article style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }}>
                  
                  {/* Category Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{article.readTime}</span>
                  </div>

                  {/* Title */}
                  <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#f3f4f6', lineHeight: 1.3 }}>
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9ca3af', lineHeight: 1.6, flex: 1 }}>
                    {article.excerpt}
                  </p>

                  {/* Read More */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
                    Read Report <span style={{ fontSize: 16 }}>→</span>
                  </div>

                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* -- BOTTOM CTA ---------------------------------------------- */}
        <section style={{ padding: '3rem 20px', textAlign: 'center', background: 'rgba(139,92,246,0.03)', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
          <div style={{ ...s.container, maxWidth: 600 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 900, color: '#f3f4f6' }}>Stay Ahead of The Industry.</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#9ca3af' }}>
              We continuously aggregate intelligence from DOT updates, wind OEMs, and elite fleets. Subscribe to the dispatcher intel brief.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <input type="email" placeholder="Email address" style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: '#fff', width: '250px', outline: 'none' }} />
              <button style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: '#a78bfa', color: '#000', fontWeight: 800, cursor: 'pointer' }}>Subscribe</button>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}