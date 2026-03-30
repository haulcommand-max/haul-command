import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getGlossaryTermBySlug } from '@/lib/glossary-unified';
import {
  resolveTermSlug, resolveCountrySlug, getCanonicalCountrySlug,
  getCountryDisplayName, COUNTRY_SLUG_MAP,
} from '@/lib/glossary-slugs';
import { getCountryBySlug, COUNTRIES } from '@/lib/seo-countries';
import { supabaseServer } from '@/lib/supabase-server';
import Navbar from '@/components/Navbar';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';

export const revalidate = 86400; // 1 day ISR

/**
 * BUILD SIZE GUARD: Pre-render Tier A countries × 12 flagship terms only.
 * Everything else renders on first visit via ISR.
 */
export function generateStaticParams() {
  const flagshipSlugs = [
    'pilot-car', 'escort-vehicle', 'pevo', 'oversize-load', 'superload',
    'height-pole', 'route-survey', 'bridge-formula', 'wide-load',
    'overweight-load', 'deadhead', 'curfew',
  ];
  const tierAIso = ['us', 'ca', 'au', 'gb', 'nz', 'za', 'de', 'nl', 'ae', 'br'];

  const params: Array<{ 'term-slug': string; 'country-slug': string }> = [];
  for (const term of flagshipSlugs) {
    for (const iso of tierAIso) {
      params.push({ 'term-slug': term, 'country-slug': COUNTRY_SLUG_MAP[iso] });
    }
  }
  return params; // 12 × 10 = 120 pages at build
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'term-slug': string; 'country-slug': string }>;
}): Promise<Metadata> {
  const { 'term-slug': rawTermSlug, 'country-slug': rawCountrySlug } = await params;
  const termSlug = resolveTermSlug(rawTermSlug);
  const iso = resolveCountrySlug(rawCountrySlug);
  const country = iso ? getCountryBySlug(iso) : undefined;
  const term = await getGlossaryTermBySlug(termSlug);

  if (!term || !country) return { title: 'Not Found | Haul Command' };

  const countryFullSlug = getCanonicalCountrySlug(rawCountrySlug);
  const displayName = getCountryDisplayName(rawCountrySlug) || country.name;

  // Use country-specific local term if available
  const localTerm = country.terms?.pilot_car; // TODO: map by category
  const title = `${term.term} Terms, Definition, Requirements & Rules in ${displayName} | Haul Command`;
  const description = `Learn about ${term.term} in ${displayName}. ${(term.shortDefinition || '').substring(0, 120)}`;
  const url = `https://haulcommand.com/glossary/${termSlug}/${countryFullSlug || rawCountrySlug}/`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: 'article' },
    alternates: { canonical: url },
  };
}

export default async function GlossaryCountryPage({
  params,
}: {
  params: Promise<{ 'term-slug': string; 'country-slug': string }>;
}) {
  const { 'term-slug': rawTermSlug, 'country-slug': rawCountrySlug } = await params;
  const canonicalTermSlug = resolveTermSlug(rawTermSlug);
  const iso = resolveCountrySlug(rawCountrySlug);
  const canonicalCountrySlug = iso ? COUNTRY_SLUG_MAP[iso] : undefined;

  // Redirect non-canonical slugs
  if (rawTermSlug !== canonicalTermSlug || rawCountrySlug !== canonicalCountrySlug) {
    if (canonicalCountrySlug) {
      redirect(`/glossary/${canonicalTermSlug}/${canonicalCountrySlug}/`);
    }
  }

  if (!iso || !canonicalCountrySlug) notFound();

  const country = getCountryBySlug(iso);
  const term = await getGlossaryTermBySlug(canonicalTermSlug);

  if (!country || !term) notFound();

  const displayName = getCountryDisplayName(rawCountrySlug) || country.name;
  const baseUrl = 'https://haulcommand.com';

  // Fetch trusted providers for this country
  let trustedProviders: any[] = [];
  try {
    const { data } = await supabaseServer()
      .from('hc_public_operators')
      .select('id, name, slug, claim_status')
      .eq('country_code', country.code)
      .in('trust_classification', ['verified', 'gold', 'silver', 'bronze'])
      .order('trust_score', { ascending: false })
      .limit(3);
    trustedProviders = data || [];
  } catch { /* silent */ }

  // Country-specific local terminology
  const localTermMap: Record<string, keyof typeof country.terms> = {
    'pilot-car': 'pilot_car',
    'escort-vehicle': 'escort_vehicle',
    'oversize-load': 'oversize_load',
    'wide-load': 'wide_load',
    'route-survey': 'route_survey',
    'superload': 'superload',
  };
  const termKey = localTermMap[canonicalTermSlug];
  const localTermName = termKey ? country.terms[termKey] : undefined;

  const faqs = [
    {
      question: `What is ${term.term} called in ${displayName}?`,
      answer: localTermName && localTermName !== term.term
        ? `In ${displayName}, ${term.term} is commonly referred to as "${localTermName}".`
        : `In ${displayName}, the standard term "${term.term}" is used.`,
    },
    {
      question: `What are the ${term.term} rules in ${displayName}?`,
      answer: `${displayName} has specific regulations governing ${term.term.toLowerCase()} operations. Check the country requirements page for detailed rules.`,
    },
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Haul Command', url: baseUrl },
          { name: 'Heavy Haul Glossary', url: `${baseUrl}/glossary` },
          { name: `${term.term} Terms`, url: `${baseUrl}/glossary/${canonicalTermSlug}/` },
          { name: displayName, url: `${baseUrl}/glossary/${canonicalTermSlug}/${canonicalCountrySlug}/` },
        ]}
      />
      <Navbar />

      <main className="min-h-screen bg-[#0a0e17] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
            <span className="text-slate-600">/</span>
            <Link href="/glossary" className="hover:text-white transition-colors">Glossary</Link>
            <span className="text-slate-600">/</span>
            <Link href={`/glossary/${canonicalTermSlug}/`} className="hover:text-white transition-colors">{term.term}</Link>
            <span className="text-slate-600">/</span>
            <span className="text-white">{country.flag} {displayName}</span>
          </nav>

          {/* Hero */}
          <article className="bg-[#111823] border border-white/10 rounded-2xl p-8 sm:p-12 shadow-xl shadow-black/50">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{country.flag}</span>
              <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-semibold tracking-wide uppercase">
                {term.category.replace(/_/g, ' ')} · {displayName}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              {term.term} <span className="text-accent">Terms, Meaning, and Rules in {displayName}</span>
            </h1>

            {/* Local term highlight */}
            {localTermName && localTermName !== term.term && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-slate-300 text-sm">
                  <span className="font-semibold text-white">Global Term:</span> {term.term}
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  <span className="font-semibold text-white">Local Usage ({displayName}):</span> {localTermName}
                </p>
              </div>
            )}

            <div className="prose prose-invert prose-lg max-w-none mb-8 text-slate-300 leading-relaxed">
              <p>{term.shortDefinition}</p>
              {term.longDefinition && <p>{term.longDefinition}</p>}
            </div>

            {/* Why It Matters */}
            {term.whyItMatters && (
              <div className="mb-8 p-5 rounded-xl bg-accent/5 border border-accent/10">
                <h2 className="text-lg font-bold text-white mb-2">Why It Matters in {displayName}</h2>
                <p className="text-slate-300">{term.whyItMatters}</p>
              </div>
            )}

            {/* AKA */}
            {term.synonyms.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Also Known As</h2>
                <div className="flex flex-wrap gap-2">
                  {term.synonyms.map(alias => (
                    <span key={alias} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300">{alias}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Tools */}
            {term.relatedTools.length > 0 && (
              <div className="border-t border-white/10 pt-8">
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Related Tools</h2>
                <div className="flex flex-wrap gap-2">
                  {term.relatedTools.map(tool => (
                    <Link key={tool.slug} href={`/tools/${tool.slug}`} className="px-4 py-2 bg-accent/5 hover:bg-accent/20 border border-accent/10 hover:border-accent/30 rounded-lg text-sm text-accent transition-colors">
                      {tool.name || tool.slug.replace(/-/g, ' ')} →
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Next-Step Blocks (5 minimum per spec) */}
          <div className="grid sm:grid-cols-2 gap-4 mt-12">
            {/* 1: Country regulations */}
            <Link href={`/requirements/${iso}`} className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/30 transition-colors">
              <h3 className="font-semibold text-white mb-1">{displayName} Regulations</h3>
              <p className="text-sm text-slate-400">Full oversize load requirements and rules</p>
            </Link>
            {/* 2: Back to topic hub */}
            <Link href={`/glossary/${canonicalTermSlug}/`} className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/30 transition-colors">
              <h3 className="font-semibold text-white mb-1">{term.term} — Global Overview</h3>
              <p className="text-sm text-slate-400">See this term across all 120 countries</p>
            </Link>
            {/* 3: Country directory */}
            <Link href={`/directory/${iso}`} className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/30 transition-colors">
              <h3 className="font-semibold text-white mb-1">Find Operators in {displayName}</h3>
              <p className="text-sm text-slate-400">Verified heavy haul and escort operators</p>
            </Link>
            {/* 4: Escort rules tool */}
            <Link href={`/tools/escort-rules/${iso}`} className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/30 transition-colors">
              <h3 className="font-semibold text-white mb-1">Escort Rules Tool — {displayName}</h3>
              <p className="text-sm text-slate-400">Interactive escort requirements checker</p>
            </Link>
            {/* 5: Full glossary */}
            <Link href="/glossary" className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/30 transition-colors sm:col-span-2">
              <h3 className="font-semibold text-white mb-1">Heavy Haul Glossary</h3>
              <p className="text-sm text-slate-400">Browse all 3,000+ industry terms, definitions, and rules</p>
            </Link>
          </div>

          {/* Trusted Providers */}
          {trustedProviders.length > 0 && (
            <div className="mt-12 text-center bg-[#111823] border border-white/10 rounded-2xl p-8 shadow-xl shadow-black/50">
              <h2 className="text-2xl font-bold text-white mb-2">Need {term.term} Services in {displayName}?</h2>
              <p className="text-slate-400 mb-6">Connect with verified operators in your jurisdiction.</p>
              <div className="flex flex-col gap-3 mb-6 items-center">
                {trustedProviders.map(p => (
                  <Link key={p.id} href={`/directory/${iso}/${p.slug}`} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:border-accent/50 text-slate-200 w-full max-w-sm flex items-center justify-between transition-colors">
                    <span className="font-semibold">{p.name}</span>
                    {p.claim_status === 'verified' && <span className="text-xs bg-accent text-black px-2 py-1 rounded font-bold uppercase tracking-wide">Verified</span>}
                  </Link>
                ))}
              </div>
              <Link href={`/directory/${iso}`} className="inline-block bg-accent text-black font-black px-6 py-3 rounded-xl hover:bg-yellow-500 transition-colors">
                View All {displayName} Operators
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
