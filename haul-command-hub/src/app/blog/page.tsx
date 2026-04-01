import Link from 'next/link';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';
import blogPosts from '@/data/blog_posts.json';
import BlogSearch from '@/components/hc/BlogSearch';

export const metadata: Metadata = {
  title: 'Industry Intelligence — Heavy Haul Analysis & Reports | Haul Command',
  description: 'Data-driven intelligence on superload corridors, escort certification, police scheduling, oversize load regulations, and heavy haul market trends across 120 countries.',
  openGraph: {
    title: 'Industry Intelligence — Heavy Haul Analysis & Reports | Haul Command',
    description: 'Data-driven intelligence on superload corridors, escort certification, and heavy haul market trends.',
    url: 'https://haulcommand.com/blog',
  },
  alternates: { canonical: 'https://haulcommand.com/blog' },
};

interface Post {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  slug: string;
  riskRating?: string;
  author?: string;
  readTime?: string;
}

const posts: Post[] = blogPosts;

// Extract unique categories
const categories = [...new Set(posts.map(p => p.category))].sort();

export default function BlogIndex() {
  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 pb-24 md:pb-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Intelligence</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">
            Industry <span className="text-accent">Intelligence</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
            Data-driven insights for the oversized transport economy. {posts.length} articles across {categories.length} categories.
          </p>
        </header>

        {/* Search + Filter (client component) */}
        <BlogSearch posts={posts} categories={categories} />
      </main>

      {/* BreadcrumbList Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com/' },
              { '@type': 'ListItem', position: 2, name: 'Intelligence', item: 'https://haulcommand.com/blog' },
            ],
          }),
        }}
      />
      {/* CollectionPage Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Haul Command Industry Intelligence',
            description: 'Data-driven insights for heavy haul operations, escort certification, and superload corridors.',
            url: 'https://haulcommand.com/blog',
            publisher: {
              '@type': 'Organization',
              name: 'Haul Command',
              url: 'https://haulcommand.com',
            },
            numberOfItems: posts.length,
          }),
        }}
      />
    </>
  );
}
