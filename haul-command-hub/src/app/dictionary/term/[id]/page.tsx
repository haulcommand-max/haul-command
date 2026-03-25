import { getAllTerms } from '@/lib/glossary';
import { notFound } from 'next/navigation';
import { generateDefinedTermSchema } from '@/lib/seo-schema';
import DictionaryTermView from '@/components/hc/DictionaryTermView';

/**
 * Massive Server-Side SEO Generation
 * Generates all 500+ static routes at build-time.
 */
export function generateStaticParams() {
  const terms = getAllTerms();
  return terms.map((t) => ({ id: t.id }));
}

/**
 * Dynamic Metadata targeting exact Perplexity/Google queries
 */
export function generateMetadata({ params }: { params: { id: string } }) {
  const term = getAllTerms().find(t => t.id === params.id);
  if (!term) return { title: 'Term Not Found' };
  
  return {
    title: `${term.term} - Heavy Haul & Escort Dictionary | Haul Command Pro`,
    description: `Official definition of ${term.term} in heavy haul transport. ${term.definition.substring(0, 150)}...`,
    keywords: term.seoKeywords?.join(', ') || term.term,
  };
}

export default function DictionaryTermPage({ params }: { params: { id: string } }) {
  const term = getAllTerms().find(t => t.id === params.id);
  
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
