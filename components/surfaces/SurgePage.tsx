import React from "react";
// Fake imports that map to expected module layout from spec
// import UrgencyStrip from "../modules/UrgencyStrip";
// import ServiceCards from "../modules/ServiceCards";
// import FaqBlock from "../modules/FaqBlock";

export default function SurgePage({ 
    surgeData, 
    liveOperators,
    reviews,
    marketContext 
}: { 
    surgeData: any, 
    liveOperators: any[],
    reviews: any[],
    marketContext: any 
}) {
    // This isn't a static SEO blog, it's a "mobile-first conversion surface" for high-intent panic.

    return (
        <div className="flex flex-col min-h-screen bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
            
            {/* The H1: Exact Service + Market + Benefit */}
            <section className="max-w-3xl mx-auto text-center w-full">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
                    {surgeData.headline}
                </h1>
                {surgeData.subheadline && (
                    <p className="mt-4 text-lg text-neutral-600 font-medium">
                        {surgeData.subheadline}
                    </p>
                )}
            </section>

            {/* Live Urgency Strip - Operational Local SEO difference */}
            <section className="max-w-4xl mx-auto mt-8 w-full">
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg flex items-center justify-between">
                    <div>
                        <h3 className="text-red-800 font-bold text-lg flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Live Market Status
                        </h3>
                        <p className="text-red-700 font-medium text-sm mt-1">
                            {liveOperators.length} verified operators active in {marketContext.locality_name} right now.
                        </p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-red-800 font-bold">Avg Response: &lt;15m</p>
                    </div>
                </div>
            </section>

            {/* The Hard Conversion Path */}
            <section className="max-w-md mx-auto mt-8 w-full flex flex-col gap-4">
                <button className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl shadow-xl hover:bg-neutral-800 transition-colors active:scale-95">
                    Request Urgent Coverage Now
                </button>
                <div className="flex justify-between text-xs text-neutral-500 px-2 font-medium">
                    <span>✓ TWIC Ready</span>
                    <span>✓ Fully Insured</span>
                    <span>✓ Route Verified</span>
                </div>
            </section>

            {/* Proof Block */}
            <section className="max-w-4xl mx-auto mt-12 w-full">
               <h2 className="text-xl font-bold text-neutral-900 mb-6 border-b pb-2">Recent Execution near {marketContext.locality_name}</h2>
               <div className="grid sm:grid-cols-2 gap-4">
                   {reviews.slice(0, 4).map(review => (
                       <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200">
                           <div className="flex gap-1 text-yellow-500 mb-2">★★★★★</div>
                           <p className="text-neutral-700 italic text-sm">"{review.review_text_raw}"</p>
                           <p className="text-xs text-neutral-500 mt-2 font-medium">{review.time_to_response || "Prompt response"}</p>
                       </div>
                   ))}
               </div>
            </section>

            {/* Searcher-First FAQ Block */}
            <section className="max-w-4xl mx-auto mt-12 w-full mb-12">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Frequently Asked Questions</h2>
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 divide-y">
                    {(surgeData.faq_json || []).map((faq: any, i: number) => (
                        <details key={i} className="group p-4">
                            <summary className="font-bold cursor-pointer text-neutral-800 group-open:text-black">
                                {faq.question}
                            </summary>
                            <p className="mt-2 text-neutral-600 text-sm leading-relaxed">
                                {faq.answer}
                            </p>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}
