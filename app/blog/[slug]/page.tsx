import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

/* ── Interactive components (client-only, no SSR) ── */
const FaqAccordion = dynamic(() => import('@/components/blog/FaqAccordion'), { ssr: false });
const BlogFaqSchema = dynamic(() => import('@/components/blog/BlogFaqSchema'), { ssr: false });
const ReciprocityMap = dynamic(() => import('@/components/blog/ReciprocityMap'), { ssr: false });
const CostComparisonChart = dynamic(() => import('@/components/blog/CostComparisonChart'), { ssr: false });
const CostCalculator = dynamic(() => import('@/components/blog/CostCalculator'), { ssr: false });

type Props = { params: Promise<{ slug: string }> };

/* ── FAQ data for the escort reciprocity guide ── */
const RECIPROCITY_FAQS = [
  {
    question: 'Which escort certification should I get first?',
    answer:
      "Oregon's ODOT pilot car certification is the most widely accepted across the country. It's recognized by all full-reciprocity states and several partial-reciprocity states, making it the best starting point for multi-state operators. The certification costs approximately $250 and can be completed online through ODOT-approved providers.",
  },
  {
    question: 'How long does reciprocity approval take?',
    answer:
      'In full-reciprocity states, no additional approval is needed — your existing certification is accepted immediately. In partial-reciprocity states, processing times vary: Texas requires an 8-hour online refresher, Colorado requires passing a written exam (typically same-day results), and Ohio issues temporary operating authority within 5-7 business days.',
  },
  {
    question: 'Can I operate in non-reciprocity states with an Oregon certification?',
    answer:
      'No. States with no reciprocity (like New York, Pennsylvania, and Florida) require their own state-specific certification regardless of what other certifications you hold. You must complete the state\'s approved training program and pass their exam before operating as an escort vehicle in those jurisdictions.',
  },
  {
    question: 'What happens if my certification expires while on a job?',
    answer:
      'Operating with an expired certification is treated the same as having no certification at all. Most states impose fines of $500-$2,000 for uncertified escort operations, and some states (like New York and Texas) can impound your vehicle. Set reminders 60 days before expiration and check renewal requirements, as some states require continuing education credits.',
  },
  {
    question: 'Is ESCA working toward a national escort certification standard?',
    answer:
      'Yes. The Escort Service Coordinators Association (ESCA) has been actively lobbying for federal recognition of a national certification standard since 2023. Their proposal includes a 40-hour minimum training requirement, standardized equipment specifications, and a national certification database. Several states have begun aligning their programs with ESCA guidelines in anticipation of federal action.',
  },
  {
    question: 'How do I verify which certifications a state accepts?',
    answer:
      "Check the state's DOT website for official reciprocity agreements, or use Haul Command's Requirements pages for state-specific details. You can also contact the state's Oversize/Overweight Permit Office directly. ESCA maintains an updated reciprocity matrix for member operators. Always verify before crossing state lines, as agreements can change without notice.",
  },
];

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
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
    },
    alternates: {
      canonical: `https://haulcommand.com/blog/${post.slug}`,
    },
  };
}

export const revalidate = 86400; // ISR: revalidate every 24 hours

/* ── Page Component ── */
export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(slug, post.country_code);
  const isReciprocityGuide = slug === 'escort-reciprocity-guide';
  const lastModified = post.updated_at || post.published_at;

  /* ── Article Schema ── */
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
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
      {isReciprocityGuide && <BlogFaqSchema faqs={RECIPROCITY_FAQS} />}

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
                membership bulletins
              </div>
            </div>
          </div>
        </header>

        {/* ── Article Content ── */}
        <div
          className="prose prose-invert prose-amber max-w-none
            prose-h1:text-3xl prose-h1:font-bold prose-h1:text-white
            prose-h2:text-xl prose-h2:font-semibold prose-h2:text-white prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:font-semibold prose-h3:text-white/90
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
            prose-li:text-gray-300
            prose-strong:text-white
            prose-blockquote:border-amber-500 prose-blockquote:text-gray-400
            prose-table:border-white/10
            prose-th:text-amber-400 prose-th:font-semibold
            prose-td:text-gray-300"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {/* ── Interactive Components (escort reciprocity guide only) ── */}
        {isReciprocityGuide && (
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
            <FaqAccordion faqs={RECIPROCITY_FAQS} />
          </div>
        )}

        {/* ── Sources & Methodology ── */}
        <aside className="mt-12 p-5 bg-white/[0.02] border border-white/8 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-2">Sources & Methodology</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            Data compiled from official state DOT websites, FHWA oversize/overweight permit
            guidelines, and ESCA membership bulletins. Last verified: March 2026. Regulations change
            frequently — always confirm current requirements with the relevant state authority before
            operating.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.fhwa.dot.gov/specialpermits/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
            >
              FHWA Permit Guidelines →
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

        {/* ── Enhanced Intelligence Unit CTA ── */}
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
          <h3 className="text-xl font-bold mb-2">Intelligence Unit — Operations Division</h3>
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
