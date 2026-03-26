import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COUNTRIES, getCountryBySlug } from '@/lib/seo-countries';
import { getAllTerms } from '@/lib/glossary';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';
import { generateDictionaryTermHreflang } from '@/lib/seo/hreflang';

/**
 * BUILD SIZE GUARD: Only pre-render US dictionary terms at build time.
 * All 57 countries still work via ISR (on-demand rendering on first visit).
 * This prevents the 80MB Vercel deployment artifact limit from being exceeded.
 */
export function generateStaticParams() {
  const terms = getAllTerms();
  // Only pre-render US — the highest-traffic country
  return terms.map((term) => ({
    country: 'us',
    'term-id': term.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; 'term-id': string }>;
}): Promise<Metadata> {
  const { country: countrySlug, 'term-id': termId } = await params;
  const country = getCountryBySlug(countrySlug);
  const term = getAllTerms().find(t => t.id === termId);

  if (!country || !term) return { title: 'Not Found' };

  const localTranslation = term.localTerms?.find(lt => lt.country === country.code)?.term;
  const primaryTerm = localTranslation || term.term;

  const title = `What is ${primaryTerm}? | Haul Command ${country.name} Dictionary`;
  const description = `Learn the definition of ${primaryTerm} (${term.term}) and other heavy haul, oversize load, and pilot car terminology in our comprehensive guide for ${country.name}.`;
  
  const url = `https://haulcommand.com/dictionary/${countrySlug}/${termId}`;

  return {
    title,
    description,
    openGraph: { title, description, url },
    alternates: { 
      canonical: url,
      languages: generateDictionaryTermHreflang(termId)
    },
  };
}

export default async function DictionaryTermPage({
  params,
}: {
  params: Promise<{ country: string; 'term-id': string }>;
}) {
  const { country: countrySlug, 'term-id': termId } = await params;
  
  const country = getCountryBySlug(countrySlug);
  const term = getAllTerms().find(t => t.id === termId);

  if (!country || !term) notFound();

  const localTranslation = term.localTerms?.find(lt => lt.country === country.code)?.term;
  const primaryTerm = localTranslation || term.term;

  const baseUrl = 'https://haulcommand.com';

  const faqs = [
    {
      question: `What does ${primaryTerm} mean in the transport industry?`,
      answer: term.definition,
    },
    {
      question: `Are there other names for ${primaryTerm}?`,
      answer: `Yes, ${primaryTerm} is also known as: ${term.aliases.join(', ')}.`
    }
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Haul Command', url: baseUrl },
          { name: country.name, url: `${baseUrl}/${countrySlug}` },
          { name: 'Dictionary', url: `${baseUrl}/dictionary` },
          { name: primaryTerm, url: `${baseUrl}/dictionary/${countrySlug}/${termId}` },
        ]}
      />
      <Navbar />

      <main className="min-h-screen bg-[#0a0e17] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
              <span className="text-slate-600">/</span>
              <Link href={`/${countrySlug}`} className="hover:text-white transition-colors">{country.flag} {country.name}</Link>
              <span className="text-slate-600">/</span>
              <Link href="/dictionary" className="hover:text-white transition-colors">Dictionary</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white">{primaryTerm}</span>
          </nav>

          <article className="bg-[#111823] border border-white/10 rounded-2xl p-8 sm:p-12 shadow-xl shadow-black/50">
            <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-semibold tracking-wide uppercase mb-6">
              {term.category.replace(/_/g, ' ')}
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
              {primaryTerm}
            </h1>

            {localTranslation && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-slate-300 text-sm">
                  <span className="font-semibold text-white">Global Industry Term:</span> {term.term}
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  <span className="font-semibold text-white">Local Usage ({country.name}):</span> {localTranslation}
                </p>
              </div>
            )}

            <div className="prose prose-invert prose-lg max-w-none mb-10 text-slate-300 leading-relaxed">
              <p>{term.definition}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 border-t border-white/10 pt-8 mt-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">AKA / Variations</h3>
                <div className="flex flex-wrap gap-2">
                  {term.aliases.map(alias => (
                    <span key={alias} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300">
                      {alias}
                    </span>
                  ))}
                </div>
              </div>

              {term.relatedTerms && term.relatedTerms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Related Terms</h3>
                  <div className="flex flex-wrap gap-2">
                    {term.relatedTerms.map(related => (
                      <Link key={related} href={`/dictionary/${countrySlug}/${related}`} className="px-3 py-1.5 bg-accent/5 hover:bg-accent/20 border border-accent/10 hover:border-accent/30 rounded-lg text-sm text-accent transition-colors">
                        {related} →
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Need Oversize Operations Support in {country.name}?</h2>
            <Link href={`/directory/${countrySlug}`} className="inline-block bg-accent text-black font-black px-8 py-4 rounded-xl hover:bg-yellow-500 transition-colors">
              Find Verified Operators Now
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
