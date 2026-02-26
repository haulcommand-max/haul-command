import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Post {
    title: string;
    excerpt: string;
    category: string;
    date: string;
    slug: string;
    riskRating?: string;
}

const SAMPLE_POSTS: Post[] = [
    {
        title: "The 2026 Superload Strategy: Navigating the Texas Triangle",
        excerpt: "Why Texas handles more massive freight than any other state and how to coordinate your next police escort.",
        category: "Operations",
        date: "2026-02-10",
        slug: "texas-superload-strategy",
        riskRating: "High"
    },
    {
        title: "Escort Certification Reciprocity: A 50-State Guide",
        excerpt: "Stop doubling your costs. Learn which P/EVO certifications are recognized across state lines.",
        category: "Compliance",
        date: "2026-02-08",
        slug: "escort-reciprocity-guide",
        riskRating: "Low"
    }
];

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
                    {SAMPLE_POSTS.map((post) => (
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
                                <div className="flex items-center text-accent text-sm font-black uppercase tracking-tighter">
                                    Read Intelligence <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </main>

            <footer className="border-t border-white/10 py-12 bg-black">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        &copy; 2026 Haul Command. Information advantage is a competitive moat.
                    </p>
                </div>
            </footer>
        </>
    );
}
