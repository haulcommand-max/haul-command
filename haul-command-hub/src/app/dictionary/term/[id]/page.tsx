import { getAllTerms } from '@/lib/glossary';
import { notFound } from 'next/navigation';
import { generateDefinedTermSchema } from '@/lib/seo-schema';
import DictionaryTermView from '@/components/hc/DictionaryTermView';

/**
 * BUILD SIZE GUARD: Only pre-render first 50 dictionary terms at build.
 * The rest still work perfectly via ISR (on-demand rendering on first visit).
 * This prevents exceeding the 80MB Vercel deployment artifact limit.
 * The primary dictionary route is /dictionary/[country]/[term-id] — this
 * legacy route exists for backwards compatibility and search engines.
 */
export function generateStaticParams() {
  const terms = getAllTerms();
  return terms.slice(0, 50).map((t) => ({ id: t.id }));
}

/**
 * Dynamic Metadata targeting exact Perplexity/Google queries
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = getAllTerms().find(t => t.id === id);
  if (!term) return { title: 'Term Not Found' };
  
  return {
    title: `${term.term} - Heavy Haul & Escort Dictionary | Haul Command Pro`,
    description: `Official definition of ${term.term} in heavy haul transport. ${term.definition.substring(0, 150)}...`,
    keywords: term.seoKeywords?.join(', ') || term.term,
  };
}

export default async function DictionaryTermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = getAllTerms().find(t => t.id === id);
  
  if (!term) {
    notFound();
  }

  const schema = generateDefinedTermSchema(term);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <DictionaryTermView term={term} />
    </>
  );
}
