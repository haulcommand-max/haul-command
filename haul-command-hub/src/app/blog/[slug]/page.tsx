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
    .select('title, country_code')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  // Fallback metadata for pre-existing static slugs
  if (!data) {
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    return { title: `${title} | Haul Command Intelligence` };
  }
  return {
    title:`${data.title}`,
    description: `${data.title} — Expert analysis from Haul Command's global intelligence database.`,
  };
}

// Simple markdown → HTML converter
function mdToHtml(md: string): string {
  return md
    .split('\n')
    .map((line: string) => {
      let parsed = line;

      // Handle images: ![alt](url)
      if (parsed.match(/!\[(.+?)\]\((.+?)\)/)) {
        parsed = parsed.replace(
          /!\[(.+?)\]\((.+?)\)/g,
          '<img src="$2" alt="$1" class="rounded-2xl border border-white/10 w-full object-cover my-8 shadow-2xl" loading="lazy" />'
        );
      }
      
      if (parsed.startsWith('# '))
        return `<h1 class="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-6 mt-10">${parsed.slice(2)}</h1>`;
      if (parsed.startsWith('## '))
        return `<h2 class="text-2xl font-black text-accent mt-12 mb-4 italic uppercase tracking-tighter">${parsed.slice(3)}</h2>`;
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
      
      const withLinks = parsed.replace(
        /(?<!\!)\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" class="text-accent hover:underline font-bold" target="_blank">$1</a>'
      );
      const withBold = withLinks.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
      return `<p class="text-gray-300 leading-loose text-lg mb-4">${withBold}</p>`;
    })
    .join('\n');
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const sb = supabaseServer();

  // Try loading from Supabase first
  const { data: article } = await sb
    .from('hc_blog_articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  // Fallback to static placeholder for legacy slugs
  const isStatic = !article;
  const title = article
    ? article.title
    : slug === 'texas-superload-strategy'
      ? 'The 2026 Superload Strategy: Navigating the Texas Triangle'
      : 'Escort Certification Reciprocity: A 50-State Guide';
  const date = article
    ? new Date(article.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'February 10, 2026';
  const content = article?.content || null;
  const countryCode = article?.country_code || null;

  return (
    <>
      <Navbar />
      <main className="flex-grow py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 text-center">
            <Link href="/blog" className="text-accent text-sm font-bold uppercase tracking-widest mb-6 inline-block hover:opacity-70 transition-opacity">
              &larr; Back to Intelligence
            </Link>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className="h-[1px] w-8 bg-accent/50"></span>
              <span className="text-gray-500 text-sm font-mono">{date}</span>
              <span className="h-[1px] w-8 bg-accent/50"></span>
            </div>
            {countryCode && (
              <span className="inline-block bg-accent/10 border border-accent/20 text-accent text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                {countryCode}
              </span>
            )}
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-8 italic">
              {title}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Expert operational intelligence from the Haul Command database.
            </p>
          </header>

          <article className="prose prose-invert prose-accent max-w-none bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-16 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <div className="text-9xl font-black italic tracking-tighter">HC</div>
            </div>

            {content ? (
              <div
                className="text-gray-300 leading-loose space-y-2 text-lg relative z-10"
                dangerouslySetInnerHTML={{ __html: mdToHtml(content) }}
              />
            ) : (
              <div className="text-gray-300 leading-loose space-y-8 text-lg relative z-10">
                <p className="first-letter:text-7xl first-letter:font-black first-letter:text-accent first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                  Texas is the heartbeat of North American heavy haul. With the expansion of energy infrastructure in West Texas and the massive modular builds in the Gulf Coast, the &apos;Texas Triangle&apos; (Houston-Dallas-San Antonio) has become the most active superload corridor in the world...
                </p>
                <h2 className="text-3xl font-black text-accent mt-12 mb-4 italic uppercase tracking-tighter">The Triggers You Need to Watch</h2>
                <p>In Texas, a superload isn&apos;t just about weight anymore. The sheer dimensions of modern solar turbines and modular reactor components have pushed TxDMV to implement more granular police escort scheduling windows.</p>
                <div className="bg-black/40 border-l-8 border-accent p-8 rounded-r-3xl my-12">
                  <h3 className="text-accent text-xs uppercase font-black mb-4 tracking-widest">Command Note: Police Scheduling</h3>
                  <p className="text-lg italic text-gray-300">
                    &quot;Always schedule Texas DPS at least 10 days out for moves exceeding 20&apos; width. The current backlog at the Austin permit office is averaging 4.2 days for engineering review.&quot;
                  </p>
                </div>
              </div>
            )}

            <footer className="mt-20 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center font-black text-black mr-4 text-xl italic shadow-[0_0_20px_rgba(245,159,10,0.4)]">HC</div>
                <div>
                  <p className="text-white font-black text-lg tracking-tighter">Haul Command Intelligence Unit</p>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Operations Division</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Link href="/dictionary" className="bg-white/10 text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-white/20 transition-all">Browse Dictionary</Link>
                <Link href="/claim" className="bg-accent text-black px-6 py-3 rounded-full text-sm font-black hover:bg-yellow-500 transition-all">Join Network</Link>
              </div>
            </footer>
          </article>

          {/* Related Navigation */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/escort-requirements?state=texas" className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-accent/50 transition-all flex flex-col items-center group text-center ag-spring-hover">
              <span className="text-gray-500 mb-2 uppercase tracking-widest font-black text-[10px]">Real-time Database</span>
              <span className="text-xl font-black group-hover:text-accent transition-colors italic tracking-tighter">Texas Rules Registry &rarr;</span>
            </Link>
            <Link href="/dictionary" className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-accent/50 transition-all flex flex-col items-center group text-center ag-spring-hover">
              <span className="text-gray-500 mb-2 uppercase tracking-widest font-black text-[10px]">Intelligence Hub</span>
              <span className="text-xl font-black group-hover:text-accent transition-colors italic tracking-tighter">500+ Term Dictionary &rarr;</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
