import React from "react";
// Fake imports that map to expected module layout from spec
// import AttributeBlock from "../modules/AttributeBlock";
// import ReviewSnippets from "../modules/ReviewSnippets";
// import TrustScore from "../modules/TrustScore";

export default function ProfilePage({ 
    entity,
    profile,
    attributes,
    reviews,
    scoreSnapshot,
    renderContext
}: { 
    entity: any, 
    profile: any, 
    attributes: any[], 
    reviews: any[],
    scoreSnapshot: any,
    renderContext: any 
}) {
    
    // Applying local alias if available
    const roleTranslation = renderContext.roleAliases[entity.entity_type] || entity.entity_type;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            
            {/* Identity Block */}
            <section className="bg-white p-6 rounded-lg shadow border border-neutral-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold font-sans text-neutral-900">{entity.display_name || entity.canonical_name}</h1>
                        <p className="text-neutral-500 uppercase tracking-wider text-sm mt-1">{roleTranslation}</p>
                    </div>
                    {/* TrustScore Placeholder */}
                    <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2 rounded flex flex-col items-center">
                        <span className="text-xl font-bold">{scoreSnapshot?.overall_ai_readiness_score || "--"}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">AI Readiness</span>
                    </div>
                </div>
                
                {profile?.headline && (
                    <p className="mt-4 text-lg font-medium text-neutral-800">{profile.headline}</p>
                )}
                {profile?.short_description && (
                    <p className="mt-2 text-neutral-600">{profile.short_description}</p>
                )}
            </section>

            {/* Services & Attribute Block */}
            <section className="bg-white p-6 rounded-lg shadow border border-neutral-200">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Verified Capabilities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {attributes.map(attr => (
                        <div key={attr.id} className="bg-neutral-50 px-3 py-2 rounded text-sm font-medium border border-neutral-100 flex items-center justify-between">
                            {/* Uses canonical key for now, could resolve via Alias later */}
                            <span className="text-sm text-neutral-700 capitalize">{attr.canonical_key.replace(/_/g, ' ')}</span>
                            {attr.confidence_score > 80 && <span className="text-green-500 text-xs">✓ Verified</span>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Review Snippets Block */}
            <section className="bg-white p-6 rounded-lg shadow border border-neutral-200">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Signal Intelligence</h2>
                <div className="flex flex-col gap-4">
                    {reviews.length === 0 ? (
                        <p className="text-neutral-500 italic text-sm">No structured review evidence found.</p>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="border-l-4 border-emerald-500 pl-4 py-1">
                                <p className="text-neutral-700 select-none">"{review.review_text_raw}"</p>
                                <p className="text-xs text-neutral-400 mt-2">Signal: {review.review_source} • {review.review_date}</p>
                            </div>
                        ))
                    )}
                </div>
            </section>
            
            {/* Conversion Path */}
            <section className="mt-8 flex justify-center">
                <button className="bg-black hover:bg-neutral-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all">
                    {entity.claim_status === 'unclaimed' ? "Claim & Optimize Profile" : "Request Urgent Support"}
                </button>
            </section>

        </div>
    );
}
