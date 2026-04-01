import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getArticleEnrichment } from '@/lib/blog/article-enrichments';

/* ── Interactive components (client-only, no SSR) ── */
const FaqAccordion = dynamic(() => import('@/components/blog/FaqAccordion'));
const BlogFaqSchema = dynamic(() => import('@/components/blog/BlogFaqSchema'));
const ReciprocityMap = dynamic(() => import('@/components/blog/ReciprocityMap'));
const CostComparisonChart = dynamic(() => import('@/components/blog/CostComparisonChart'));
const CostCalculator = dynamic(() => import('@/components/blog/CostCalculator'));
const QuickAnswerBox = dynamic(() => import('@/components/blog/QuickAnswerBox'));
const TableOfContents = dynamic(() => import('@/components/blog/TableOfContents'));
const WhatChangedBox = dynamic(() => import('@/components/blog/WhatChangedBox'));
const BridgeClearanceTool = dynamic(() => import('@/components/blog/BridgeClearanceTool'));
const AxleWeightTool = dynamic(() => import('@/components/blog/AxleWeightTool'));

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
      images: [
        {
          url: post.cover_image || 'https://haulcommand.com/brand/default-og.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
      images: [post.cover_image || 'https://haulcommand.com/brand/default-og.png'],
    },
    alternates: {
      canonical: `https://haulcommand.com/blog/${post.slug}`,
      languages: {
        'en-US': `https://haulcommand.com/blog/${post.slug}`,
        'en-GB': `https://haulcommand.com/en-gb/blog/${post.slug}`,
        'en-AU': `https://haulcommand.com/en-au/blog/${post.slug}`,
        'es-MX': `https://haulcommand.com/es-mx/blog/${post.slug}`,
        'pt-BR': `https://haulcommand.com/pt-br/blog/${post.slug}`,
        'de-DE': `https://haulcommand.com/de-de/blog/${post.slug}`,
      },
    },
  };
}

export const revalidate = 86400; // ISR: revalidate every 24 hours

/* ── Content renderer with tool injection ── */
function RenderContentWithTools({ html, countryCode = 'us' }: { html: string; countryCode?: string }) {
  // Ensure we have our 3 core visuals
  let processedHtml = html || '';
  
  if (!processedHtml.includes('[INJECT_BRIDGE_CLEARANCE]')) {
    processedHtml += '\n\n<h2 class="text-2xl font-bold mt-8 mb-4">Live Dispatch Intelligence</h2>\n[INJECT_BRIDGE_CLEARANCE]\n';
  }
  if (!processedHtml.includes('[INJECT_AXLE_WEIGHT_TOOL]')) {
    processedHtml += '\n[INJECT_AXLE_WEIGHT_TOOL]\n';
  }
  
  const imgCount = (processedHtml.match(/<img/g) || []).length;
  if (imgCount < 1) {
    const infographicHtml = `\n<figure class="my-8"><img src="https://images.unsplash.com/photo-1541888079-052a65fe3629?auto=format&fit=crop&w=1200&q=80" alt="Heavy Haul Infrastructure Diagram" class="w-full rounded-xl border border-gray-800" /><figcaption class="text-sm text-gray-400 mt-2 text-center text-balance">Heavy haul route topography and clearance infrastructure mapping.</figcaption></figure>\n`;
    const paragraphs = processedHtml.split('</p>');
    if (paragraphs.length > 3) {
      paragraphs.splice(2, 0, infographicHtml + '</p>');
      processedHtml = paragraphs.join('');
    } else {
      processedHtml = infographicHtml + processedHtml;
    }
  }

  const parts = processedHtml.split(/(\[INJECT_[A_Z_]+\])/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part === '[INJECT_COST_CALCULATOR]') return <div key={i} className="my-12"><CostCalculator /></div>;
        if (part === '[INJECT_RECIPROCITY_MAP]') return <div key={i} className="my-12"><ReciprocityMap /></div>;
        if (part === '[INJECT_BRIDGE_CLEARANCE]') return <div key={i} className="my-12"><BridgeClearanceTool /></div>;
        if (part === '[INJECT_AXLE_WEIGHT_TOOL]') return <div key={i} className="my-12"><AxleWeightTool /></div>;
        if (part === '[INJECT_THRESHOLD_TABLE]') return (
          <div key={i} className="my-8 overflow-x-auto"><p className="text-gray-400">Standard Threshold Matrix (TX Data)</p></div>
        );
        return (
          <div
            key={i}
            className="prose prose-invert prose-amber max-w-none hover:prose-a:text-hc-orange transition-colors"
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

  const relatedPosts = await getRelatedPosts(slug, post.country_code);
  const enrichment = getArticleEnrichment(slug);
  const lastModified = post.updated_at || post.published_at;

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
    datePublished: post.published_at,
    dateModified: lastModified,
    image: {
      '@type': 'ImageObject',
      url: post.cover_image || 'https://haulcommand.com/brand/default-og.png',
      caption: post.title,
      width: 1200,
      height: 630,
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

      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog" className="hover:text-white transition-colors">
            Intelligence
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
        </nav>

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
            <RenderContentWithTools html={post.content_html} />
          </div>
          
          <div className="md:col-span-4 hidden md:block space-y-6 sticky top-10 self-start">
             <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-2 text-xs font-bold text-amber-500/50">LIVE</div>
               <h4 className="text-white font-bold text-sm mb-2">Cost Comparison Index</h4>
               <p className="text-xs text-gray-500 mb-4">Real-time heavy haul analytics.</p>
               <div className="relative h-40 w-full rounded-lg overflow-hidden border border-white/5 group-hover:border-amber-500/30 transition-all">
                  <Image src="/images/blog/cost_comparison_infographic.png" alt="Cost Comparison" fill className="object-cover" />
               </div>
             </div>

             <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl relative overflow-hidden group mt-6">
               <div className="absolute top-0 right-0 p-2 text-xs font-bold text-amber-500/50">OS/OW</div>
               <h4 className="text-white font-bold text-sm mb-2">Compliance Dashboard</h4>
               <p className="text-xs text-gray-500 mb-4">Federal regulatory checklists.</p>
               <div className="relative h-40 w-full rounded-lg overflow-hidden border border-white/5 group-hover:border-amber-500/30 transition-all">
                  <Image src="/images/blog/compliance_dashboard_graphic.png" alt="Compliance Dashboard" fill className="object-cover" />
               </div>
             </div>
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
            <Link
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
                <Link
                  href="/glossary"
                  className="px-5 py-2.5 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-xl text-sm transition-colors border border-white/10"
                  id="cta-browse-dictionary"
                >
                  Browse Dictionary
                </Link>
                <Link
                  href="/claim"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-colors"
                  id="cta-join-network"
                >
                  Join Network
                </Link>
                <Link
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

        {/* ── Related Intelligence ── */}
        {relatedPosts.length > 0 && (
          <section className="mt-16" aria-label="Related articles">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-bold text-white">Related Intelligence</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((related: any) => (
                <Link
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
              <Link
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
