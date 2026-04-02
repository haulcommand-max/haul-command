/**
 * CategoryGrid — The 6-category navigation panel shown on state/province pages.
 * This is the FIRST PLACE users see categories (not the root directory).
 *
 * Links route to /directory/{country}/{region}/{category-slug}
 */
"use client";
import React from "react";
import Link from "next/link";
import {
    Car, FileText, Wrench, BedDouble, HeartHandshake, Map
} from "lucide-react";

const CATEGORIES = [
    {
        slug: "pilot-car-operators",
        label: "Pilot Car / Escort Operators",
        icon: Car,
        description: "Lead car, chase car, escort vehicle, BF3-Begleitfahrzeug",
        hot: true,
    },
    {
        slug: "freight-brokers",
        label: "Heavy Haul Brokers",
        icon: HeartHandshake,
        description: "Oversize load brokers & dispatchers",
        hot: false,
    },
    {
        slug: "heavy-haul-carriers",
        label: "Heavy Haul Carriers",
        icon: Map,
        description: "Lowboy, RGN & specialized transport",
        hot: false,
    },
    {
        slug: "permit-services",
        label: "Permit Services",
        icon: FileText,
        description: "OS/OW permits, multi-region filings & routing",
        hot: false,
    },
    {
        slug: "route-surveyors",
        label: "Route Surveyors",
        icon: Map,
        description: "Pre-trip surveys, clearance checks & hazard reports",
        hot: false,
    },
    {
        slug: "diesel-mechanics",
        label: "Diesel Mechanics",
        icon: Wrench,
        description: "Mobile repair, towing & roadside assistance",
        hot: false,
    },
    {
        slug: "equipment-dealers",
        label: "Equipment Dealers",
        icon: Wrench,
        description: "Height poles, flags, signs & escort gear",
        hot: false,
    },
    {
        slug: "weigh-stations",
        label: "Weigh Stations & Scales",
        icon: Map,
        description: "DOT scales, CAT scales & inspection sites",
        hot: false,
    },
    {
        slug: "travel-plazas",
        label: "Travel Plazas & Staging",
        icon: BedDouble,
        description: "Oversize-friendly stops, yards & staging areas",
        hot: false,
    },
    {
        slug: "ports-borders",
        label: "Ports & Border Crossings",
        icon: Map,
        description: "POE, customs yards & port infrastructure",
        hot: false,
    },
    {
        slug: "training-certification",
        label: "Training & Certification",
        icon: FileText,
        description: "Escort certifications, safety courses & licensing",
        hot: false,
    },
    {
        slug: "insurance-compliance",
        label: "Insurance & Compliance",
        icon: HeartHandshake,
        description: "Cargo insurance, liability & compliance consulting",
        hot: false,
    },
] as const;

interface CategoryGridProps {
    country: string;  // "us" | "ca"
    region: string;   // state/province code e.g. "fl"
    regionName?: string;
    /** Optionally pass listing counts per category slug */
    counts?: Record<string, number>;
}

export function CategoryGrid({ country, region, regionName, counts }: CategoryGridProps) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-5">
                <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: "#F1A91B" }}
                />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white/50">
                    Browse by Category{regionName ? ` — ${regionName}` : ""}
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(({ slug, label, icon: Icon, description, hot }) => {
                    const count = counts?.[slug];
                    return (
                        <Link aria-label="Navigation Link"
                            key={slug}
                            href={`/directory/${country}/${region}/${slug}`}
                            className="group relative flex flex-col gap-3 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                            style={{
                                background: hot
                                    ? "rgba(241,169,27,0.06)"
                                    : "rgba(255,255,255,0.03)",
                                border: hot
                                    ? "1px solid rgba(241,169,27,0.2)"
                                    : "1px solid rgba(255,255,255,0.07)",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.borderColor =
                                    "rgba(241,169,27,0.35)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = hot
                                    ? "rgba(241,169,27,0.2)"
                                    : "rgba(255,255,255,0.07)";
                            }}
                        >
                            {hot && (
                                <div
                                    className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                    style={{
                                        background: "rgba(241,169,27,0.15)",
                                        color: "#F1A91B",
                                    }}
                                >
                                    Popular
                                </div>
                            )}
                            <Icon
                                className="w-5 h-5 transition-colors"
                                style={{ color: hot ? "#F1A91B" : "rgba(255,255,255,0.35)" }}
                            />
                            <div>
                                <div className="text-sm font-bold text-white/80 group-hover:text-white transition-colors leading-tight">
                                    {label}
                                </div>
                                <div className="text-[11px] text-white/35 mt-0.5 leading-snug">
                                    {description}
                                </div>
                                {count != null && (
                                    <div
                                        className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: "rgba(255,255,255,0.06)",
                                            color: "rgba(255,255,255,0.4)",
                                        }}
                                    >
                                        {count} listings
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

export { CATEGORIES };
