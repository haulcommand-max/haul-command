'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';

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

interface Props {
  posts: Post[];
  categories: string[];
}

export default function BlogSearch({ posts, categories }: Props) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = posts;
    if (activeCategory) {
      result = result.filter(p => p.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, query, activeCategory]);

  return (
    <>
      {/* Search + Category Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">🔍</div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent/50 transition-all"
            autoComplete="off"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !activeCategory
                ? 'bg-accent text-black'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All ({posts.length})
          </button>
          {categories.map(cat => {
            const count = posts.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-accent text-black'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      {(query || activeCategory) && (
        <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-wider font-bold">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
          {activeCategory && <span> in {activeCategory}</span>}
          {query && <span> matching &quot;{query}&quot;</span>}
        </p>
      )}

      {/* Article Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((post) => (
          <article key={post.slug} className="group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-accent/30 transition-all duration-300">
            <div className="p-6 sm:p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4 gap-2">
                <span className="bg-accent/15 text-accent text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex-shrink-0">
                  {post.category}
                </span>
                <span className="text-gray-600 text-xs tabular-nums flex-shrink-0">{post.date}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors leading-tight">
                <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[8px] font-black">HC</div>
                  <span className="text-gray-500 text-[10px]">{post.author || 'Haul Command'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {post.readTime && <span className="text-gray-600 text-[10px] tabular-nums">{post.readTime}</span>}
                  <span className="text-accent text-xs font-bold group-hover:translate-x-1 transition-transform inline-block">→</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-white font-bold mb-2">No articles found</h3>
          <p className="text-gray-500 text-sm">Try a different search term or category.</p>
        </div>
      )}
    </>
  );
}
