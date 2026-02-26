/**
 * StateInfrastructure — renders truck stops, hotels, and SEO authority block
 * for a state/province directory page.
 *
 * Sections:
 * - Truck Stops (from truck_stops table, queried by region_code)
 * - Pilot Car Hotels (from hotels table, queried by state)
 * - SEO Authority Block (static copy + FAQ schema)
 *
 * All sections gracefully hide when there's no data.
 * The SEO authority block always renders at minimum (static copy).
 */

import React from "react";
import type { TruckStop, PilotCarHotel } from "@/lib/data/getRegionBundle";
import { Truck, Wifi, ShowerHead, Scale, Bed, ShieldCheck, HelpCircle, ExternalLink } from "lucide-react";

// ── Truck stop card ───────────────────────────────────────────────────────────

function TruckStopCard({ stop }: { stop: TruckStop }) {
    const amenities = [
        stop.has_parking && "Parking",
        stop.has_showers && "Showers",
        stop.has_scales && "Scales",
        stop.has_wifi && "WiFi",
        stop.fuel_lanes && stop.fuel_lanes > 0 && `${stop.fuel_lanes} Fuel Lanes`,
    ].filter(Boolean) as string[];

    return (
        <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h4 className="font-bold text-white/80 text-sm leading-tight">{stop.name}</h4>
                    {stop.city && (
                        <p className="text-[10px] text-white/30 font-mono mt-0.5">{stop.city}</p>
                    )}
                </div>
                <Truck className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
            </div>
            {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {amenities.map(a => (
                        <span
                            key={a}
                            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(241,169,27,0.08)", border: "1px solid rgba(241,169,27,0.15)", color: "rgba(241,169,27,0.7)" }}
                        >
                            {a}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Hotel card ────────────────────────────────────────────────────────────────

function HotelCard({ hotel }: { hotel: PilotCarHotel }) {
    return (
        <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h4 className="font-bold text-white/80 text-sm leading-tight">{hotel.name}</h4>
                    {hotel.city && (
                        <p className="text-[10px] text-white/30 font-mono mt-0.5">{hotel.city}</p>
                    )}
                </div>
                <Bed className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
            </div>
            <div className="flex flex-wrap gap-1">
                {hotel.is_pilot_car_friendly && (
                    <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
                    >
                        Pilot Friendly
                    </span>
                )}
                {hotel.has_truck_parking && (
                    <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}
                    >
                        Truck Parking
                    </span>
                )}
            </div>
            {hotel.rate_notes && (
                <p className="text-[10px] text-white/30 leading-relaxed">{hotel.rate_notes}</p>
            )}
        </div>
    );
}

// ── FAQ schema builder ────────────────────────────────────────────────────────

export function buildFaqSchema(regionName: string) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `How do I find a pilot car in ${regionName}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Use the Haul Command directory to search verified pilot car and escort operators in ${regionName}. Filter by availability, trust score, and service type to find the right match for your load.`,
                },
            },
            {
                "@type": "Question",
                "name": `What are the escort requirements in ${regionName}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Escort requirements in ${regionName} vary by load dimensions and permit type. Oversized loads typically require a lead escort at minimum. Contact your ${regionName} permit office or check HC's regulation database for current rules.`,
                },
            },
            {
                "@type": "Question",
                "name": `What does a pilot car escort cost in ${regionName}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Pilot car rates in ${regionName} typically range from $2.75–$4.50 per mile for lead or chase escorts. Day rates range from $650–$1,000+. Height pole and specialized escorts command a premium. See the Rate Benchmarks section above for current 2026 data.`,
                },
            },
            {
                "@type": "Question",
                "name": `Do I need a permit to move oversized loads through ${regionName}?`,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": `Yes. Any load exceeding standard legal dimensions in ${regionName} requires a state-issued oversize/overweight permit. Requirements vary by county and route. Haul Command connects you with trusted permit services familiar with ${regionName} regulations.`,
                },
            },
        ],
    };
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
    truckStops: TruckStop[];
    hotels: PilotCarHotel[];
    regionName: string;
    country: string;
    region: string;
}

export function StateInfrastructure({ truckStops, hotels, regionName, country, region }: Props) {
    const hasStops = truckStops.length > 0;
    const hasHotels = hotels.length > 0;
    const faqSchema = buildFaqSchema(regionName);

    return (
        <>
            {/* ── JSON-LD FAQ Schema ────────────────────────────────────── */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* ── Truck Stops ───────────────────────────────────────────── */}
            {hasStops && (
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <Truck className="w-5 h-5" style={{ color: "#F1A91B" }} />
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Truck Stops</h2>
                        <span className="text-[10px] text-white/30 font-mono ml-1">{truckStops.length} locations</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {truckStops.slice(0, 12).map(s => <TruckStopCard key={s.id} stop={s} />)}
                    </div>
                </section>
            )}

            {/* ── Pilot Car Friendly Hotels ─────────────────────────────── */}
            {hasHotels && (
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <Bed className="w-5 h-5" style={{ color: "#F1A91B" }} />
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Pilot Car Hotels</h2>
                        <span className="text-[10px] text-white/30 font-mono ml-1">{hotels.length} properties</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {hotels.map(h => <HotelCard key={h.id} hotel={h} />)}
                    </div>
                </section>
            )}

            {/* ── SEO Authority Block — always renders ──────────────────── */}
            <section className="mb-16">
                <div className="flex items-center gap-2 mb-6">
                    <HelpCircle className="w-5 h-5" style={{ color: "#F1A91B" }} />
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                        {regionName} Pilot Car Guide
                    </h2>
                </div>

                {/* FAQ items — visible content for SEO + users */}
                <div className="space-y-4">
                    {faqSchema.mainEntity.map((item: any, i: number) => (
                        <details
                            key={i}
                            className="group rounded-xl overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <summary
                                className="flex items-center justify-between p-5 cursor-pointer list-none"
                                style={{ userSelect: "none" }}
                            >
                                <span className="font-bold text-white/80 text-sm pr-4">{item.name}</span>
                                <span className="text-white/30 text-xs font-black flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                            </summary>
                            <div className="px-5 pb-5">
                                <p className="text-white/40 text-sm leading-relaxed">{item.acceptedAnswer.text}</p>
                            </div>
                        </details>
                    ))}
                </div>

                {/* Related resources */}
                <div className="mt-8 flex flex-wrap gap-3">
                    <a
                        href={`/directory/${country.toLowerCase()}`}
                        className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors font-bold"
                    >
                        ← All {country === "US" ? "US States" : "CA Provinces"}
                    </a>
                    <a
                        href="/quote"
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full transition-all hover:scale-[1.02]"
                        style={{ background: "rgba(241,169,27,0.1)", border: "1px solid rgba(241,169,27,0.2)", color: "#F1A91B" }}
                    >
                        <ExternalLink className="w-3 h-3" />
                        Get a Custom Quote
                    </a>
                </div>
            </section>
        </>
    );
}
