import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SaveButton from '@/components/capture/SaveButton';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';

interface Props {
  params: Promise<{ jurisdiction: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jurisdiction: rawJur } = await params;
  const jurisdiction = decodeURIComponent(rawJur).replace(/-/g, ' ');
  return {
    title: `${jurisdiction} Oversize Load Regulations | Haul Command`,
    description: `Complete oversize and overweight load regulations for ${jurisdiction}. Permit requirements, escort rules, max dimensions, and DOT authority contacts.`,
  };
}

export default async function RegulationPage({ params }: Props) {
  const supabase = createClient();
  const { jurisdiction: rawJur } = await params;
  const jurisdiction = decodeURIComponent(rawJur).replace(/-/g, ' ');

  const { data: page } = await supabase
    .from('regulation_pages')
    .select('*')
    .ilike('jurisdiction', jurisdiction)
    .single();

  const domain = "haulcommand.com";
  const url = `https://${domain}/regulations/${rawJur}`;
  const faqSchemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What are the oversize load regulations in ${jurisdiction}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": page?.content ? `According to official data: ${page.content.substring(0, 150)}...` : `In ${jurisdiction}, oversize loads must adhere to specific permit requirements, escort rules, and dimension limits. Check full details on Haul Command.`
        }
      }
    ]
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Regulations", "item": `https://${domain}/regulations` },
      { "@type": "ListItem", "position": 2, "name": jurisdiction, "item": url }
    ]
  };

  // If no page yet, serve a helpful fallback with Route Check CTA
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SchemaGenerator type="FAQPage" data={faqSchemaData} />
      <SchemaGenerator type="BreadcrumbList" data={breadcrumbData} />
      <section className="py-12 px-4 border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <a href="/regulations" className="text-xs text-gray-600 hover:text-amber-400">Regulations</a>
            <span className="text-gray-800">/</span>
            <span className="text-xs text-gray-400 capitalize">{jurisdiction}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold">
                  {jurisdiction} — Oversize Load Regulations
                </h1>
                <SaveButton entityType="regulation" entityId={rawJur} entityLabel={jurisdiction} variant="pill" />
              </div>
              <p className="text-gray-400">
                Permit requirements, escort rules, max dimensions, and authority contacts
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {page?.content ? (
          <div className="space-y-6">
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-p:text-gray-400 prose-li:text-gray-400
              prose-strong:text-white">
              <div dangerouslySetInnerHTML={{ __html:
                page.content
                  .split('\n')
                  .map((line: string) => line.startsWith('- ') ? `<li>${line.slice(2)}</li>` : `<p>${line}</p>`)
                  .join('\n')
              }} />
            </div>

            {page.generated_at && (
              <p className="text-xs text-gray-700">
                Last updated: {new Date(page.generated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
        ) : (
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-gray-400 mb-3">Regulation summary is being generated for {jurisdiction}. Check back shortly.</p>
          </div>
        )}

        {/* Route Check CTA */}
        <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <p className="font-bold text-white mb-1">Have a specific question about {jurisdiction}?</p>
          <p className="text-sm text-gray-400 mb-3">Get an instant AI answer with live regulation data.</p>
          <div className="flex gap-3">
            <a
              href={`/route-check?q=${encodeURIComponent(`Oversize load regulations in ${jurisdiction}`)}`}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors"
            >
              Ask Route Check →
            </a>
            <a href="/directory" className="px-4 py-2 border border-white/20 text-white text-sm rounded-xl hover:border-white/40 transition-colors">
              Find Operators
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
