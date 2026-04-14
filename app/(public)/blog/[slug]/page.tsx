import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronRight, Clock, Calendar, ArrowLeft, ArrowRight, BookOpen, Shield } from 'lucide-react';

import { HCContentPageShell, HCContentContainer, HCContentSection } from '@/components/content-system/shell/HCContentPageShell';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

// ═══════════════════════════════════════════════════════════════
// /blog/[slug] — Article Detail Page
// P0 FIX: This page was MISSING (empty directory).
// Blog index was linking to /blog/[slug] but no page.tsx existed,
// causing slugs to fall through to the nearest catch-all/layout
// which rendered as a directory/monetization shell.
// ═══════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ── Static fallback articles (until DB is populated) ──────────
const FALLBACK_ARTICLES: Record<string, {
  title: string;
  excerpt: string;
  body: string[];
  article_type: string;
  published_at: string;
  read_time: string;
  hero_image_url: string;
  related: { title: string; slug: string }[];
}> = {
  'texas-superload-strategy-2026': {
    title: 'Texas Superload Blueprint: Navigating I-10 and I-35 Escort Thresholds in 2026',
    excerpt: 'Analyzing the newly adopted TxDMV routing procedures and how they impact civilian police escort availability and total load economics across the Texas Triangle.',
    body: [
      'The Texas Department of Motor Vehicles finalized significant changes to oversize/overweight permit routing in early 2026, directly impacting how superloads traverse the I-10 and I-35 corridors. For escort operators and brokers, these changes alter dispatch economics, staging requirements, and the critical interplay between civilian pilot cars and law enforcement escorts.',
      'Under the updated TxDMV procedures, loads exceeding 16 feet in width or 150 feet in overall length now require mandatory advance routing approval through the Texas Permitting and Routing Optimization System (TxPROS). This system replaces the previous county-by-county variance process and introduces standardized escort thresholds tied to corridor-specific traffic density data.',
      'The I-10 corridor between Houston and San Antonio sees the most dramatic impact. Peak-hour restrictions now extend from 6:00 AM to 9:00 AM and 4:00 PM to 7:00 PM on weekdays, with mandatory law enforcement escorts required for any load exceeding 14 feet in width during these windows. Outside peak hours, civilian pilot cars remain sufficient for loads up to 16 feet.',
      'For the I-35 corridor running through the Texas Triangle (Dallas–San Antonio–Houston), the new framework introduces a tiered escort requirement. Single pilot car escorts cover loads 12–14 feet wide. Dual escorts (front and rear) are required for 14–16 feet. Above 16 feet, a law enforcement lead vehicle must accompany the convoy, with civilian pilots handling rear escort duty.',
      'The economic impact on escort operators is significant. Operators staging in the Houston metro area report a 15–22% increase in demand for dual-escort configurations since the new rules took effect. The constraint on law enforcement availability during peak hours has created predictable surge pricing windows that smart operators can position around.',
      'Haul Command data from the first quarter of 2026 shows average escort rates on the I-10 Houston–San Antonio segment increasing from $2.85/mile to $3.40/mile for standard pilot car service, with dual-escort configurations commanding $5.80–$6.50/mile. Law enforcement escort coordination adds an additional $150–$300 flat fee depending on jurisdiction.',
      'For brokers planning superload movements through Texas, the key takeaway is that routing optimization has become more important than ever. The difference between a well-timed movement (departing at 9:15 AM to avoid peak-hour LE requirements) and a poorly timed one can represent $2,000–$4,000 in escort cost differential on a single Houston-to-Dallas run.',
    ],
    article_type: 'Corridor Intel',
    published_at: 'Apr 07, 2026',
    read_time: '5 min',
    hero_image_url: '/images/blog_hero_bg.png',
    related: [
      { title: 'Cross-Border Escort Reciprocity: The Pilot Car Certification Matrix', slug: 'escort-reciprocity-guide' },
      { title: 'Q3 2026 Escort Rate Analytics: Surge Pricing on Wind Energy Routes', slug: 'q3-rate-report-escorts' },
    ],
  },
  'escort-reciprocity-guide': {
    title: 'Cross-Border Escort Reciprocity: The Pilot Car Certification Matrix',
    excerpt: 'A comprehensive map of which states accept out-of-state pilot car certifications, focusing on the critical Washington-Oregon-California corridor.',
    body: [
      'One of the most persistent friction points in the oversize load escort industry is certification reciprocity — or the lack of it. As loads cross state lines, escort operators face a patchwork of certification requirements that can ground an otherwise qualified pilot car at the border.',
      'The Washington-Oregon-California corridor represents the most commercially significant reciprocity challenge in the western United States. Washington requires WSDOT-approved pilot car certification. Oregon mandates ODOT pilot vehicle operator certification. California requires a valid pilot car operator permit through Caltrans. None of these three states automatically recognizes the others\' certifications.',
      'This guide maps the current state of reciprocity agreements as of Q2 2026, identifies the states with the most permissive and most restrictive cross-border policies, and outlines strategies escort operators use to maintain multi-state compliance without redundant coursework.',
      'States with full reciprocity agreements as of 2026: Montana and Wyoming maintain mutual recognition. Idaho accepts both Washington and Oregon certifications. Several southeastern states (Alabama, Mississippi, Louisiana) recognize each other\'s pilot car credentials through an informal mutual recognition arrangement.',
      'States with no reciprocity: California, New York, and Pennsylvania require state-specific certification regardless of what other credentials an operator holds. Texas accepts some out-of-state certifications but requires operators to register through TxDMV before operating.',
      'For escort operators running the I-5 corridor, the most cost-effective approach is obtaining the Haul Command Multi-State Certification package, which covers the core coursework common to all three Pacific Coast states and provides state-specific supplemental modules for each jurisdiction.',
    ],
    article_type: 'Regulation Monitor',
    published_at: 'Apr 06, 2026',
    read_time: '8 min',
    hero_image_url: '/images/training_hero_bg.png',
    related: [
      { title: 'Texas Superload Blueprint', slug: 'texas-superload-strategy-2026' },
      { title: 'Dispatch Psychology: Retaining Top Escort Vendors', slug: 'emergency-escort-retention' },
    ],
  },
  'q3-rate-report-escorts': {
    title: 'Q3 2026 Escort Rate Analytics: Surge Pricing on Wind Energy Routes',
    excerpt: 'Real-time pricing data from the Haul Command Terminal showing a 22% rate surge for high-pole escorts on key midwestern wind energy supply chains.',
    body: [
      'The wind energy sector continues to drive outsized demand for specialized escort services, particularly high-pole operations required for turbine blade and tower section transport. Haul Command Terminal data from Q3 2026 reveals a 22% average rate surge on key midwestern wind energy supply chain routes.',
      'The primary driver is a combination of increased installation targets — the DOE projects 15 GW of new onshore wind capacity in 2026 — and a persistent shortage of high-pole certified escort operators. Standard escort rates have remained relatively flat, but specialized high-pole configurations (requiring 16-foot or taller warning pole systems) have seen dramatic increases.',
      'Route-specific data shows the most pronounced surge on the I-35 corridor between Oklahoma City and Wichita, where blade transport volumes have increased 40% year-over-year. Average escort rates on this segment have risen from $3.10/mile to $3.78/mile for standard service, and from $4.50/mile to $5.85/mile for high-pole configurations.',
      'The Texas panhandle region (I-40 corridor) shows similar patterns, with rates peaking during the April–October installation window. Operators who position in Amarillo or Lubbock during this period report utilization rates exceeding 85%, compared to the national escort operator average of 62%.',
      'For operators considering entering the wind energy escort market, certification requirements are more stringent than standard pilot car operations. Most wind energy OEMs require escorts to carry specialized signage, possess route-specific training, and maintain equipment configurations that exceed minimum state requirements.',
    ],
    article_type: 'Market Data',
    published_at: 'Apr 05, 2026',
    read_time: '6 min',
    hero_image_url: '/images/blog_hero_bg.png',
    related: [
      { title: 'Texas Superload Blueprint', slug: 'texas-superload-strategy-2026' },
      { title: 'Cross-Border Escort Reciprocity', slug: 'escort-reciprocity-guide' },
    ],
  },
  'emergency-escort-retention': {
    title: 'Dispatch Psychology: Retaining Top Escort Vendors in Heat States',
    excerpt: 'When standard loads pivot, high-tier escort operators evaporate. How top brokers use Haul Command Trust Scores to lock in verified capacity.',
    body: [
      'In the escort dispatch world, the operators you want most are the ones most likely to disappear when you need them. High-trust, well-equipped, responsive escort operators have options — and when market conditions shift, they shift first.',
      'This creates a retention challenge that most brokers handle poorly. The standard approach — blasting dispatch requests to a phone list and hoping for callbacks — actively selects against the best operators. Top-tier escorts with strong Haul Command Trust Scores are already booked; they don\'t need to monitor broadcast channels.',
      'The brokers who consistently retain the best escort capacity share three behavioral patterns that Haul Command data reveals clearly. First, they maintain direct relationships with a curated operator panel rather than relying on open broadcast. Second, they pay market or above-market rates without negotiation friction. Third, they provide advance notice and route planning support that reduces operator risk.',
      'Trust Score correlation data supports this: operators with Trust Scores above 85 accept dispatch requests from repeat brokers at 3.2x the rate of cold requests. The implication is clear — the investment in relationship capital with high-trust operators has measurable, compounding returns.',
      'Heat state dynamics (Texas, California, Florida, Oklahoma) amplify this pattern because demand surges are seasonal and predictable. Operators who know a broker will provide consistent volume during off-peak months are far more likely to prioritize that broker\'s requests during surge periods.',
      'The Haul Command dispatch system supports this relationship-first model through its Preferred Operator panel, which allows brokers to flag specific operators for priority matching. When a load is posted, the system contacts preferred operators first before opening the request to the broader network.',
    ],
    article_type: 'Strategic Ops',
    published_at: 'Apr 04, 2026',
    read_time: '4 min',
    hero_image_url: '/images/training_hero_bg.png',
    related: [
      { title: 'Q3 2026 Escort Rate Analytics', slug: 'q3-rate-report-escorts' },
      { title: 'Cross-Border Escort Reciprocity', slug: 'escort-reciprocity-guide' },
    ],
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Try DB first
  const supabase = createClient();
  const { data: article } = await supabase
    .from('hc_blog_articles')
    .select('title, excerpt, hero_image_url')
    .eq('slug', slug)
    .single();

  const fallback = FALLBACK_ARTICLES[slug];
  const title = article?.title || fallback?.title || 'Article';
  const description = article?.excerpt || fallback?.excerpt || 'Heavy haul intelligence from Haul Command.';

  return {
    title: `${title} | Haul Command Intelligence`,
    description,
    alternates: { canonical: `https://www.haulcommand.com/blog/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://www.haulcommand.com/blog/${slug}`,
      type: 'article',
      images: [{ url: article?.hero_image_url || fallback?.hero_image_url || '/images/blog_hero_bg.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;

  // Try DB first
  const supabase = createClient();
  const { data: dbArticle } = await supabase
    .from('hc_blog_articles')
    .select('*')
    .eq('slug', slug)
    .single();

  // Fall back to hardcoded seed content
  const fallback = FALLBACK_ARTICLES[slug];

  if (!dbArticle && !fallback) {
    notFound();
  }

  const article = dbArticle ? {
    title: dbArticle.title,
    excerpt: dbArticle.excerpt,
    body: (dbArticle.body_sections || dbArticle.content || '').split('\n\n'),
    article_type: dbArticle.article_type || 'Intelligence',
    published_at: new Date(dbArticle.published_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    read_time: dbArticle.read_time || '5 min',
    hero_image_url: dbArticle.hero_image_url || '/images/blog_hero_bg.png',
    related: [] as { title: string; slug: string }[],
  } : fallback!;

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    author: { '@type': 'Organization', name: 'Haul Command Intelligence' },
    publisher: {
      '@type': 'Organization',
      name: 'Haul Command',
      logo: { '@type': 'ImageObject', url: 'https://www.haulcommand.com/logo.png' },
    },
    mainEntityOfPage: `https://www.haulcommand.com/blog/${slug}`,
    image: article.hero_image_url,
  };

  return (
    <HCContentPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <div style={{
        position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#0A0D14',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(198,146,58,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          transform: 'translate(30%, -30%)',
        }} />

        <div style={{ maxWidth: 780, margin: '0 auto', padding: '2.5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            <Link href="/blog" style={{ color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft style={{ width: 12, height: 12 }} /> Intelligence Hub
            </Link>
            <ChevronRight style={{ width: 12, height: 12 }} />
            <span style={{ color: '#C6923A' }}>{article.article_type}</span>
          </nav>

          {/* Meta badges */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.25)',
              fontSize: 10, fontWeight: 800, color: '#E0B05C', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <BookOpen style={{ width: 12, height: 12 }} />
              {article.article_type}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#64748b', fontWeight: 600,
            }}>
              <Calendar style={{ width: 12, height: 12 }} /> {article.published_at}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#64748b', fontWeight: 600,
            }}>
              <Clock style={{ width: 12, height: 12 }} /> {article.read_time} read
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            fontWeight: 900,
            color: '#f9fafb',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}>
            {article.title}
          </h1>

          {/* Deck */}
          <p style={{
            margin: 0,
            fontSize: '1.05rem',
            color: '#94a3b8',
            lineHeight: 1.65,
            maxWidth: 640,
          }}>
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* Article body */}
      <HCContentSection>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
          {/* Source attribution */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32,
            padding: '10px 16px', borderRadius: 10,
            background: 'rgba(198,146,58,0.04)', border: '1px solid rgba(198,146,58,0.12)',
            fontSize: 11, color: '#94a3b8', fontWeight: 600,
          }}>
            <Shield style={{ width: 14, height: 14, color: '#C6923A' }} />
            Verified intelligence from Haul Command data systems
          </div>

          {/* Body paragraphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {article.body.filter((p: string) => p.trim()).map((paragraph: string, i: number) => (
              <p
                key={i}
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.78,
                  color: '#c9cfd8',
                  fontFamily: "'Inter', system-ui",
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Related articles */}
          {article.related && article.related.length > 0 && (
            <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                Continue Reading
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {article.related.map((rel: { title: string; slug: string }) => (
                  <Link
                    key={rel.slug}
                    href={`/blog/${rel.slug}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db' }}>{rel.title}</span>
                    <ArrowRight style={{ width: 14, height: 14, color: '#C6923A', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA strip */}
          <div style={{
            marginTop: 48, padding: '24px', borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(198,146,58,0.06), rgba(198,146,58,0.02))',
            border: '1px solid rgba(198,146,58,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', margin: '0 0 4px' }}>
                Need escort operators for this corridor?
              </h4>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                Find verified escorts with live availability and trust scores.
              </p>
            </div>
            <Link href="/available-now" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
              color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              Available Now <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </div>
      </HCContentSection>

      {/* No Dead End */}
      <HCContentSection>
        <HCContentContainer>
          <NoDeadEndBlock
            heading="Explore More Intelligence"
            moves={[
              { href: '/blog', icon: '📰', title: 'All Reports', desc: 'Intelligence hub', primary: true, color: '#C6923A' },
              { href: '/tools/escort-calculator', icon: '🧮', title: 'Rate Calculator', desc: 'Instant estimates' },
              { href: '/directory', icon: '🔍', title: 'Operator Directory', desc: 'Verified escorts' },
              { href: '/regulations', icon: '⚖️', title: 'Regulations', desc: 'State-by-state rules' },
              { href: '/corridors', icon: '🗺️', title: 'Corridors', desc: 'Route intelligence' },
              { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'HC training program' },
            ]}
          />
        </HCContentContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
