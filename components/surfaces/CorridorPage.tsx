import React from "react";

/**
 * CorridorPage — Route and corridor demand/supply page.
 * 
 * This is where corridor intelligence becomes a commercial surface.
 * Data products, sponsor inventory, and entity linking all originate here.
 */
export default function CorridorPage({
  corridor,
  constraints,
  supportEntities,
  nearbyYards,
  relatedRegulations,
  freshnessData,
  renderContext,
}: {
  corridor: any;
  constraints: any[];
  supportEntities: any[];
  nearbyYards: any[];
  relatedRegulations: any[];
  freshnessData: any;
  renderContext: any;
}) {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-500 font-medium" aria-label="Breadcrumb">
        <a href="/" className="hover:underline">Home</a>
        {" / "}
        <a href="/corridors" className="hover:underline">Corridors</a>
        {" / "}
        <span className="text-neutral-900">{corridor.name}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
        {corridor.name}
      </h1>

      {/* Direct Answer */}
      <section className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
        <p className="text-blue-900 font-semibold text-base leading-relaxed">
          {corridor.summary || `${corridor.name} is a major heavy haul corridor. Here is what you need to know about routing, restrictions, support services, and available operators.`}
        </p>
      </section>

      {/* Freshness Strip — "Is this data current?" */}
      {freshnessData && (
        <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-500 border-b pb-4">
          {freshnessData.last_verified && <span>Last verified: {new Date(freshnessData.last_verified).toLocaleDateString()}</span>}
          {freshnessData.active_operators && <span>Active operators: {freshnessData.active_operators}</span>}
          {freshnessData.recent_moves && <span>Recent moves: {freshnessData.recent_moves}</span>}
        </div>
      )}

      {/* Known Constraints */}
      {constraints.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Known Constraints</h2>
          <div className="flex flex-col gap-2">
            {constraints.map((c, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 text-sm">{c.type}: {c.label}</p>
                {c.description && <p className="text-red-700 text-xs mt-1">{c.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Support Entities */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Support Services on This Corridor</h2>
        {supportEntities.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800">
            Coverage needed on this corridor.
            <a href="/claim" className="underline ml-1 font-semibold">Claim your listing →</a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {supportEntities.map((entity) => (
              <a key={entity.id} href={`/place/${entity.slug}`} className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors">
                <p className="font-bold text-neutral-900 text-sm">{entity.canonical_name}</p>
                <p className="text-xs text-neutral-500 mt-1">{entity.entity_type?.replace(/_/g, " ")}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Nearby Yards */}
      {nearbyYards.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Yards & Staging Areas</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {nearbyYards.map((yard) => (
              <a key={yard.id} href={`/place/${yard.slug}`} className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-400 transition-colors">
                <p className="font-bold text-neutral-900 text-sm">{yard.canonical_name}</p>
                <p className="text-xs text-neutral-500 mt-1">{yard.city_name}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Related Regulations */}
      {relatedRegulations.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Applicable Regulations</h2>
          <div className="flex flex-col gap-2">
            {relatedRegulations.map((reg, i) => (
              <a key={i} href={`/regulations/${reg.slug}`} className="text-sm text-blue-700 hover:underline font-medium">{reg.title}</a>
            ))}
          </div>
        </section>
      )}

      {/* No dead end */}
      <section className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/search" className="bg-black text-white font-bold text-center py-3 px-6 rounded-xl hover:bg-neutral-800 transition-colors text-sm">
          Find Corridor Support
        </a>
        <a href="/corridors" className="bg-neutral-100 text-neutral-800 font-bold text-center py-3 px-6 rounded-xl hover:bg-neutral-200 transition-colors text-sm">
          Browse All Corridors
        </a>
      </section>
    </div>
  );
}
