import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sb = supabaseServer();
  const { data } = await sb
    .from('hc_blog_articles')
    .select('title, country_code, content')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  const title = data?.title ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description = data?.content
    ? data.content.replace(/[#*\-\[\]()]/g, '').substring(0, 155).trim() + '…'
    : `${title} — Expert analysis from Haul Command's global intelligence database.`;

  return {
    title: `${title} | Haul Command Intelligence`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://haulcommand.com/blog/${slug}`,
      siteName: 'Haul Command',
    },
    alternates: { canonical: `https://haulcommand.com/blog/${slug}` },
  };
}

/* ═══════════════════════════════════════════════════════
   MARKDOWN → HTML CONVERTER
   With auto-ID generation for TOC anchors
   ═══════════════════════════════════════════════════════ */

interface TOCEntry { id: string; text: string; level: number; }

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractTOC(md: string): TOCEntry[] {
  const entries: TOCEntry[] = [];
  md.split('\n').forEach(line => {
    if (line.startsWith('## ')) {
      const text = line.slice(3).trim();
      entries.push({ id: slugify(text), text, level: 2 });
    } else if (line.startsWith('### ')) {
      const text = line.slice(4).trim();
      entries.push({ id: slugify(text), text, level: 3 });
    }
  });
  return entries;
}

function mdToHtml(md: string): string {
  return md
    .split('\n')
    .map((line: string) => {
      let parsed = line;

      // Images: ![alt](url)
      if (parsed.match(/!\[(.+?)\]\((.+?)\)/)) {
        parsed = parsed.replace(
          /!\[(.+?)\]\((.+?)\)/g,
          '<figure class="my-8"><img src="$2" alt="$1" class="rounded-2xl border border-white/10 w-full object-cover shadow-2xl" loading="lazy" /><figcaption class="text-center text-gray-500 text-xs mt-2">$1</figcaption></figure>'
        );
      }
      
      if (parsed.startsWith('# '))
        return `<h1 class="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-6 mt-10">${parsed.slice(2)}</h1>`;
      if (parsed.startsWith('## ')) {
        const text = parsed.slice(3).trim();
        return `<h2 id="${slugify(text)}" class="text-2xl font-black text-accent mt-12 mb-4 scroll-mt-24">${text}</h2>`;
      }
      if (parsed.startsWith('### ')) {
        const text = parsed.slice(4).trim();
        return `<h3 id="${slugify(text)}" class="text-xl font-bold text-white mt-8 mb-3 scroll-mt-24">${text}</h3>`;
      }
      if (parsed.startsWith('- **')) {
        const m = parsed.match(/- \*\*(.+?)\*\*(.+)/);
        if (m)
          return `<li class="flex gap-2 mb-2"><span class="text-accent">•</span><span><strong class="text-white">${m[1]}</strong><span class="text-gray-300">${m[2]}</span></span></li>`;
      }
      if (/^[0-9]+\. /.test(parsed)) {
        const num = parsed.match(/^(\d+)\. (.+)/);
        if (num) return `<li class="flex gap-3 mb-2"><span class="text-accent font-bold">${num[1]}.</span><span class="text-gray-300">${num[2].replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')}</span></li>`;
      }
      if (parsed.trim() === '') return '<div class="h-4"></div>';
      if (parsed.startsWith('---')) return '<hr class="border-white/10 my-8" />';
      if (parsed.startsWith('*') && parsed.endsWith('*'))
        return `<p class="text-gray-500 text-sm italic">${parsed.replace(/\*/g, '')}</p>`;
      
      // Links
      const withLinks = parsed.replace(
        /(?<!!)\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" class="text-accent hover:underline font-bold">$1</a>'
      );
      const withBold = withLinks.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
      return `<p class="text-gray-300 leading-loose text-lg mb-4">${withBold}</p>`;
    })
    .join('\n');
}

/* ═══════════════════════════════════════════════════════
   BLOG POST PAGE
   ═══════════════════════════════════════════════════════ */

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const sb = supabaseServer();

  const { data: article } = await sb
    .from('hc_blog_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  const isStatic = !article;
  const title = article
    ? article.title
    : slug === 'texas-superload-strategy'
      ? 'The 2026 Superload Strategy: Navigating the Texas Triangle'
      : 'Escort Certification Reciprocity: A 50-State Guide';
  
  const publishedDate = article
    ? new Date(article.generated_at).toISOString()
    : '2026-02-10T00:00:00Z';
  const updatedDate = article?.updated_at
    ? new Date(article.updated_at).toISOString()
    : publishedDate;
  const displayDate = new Date(publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const displayUpdated = new Date(updatedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const content = article?.content || null;
  const countryCode = article?.country_code || null;

  // Extract TOC from content
  const toc = content ? extractTOC(content) : [];

  // Derive definition snippet (first 40-60 words of content)
  const definitionSnippet = content
    ? content.replace(/[#*\-\[\]()!]/g, '').split(/\s+/).slice(0, 55).join(' ') + '…'
    : null;

  return (
    <>
      <Navbar />
      <main className="flex-grow py-10 sm:py-16 px-4 pb-24 md:pb-16">
        <div className="max-w-4xl mx-auto">
          {/* ═══ BREADCRUMBS ═══ */}
          <nav className="text-xs text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span>›</span>
            <Link href="/blog" className="hover:text-accent">Intelligence</Link>
            <span>›</span>
            <span className="text-white truncate max-w-[200px] sm:max-w-none">{title}</span>
          </nav>

          <header className="mb-10">
            {/* Category + Country */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {countryCode && (
                <span className="bg-accent/10 border border-accent/20 text-accent text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {countryCode}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-4">
              {title}
            </h1>

            {/* Author + Date + Last Updated */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-black">HC</div>
                <span className="font-medium text-gray-400">Haul Command Intelligence</span>
              </div>
              <span className="hidden sm:inline">·</span>
              <time dateTime={publishedDate}>{displayDate}</time>
              {displayUpdated !== displayDate && (
                <>
                  <span>·</span>
                  <span className="text-green-400 text-xs font-bold">Updated {displayUpdated}</span>
                </>
              )}
            </div>
          </header>

          {/* ═══ TABLE OF CONTENTS ═══ */}
          {toc.length > 2 && (
            <nav className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-6 mb-8" aria-label="Table of Contents">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">In This Article</h2>
              <ol className="space-y-1.5">
                {toc.map((entry, i) => (
                  <li key={entry.id}>
                    <a
                      href={`#${entry.id}`}
                      className={`text-sm hover:text-accent transition-colors ${
                        entry.level === 2 ? 'text-gray-300 font-semibold' : 'text-gray-500 pl-4'
                      }`}
                    >
                      {entry.level === 2 && <span className="text-accent/50 mr-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>}
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* ═══ ARTICLE BODY ═══ */}
          <article className="prose prose-invert prose-accent max-w-none bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 sm:p-10 md:p-14 relative overflow-hidden">
            {content ? (
              <div
                className="text-gray-300 leading-loose space-y-2 text-lg relative z-10"
                dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
              />
            ) : (
              <div className="text-gray-300 leading-loose space-y-8 text-lg relative z-10">
                <p className="first-letter:text-6xl first-letter:font-black first-letter:text-accent first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                  Texas is the heartbeat of North American heavy haul. With the expansion of energy infrastructure in West Texas and the massive modular builds in the Gulf Coast, the &apos;Texas Triangle&apos; (Houston-Dallas-San Antonio) has become the most active superload corridor in the world...
                </p>
                <h2 id="the-triggers-you-need-to-watch" className="text-2xl font-black text-accent mt-12 mb-4 scroll-mt-24">The Triggers You Need to Watch</h2>
                <p>In Texas, a superload isn&apos;t just about weight anymore. The sheer dimensions of modern solar turbines and modular reactor components have pushed TxDMV to implement more granular police escort scheduling windows.</p>
                <div className="bg-black/40 border-l-4 border-accent p-6 rounded-r-2xl my-8">
                  <h3 className="text-accent text-xs uppercase font-black mb-3 tracking-widest">Command Note: Police Scheduling</h3>
                  <p className="text-base italic text-gray-300">
                    &quot;Always schedule Texas DPS at least 10 days out for moves exceeding 20&apos; width. The current backlog at the Austin permit office is averaging 4.2 days for engineering review.&quot;
                  </p>
                </div>
              </div>
            )}

            {/* ═══ SOCIAL SHARING ═══ */}
            <div className="mt-12 pt-8 border-t border-white/10 relative z-10">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Share this article</p>
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(`https://haulcommand.com/blog/${slug}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bg-white/5 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  𝕏 Post
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://haulcommand.com/blog/${slug}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bg-white/5 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                  LinkedIn
                </a>
                <button
                  onClick={undefined}
                  className="bg-white/5 border border-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                  data-copy-url={`https://haulcommand.com/blog/${slug}`}
                >
                  📋 Copy Link
                </button>
              </div>
            </div>

            {/* ═══ AUTHOR BIO (E-E-A-T) ═══ */}
            <footer className="mt-10 pt-8 border-t border-white/10 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center font-black text-black text-xl flex-shrink-0 shadow-[0_0_20px_rgba(245,159,10,0.3)]">HC</div>
                <div>
                  <p className="text-white font-bold text-sm">Haul Command Intelligence Unit</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed max-w-lg">
                    The Haul Command Intelligence Unit publishes data-driven analysis on heavy haul operations, escort certification, superload corridors, and regulatory trends across 120 countries. Backed by verified operator data and real-time dispatch intelligence.
                  </p>
                </div>
              </div>
            </footer>
          </article>

          {/* ═══ INTERNAL LINKING: Related Resources ═══ */}
          <section className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/glossary" className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl hover:border-accent/30 transition-all group">
              <span className="text-lg mb-1 block">📖</span>
              <span className="text-xs font-bold text-white group-hover:text-accent transition-colors">Glossary</span>
              <p className="text-[10px] text-gray-500 mt-0.5">500+ heavy haul terms</p>
            </Link>
            <Link href="/tools" className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl hover:border-accent/30 transition-all group">
              <span className="text-lg mb-1 block">🛠️</span>
              <span className="text-xs font-bold text-white group-hover:text-accent transition-colors">Tools</span>
              <p className="text-[10px] text-gray-500 mt-0.5">Calculators & checkers</p>
            </Link>
            <Link href="/directory" className="bg-white/[0.03] border border-white/[0.06] p-5 rounded-xl hover:border-accent/30 transition-all group">
              <span className="text-lg mb-1 block">🔍</span>
              <span className="text-xs font-bold text-white group-hover:text-accent transition-colors">Directory</span>
              <p className="text-[10px] text-gray-500 mt-0.5">Find verified operators</p>
            </Link>
          </section>

          {/* ═══ CTA ═══ */}
          <div className="mt-8 bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">Get market intelligence in your inbox</h3>
              <p className="text-gray-500 text-xs mt-1">Weekly analysis on corridors, rates, and regulatory changes.</p>
            </div>
            <Link href="/waitlist" className="bg-accent text-black px-6 py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-colors flex-shrink-0">
              Subscribe Free
            </Link>
          </div>
        </div>
      </main>

      {/* ═══ STRUCTURED DATA: Article + BreadcrumbList ═══ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description: definitionSnippet || `${title} — Expert analysis from Haul Command.`,
            url: `https://haulcommand.com/blog/${slug}`,
            datePublished: publishedDate,
            dateModified: updatedDate,
            author: {
              '@type': 'Organization',
              name: 'Haul Command Intelligence Unit',
              url: 'https://haulcommand.com',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Haul Command',
              url: 'https://haulcommand.com',
              logo: {
                '@type': 'ImageObject',
                url: 'https://haulcommand.com/favicon.ico',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `https://haulcommand.com/blog/${slug}`,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com/' },
              { '@type': 'ListItem', position: 2, name: 'Intelligence', item: 'https://haulcommand.com/blog' },
              { '@type': 'ListItem', position: 3, name: title, item: `https://haulcommand.com/blog/${slug}` },
            ],
          }),
        }}
      />
    </>
  );
}
