import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'

// ─── INITIAL ARTICLE DATABASE (V1) ──────────────────────────────────────────
// Currently rendering the V1 small-scale release. In later iterations, this array 
// can be externalized to a headless CMS or unified Markdown directory for massive scale.
export const ARTICLES = [
  {
    slug: 'oversize-load-bridge-hits-prevention',
    title: 'Oversize Load Bridge Hits: The $100M Problem & How to Prevent It',
    category: 'Bridge Strikes & Clearances',
    readTime: '6 min read',
    publishedOn: '2026-04-10',
    author: 'HC Infrastructure Intelligence',
    content: `
      <h2>The True Cost of a Bridge Strike</h2>
      <p>A single oversize load bridge strike doesn't just damage the cargo—it jeopardizes federal infrastructure, paralyzes interstate traffic for hours, and immediately bankrupts the carrier via catastrophic liability claims. Despite advancements in routing software, structural impacts remain one of the leading causes of multimillion-dollar insurance payouts in the heavy-haul sector.</p>
      
      <h3>The 3 Critical Points of Failure</h3>
      <ol>
        <li><strong>Relying exclusively on outdated state database permits.</strong> State automated permitting systems (like PASSPORT) possess known lag times. A local municipality might pave a 2-inch asphalt overlay overnight, nullifying the state's official clearance records by morning.</li>
        <li><strong>Improper High-Pole Calibration.</strong> Striker poles must be set precisely 3 to 6 inches above the maximum loaded height (depending on state regulations and vertical oscillations of the specific trailer equipment). Miscalibration is deadly.</li>
        <li><strong>Reaction Delay in the Escort.</strong> The pilot car must run far enough ahead to measure structural interference *and* afford the heavy hauler adequate stopping distance relative to their speed, gross weight, and brake efficiency.</li>
      </ol>

      <h2>The Haul Command Standard for Clearance</h2>
      <p>At Haul Command, certified operators rely on zero assumptions. The expectation of HC-verified teams involves deploying state-of-the-art non-conductive fiberglass poles, conducting pre-trip physical tape measurements against the actual loaded chassis, and establishing dedicated closed-loop radio frequencies specifically for clearance call-outs.</p>

      <blockquote>"Permits are legal permission, but the pilot car's fiberglass pole is the only absolute physical truth on the corridor."</blockquote>

      <p>If you are serious about handling superloads and Tier-1 freight without disastrous risk, your clearance operating procedures need to be flawless. Brokers utilizing the Haul Command matching engine explicitly filter for operators holding an HC Elite rating precisely to mitigate these exact risks.</p>
    `,
    seoDescription: 'Bridge strikes result in millions of dollars in infrastructure damage. Learn how proper route surveys and high-pole operation eliminate strike risks.',
  },
  {
    slug: 'pilot-car-certification-reciprocity-guide',
    title: 'Where Can I Use My Certification? (State-by-State Reciprocity)',
    category: 'Interstate Reciprocity',
    readTime: '5 min read',
    publishedOn: '2026-04-08',
    author: 'HC Regulatory Team',
    content: `
      <h2>The Blueprint to State Lines</h2>
      <p>Pilot car certification in the United States is fragmented. Only about 12 states officially mandate state-level certification to escort an oversize/overweight load, but navigating between them requires understanding 'Reciprocity'—which states formally recognize the training credentials of another state.</p>
      <h3>Recognized Tier-1 Certifications</h3>
      <p>Generally, certifications from <strong>Washington (WA)</strong>, <strong>Florida (FL)</strong>, <strong>Utah (UT)</strong>, and <strong>North Carolina (NC)</strong> maintain the highest degree of cross-border reciprocity. A Washington PEVO card, for instance, is accepted in almost all regulated states, making it the gold standard for independent pilot car operators who run nationwide corridors.</p>
      <h3>The Haul Command Platform Credential</h3>
      <p>The <strong>HC Certified Baseline Badge</strong> acts as the definitive pre-certification. By completing the Haul Command curriculum, you have matched the 8-hour national standard required by Florida and Washington. While you still must submit your paperwork to the specific DOT for the physical card if operating in those states, the HC Badge instantly proves to brokers inside our platform that you possess the exact knowledge required.</p>
    `,
    seoDescription: 'Navigating state lines? See our complete updated guide on which states accept Washington, Florida, and Utah pilot car certifications.',
  }
]

// ─── DYNAMIC SEO METADATA ──────────────────────────────────────────────────
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = ARTICLES.find(a => a.slug === params.slug)
  if (!article) return { title: 'Article Not Found | Haul Command' }

  return {
    title: `${article.title} | Haul Command Intelligence`,
    description: article.seoDescription,
    alternates: { canonical: `https://www.haulcommand.com/library/${params.slug}` },
    openGraph: {
      title: article.title,
      description: article.seoDescription,
      url: `https://www.haulcommand.com/library/${params.slug}`,
      type: 'article',
      publishedTime: article.publishedOn,
    },
  }
}

// ─── PAGE COMPONENT ────────────────────────────────────────────────────────
export default function ArticleDetail({ params }: { params: { slug: string } }) {
  const article = ARTICLES.find(a => a.slug === params.slug)
  if (!article) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seoDescription,
    author: { '@type': 'Organization', name: article.author },
    datePublished: article.publishedOn,
    publisher: { '@type': 'Organization', name: 'Haul Command', logo: { '@type': 'ImageObject', url: 'https://www.haulcommand.com/logo.png' } },
  }

  // Very simple global reset for raw HTML injection styling
  const articleHtmlStyle = `
    .hc-article-content h2 { margin-top: 2rem; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 800; color: #f9fafb; }
    .hc-article-content h3 { margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1.25rem; font-weight: 700; color: #e5e7eb; }
    .hc-article-content p { margin-bottom: 1.25rem; font-size: 1.125rem; font-weight: 400; color: #d1d5db; line-height: 1.8; }
    .hc-article-content li { margin-bottom: 0.75rem; font-size: 1.125rem; font-weight: 400; color: #d1d5db; line-height: 1.8; margin-left: 1.5rem; }
    .hc-article-content blockquote { padding: 1.5rem; margin: 2rem 0; border-left: 4px solid #D4A844; background: rgba(212,168,68,0.05); font-style: italic; font-size: 1.25rem; color: #f3f4f6; }
    .hc-article-content strong { color: #f9fafb; font-weight: 700; }
  `

  return (
    <>
      <JsonLd data={jsonLd} />
      <style dangerouslySetInnerHTML={{ __html: articleHtmlStyle }} />
      <div style={{ minHeight: '100vh', background: '#07090d', color: '#e8e8e8' }}>
        
        {/* Nav Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', position: 'sticky', top: 0, background: 'rgba(7,9,13,0.9)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/library" style={{ color: '#a78bfa', textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>←</span> Back to Intelligence Library
            </Link>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Haul Command OS</span>
          </div>
        </div>

        {/* Article Body */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(2rem,6vw,4rem) 20px' }}>
          
          {/* Metadata Meta */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            <span style={{ padding: '4px 10px', background: 'rgba(212,168,68,0.1)', color: '#D4A844', fontSize: 11, fontWeight: 800, borderRadius: 4, textTransform: 'uppercase' }}>
              {article.category}
            </span>
            <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>{article.readTime}</span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 'clamp(2rem,4vw,3.25rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', color: '#f9fafb', letterSpacing: '-0.02em' }}>
            {article.title}
          </h1>

          {/* Author Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800 }}>HC</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{article.author}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Published {new Date(article.publishedOn).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Injected Content */}
          <article className="hc-article-content" dangerouslySetInnerHTML={{ __html: article.content }} />

          {/* AdGrid Integration (Programmatic Sponsor Slot) */}
          <div style={{ margin: '4rem 0', padding: '2rem', background: '#0e0e11', border: '1px solid rgba(212,168,68,0.2)', borderRadius: 12, display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#D4A844', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>HC Sponsored Intelligence</div>
              <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#fff' }}>Protect Your Fleet with Premier Insurance</h4>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#9ca3af' }}>Get comprehensive coverage designed specifically for oversize load and pilot car operations.</p>
              <button style={{ padding: '8px 16px', background: 'rgba(212,168,68,0.1)', color: '#D4A844', border: '1px solid #D4A844', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Get a Quote →</button>
            </div>
          </div>

          {/* Conversion CTA Footer */}
          <div style={{ marginTop: '5rem', padding: '3rem 2rem', background: 'rgba(139,92,246,0.05)', borderRadius: 16, border: '1px solid rgba(139,92,246,0.15)', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, color: '#fff' }}>Upgrade Your Safety Intelligence</h3>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#a78bfa' }}>
              Stop guessing. Get the definitive pre-certification training that elite brokers trust, and secure your HC Platform Badge.
            </p>
            <Link href="/training" style={{ padding: '14px 28px', background: '#e5e7eb', color: '#000', fontSize: 15, fontWeight: 800, borderRadius: 8, textDecoration: 'none', display: 'inline-block' }}>
              Access Training Academy →
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}
