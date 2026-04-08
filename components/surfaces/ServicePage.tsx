import React from "react";

/**
 * ServicePage — Core service intent page.
 * 
 * Answers: What is this service? When is it needed? Who provides it?
 * Where is it available? What proof exists? What should I do next?
 * 
 * Steve Jobs standard: one dominant action, zero dead ends,
 * immediate orientation on mobile.
 */
export default function ServicePage({
  service,
  entities,
  geoContext,
  renderContext,
  faqItems,
  relatedTools,
  relatedGlossary,
}: {
  service: any;
  entities: any[];
  geoContext: any;
  renderContext: any;
  faqItems: any[];
  relatedTools: any[];
  relatedGlossary: any[];
}) {
  const localServiceName =
    renderContext.serviceAliases?.[service.canonical_key] ||
    service.label_default;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

      {/* Breadcrumb — crawlable, not JS-only */}
      <nav className="text-sm text-neutral-500 font-medium" aria-label="Breadcrumb">
        <a href={`/${geoContext.country_code}`} className="hover:underline">{geoContext.country_code}</a>
        {geoContext.region_code && (
          <> / <a href={`/${geoContext.country_code}/${geoContext.region_code}`} className="hover:underline">{geoContext.region_code}</a></>
        )}
        {" / "}
        <span className="text-neutral-900">{localServiceName}</span>
      </nav>

      {/* H1 — service + market + benefit */}
      <section>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
          {localServiceName} in {geoContext.region_name || geoContext.country_name}
        </h1>
        <p className="mt-3 text-lg text-neutral-600 leading-relaxed max-w-2xl">
          {service.description_default || `Find verified ${localServiceName} providers with proven equipment, credentials, and response speed.`}
        </p>
      </section>

      {/* Direct Answer Block — AI snippet extraction target */}
      <section className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
        <h2 className="sr-only">Quick Answer</h2>
        <p className="text-blue-900 font-semibold text-base leading-relaxed">
          {localServiceName} involves {service.description_default || "professional escort and support services for heavy haul and oversize loads"}.
          In {geoContext.region_name || geoContext.country_name}, providers must meet local credential and insurance requirements.
        </p>
      </section>

      {/* When This Service Is Needed */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">When You Need This</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          <li className="bg-white border border-neutral-200 rounded-lg p-4 text-sm text-neutral-700">Planned oversize or heavy haul moves</li>
          <li className="bg-white border border-neutral-200 rounded-lg p-4 text-sm text-neutral-700">Emergency / last-minute replacement coverage</li>
          <li className="bg-white border border-neutral-200 rounded-lg p-4 text-sm text-neutral-700">Night, weekend, or after-hours transport</li>
          <li className="bg-white border border-neutral-200 rounded-lg p-4 text-sm text-neutral-700">Port access, TWIC-required zones, or restricted corridors</li>
        </ul>
      </section>

      {/* Matching Entities — the conversion engine */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">
          Verified Providers {geoContext.city_name ? `near ${geoContext.city_name}` : `in ${geoContext.region_name || geoContext.country_name}`}
        </h2>
        {entities.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 text-sm">
            No verified providers found yet in this market.
            <a href="/claim" className="underline ml-1 font-semibold">Claim your listing →</a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entities.slice(0, 8).map((entity) => (
              <a
                key={entity.id}
                href={`/place/${entity.slug}`}
                className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors"
              >
                <div>
                  <p className="font-bold text-neutral-900">{entity.display_name || entity.canonical_name}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {entity.city_name && `${entity.city_name}, `}{entity.region_code}
                    {entity.claim_status !== "unclaimed" && " • ✓ Verified"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-neutral-400">→</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Related Tools</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedTools.map((tool) => (
              <a key={tool.id} href={`/tools/${tool.slug}`} className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors">
                <p className="font-semibold text-neutral-900">{tool.tool_name}</p>
                <p className="text-xs text-neutral-500 mt-1">Free tool</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Related Glossary */}
      {relatedGlossary.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Key Terms</h2>
          <div className="flex flex-wrap gap-2">
            {relatedGlossary.map((term) => (
              <a key={term.id} href={`/glossary/${term.slug}`} className="bg-neutral-100 text-neutral-700 text-sm px-3 py-1.5 rounded-full hover:bg-neutral-200 transition-colors">
                {term.canonical_term}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FAQ Block — minimum 5 for thin pages */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Frequently Asked Questions</h2>
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 divide-y">
          {faqItems.map((faq, i) => (
            <details key={i} className="group p-4">
              <summary className="font-bold cursor-pointer text-neutral-800 group-open:text-black">{faq.question}</summary>
              <p className="mt-2 text-neutral-600 text-sm leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA — no dead end */}
      <section className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/search" className="bg-black text-white font-bold text-center py-3 px-8 rounded-xl shadow-lg hover:bg-neutral-800 transition-colors">
          Find Available Providers
        </a>
        <a href="/claim" className="bg-white text-black font-bold text-center py-3 px-8 rounded-xl shadow border border-neutral-300 hover:border-neutral-500 transition-colors">
          List Your Business
        </a>
      </section>
    </div>
  );
}
