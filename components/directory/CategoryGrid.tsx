/**
 * CategoryGrid — The 6-category navigation panel shown on state/province pages.
 * This is the FIRST PLACE users see categories (not the root directory).
 *
 * Links route to /directory/{country}/{region}/{category-slug}
 */
import React from "react";
import Link from "next/link";
import {
    Car, FileText, Wrench, BedDouble, HeartHandshake, Map
} from "lucide-react";

const CATEGORIES = [
    {
        slug: "escort-operators",
        label: "Escort Operators",
        icon: Car,
        description: "Verified pilot car & escort drivers",
        hot: true,
    },
    {
        slug: "permit-services",
        label: "Permit Services",
        icon: FileText,
        description: "Routing permits & multi-state filings",
        hot: false,
    },
    {
        slug: "pilot-car-equipment",
        label: "Pilot Car Equipment",
        icon: Wrench,
        description: "Flags, signs, height poles & gear",
        hot: false,
    },
    {
        slug: "hotels-motels",
        label: "Hotels & Motels",
        icon: BedDouble,
        description: "Oversized-load friendly overnight stops",
        hot: false,
    },
    {
        slug: "support-services",
        label: "Support Services",
        icon: HeartHandshake,
        description: "Fuel, breakdown, towing & more",
        hot: false,
    },
    {
        slug: "route-compliance",
        label: "Route & Compliance",
        icon: Map,
        description: "Route surveys, compliance, consulting",
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
                        <Link
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
