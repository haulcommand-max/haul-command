import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title:'AI Voice Answers — Heavy Haul Regulatory Intelligence |',
  description: 'Get instant AI-powered voice answers to heavy haul regulatory questions. Permits, escorts, compliance, and operational requirements for 120 countries.',
};

export default async function VoiceLandingPage() {
  const sb = supabaseServer();

  // Fetch sample voice templates grouped by country
  const { data: templates } = await sb
    .from('voice_query_template')
    .select('id, query_pattern, country_code, language_code')
    .eq('status', 'active')
    .limit(30);

  const voiceTemplates = (templates as any[]) ?? [];

  // Group by country
  const byCountry = new Map<string, any[]>();
  for (const t of voiceTemplates) {
    const cc = t.country_code || 'US';
    if (!byCountry.has(cc)) byCountry.set(cc, []);
    byCountry.get(cc)!.push(t);
  }

  // Sample questions for empty state
  const sampleQuestions = [
    { country: 'us', query: 'escort-requirements-for-oversize-loads', label: 'Escort requirements for oversize loads', cc: 'US' },
    { country: 'us', query: 'pilot-car-certification-requirements', label: 'Pilot car certification requirements', cc: 'US' },
    { country: 'us', query: 'superload-permit-process', label: 'Superload permit process', cc: 'US' },
    { country: 'ca', query: 'wide-load-escort-rules-canada', label: 'Wide load escort rules in Canada', cc: 'CA' },
    { country: 'au', query: 'pilot-vehicle-requirements-australia', label: 'Pilot vehicle requirements in Australia', cc: 'AU' },
    { country: 'gb', query: 'abnormal-load-escort-regulations-uk', label: 'Abnormal load escort regulations in UK', cc: 'GB' },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full overflow-x-hidden">

        {/* Header */}
        <section className="relative py-16 sm:py-24 px-4 border-b border-white/5 bg-[#05080f]">
          <div className="absolute top-0 right-1/3 w-[500px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-lg">🎙️</span>
              <span className="text-blue-400 text-xs font-bold">AI Voice Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 leading-[0.95]">
              Ask <span className="text-accent ag-text-glow">Anything</span> About Heavy Haul
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              AI-powered regulatory answers for permits, escorts, compliance, and operational requirements
              across 120 countries. Text or voice.
            </p>

            {/* Quick Search */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-gray-500">🔍</span>
                <input
                  type="text"
                  placeholder="Ask a regulatory question..."
                  className="w-full bg-transparent text-white text-sm placeholder:text-gray-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Popular Questions */}
        <section className="py-10 sm:py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-6">
              Popular <span className="text-accent">Questions</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(voiceTemplates.length > 0 ? voiceTemplates.slice(0, 8) : sampleQuestions).map((item: any, i: number) => {
                const cc = item.country_code || item.cc || 'US';
                const query = item.query_pattern || item.label || '';
                const slug = item.query || query.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                const country = (item.country || cc).toLowerCase();

                return (
                  <Link
                    key={i}
                    href={`/voice/${country}/${slug}`}
                    className="group flex items-center gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/20 hover:bg-accent/[0.02] transition-all ag-spring-hover"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-400">{cc}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold group-hover:text-accent transition-colors truncate">
                        {query}
                      </div>
                      <div className="text-[10px] text-gray-600">Voice + Text Answer</div>
                    </div>
                    <span className="text-gray-600 group-hover:text-accent transition-colors">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* By Country */}
        {byCountry.size > 0 && (
          <section className="py-8 px-4 bg-black/20">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-xl font-bold text-white mb-6">
                By <span className="text-accent">Country</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from(byCountry.entries()).map(([cc, items]) => (
                  <div key={cc} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-white font-bold text-sm">{cc}</span>
                      <span className="text-[9px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded">{items.length} templates</span>
                    </div>
                    <div className="space-y-1.5">
                      {items.slice(0, 3).map((item: any) => {
                        const slug = (item.query_pattern || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
                        return (
                          <Link
                            key={item.id}
                            href={`/voice/${cc.toLowerCase()}/${slug}`}
                            className="block text-gray-400 text-xs hover:text-accent transition-colors truncate"
                          >
                            → {item.query_pattern}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-black text-white tracking-tighter mb-3">
              Need a <span className="text-accent">Human</span>?
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Our directory connects you directly to verified operators who can answer your questions in person.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/directory" className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-all ag-magnetic">
                Browse Directory →
              </Link>
              <Link href="/claim" className="bg-white/[0.05] border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/[0.08] transition-all">
                Claim Profile →
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
