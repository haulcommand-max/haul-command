import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string }> };

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Article Not Found | Haul Command' };
  return {
    title: `${post.title} | Haul Command`,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: 'article',
      publishedTime: post.published_at,
      authors: ['Haul Command Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description,
    },
  };
}

export const revalidate = 86400; // ISR: revalidate every 24 hours

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description,
    author: { '@type': 'Organization', name: 'Haul Command' },
    publisher: {
      '@type': 'Organization',
      name: 'Haul Command',
      url: 'https://haulcommand.com',
    },
    datePublished: post.published_at,
    dateModified: post.published_at,
    url: `https://haulcommand.com/blog/${post.slug}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://haulcommand.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://haulcommand.com/blog/${post.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          {post.country_code && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full uppercase">
              {post.country_code}
            </span>
          )}
          {post.target_keyword && (
            <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded-full">
              {post.target_keyword}
            </span>
          )}
          <span className="text-xs text-gray-600">
            {new Date(post.published_at).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </span>
        </div>

        {/* Article Content */}
        <div
          className="prose prose-invert prose-amber max-w-none
            prose-h1:text-3xl prose-h1:font-bold prose-h1:text-white
            prose-h2:text-xl prose-h2:font-semibold prose-h2:text-white prose-h2:mt-8
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
            prose-li:text-gray-300
            prose-strong:text-white
            prose-blockquote:border-amber-500 prose-blockquote:text-gray-400"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {/* CTA Footer */}
        <div className="mt-16 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <h3 className="text-xl font-bold mb-2">Ready to find escort operators?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Search 7,745+ verified operators across 57 countries. Post your load in 90 seconds.
          </p>
          <div className="flex gap-3">
            <Link
              href="/directory"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-colors"
            >
              Browse Directory
            </Link>
            <Link
              href="/loads"
              className="px-6 py-2.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Post a Load
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
