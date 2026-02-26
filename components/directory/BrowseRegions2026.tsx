/**
 * BrowseRegions2026 — compact, scannable state/province grid.
 *
 * Root page rule: show ONLY state name + code. No categories. No MiniKpi.
 * No "unknown" labels ever. Hot states get a subtle amber ring.
 *
 * Click → /directory/{country}/{code}
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Country = "US" | "CA";

type Region = { country: Country; code: string; name: string };

// ── Hot states (demand signal — subtle only, no label) ────────────────────────
const HOT_STATES = new Set(["TX", "LA", "FL", "CA", "GA", "TN", "AL", "AZ", "NC", "OK", "OR", "WA", "ON", "BC", "AB"]);

// ── Region data ───────────────────────────────────────────────────────────────
const US_REGIONS: Region[] = [
    { country: "US", code: "AL", name: "Alabama" }, { country: "US", code: "AK", name: "Alaska" },
    { country: "US", code: "AZ", name: "Arizona" }, { country: "US", code: "AR", name: "Arkansas" },
    { country: "US", code: "CA", name: "California" }, { country: "US", code: "CO", name: "Colorado" },
    { country: "US", code: "CT", name: "Connecticut" }, { country: "US", code: "DE", name: "Delaware" },
    { country: "US", code: "FL", name: "Florida" }, { country: "US", code: "GA", name: "Georgia" },
    { country: "US", code: "HI", name: "Hawaii" }, { country: "US", code: "ID", name: "Idaho" },
    { country: "US", code: "IL", name: "Illinois" }, { country: "US", code: "IN", name: "Indiana" },
    { country: "US", code: "IA", name: "Iowa" }, { country: "US", code: "KS", name: "Kansas" },
    { country: "US", code: "KY", name: "Kentucky" }, { country: "US", code: "LA", name: "Louisiana" },
    { country: "US", code: "ME", name: "Maine" }, { country: "US", code: "MD", name: "Maryland" },
    { country: "US", code: "MA", name: "Massachusetts" }, { country: "US", code: "MI", name: "Michigan" },
    { country: "US", code: "MN", name: "Minnesota" }, { country: "US", code: "MS", name: "Mississippi" },
    { country: "US", code: "MO", name: "Missouri" }, { country: "US", code: "MT", name: "Montana" },
    { country: "US", code: "NE", name: "Nebraska" }, { country: "US", code: "NV", name: "Nevada" },
    { country: "US", code: "NH", name: "New Hampshire" }, { country: "US", code: "NJ", name: "New Jersey" },
    { country: "US", code: "NM", name: "New Mexico" }, { country: "US", code: "NY", name: "New York" },
    { country: "US", code: "NC", name: "North Carolina" }, { country: "US", code: "ND", name: "North Dakota" },
    { country: "US", code: "OH", name: "Ohio" }, { country: "US", code: "OK", name: "Oklahoma" },
    { country: "US", code: "OR", name: "Oregon" }, { country: "US", code: "PA", name: "Pennsylvania" },
    { country: "US", code: "RI", name: "Rhode Island" }, { country: "US", code: "SC", name: "South Carolina" },
    { country: "US", code: "SD", name: "South Dakota" }, { country: "US", code: "TN", name: "Tennessee" },
    { country: "US", code: "TX", name: "Texas" }, { country: "US", code: "UT", name: "Utah" },
    { country: "US", code: "VT", name: "Vermont" }, { country: "US", code: "VA", name: "Virginia" },
    { country: "US", code: "WA", name: "Washington" }, { country: "US", code: "WV", name: "West Virginia" },
    { country: "US", code: "WI", name: "Wisconsin" }, { country: "US", code: "WY", name: "Wyoming" },
];

const CA_REGIONS: Region[] = [
    { country: "CA", code: "AB", name: "Alberta" },
    { country: "CA", code: "BC", name: "British Columbia" },
    { country: "CA", code: "MB", name: "Manitoba" },
    { country: "CA", code: "NB", name: "New Brunswick" },
    { country: "CA", code: "NL", name: "Newfoundland and Labrador" },
    { country: "CA", code: "NS", name: "Nova Scotia" },
    { country: "CA", code: "NT", name: "Northwest Territories" },
    { country: "CA", code: "NU", name: "Nunavut" },
    { country: "CA", code: "ON", name: "Ontario" },
    { country: "CA", code: "PE", name: "Prince Edward Island" },
    { country: "CA", code: "QC", name: "Quebec" },
    { country: "CA", code: "SK", name: "Saskatchewan" },
    { country: "CA", code: "YT", name: "Yukon" },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
    initialCountry?: Country;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BrowseRegions2026({ initialCountry = "US" }: Props) {
    const [country, setCountry] = React.useState<Country>(initialCountry);
    const [q, setQ] = React.useState("");

    const all = React.useMemo(
        () => (country === "US" ? US_REGIONS : CA_REGIONS),
        [country]
    );

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return all;
        return all.filter(r => `${r.name} ${r.code}`.toLowerCase().includes(query));
    }, [all, q]);

    return (
        <section id="browse-state" aria-label="Browse by state or province">

            {/* ── Controls row ───────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                {/* Country toggle */}
                <div
                    className="inline-flex rounded-xl p-1 gap-1 flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                    role="radiogroup"
                    aria-label="Select country"
                >
                    {(["US", "CA"] as Country[]).map(c => (
                        <button
                            key={c}
                            role="radio"
                            aria-checked={country === c}
                            onClick={() => { setCountry(c); setQ(""); }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150"
                            style={country === c
                                ? { background: "#F1A91B", color: "#000" }
                                : { background: "transparent", color: "rgba(255,255,255,0.38)" }
                            }
                        >
                            <span>{c === "US" ? "🇺🇸" : "🇨🇦"}</span>
                            {c === "US" ? "United States" : "Canada"}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                        style={{ color: "rgba(255,255,255,0.25)" }} />
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder={country === "US" ? "Filter states…" : "Filter provinces…"}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#fff",
                        }}
                    />
                    {q && (
                        <button
                            onClick={() => setQ("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Live map shortcut */}
                <Link href="/map"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80 ml-auto"
                    style={{ background: "rgba(241,169,27,0.08)", border: "1px solid rgba(241,169,27,0.18)", color: "#F1A91B" }}>
                    Map View →
                </Link>
            </div>

            {/* ── Region grid ────────────────────────────────────────────── */}
            <div
                className="grid gap-2.5"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
            >
                {filtered.map(r => {
                    const hot = HOT_STATES.has(r.code);
                    const href = `/directory/${r.country.toLowerCase()}/${r.code.toLowerCase()}`;
                    return (
                        <Link
                            key={`${r.country}:${r.code}`}
                            href={href}
                            className="group grid place-items-center text-center rounded-xl px-4 py-4 transition-all duration-150 focus-visible:outline-none"
                            style={{
                                background: hot ? "rgba(241,169,27,0.06)" : "rgba(255,255,255,0.03)",
                                border: hot
                                    ? "1px solid rgba(241,169,27,0.22)"
                                    : "1px solid rgba(255,255,255,0.07)",
                                minHeight: "56px",
                                /* Premium hover handled via CSS group-hover in globals */
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget;
                                el.style.transform = "translateY(-2px)";
                                el.style.boxShadow = hot
                                    ? "0 4px 16px rgba(241,169,27,0.18), 0 0 0 1px rgba(241,169,27,0.3)"
                                    : "0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.10)";
                                el.style.borderColor = hot
                                    ? "rgba(241,169,27,0.45)"
                                    : "rgba(255,255,255,0.14)";
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget;
                                el.style.transform = "";
                                el.style.boxShadow = "";
                                el.style.borderColor = hot
                                    ? "rgba(241,169,27,0.22)"
                                    : "rgba(255,255,255,0.07)";
                            }}
                            title={`Browse ${r.name} pilot car directory`}
                        >
                            <span
                                className="text-sm font-semibold leading-tight group-hover:text-white transition-colors"
                                style={{ color: hot ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)" }}
                            >
                                {r.name}
                            </span>
                            <span
                                className="text-[9px] font-black uppercase tracking-widest transition-colors mt-0.5"
                                style={{ color: hot ? "rgba(241,169,27,0.75)" : "rgba(255,255,255,0.28)" }}
                            >
                                {r.code}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <span className="text-2xl">🔍</span>
                    <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
                        No results for &ldquo;{q}&rdquo;
                    </p>
                    <button onClick={() => setQ("")}
                        className="text-xs font-black uppercase tracking-widest mt-1 transition-opacity hover:opacity-70"
                        style={{ color: "#F1A91B" }}>
                        Clear filter
                    </button>
                </div>
            )}

            {/* ── Footer ──────────────────────────────────────────────────── */}
            {filtered.length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
                        {filtered.length} {country === "US" ? "states" : "provinces/territories"}
                        {HOT_STATES.size > 0 && " · amber = high demand"}
                    </span>
                    <Link href="/claim"
                        className="text-[10px] font-black uppercase tracking-widest transition-opacity hover:opacity-70"
                        style={{ color: "rgba(241,169,27,0.5)" }}>
                        Claim your profile →
                    </Link>
                </div>
            )}
        </section>
    );
}
