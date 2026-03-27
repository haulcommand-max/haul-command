import Link from 'next/link';
import Navbar from '@/components/Navbar';
import blogPosts from '@/data/blog_posts.json';

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

export default function BlogIndex() {
    return (
        <>
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 italic tracking-tighter">
                        INDUSTRY <span className="text-accent underline decoration-4 underline-offset-8 transition-all">INTELLIGENCE</span>
                    </h1>
                    <p className="text-gray-400 text-lg">Data-driven insights for the oversized transport economy.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {posts.map((post) => (
                        <article key={post.slug} className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-accent/50 transition-all duration-300">
                            <div className="p-8 md:p-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                        {post.category}
                                    </span>
                                    <span className="text-gray-500 text-sm font-mono">{post.date}</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-accent transition-colors">
                                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                                        {post.title}
                                    </Link>
                                </h2>
                                <p className="text-gray-400 mb-8 flex-grow leading-relaxed">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-accent text-sm font-black uppercase tracking-tighter">
                                        Read Intelligence <span className="ml-2 group-hover:translate-x-2 transition-transform inline-block">→</span>
                                    </span>
                                    {post.readTime && <span className="text-gray-600 text-xs font-mono">{post.readTime}</span>}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </>
    );
}
