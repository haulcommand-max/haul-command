import { getGlossaryTopic } from '@/lib/glossary/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookType } from 'lucide-react';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 86400;

export default async function GlossaryTopicPage({ params }: { params: { 'topic-slug': string } }) {
    const topicSlug = (await params)['topic-slug'];
    const data = await getGlossaryTopic(topicSlug);

    if (!data || !data.topic) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#070708] text-white">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                
                <nav className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-8 flex items-center gap-2">
                    <Link href="/glossary" className="hover:text-white">Glossary</Link>
                    <span>/</span>
                    <span className="text-[#D4A844]">{data.topic.name}</span>
                </nav>

                <h1 className="text-4xl font-black mb-4">{data.topic.name}</h1>
                <p className="text-xl text-gray-400 mb-12">{data.topic.description}</p>

                <div className="space-y-4 mb-16">
                    {data.terms.map((term: any) => (
                        <Link href={`/glossary/${term.term_slug}`} key={term.term_slug} 
                            className="bg-[#101012] border border-white/5 rounded-2xl p-6 flex items-start gap-4 hover:border-white/20 transition-all group">
                            <div className="bg-white/5 p-3 rounded-xl mt-1">
                                <BookType className="w-5 h-5 text-[#D4A844]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D4A844]">{term.canonical_term}</h3>
                                <p className="text-gray-400">{term.short_definition}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </div>

                <NoDeadEndBlock
                    heading={`More from Haul Command`}
                    moves={[
                        { href: '/directory', icon: '🔍', title: 'Find Operators', desc: `Search specialists`, primary: true, color: '#D4A844' },
                        { href: '/tools', icon: '🧮', title: 'Tools', desc: 'Try free operational tools' },
                    ]}
                />
            </main>
        </div>
    );
}
