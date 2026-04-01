/**
 * RateCardGrid — renders bundle.pricing grouped by service category.
 * Uses rate data from rate_benchmarks (via getRegionBundle → pricing[]).
 * Shows ranges (low–high), currency, confidence chip, and CTA.
 * Empty state if pricing array is empty.
 */

import React from "react";
import Link from "next/link";
import type { RegionPricing } from "@/lib/data/getRegionBundle";

// ── Service category taxonomy ─────────────────────────────────────────────────

const CATEGORY_ORDER = [
    "lead_chase",
    "height_pole",
    "route_survey",
    "specialty",
    "premiums",
    "misc",
] as const;

type CategoryKey = (typeof CATEGORY_ORDER)[number];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
    lead_chase: "Lead / Chase Escort",
    height_pole: "Height Pole & Specialized",
    route_survey: "Route Surveys",
    specialty: "Police & Specialty",
    premiums: "Premiums & Add-ons",
    misc: "Other Services",
};

const SERVICE_CATEGORY_MAP: Record<string, CategoryKey> = {
    pevo_lead_chase: "lead_chase",
    lead_chase_day_rate: "lead_chase",
    pevo_short_move: "lead_chase",
    height_pole: "height_pole",
    height_pole_day_rate: "height_pole",
    bucket_truck: "height_pole",
    route_survey: "route_survey",
    police_local: "specialty",
    police_state: "specialty",
    multi_agency: "specialty",
    night_move: "premiums",
    after_hours: "premiums",
    weekend_seasonal: "premiums",
    deadhead: "premiums",
    detention: "premiums",
    standby: "premiums",
    layover: "premiums",
    cancel_after_dispatch: "premiums",
    advanced_visibility: "premiums",
    urban_coordination: "misc",
    pevo_lead_chase_short: "lead_chase",
};

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
    pevo_lead_chase: "Lead / Chase — per mile",
    lead_chase_day_rate: "Lead / Chase — day rate",
    pevo_short_move: "Short move minimum",
    height_pole: "Height pole — per mile",
    height_pole_day_rate: "Height pole — day rate",
    bucket_truck: "Bucket truck escort",
    route_survey: "Route survey",
    police_local: "Police escort (local)",
    police_state: "Police escort (state)",
    multi_agency: "Multi-agency coordination",
    night_move: "Night move supplement",
    after_hours: "After-hours premium",
    weekend_seasonal: "Weekend / seasonal premium",
    deadhead: "Deadhead — per mile",
    detention: "Detention / wait time",
    standby: "Standby",
    layover: "Layover / overnight",
    cancel_after_dispatch: "Cancel after dispatch",
    advanced_visibility: "Advanced visibility adder",
    urban_coordination: "Urban coordination",
};

function getCategory(service_type: string): CategoryKey {
    return SERVICE_CATEGORY_MAP[service_type] ?? "misc";
}

function formatRate(row: RegionPricing): string {
    const sym = row.currency_code === "CAD" ? "CA$" : "$";
    if (row.low == null && row.high == null) return "—";
    if (row.low != null && row.high != null) return `${sym}${row.low}–${sym}${row.high}`;
    return `${sym}${row.low ?? row.high}`;
}

function formatUnit(unit: string): string {
    const map: Record<string, string> = {
        mile: "/ mi", hour: "/ hr", day: "/ day",
        flat: "flat", week: "/ wk",
    };
    return map[unit] ?? `/ ${unit}`;
}

function confidenceColor(c: string) {
    if (c === "high") return { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", text: "#22c55e" };
    if (c === "low") return { bg: "rgba(251,113,133,0.1)", border: "rgba(251,113,133,0.25)", text: "#fb7185" };
    return { bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", text: "#fbbf24" };
}

// ── Single rate card ──────────────────────────────────────────────────────────

function RateCard({ row, ctaHref }: { row: RegionPricing; ctaHref: string }) {
    const cc = confidenceColor(row.confidence ?? "medium");
    const tierLabel = row.tier_min_miles != null
        ? ` (${row.tier_min_miles}–${row.tier_max_miles === 9999 ? row.tier_min_miles + "+" : row.tier_max_miles} mi)`
        : "";

    return (
        <div
            className="rounded-2xl p-5 flex flex-col gap-4 transition-all"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
            <div>
                <h4 className="text-sm font-bold text-white/80 leading-tight">
                    {SERVICE_DISPLAY_NAMES[row.service_type] ?? row.service_type.replace(/_/g, " ")}
                    {tierLabel && <span className="text-white/30 ml-1 font-normal text-xs">{tierLabel}</span>}
                </h4>
                {row.notes && (
                    <p className="text-[10px] text-white/25 mt-1 leading-relaxed">{row.notes}</p>
                )}
            </div>

            <div className="flex items-end justify-between gap-2">
                <div>
                    <div className="text-xl font-black text-white">{formatRate(row)}</div>
                    <div className="text-[11px] text-white/30 font-mono">{formatUnit(row.unit)} · {row.currency_code}</div>
                    {(row.p25_rate || row.p75_rate) && (
                        <div className="text-[10px] text-white/20 mt-0.5">
                            p25: {row.currency_code === "CAD" ? "CA$" : "$"}{row.p25_rate} → p75: {row.currency_code === "CAD" ? "CA$" : "$"}{row.p75_rate}
                        </div>
                    )}
                </div>
                <span
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: cc.bg, border: `1px solid ${cc.border}`, color: cc.text }}
                >
                    {row.confidence ?? "medium"}
                </span>
            </div>

            <Link
                href={ctaHref}
                className="w-full text-center py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-[1.02] hover:-translate-y-px"
                style={{ background: "#F1A91B", boxShadow: "0 0 16px rgba(241,169,27,0.2)" }}
            >
                Request Quote
            </Link>
        </div>
    );
}

// ── Main grid ────────────────────────────────────────────────────────────────

interface Props {
    pricing: RegionPricing[];
    regionName: string;
    country: string;
    region: string;
}

export function RateCardGrid({ pricing, regionName, country, region }: Props) {
    if (!pricing || pricing.length === 0) {
        return (
            <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
                <div className="text-white/20 text-3xl mb-3">📋</div>
                <p className="text-white/30 text-sm">
                    Rate benchmarks for {regionName} are not available yet — check back soon.
                </p>
                <Link
                    href="/quote"
                    className="inline-block mt-4 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-black"
                    style={{ background: "#F1A91B" }}
                >
                    Get a Custom Quote
                </Link>
            </div>
        );
    }

    // Group by category
    const grouped: Partial<Record<CategoryKey, RegionPricing[]>> = {};
    for (const row of pricing) {
        const cat = getCategory(row.service_type);
        (grouped[cat] ??= []).push(row);
    }

    const ctaHref = `/claim?region=${country.toLowerCase()}-${region.toLowerCase()}`;

    return (
        <div className="space-y-10">
            {CATEGORY_ORDER.map((cat) => {
                const rows = grouped[cat];
                if (!rows?.length) return null;
                return (
                    <div key={cat}>
                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.18em] mb-4">
                            {CATEGORY_LABELS[cat]}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {rows.map((row, i) => (
                                <RateCard
                                    key={`${row.service_type}-${row.region_group}-${i}`}
                                    row={row}
                                    ctaHref={ctaHref}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
