import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Head from 'next/head';
import Link from 'next/link';

// Mock DB wrapper - in actual implementation would import from @supabase
const getTermData = async (country: string, term: string) => {
  // Simulate fetch from 'glossary_control_term' joined with 'glossary_country_variant'
  return {
    canonical_term: term,
    country_alias: term === 'pilot-car' && country === 'gb' ? 'escort vehicle' : term.replace('-', ' '),
    definition: 'A specially equipped vehicle used to escort oversize loads and warn traffic.',
    related_terms: ['steerperson', 'high-pole', 'route-survey'],
    voice_questions: ['Do I need a pilot car in traffic?', 'How much does an escort vehicle cost?']
  };
};

export async function generateMetadata(
  { params }: { params: { country: string; term: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const data = await getTermData(params.country, params.term);
  if (!data) return { title: 'Not Found' };

  const termCapitalized = data.country_alias.replace(/\b\w/g, l => l.toUpperCase());

  return {
    title:`${termCapitalized} Requirements & Directory in ${params.country.toUpperCase()} |`,
    description: `Learn about ${data.country_alias} rules and definitions in ${params.country.toUpperCase()}. Discover verified operators, route restrictions, and exact cost estimates using Haul Command's 120-country glossary network.`,
    alternates: {
      canonical: `https://haulcommand.com/glossary/${params.country}/${params.term}`,
    },
    openGraph: {
      title: `What is a ${termCapitalized}? | Haul Command ${params.country.toUpperCase()}`,
      description: data.definition,
      url: `https://haulcommand.com/glossary/${params.country}/${params.term}`,
      images: [
        {
          url: `https://haulcommand.com/api/og/glossary?term=${params.term}&country=${params.country}`,
          width: 1200,
          height: 630,
          alt: `${termCapitalized} meaning and definition`,
        },
      ],
      type: 'article',
    },
  };
}

export default async function GlossaryTermPage({ params }: { params: { country: string; term: string } }) {
  const data = await getTermData(params.country, params.term);
  if (!data) return notFound();

  // JSON-LD structured data mapping the page and definitions into schema.org format
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': data.country_alias,
    'description': data.definition,
    'inDefinedTermSet': 'https://haulcommand.com/glossary',
    'url': `https://haulcommand.com/glossary/${params.country}/${params.term}`
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Search Engine Native Schema JSON */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="mb-6 flex space-x-2 text-sm text-gray-400">
        <Link href="/glossary" className="hover:text-white">Glossary</Link> 
        <span>/</span>
        <Link href={`/glossary/${params.country}`} className="hover:text-white">{params.country.toUpperCase()}</Link>
        <span>/</span>
        <span className="text-emerald-500 capitalize">{data.country_alias}</span>
      </div>

      <h1 className="text-4xl font-bold mb-4 capitalize text-white">What is a {data.country_alias}?</h1>
      <div className="prose prose-invert lg:prose-lg max-w-none">
        <p className="text-gray-300 text-lg leading-relaxed">{data.definition}</p>
        
        <h2 className="text-2xl mt-12 mb-4">Common Questions</h2>
        <ul className="space-y-4">
          {data.voice_questions.map((q, i) => (
            <li key={i}>
              <Link href={`/voice/${params.country}/${q.toLowerCase().replace(/ /g, '-')}`} className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/30">
                {q}
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="text-2xl mt-12 mb-4">Related Terms</h2>
        <div className="flex flex-wrap gap-3">
          {data.related_terms.map(rt => (
            <Link key={rt} href={`/glossary/${params.country}/${rt}`} className="px-4 py-2 bg-slate-800 rounded text-sm hover:bg-slate-700 transition">
              {rt.replace('-', ' ')}
            </Link>
          ))}
        </div>

        <div className="my-16 p-8 bg-slate-900 border border-slate-700 rounded-xl">
          <h3 className="text-xl font-bold mb-2">Claim Your Profile Today</h3>
          <p className="text-gray-400 mb-4">Are you a {data.country_alias} operating in {params.country.toUpperCase()}? Claim your Haul Command Verified profile now to capture this local search traffic.</p>
          <Link href={`/claim/${params.country}/${params.term}`} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded shadow-lg hover:bg-emerald-500 transition">
            Claim Profile Now
          </Link>
        </div>
      </div>
    </div>
  );
}
