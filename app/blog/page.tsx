import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

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
      .select('id, slug, title, meta_description, target_keyword, country_code, published_at, reading_time_minutes, views')
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Heavy Haul Intelligence
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Regulation guides, corridor intelligence, and escort industry insights — updated daily from the Haul Command global network.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Content publishing soon. Check back tomorrow.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Link aria-label="Navigation Link"
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all flex flex-col h-full"
              >
                <div>
                  {post.country_code && (
                    <span className="text-xs text-amber-500 font-medium uppercase tracking-wider">
                      {post.country_code}
                    </span>
                  )}
                  <h2 className="text-lg font-bold mt-2 mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {post.meta_description}
                  </p>
                </div>
                
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    {post.reading_time_minutes > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                        <span>{post.reading_time_minutes} min read</span>
                      </>
                    )}
                    {post.views > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                        <span>{post.views.toLocaleString()} views</span>
                      </>
                    )}
                  </div>
                  <span className="text-amber-400 text-sm group-hover:translate-x-1 transition-transform ml-2">
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
