import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RESOURCE_GUIDES } from '../page';
import { getAllTerms } from '@/lib/glossary';

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return RESOURCE_GUIDES.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = RESOURCE_GUIDES.find(g => g.slug === slug);
  if (!guide) return { title: 'Resource Not Found' };
  return {
    title: `${guide.title} | Haul Command Resources`,
    description: guide.description,
    alternates: { canonical: `https://haulcommand.com/resources/${guide.slug}/` },
  };
}

export default async function ResourceGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = RESOURCE_GUIDES.find(g => g.slug === slug);
  if (!guide) notFound();

  const allTerms = getAllTerms();
  const relatedTerms = allTerms.filter(t => guide.glossaryLinks.includes(t.id));

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-8">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span className="mx-2">›</span>
        <Link href="/resources" className="hover:text-accent">Resources</Link>
        <span className="mx-2">›</span>
        <span className="text-white">{guide.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-12 border-b border-white/5 pb-10">
        <div className="text-4xl mb-4">{guide.icon}</div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
          {guide.title}
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">{guide.description}</p>
        <div className="flex flex-wrap gap-2 mt-6">
          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 uppercase tracking-wider">
            {guide.category}
          </span>
          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10">
            {guide.glossaryLinks.length} related terms
          </span>
        </div>
      </header>

      {/* Guide content placeholder — designed for expansion */}
      <section className="mb-12 bg-[#111823]/50 border border-white/10 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-4">Overview</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          This comprehensive guide covers everything you need to know about {guide.title.toLowerCase()}.
          Below you'll find related industry terms from our glossary, direct links to our interactive tools,
          and pathways to find verified operators in the Haul Command directory.
        </p>
        <div className="bg-accent/5 border border-accent/15 rounded-xl p-6">
          <p className="text-accent font-bold text-sm mb-2">💡 Quick Action</p>
          <p className="text-gray-400 text-xs mb-4">
            Don't just read — take action. Use the tools below to check requirements for your specific load.
          </p>
          <div className="flex flex-wrap gap-3">
            {guide.toolLinks.map(tool => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-block bg-accent text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors"
              >
                {tool.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related Glossary Terms */}
      {relatedTerms.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Related Glossary Terms</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {relatedTerms.map(term => (
              <Link
                key={term.id}
                href={`/glossary/${term.id}/`}
                className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/20 transition-all group block"
              >
                <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors mb-1">
                  {term.term}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">{term.definition.substring(0, 120)}...</p>
                {term.countries.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {term.countries.slice(0, 5).map(c => (
                      <span key={c} className="text-[9px] text-gray-600">{c}</span>
                    ))}
                    {term.countries.length > 5 && <span className="text-[9px] text-gray-600">+{term.countries.length - 5}</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tools CTA */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-6">Industry Tools</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {guide.toolLinks.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-accent/30 transition-all group block"
            >
              <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors">
                🛠️ {tool.label}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">Free online tool — no signup required</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom nav */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between border-t border-white/5 pt-8">
        <Link href="/resources" className="text-sm text-accent hover:underline font-bold">← All Resources</Link>
        <Link href="/directory" className="text-sm text-accent hover:underline font-bold">Find Verified Operators →</Link>
      </div>

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: guide.title,
            description: guide.description,
            url: `https://haulcommand.com/resources/${guide.slug}/`,
            publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
          }),
        }}
      />
    </main>
  );
}
