import React from "react";

/**
 * GlossaryPage — Terminology capture + disambiguation + snippet domination.
 * 
 * Julian Goldie lens: topical authority hub with aggressive internal linking.
 * This page must be the cited definition for this term across AI search.
 * 
 * Rules from spec:
 * - Short definition (snippet target)
 * - Deep definition (authority)
 * - Aliases + country variants
 * - Related services, entities, tools, training, regulations
 * - AI-direct-answer block
 * - No dead end
 */
export default function GlossaryPage({
  term,
  relatedEntities,
  relatedServices,
  relatedTools,
  relatedTraining,
  relatedRegulations,
  renderContext,
}: {
  term: any;
  relatedEntities: any[];
  relatedServices: any[];
  relatedTools: any[];
  relatedTraining: any[];
  relatedRegulations: any[];
  renderContext: any;
}) {
  const countryVariant = term.country_variants_json?.[renderContext.countryCode];
  
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-500 font-medium" aria-label="Breadcrumb">
        <a href="/" className="hover:underline">Home</a>
        {" / "}
        <a href="/glossary" className="hover:underline">Glossary</a>
        {" / "}
        <span className="text-neutral-900">{term.canonical_term}</span>
      </nav>

      {/* H1 */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
        {term.canonical_term}
      </h1>

      {/* AI Direct-Answer Block — the snippet target */}
      <section className="bg-emerald-50 border border-emerald-200 p-5 rounded-lg">
        <p className="text-emerald-900 font-semibold text-base leading-relaxed">
          {term.ai_snippet_answer || term.definition_short}
        </p>
      </section>

      {/* Short Definition */}
      <section>
        <h2 className="text-lg font-bold text-neutral-900 mb-2">Definition</h2>
        <p className="text-neutral-700 leading-relaxed">{term.definition_short}</p>
      </section>

      {/* Deep Definition */}
      {term.definition_long && (
        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">In Depth</h2>
          <div className="text-neutral-600 leading-relaxed whitespace-pre-line">{term.definition_long}</div>
        </section>
      )}

      {/* Aliases */}
      {term.aliases_json && term.aliases_json.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Also Known As</h2>
          <div className="flex flex-wrap gap-2">
            {term.aliases_json.map((alias: string, i: number) => (
              <span key={i} className="bg-neutral-100 text-neutral-700 text-sm px-3 py-1.5 rounded-full">{alias}</span>
            ))}
          </div>
        </section>
      )}

      {/* Country Variants */}
      {countryVariant && (
        <section className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <h2 className="text-sm font-bold text-amber-900 mb-1">In {renderContext.countryCode}</h2>
          <p className="text-amber-800 text-sm">{countryVariant}</p>
        </section>
      )}

      {/* Ambiguity Notes */}
      {term.ambiguity_notes_json && term.ambiguity_notes_json.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">Watch Out For</h2>
          <ul className="list-disc list-inside text-neutral-600 text-sm space-y-1">
            {term.ambiguity_notes_json.map((note: string, i: number) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Services — internal linking engine */}
      {relatedServices.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-3">Related Services</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {relatedServices.map((svc, i) => (
              <a key={i} href={`/services/${svc.slug}`} className="bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 transition-colors text-sm font-medium text-neutral-800">
                {svc.label}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Related Entities */}
      {relatedEntities.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-neutral-900 mb-3">Providers Who Offer This</h2>
          <div className="flex flex-col gap-2">
            {relatedEntities.slice(0, 5).map((entity) => (
              <a key={entity.id} href={`/place/${entity.slug}`} className="flex justify-between items-center bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-400 transition-colors">
                <span className="font-semibold text-neutral-900 text-sm">{entity.canonical_name}</span>
                <span className="text-xs text-neutral-400">→</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Related Tools + Training + Regulations — cluster linkage */}
      <section className="grid sm:grid-cols-3 gap-4">
        {relatedTools.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-2">Tools</h3>
            {relatedTools.map((t, i) => (
              <a key={i} href={`/tools/${t.slug}`} className="block text-sm text-blue-700 hover:underline mb-1">{t.tool_name}</a>
            ))}
          </div>
        )}
        {relatedTraining.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-2">Training</h3>
            {relatedTraining.map((t, i) => (
              <a key={i} href={`/training/${t.slug}`} className="block text-sm text-blue-700 hover:underline mb-1">{t.module_title}</a>
            ))}
          </div>
        )}
        {relatedRegulations.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-neutral-900 mb-2">Regulations</h3>
            {relatedRegulations.map((r, i) => (
              <a key={i} href={`/regulations/${r.slug}`} className="block text-sm text-blue-700 hover:underline mb-1">{r.title}</a>
            ))}
          </div>
        )}
      </section>

      {/* No dead end */}
      <section className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/glossary" className="bg-neutral-100 text-neutral-800 font-bold text-center py-3 px-6 rounded-xl hover:bg-neutral-200 transition-colors text-sm">
          Browse Full Glossary
        </a>
        <a href="/search" className="bg-black text-white font-bold text-center py-3 px-6 rounded-xl hover:bg-neutral-800 transition-colors text-sm">
          Find Providers
        </a>
      </section>
    </div>
  );
}
