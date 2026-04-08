import React from "react";

/**
 * UrgencyPage — High-conversion emergency surface.
 * 
 * This is NOT an informational page. This is a panic-response conversion weapon.
 * Mobile-first. Above-the-fold answer. Immediate action path.
 * 
 * Cole Gordon lens: qualify and route to action in < 5 seconds.
 * Alex Hormozi lens: remove pain immediately, then upsell.
 */
export default function UrgencyPage({
  service,
  urgencyContext,
  availableEntities,
  geoContext,
  renderContext,
}: {
  service: any;
  urgencyContext: { trigger: string; crisis_frame: string };
  availableEntities: any[];
  geoContext: any;
  renderContext: any;
}) {
  const localServiceName =
    renderContext.serviceAliases?.[service.canonical_key] || service.label_default;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">

      {/* Crisis Frame — immediate orientation */}
      <section className="px-4 pt-8 pb-6 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center w-full">
        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Urgent
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
          {urgencyContext.crisis_frame || `Need ${localServiceName} Right Now?`}
        </h1>
        <p className="mt-4 text-lg text-neutral-400 max-w-xl mx-auto">
          {urgencyContext.trigger || "Operator no-show, last-minute load, after-hours scramble, or deadline pressure."} We route you to verified coverage fast.
        </p>
      </section>

      {/* Dominant CTA */}
      <section className="px-4 sm:px-6 max-w-md mx-auto w-full">
        <button className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-lg py-4 rounded-xl shadow-2xl transition-all active:scale-95">
          Request Emergency Coverage
        </button>
        <p className="text-center text-neutral-500 text-xs mt-3 font-medium">
          Average response: under 15 minutes • Verified operators only
        </p>
      </section>

      {/* Available Now strip */}
      <section className="mt-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <h2 className="text-lg font-bold text-neutral-300 mb-4">
          Available Now {geoContext.city_name ? `near ${geoContext.city_name}` : `in ${geoContext.region_name || geoContext.country_name}`}
        </h2>
        {availableEntities.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg text-neutral-400 text-sm">
            Checking coverage… Submit a request and we will match you immediately.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {availableEntities.slice(0, 5).map((entity) => (
              <div
                key={entity.id}
                className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg p-4"
              >
                <div>
                  <p className="font-bold text-white">{entity.display_name || entity.canonical_name}</p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {entity.city_name} • Trust: {entity.trust_score || "—"}/100
                    {entity.claim_status !== "unclaimed" && " • ✓ Verified"}
                  </p>
                </div>
                <a
                  href={`/place/${entity.slug}`}
                  className="bg-white text-black text-sm font-bold px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Contact
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Backup options + support */}
      <section className="mt-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <h2 className="text-lg font-bold text-neutral-300 mb-4">While You Wait</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <a href="/tools/escort-requirement-calculator" className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-600 transition-colors">
            <p className="font-semibold text-white text-sm">Requirement Calculator</p>
            <p className="text-xs text-neutral-500 mt-1">Check what you need for this load</p>
          </a>
          <a href="/tools/staging-yard-finder" className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-600 transition-colors">
            <p className="font-semibold text-white text-sm">Staging Yard Finder</p>
            <p className="text-xs text-neutral-500 mt-1">Find a safe hold point nearby</p>
          </a>
          <a href="/glossary/pilot-car" className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-600 transition-colors">
            <p className="font-semibold text-white text-sm">Glossary: Pilot Car</p>
            <p className="text-xs text-neutral-500 mt-1">Local rules and terminology</p>
          </a>
        </div>
      </section>

      {/* Secondary CTA at bottom — no dead end */}
      <section className="mt-12 mb-8 px-4 sm:px-6 max-w-md mx-auto w-full">
        <a href="/claim" className="block w-full text-center bg-neutral-800 text-neutral-300 font-bold py-3 rounded-xl hover:bg-neutral-700 transition-colors">
          Are you an operator? Claim your listing →
        </a>
      </section>
    </div>
  );
}
