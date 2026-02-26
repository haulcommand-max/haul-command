import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;

    // Placeholder post data matching visual design
    const post = {
        title: slug === "texas-superload-strategy" ? "The 2026 Superload Strategy: Navigating the Texas Triangle" : "Escort Certification Reciprocity: A 50-State Guide",
        category: slug === "texas-superload-strategy" ? "Operations" : "Compliance",
        date: "February 10, 2026",
        content: "Texas is the heartbeat of North American heavy haul. With the expansion of energy infrastructure in West Texas and the massive modular builds in the Gulf Coast, the 'Texas Triangle' (Houston-Dallas-San Antonio) has become the most active superload corridor in the world...",
        author: "Haul Command Intelligence Unit"
    };

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
                            <span className="text-gray-500 text-sm font-mono">{post.date}</span>
                            <span className="h-[1px] w-8 bg-accent/50"></span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-8 italic">
                            {post.title}
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            How to coordinate complex moves through the most permit-heavy geography in the United States.
                        </p>
                    </header>

                    <article className="prose prose-invert prose-accent max-w-none bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-16 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <div className="text-9xl font-black italic tracking-tighter">HC</div>
                        </div>
                        <div className="text-gray-300 leading-loose space-y-8 text-lg relative z-10">
                            <p className="first-letter:text-7xl first-letter:font-black first-letter:text-accent first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                                {post.content}
                            </p>

                            <h2 className="text-3xl font-black text-accent mt-12 mb-4 italic uppercase tracking-tighter">The Triggers You Need to Watch</h2>
                            <p>In Texas, a superload isn't just about weight anymore. The sheer dimensions of modern solar turbines and modular reactor components have pushed TxDMV to implement more granular police escort scheduling windows.</p>

                            <div className="bg-black/40 border-l-8 border-accent p-8 rounded-r-3xl my-12">
                                <h3 className="text-accent text-xs uppercase font-black mb-4 tracking-widest">Command Note: Police Scheduling</h3>
                                <p className="text-lg italic text-gray-300">
                                    "Always schedule Texas DPS at least 10 days out for moves exceeding 20' width. The current backlog at the Austin permit office is averaging 4.2 days for engineering review."
                                </p>
                            </div>

                            <h2 className="text-3xl font-black text-accent mt-12 mb-4 italic uppercase tracking-tighter">Automation and Risk Mitigation</h2>
                            <p>By leveraging the Haul Command Regulatory Control Tower, carriers are now scoring their moves before the wheels spin. A move that checks out on Tuesday might be a 'High Risk' event on Friday afternoon in the Dallas-Fort Worth metroplex.</p>
                        </div>

                        <footer className="mt-20 pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center">
                                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center font-black text-black mr-4 text-xl italic shadow-[0_0_20px_rgba(245,159,10,0.4)]">HC</div>
                                <div>
                                    <p className="text-white font-black text-lg tracking-tighter">{post.author}</p>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Operations Division</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button className="bg-white/10 text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-white/20 transition-all">Share Data</button>
                                <button className="bg-accent text-black px-6 py-3 rounded-full text-sm font-black hover:bg-yellow-500 transition-all">Join Network</button>
                            </div>
                        </footer>
                    </article>

                    {/* Related Navigation */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Link href="/state/texas" className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-accent/50 transition-all flex flex-col items-center group text-center">
                            <span className="text-gray-500 mb-2 uppercase tracking-widest font-black text-[10px]">Real-time Database</span>
                            <span className="text-xl font-black group-hover:text-accent transition-colors italic tracking-tighter">Texas Rules Registry &rarr;</span>
                        </Link>
                        <Link href="/state/florida" className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:border-accent/50 transition-all flex flex-col items-center group text-center">
                            <span className="text-gray-500 mb-2 uppercase tracking-widest font-black text-[10px]">Reference Hub</span>
                            <span className="text-xl font-black group-hover:text-accent transition-colors italic tracking-tighter">Florida Compares &rarr;</span>
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/10 py-16 bg-black mt-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="text-accent font-black tracking-tighter text-3xl mb-8 italic">HAUL COMMAND</div>
                    <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                        Premium Infrastructure for Specialized Freight. Information advantage is not just a tool—it's a competitive moat.
                    </p>
                </div>
            </footer>
        </>
    );
}
