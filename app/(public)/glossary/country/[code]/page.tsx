import { getGlossaryCountry } from '@/lib/glossary/queries';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Globe } from 'lucide-react';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 86400;

export default async function GlossaryCountryPage({ params }: { params: { code: string } }) {
    const code = (await params).code.toUpperCase();
    const data = await getGlossaryCountry(code);

    if (!data || !data.terms || data.terms.length === 0) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#070708] text-white">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                
                <nav className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-8 flex items-center gap-2">
                    <Link href="/glossary" className="hover:text-white">Glossary</Link>
                    <span>/</span>
                    <span className="text-[#D4A844]">{code} Localized Terms</span>
                </nav>

                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-[#D4A844]/20 p-4 rounded-2xl">
                        <Globe className="w-10 h-10 text-[#D4A844]" />
                    </div>
                    <h1 className="text-4xl font-black">{code} Glossary</h1>
                </div>
                <p className="text-xl text-gray-400 mb-12">
                    Heavy haul and pilot car terminology localized for {code} operations.
                </p>

                <div className="space-y-4 mb-16">
                    {data.terms.map((term: any) => (
                        <Link href={`/glossary/${term.term_slug}?geo=${code}`} key={term.term_slug} 
                            className="bg-[#101012] border border-white/5 rounded-2xl p-6 flex flex-col gap-3 hover:border-white/20 transition-all group">
                            
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white group-hover:text-[#D4A844]">{term.local_title}</h3>
                                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                            
                            <p className="text-gray-400">{term.short_definition}</p>
                            
                            {term.regulatory_note && (
                                <div className="mt-2 text-sm text-[#D4A844] bg-[#D4A844]/5 border border-[#D4A844]/10 p-3 rounded-lg">
                                    <span className="font-bold block mb-1">Local Note:</span>
                                    {term.regulatory_note}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>

                <NoDeadEndBlock
                    heading={`More from Haul Command`}
                    moves={[
                        { href: '/directory', icon: '🔍', title: 'Find Operators', desc: `Search specialists in ${code}`, primary: true, color: '#D4A844' },
                    ]}
                />
            </main>
        </div>
    );
}
