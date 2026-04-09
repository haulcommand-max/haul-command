import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Heavy Haul Intelligence — News & Guides | Haul Command',
  description:
    'Heavy haul industry news, permit guides, escort vehicle regulations, and market intelligence. The authoritative source for oversize load transport professionals.',
  openGraph: {
    title: 'Heavy Haul Intelligence | Haul Command',
    description: 'Industry news, permit guides, and market intelligence for heavy haul professionals.',
    url: 'https://haulcommand.com/blog',
  },
  alternates: {
    canonical: 'https://haulcommand.com/blog',
  },
};

async function getBlogPosts(limit = 24) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('blog_posts')
      .select('id, slug, title, meta_description, target_keyword, country_code, published_at, reading_time_minutes, views, hero_image_url')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-hc-text font-sans selection:bg-hc-gold selection:text-white">
      {/* ── Magazine Style Hero ── */}
      <section className="relative pt-24 pb-20 px-4 text-center overflow-hidden border-b border-hc-border">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-hc-gold/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-3xl mx-auto">
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-hc-gold uppercase tracking-widest mb-6 inline-block">
            Operations & Intelligence
          </span>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight">
            Heavy Haul Intelligence
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mx-auto leading-relaxed">
            Regulation updates, corridor intelligence, and escort industry insights—compiled daily from the Haul Command global network.
          </p>
        </div>
      </section>

      {/* ── Premium Content Grid ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        {posts.length === 0 ? (
          <div className="text-center py-32 border border-white/5 rounded-3xl bg-white/[0.02]">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-2xl opacity-50">📡</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Awaiting Intelligence</h3>
            <p className="text-gray-500">The operations desk is compiling data. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any, index: number) => (
              <Link 
                aria-label={post.title}
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-hc-surface border border-hc-border rounded-3xl overflow-hidden hover:border-hc-gold/40 hover:shadow-gold-md transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* ── Image Header ── */}
                <div className="relative w-full h-56 bg-zinc-900 overflow-hidden">
                  {post.hero_image_url ? (
                    <Image
                      src={post.hero_image_url}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-hc-elevated flex items-center justify-center group-hover:scale-105 transition-transform duration-700 ease-out">
                      {/* Geometric fallback pattern */}
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                      <span className="text-5xl opacity-10">🛣️</span>
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-hc-surface via-transparent to-transparent opacity-80" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {post.country_code && (
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 text-hc-gold text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {post.country_code}
                      </span>
                    )}
                    {index === 0 && (
                      <span className="px-2.5 py-1 bg-hc-gold text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-gold-sm">
                        Latest
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Content Body ── */}
                <div className="flex flex-col flex-1 p-6 lg:p-8">
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-hc-gold transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed mb-6">
                    {post.meta_description}
                  </p>
                  
                  {/* ── Footer ── */}
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                      <time dateTime={post.published_at}>
                        {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </time>
                      {post.reading_time_minutes > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                          <span>{post.reading_time_minutes} min read</span>
                        </>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-hc-gold/10 transition-colors">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400 group-hover:text-hc-gold transition-colors">
                        <path d="M1 11L11 1M11 1H3.5M11 1V8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
