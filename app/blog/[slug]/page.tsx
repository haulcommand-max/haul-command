import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getArticleEnrichment } from '@/lib/blog/article-enrichments';
import { annotateHtml, fetchGlossaryMap } from '@/lib/blog/annotate-html';
import { EmailSubscribe } from '@/components/blog/EmailSubscribe';
import { ShareButton } from '@/components/social/ShareButton';

/* ── Interactive components (client-only, no SSR) ── */
const FaqAccordion = dynamic(() => import('@/components/blog/FaqAccordion'));
const BlogFaqSchema = dynamic(() => import('@/components/blog/BlogFaqSchema'));
const ReciprocityMap = dynamic(() => import('@/components/blog/ReciprocityMap'));
const CostComparisonChart = dynamic(() => import('@/components/blog/CostComparisonChart'));
const CostCalculator = dynamic(() => import('@/components/blog/CostCalculator'));
const QuickAnswerBox = dynamic(() => import('@/components/blog/QuickAnswerBox'));
const TableOfContents = dynamic(() => import('@/components/blog/TableOfContents'));
const WhatChangedBox = dynamic(() => import('@/components/blog/WhatChangedBox'));
const NativeAdCard = dynamic(() => import('@/components/ads/NativeAdCard').then(m => ({ default: m.NativeAdCard })));
const ScrollPaywallTrigger = dynamic(() => import('@/components/monetization/ScrollPaywallTrigger'));

type Props = { params: Promise<{ slug: string }> };

/* ── Data fetching ── */
async function getPost(slug: string) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();
    return data;
  } catch {
    return null;
  }
}

async function getRelatedPosts(currentSlug: string, countryCode?: string) {
  try {
    const supabase = createClient();
    let query = supabase
      .from('blog_posts')
      .select('id, slug, title, meta_description, country_code, published_at')
      .eq('published', true)
      .neq('slug', currentSlug)
      .order('published_at', { ascending: false })
      .limit(3);

    if (countryCode) {
      query = query.eq('country_code', countryCode);
    }

    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
}

/* ── Metadata ── */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Article Not Found | Haul Command' };

  const lastModified = post.updated_at || post.published_at;

  return {
    title: `${post.title} | Haul Command`,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: lastModified,
      authors: ['Haul Command Intelligence Unit'],
      url: `https://haulcommand.com/blog/${post.slug}`,
      ...(post.hero_image_url ? { images: [{ url: post.hero_image_url, width: 1200, height: 630, alt: post.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
      ...(post.hero_image_url ? { images: [post.hero_image_url] } : {}),
    },
    alternates: {
      canonical: `https://haulcommand.com/blog/${post.slug}`,
    },
  };
}

export const revalidate = 86400; // ISR: revalidate every 24 hours

/* ── Content renderer with tool injection ── */
function RenderContentWithTools({ html }: { html: string }) {
  const parts = html.split(/(\[INJECT_COST_CALCULATOR\]|\[INJECT_RECIPROCITY_MAP\]|\[INJECT_THRESHOLD_TABLE\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === '[INJECT_COST_CALCULATOR]') {
          return (
            <div key={i} className="my-12 px-6 py-8 bg-black/40 border border-hc-yellow-400/20 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-xs font-bold text-hc-yellow-400/50 uppercase">Live Calculator</div>
              <CostCalculator />
            </div>
          );
        }
        if (part === '[INJECT_RECIPROCITY_MAP]') {
          return (
            <div key={i} className="my-12 px-6 py-8 bg-black/40 border border-blue-400/20 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-xs font-bold text-blue-400/50 uppercase">Reciprocity Zone Engine</div>
              <ReciprocityMap />
            </div>
          );
        }
        if (part === '[INJECT_THRESHOLD_TABLE]') {
          return (
            <div key={i} className="my-8 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-amber-400 font-semibold text-xs uppercase tracking-wider">Dimension</th>
                    <th className="text-left py-3 px-4 text-amber-400 font-semibold text-xs uppercase tracking-wider">Standard OS/OW</th>
                    <th className="text-left py-3 px-4 text-amber-400 font-semibold text-xs uppercase tracking-wider">Superload Threshold</th>
                    <th className="text-center py-3 px-4 text-amber-400 font-semibold text-xs uppercase tracking-wider">DPS Escort</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dim: 'Width', standard: '8\'6" (102")', superload: '> 16\' (192")', escort: true },
                    { dim: 'Height', standard: '14\'', superload: '> 18\'', escort: true },
                    { dim: 'Length', standard: '110\'', superload: '> 125\'', escort: true },
                    { dim: 'GVW', standard: '80,000 lbs', superload: '> 254,300 lbs', escort: true },
                  ].map((row) => (
                    <tr key={row.dim} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{row.dim}</td>
                      <td className="py-3 px-4 text-gray-400">{row.standard}</td>
                      <td className="py-3 px-4 text-red-400 font-semibold">{row.superload}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs rounded-full font-bold">Required</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-gray-600">
                Source: Texas Transportation Code §621.101 · TxDMV OS/OW Permit Division · Last verified March 2026
              </p>
            </div>
          );
        }
        return (
          <div
            key={i}
            className="prose prose-invert prose-amber max-w-none
              prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:font-bold prose-h1:text-white prose-h1:leading-tight
              prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-16 prose-h2:mb-6 prose-h2:tracking-tight
              prose-h3:text-xl md:prose-h3:text-2xl prose-h3:font-semibold prose-h3:text-white/90 prose-h3:mt-10
              prose-p:text-lg md:prose-p:text-[20px] prose-p:text-gray-300 prose-p:leading-[1.8] prose-p:mb-8
              prose-a:text-hc-gold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-white transition-colors
              prose-li:text-lg md:prose-li:text-[20px] prose-li:text-gray-300 prose-li:leading-[1.8]
              prose-strong:text-white prose-strong:font-semibold
              prose-blockquote:border-l-4 prose-blockquote:border-hc-gold prose-blockquote:bg-white/[0.02] prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl prose-blockquote:text-xl prose-blockquote:font-medium prose-blockquote:text-gray-200 prose-blockquote:my-10 prose-blockquote:not-italic
              prose-table:border-white/10 prose-table:rounded-xl prose-table:overflow-hidden 
              prose-th:text-hc-gold prose-th:font-semibold prose-th:bg-white/[0.03] prose-th:p-4
              prose-td:text-gray-300 prose-td:p-4 prose-td:border-t prose-td:border-white/5
              prose-img:rounded-2xl prose-img:border prose-img:border-hc-border prose-img:shadow-2xl prose-img:my-12"
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      })}
    </>
  );
}

/* ── Page Component ── */
export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [relatedPosts, glossaryMap] = await Promise.all([
    getRelatedPosts(slug, post.country_code),
    fetchGlossaryMap(),
  ]);
  const enrichment = getArticleEnrichment(slug);
  const lastModified = post.updated_at || post.published_at;

  // Annotate blog content with glossary links (blog→glossary PageRank flow)
  const annotatedContent = annotateHtml(post.content_html, glossaryMap);

  /* ── Structured Data ── */
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description,
    author: {
      '@type': 'Organization',
      name: 'Haul Command Intelligence Unit',
      url: 'https://haulcommand.com/about',
      logo: {
        '@type': 'ImageObject',
        url: 'https://haulcommand.com/brand/logo-wordmark.png',
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Haul Command',
      url: 'https://haulcommand.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://haulcommand.com/brand/logo-wordmark.png',
      },
    },
    datePublished: post.published_at,
    dateModified: lastModified,
    url: `https://haulcommand.com/blog/${post.slug}`,
    mainEntityOfPage: `https://haulcommand.com/blog/${post.slug}`,
    isAccessibleForFree: true,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
      { '@type': 'ListItem', position: 2, name: 'Intelligence', item: 'https://haulcommand.com/blog' },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://haulcommand.com/blog/${post.slug}`,
      },
    ],
  };

  // FAQ schema — fires for any article with enrichment FAQs
  const faqSchema = enrichment?.faqs && enrichment.faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: enrichment.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* ── Scroll Paywall Trigger — fires at 2/3 scroll depth ── */}
      <ScrollPaywallTrigger
        surfaceName="Blog Article"
        tier="Pro"
        urgencyLevel="soft"
        threshold={0.67}
      />

      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link aria-label="Navigation Link" href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link aria-label="Navigation Link" href="/blog" className="hover:text-white transition-colors">
            Intelligence
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* ── Hero Image ── */}
        {post.hero_image_url && (
          <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden mb-8 border border-white/5">
            <Image
              src={post.hero_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
        )}

        {/* ── Article Meta Header ── */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {post.country_code && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full uppercase font-medium">
                {post.country_code}
              </span>
            )}
            {post.target_keyword && (
              <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded-full">
                {post.target_keyword}
              </span>
            )}
          </div>

          {/* Dates with "last updated" signal */}
          <div className="flex items-center gap-4 mb-6 text-xs">
            <time dateTime={post.published_at} className="text-gray-500">
              Published{' '}
              {new Date(post.published_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            {lastModified !== post.published_at && (
              <>
                <span className="text-gray-700">•</span>
                <time dateTime={lastModified} className="text-amber-500/80 font-medium">
                  Updated{' '}
                  {new Date(lastModified).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </>
            )}
          </div>

          {/* Author Byline */}
          <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/8 rounded-xl">
            <Image
              src="/brand/logo-mark.png"
              alt="Haul Command logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <div className="text-sm font-semibold text-white">
                Haul Command Intelligence Unit
              </div>
              <div className="text-xs text-gray-500">
                Operations Division — Data compiled from state DOT websites, FHWA guidelines, and{' '}
                <a
                  href="https://www.escortservicecoordinators.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500/80 hover:text-amber-400 transition-colors"
                >
                  ESCA
                </a>{' '}
                membership bulletins. Monitoring 120 countries, 4.6M+ entities.
              </div>
            </div>
          </div>
        </header>

        {/* ── Quick Answer Box (above-fold key facts) ── */}
        {enrichment?.quickAnswer && (
          <QuickAnswerBox data={enrichment.quickAnswer} />
        )}

        {/* ── What Changed Box ── */}
        {enrichment?.changes && (
          <WhatChangedBox
            changes={enrichment.changes.items}
            year={enrichment.changes.year}
          />
        )}

        {/* ── Table of Contents ── */}
        <TableOfContents />

        {/* ── Article Content ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <RenderContentWithTools html={annotatedContent} />
          </div>
          
          <div className="md:col-span-4 hidden md:block space-y-4 sticky top-10 self-start">
             {/* ── AdGrid Placement: blog-sidebar-1 ── */}
             <NativeAdCard
               placementId="blog-sidebar-1"
               surface="blog"
               variant="sidebar"
             />
             {/* ── AdGrid Placement: blog-sidebar-2 ── */}
             <NativeAdCard
               placementId="blog-sidebar-2"
               surface="blog"
               variant="sidebar"
             />
          </div>
        </div>

        {/* ── FAQ Section (universal, slug-keyed) ── */}
        {enrichment?.faqs && enrichment.faqs.length > 0 && (
          <section className="mt-12" aria-label="Frequently Asked Questions">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              <span className="text-xs text-amber-500/60 uppercase tracking-widest font-medium">
                Frequently Asked Questions
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            </div>
            <FaqAccordion faqs={enrichment.faqs} />
          </section>
        )}

        {/* ── Interactive Tools ── */}
        <div className="mt-12 space-y-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            <span className="text-xs text-amber-500/60 uppercase tracking-widest font-medium">
              Interactive Tools
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          </div>

          <ReciprocityMap />
          <CostComparisonChart />
          <CostCalculator />
        </div>

        {/* ── Sources & Methodology ── */}
        <aside className="mt-12 p-5 bg-white/[0.02] border border-white/8 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-2">Sources & Methodology</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            Data compiled from official state DOT websites, FHWA oversize/overweight permit
            guidelines, and ESCA membership bulletins. Permit volume data from TxDMV FY 2025 Annual Report.
            Corridor lead times averaged from HC operator-reported scheduling data (n=847 DPS escort requests, Jan–Dec 2025).
            Cost ranges reflect 2026 published fee schedules plus HC Rate Index median quotes.
            Regulations change frequently — always confirm current requirements with the relevant state authority before operating.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.txdmv.gov/motorcarriers/oversize-overweight-permits"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
            >
              TxDMV Permits →
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="https://www.fhwa.dot.gov/specialpermits/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
            >
              FHWA Guidelines →
            </a>
            <span className="text-gray-700">•</span>
            <a
              href="https://www.escortservicecoordinators.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
            >
              ESCA →
            </a>
            <span className="text-gray-700">•</span>
            <Link aria-label="Navigation Link"
              href="/requirements"
              className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
            >
              State Requirements Database →
            </Link>
          </div>
        </aside>

        {/* ── Intent-Matched CTAs ── */}
        <div className="mt-12 p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl">
          <div className="flex items-start gap-4 mb-5">
            <Image
              src="/brand/logo-wordmark.png"
              alt="Haul Command full logo"
              width={160}
              height={40}
              className="shrink-0 mt-1"
            />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {enrichment?.ctas ? 'Next Steps' : 'Intelligence Unit — Operations Division'}
          </h3>
          <p className="text-gray-400 text-sm mb-1">
            Expert regulatory intelligence from the Haul Command database. Real-time monitoring of
            permit regulations, escort requirements, and certification changes across 120 countries.
          </p>
          <p className="text-gray-500 text-xs mb-5">
            Our Intelligence Unit tracks regulatory changes daily, analyzes DOT bulletins, and
            provides actionable insights for escort vehicle operators, heavy haul carriers, and
            transport brokers.
          </p>
          <div className="flex flex-wrap gap-3">
            {enrichment?.ctas ? (
              enrichment.ctas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className={`px-5 py-2.5 font-semibold rounded-xl text-sm transition-colors ${
                    cta.variant === 'primary'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : cta.variant === 'secondary'
                      ? 'bg-white/8 hover:bg-white/12 text-white border border-white/10'
                      : 'border border-white/15 hover:border-white/30 text-white'
                  }`}
                  id={`cta-${cta.href.split('/').pop()}`}
                >
                  {cta.label}
                </Link>
              ))
            ) : (
              <>
                <Link aria-label="Navigation Link"
                  href="/glossary"
                  className="px-5 py-2.5 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-xl text-sm transition-colors border border-white/10"
                  id="cta-browse-dictionary"
                >
                  Browse Dictionary
                </Link>
                <Link aria-label="Navigation Link"
                  href="/claim"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-colors"
                  id="cta-join-network"
                >
                  Join Network
                </Link>
                <Link aria-label="Navigation Link"
                  href="/directory"
                  className="px-5 py-2.5 border border-white/15 hover:border-white/30 text-white font-semibold rounded-xl text-sm transition-colors"
                  id="cta-browse-directory"
                >
                  Browse Directory
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Email Capture (lead capture event: blog_article_email) ── */}
        <div className="mt-12">
          <EmailSubscribe
            title="Get the Heavy Haul Intel Brief"
            description="Regulatory changes. Corridor alerts. High-paying loads. Join 6,900+ operators who stay ahead."
            ctaText="Subscribe Free"
            source="blog_article"
          />
        </div>

        {/* ── Share Button (event: share_intent / blog_article) ── */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-gray-500">Found this useful? Share it.</span>
          <ShareButton
            title={post.title}
            text={post.meta_description}
            context="blog"
          />
        </div>

        {/* ── Related Intelligence ── */}
        {relatedPosts.length > 0 && (
          <section className="mt-16" aria-label="Related articles">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-bold text-white">Related Intelligence</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((related: any) => (
                <Link aria-label="Navigation Link"
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group p-4 bg-white/[0.03] border border-white/8 rounded-xl hover:border-amber-500/30 transition-all"
                >
                  {related.country_code && (
                    <span className="text-[10px] text-amber-500/70 font-medium uppercase tracking-wider">
                      {related.country_code}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold mt-1 mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{related.meta_description}</p>
                  <span className="text-amber-400 text-xs mt-3 inline-block group-hover:translate-x-1 transition-transform">
                    Read →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Internal Navigation Links ── */}
        <nav className="mt-12 pt-8 border-t border-white/8" aria-label="Related resources">
          <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
            Explore More
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/requirements', label: 'State Requirements', icon: '📋' },
              { href: '/glossary', label: 'HC Glossary', icon: '📖' },
              { href: '/directory', label: 'Operator Directory', icon: '🔍' },
              { href: '/regulations', label: 'Regulations Hub', icon: '⚖️' },
              { href: '/corridors', label: 'Corridor Intelligence', icon: '🛣️' },
              { href: '/tools', label: 'Permit Tools', icon: '🧮' },
              { href: '/rates', label: 'Rate Estimator', icon: '💰' },
              { href: '/training', label: 'Training Resources', icon: '🎓' },
            ].map((link) => (
              <Link aria-label="Navigation Link"
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg hover:border-amber-500/20 hover:bg-white/[0.04] transition-all text-xs text-gray-400 hover:text-white"
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </article>
    </div>
  );
}
