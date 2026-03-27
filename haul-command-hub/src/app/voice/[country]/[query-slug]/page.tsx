import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import LiveKitVoicePanel from '@/components/hc/LiveKitVoicePanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface VoicePageProps {
  params: Promise<{ country: string; 'query-slug': string }>;
}

export async function generateMetadata({ params }: VoicePageProps): Promise<Metadata> {
  const { country, 'query-slug': querySlug } = await params;
  const title = querySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const cc = country.toUpperCase();
  return {
    title:`${title} — ${cc} Voice Answer |`,
    description: `AI-powered regulatory answer for "${title}" in ${cc}. Get instant voice answers for heavy haul compliance, permits, and escort requirements.`,
  };
}

/* ─── Related question generator ─────────────────────────── */
function generateFollowUps(queryPattern: string, country: string): string[] {
  const cc = country.toUpperCase();
  const base = [
    `What escort requirements exist in ${cc}?`,
    `Who are the nearest operators in ${cc}?`,
    `What permits do I need in ${cc}?`,
  ];
  if (queryPattern.toLowerCase().includes('escort')) {
    return [
      `How many escort vehicles are required in ${cc}?`,
      `What are police escort triggers in ${cc}?`,
      `What training is needed for escorts in ${cc}?`,
      ...base.slice(2),
    ];
  }
  if (queryPattern.toLowerCase().includes('permit')) {
    return [
      `How long do permit approvals take in ${cc}?`,
      `What are superload permit thresholds in ${cc}?`,
      `Can I get multi-state permits in ${cc}?`,
      ...base.slice(0, 2),
    ];
  }
  return base;
}

export default async function VoiceAnswerPage({ params }: VoicePageProps) {
  const { country, 'query-slug': querySlug } = await params;
  const cc = country.toUpperCase();
  const humanQuery = querySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const sb = supabaseServer();

  // Fetch matching voice query template
  const { data: voiceData } = await sb
    .from('voice_query_template')
    .select(`
      id, query_pattern, status, language_code,
      mapped_term:mapped_term_id ( id, term_name, term_type, term_slug )
    `)
    .eq('country_code', cc)
    .eq('status', 'active')
    .limit(10);

  const templates = (voiceData as any[]) ?? [];

  // Try to find a matching template
  const slugNormalized = querySlug.toLowerCase().replace(/-/g, ' ');
  const matchedTemplate = templates.find(
    (t: any) => t.query_pattern?.toLowerCase().includes(slugNormalized)
  ) || templates[0] || null;

  // Fetch related glossary terms for this country
  const { data: relatedTerms } = await sb
    .from('glossary_control_term')
    .select('id, term_name, term_slug, term_type')
    .eq('classification', 'confirmed_safe')
    .limit(6);

  const terms = (relatedTerms as any[]) ?? [];
  const followUps = generateFollowUps(humanQuery, country);

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full overflow-x-hidden">

        {/* ═══ HEADER ═══ */}
        <section className="relative py-12 sm:py-16 px-4 border-b border-white/5 bg-[#05080f]">
          <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[200px] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10">
            <nav className="text-xs text-gray-500 mb-6">
              <Link href="/" className="hover:text-accent">Home</Link>
              <span className="mx-2">›</span>
              <Link href="/voice" className="hover:text-accent">Voice Answers</Link>
              <span className="mx-2">›</span>
              <Link href={`/directory/${country}`} className="hover:text-accent">{cc}</Link>
              <span className="mx-2">›</span>
              <span className="text-white">{humanQuery}</span>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🎙️</span>
              </div>
              <div>
                <div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">AI Voice Answer</div>
                <div className="text-[10px] text-gray-600 font-mono">{cc} · Regulatory Intelligence</div>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter mb-3 leading-tight">
              {humanQuery}
            </h1>
            <p className="text-gray-400 text-sm max-w-2xl">
              Get instant AI-powered answers to heavy haul regulatory questions for {cc}.
              Ask about permits, escorts, compliance, and operational requirements.
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Main Content Column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Answer Block */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-bold">AI Answer</span>
                  {matchedTemplate && (
                    <span className="text-[9px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-full ml-auto font-mono">
                      Template: {matchedTemplate.query_pattern?.substring(0, 40)}...
                    </span>
                  )}
                </div>

                {matchedTemplate ? (
                  <div className="space-y-3">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Based on our regulatory intelligence database for <strong className="text-white">{cc}</strong>,
                      here is what we know about <strong className="text-accent">{humanQuery.toLowerCase()}</strong>:
                    </p>
                    <div className="bg-blue-500/[0.03] border border-blue-500/10 rounded-xl p-4">
                      <p className="text-gray-400 text-sm leading-relaxed">
                        This query maps to <strong className="text-blue-400">{(matchedTemplate as any).mapped_term?.term_name || 'a regulatory concept'}</strong>
                        {(matchedTemplate as any).mapped_term?.term_type && (
                          <> (classified as: <span className="text-gray-300">{(matchedTemplate as any).mapped_term.term_type}</span>)</>
                        )}.
                        For detailed compliance information, consult the official transport authority in {cc}.
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-600">
                      ⚠️ This answer is AI-generated from our regulatory database. Always verify with official sources before movement.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-400 text-sm leading-relaxed">
                      We&apos;re building regulatory intelligence for <strong className="text-white">{cc}</strong>.
                      Our AI is ready to answer questions about permits, escort requirements, and compliance
                      as our data for this region expands.
                    </p>
                    <div className="bg-accent/[0.03] border border-accent/10 rounded-xl p-4">
                      <p className="text-accent text-xs font-bold mb-1">Try your question via voice</p>
                      <p className="text-gray-500 text-[11px]">
                        Click the microphone below to ask your question. Our AI agent can search broader
                        regulatory databases for real-time answers.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* LiveKit Voice Panel */}
              <LiveKitVoicePanel country={country} query={humanQuery} />

              {/* Follow-Up Questions */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-white font-bold text-sm mb-3">
                  Follow-Up Questions
                </h3>
                <div className="space-y-2">
                  {followUps.map((q, i) => (
                    <Link
                      key={i}
                      href={`/voice/${country}/${q.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}`}
                      className="group flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 hover:border-accent/20 hover:bg-accent/[0.02] transition-all"
                    >
                      <span className="text-gray-600 group-hover:text-accent transition-colors text-sm">→</span>
                      <span className="text-gray-400 text-sm group-hover:text-white transition-colors">{q}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Sidebar Column ── */}
            <div className="space-y-6">

              {/* Related Glossary Terms */}
              {terms.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-white font-bold text-sm mb-3">Related Terms</h3>
                  <div className="space-y-2">
                    {terms.map((term: any) => (
                      <Link
                        key={term.id}
                        href={`/glossary/${country}/${term.term_slug}`}
                        className="group block bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2 hover:border-accent/20 transition-all"
                      >
                        <div className="text-white text-xs font-semibold group-hover:text-accent transition-colors">
                          {term.term_name}
                        </div>
                        <div className="text-[9px] text-gray-600">{term.term_type}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements Link */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-2">Requirements</h3>
                <p className="text-gray-500 text-[11px] mb-3">
                  View full escort and permit requirements for {cc}.
                </p>
                <Link
                  href={`/escort-requirements`}
                  className="block bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2.5 text-center text-accent text-xs font-bold hover:bg-accent/[0.05] hover:border-accent/20 transition-all"
                >
                  View Requirements →
                </Link>
              </div>

              {/* Nearby Operators */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-2">Nearby Operators</h3>
                <p className="text-gray-500 text-[11px] mb-3">
                  Find verified operators in {cc} who handle these services.
                </p>
                <Link
                  href={`/directory/${country}`}
                  className="block bg-accent text-black rounded-lg px-3 py-2.5 text-center text-xs font-black hover:bg-yellow-500 transition-all ag-magnetic"
                >
                  Find Operators →
                </Link>
              </div>

              {/* Claim CTA */}
              <div className="bg-gradient-to-b from-accent/[0.06] to-transparent border border-accent/20 rounded-2xl p-5">
                <h3 className="text-white font-bold text-sm mb-1">Are You an Operator?</h3>
                <p className="text-gray-500 text-[11px] mb-3">
                  Claim your profile to get verified, receive load alerts, and rank in {cc}.
                </p>
                <Link
                  href="/claim"
                  className="block bg-accent/10 border border-accent/30 rounded-lg px-3 py-2.5 text-center text-accent text-xs font-bold hover:bg-accent/20 transition-all"
                >
                  Claim Profile →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
