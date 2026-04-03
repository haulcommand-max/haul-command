import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Shield, AlertTriangle, CheckCircle2, FileText, MapPin, Truck } from "lucide-react";
import { NativeAdCard } from "@/components/ads/NativeAdCardLazy";
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { SchemaOrchestrator } from '@/components/seo/SchemaOrchestrator';
import {
    getStateBySlug,
    getAllStateSlugs,
    getRequirementsIntro,
    PILOT_CAR_STATES,
    type StateData,
} from "@/lib/seo/pilot-car-taxonomy";
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 86400; // ISR — regulations change slowly, daily refresh

export async function generateMetadata({
    params,
}: {
    params: Promise<{ state: string }>;
}): Promise<Metadata> {
    const { state: stateSlug } = await params;
    const state = getStateBySlug(stateSlug);
    if (!state) return {};

    const title = `${state.name} Escort Vehicle Requirements | Oversize Load Rules ${state.abbr}`;
    const description = `Complete guide to oversize load escort requirements in ${state.name}. Max width ${state.maxWidthFt}ft, max height ${state.maxHeightFt}ft, police escort rules${state.policeWidthFt ? ` (required above ${state.policeWidthFt}ft)` : ""}, and pilot car certification requirements for ${state.abbr} DOT.`;

    return {
        title,
        description,
        alternates: { canonical: `https://www.haulcommand.com/escort-requirements/${state.slug}` },
        openGraph: {
            title,
            description,
            type: "article",
            url: `https://www.haulcommand.com/escort-requirements/${state.slug}`,
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE-SPECIFIC REQUIREMENTS — deterministic from taxonomy data
// ─────────────────────────────────────────────────────────────────────────────

interface EscortRule {
    condition: string;
    requirement: string;
    severity: "standard" | "warning" | "critical";
}

function buildEscortRules(state: StateData): EscortRule[] {
    const rules: EscortRule[] = [
        {
            condition: `Width > ${state.maxWidthFt}ft`,
            requirement: "1 escort vehicle required (rear chase)",
            severity: "standard",
        },
        {
            condition: `Width > 14ft`,
            requirement: "Lead car + rear chase car required (2 escorts minimum)",
            severity: "warning",
        },
        {
            condition: `Height > ${state.maxHeightFt}ft`,
            requirement: "Height pole escort required — pole operator must survey clearances",
            severity: "warning",
        },
    ];

    if (state.policeWidthFt) {
        rules.push({
            condition: `Width > ${state.policeWidthFt}ft`,
            requirement: `Law enforcement escort mandatory — 72h advance notice required`,
            severity: "critical",
        });
    }

    rules.push(
        {
            condition: "Night movement (typically after dusk)",
            requirement: "Illuminated OVERSIZE LOAD signs and amber rotating lights required on all escort vehicles",
            severity: "standard",
        },
        {
            condition: "Load exceeds 110,000 lbs GVW",
            requirement: "Bridge analysis required — route survey by licensed engineer",
            severity: "warning",
        },
        {
            condition: "Load spans multiple states",
            requirement: `${state.abbr} permit covers in-state movement only — separate permits required per state`,
            severity: "standard",
        }
    );

    return rules;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function RequirementsTable({ state }: { state: StateData }) {
    const rules = buildEscortRules(state);

    return (
        <div className="overflow-hidden rounded-2xl border border-white/8">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                            Condition
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">
                            {state.abbr} Requirement
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rules.map((rule, i) => (
                        <tr
                            key={i}
                            className="border-b border-white/5 last:border-0"
                            style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                        >
                            <td className="px-4 py-3 align-top">
                                <span className={`text-xs font-bold ${rule.severity === "critical" ? "text-red-400" :
                                    rule.severity === "warning" ? "text-amber-400" :
                                        "text-white/60"
                                    }`}>
                                    {rule.condition}
                                </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <div className="flex items-start gap-2">
                                    {rule.severity === "critical" ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                                    ) : rule.severity === "warning" ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className="text-[11px] text-white/55 leading-snug">
                                        {rule.requirement}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EquipmentChecklist({ state }: { state: StateData }) {
    const items = [
        { item: `"OVERSIZE LOAD" banner — front and rear`, required: true },
        { item: "Amber rotating or strobe lights", required: true },
        { item: "Two-way radio or CB (Channel 19)", required: true },
        { item: "Safety flags — yellow/red per DOT", required: true },
        { item: `Height pole (if load exceeds ${state.maxHeightFt}ft)`, required: state.maxHeightFt <= 14.5 },
        { item: "Flares or road triangles (night moves)", required: true },
        { item: "Laminated copy of permit", required: true },
        { item: "CB antenna and mounting hardware", required: false },
        { item: "Spare amber bulb/strobe", required: false },
        { item: "Vehicle weight rating for loaded escort scenarios", required: false },
    ];

    return (
        <div
            className="rounded-2xl border p-5"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
        >
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                Required Pilot Car Equipment — {state.abbr}
            </h3>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.required ? "bg-emerald-400/70" : "bg-white/20"}`} />
                        <span className={`text-[11px] ${item.required ? "text-white/60" : "text-white/30"}`}>
                            {item.item}
                            {!item.required && (
                                <span className="text-white/20 ml-1">(recommended)</span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NationwideComparison({ currentState }: { currentState: StateData }) {
    // Show 6 neighboring / common comparison states
    const compareStates = PILOT_CAR_STATES
        .filter(s => s.slug !== currentState.slug && s.demandTier !== "low")
        .slice(0, 6);

    return (
        <section>
            <h2 className="text-base font-black text-white mb-4">
                Escort Requirements by State — Quick Comparison
            </h2>
            <div className="overflow-hidden rounded-2xl border border-white/8">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">State</th>
                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">Max Width</th>
                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">Max Height</th>
                            <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">Police Trigger</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Current state highlighted */}
                        <tr className="border-b border-amber-500/15" style={{ background: "rgba(241,169,27,0.04)" }}>
                            <td className="px-4 py-3 text-sm font-bold text-amber-400">{currentState.name} ★</td>
                            <td className="px-4 py-3 text-xs text-white/60 tabular-nums">{currentState.maxWidthFt}ft</td>
                            <td className="px-4 py-3 text-xs text-white/60 tabular-nums">{currentState.maxHeightFt}ft</td>
                            <td className="px-4 py-3 text-xs text-white/60 tabular-nums">
                                {currentState.policeWidthFt ? `${currentState.policeWidthFt}ft+` : "Case-by-case"}
                            </td>
                        </tr>
                        {compareStates.map((s, i) => (
                            <tr key={s.slug} className="border-b border-white/5 last:border-0" style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                                <td className="px-4 py-3">
                                    <Link aria-label="Navigation Link"
                                        href={`/escort-requirements/${s.slug}`}
                                        className="text-xs text-white/50 hover:text-amber-300 transition-colors font-medium"
                                    >
                                        {s.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-xs text-white/40 tabular-nums">{s.maxWidthFt}ft</td>
                                <td className="px-4 py-3 text-xs text-white/40 tabular-nums">{s.maxHeightFt}ft</td>
                                <td className="px-4 py-3 text-xs text-white/40 tabular-nums">
                                    {s.policeWidthFt ? `${s.policeWidthFt}ft+` : "Case-by-case"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-[10px] text-white/25 mt-3 leading-relaxed">
                Requirements shown are for the most common load type. Always verify with the state DOT permit office before departure.{" "}
                <Link aria-label="Navigation Link" href="/escort-requirements" className="text-amber-400/60 hover:text-amber-400 transition-colors">View all states →</Link>
            </p>
        </section>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EscortRequirementsStatePage({
    params,
}: {
    params: Promise<{ state: string }>;
}) {
    const { state: stateSlug } = await params;
    const state = getStateBySlug(stateSlug);
    if (!state) notFound();

    return (
        <>
            {/* Schema Orchestrator — CompliancePage: GovernmentService + FAQPage + Breadcrumb */}
            <SchemaOrchestrator
                type="CompliancePage"
                data={{
                    jurisdiction: state.name,
                    description: getRequirementsIntro(state),
                    url: `https://www.haulcommand.com/escort-requirements/${state.slug}`,
                    faqs: [
                        { q: `What are the pilot car requirements in ${state.name}?`, a: getRequirementsIntro(state) },
                        { q: `When is a police escort required in ${state.name}?`, a: state.policeWidthFt ? `Law enforcement escort required above ${state.policeWidthFt}ft width.` : `Police escort requirements in ${state.name} are case-by-case.` },
                        { q: `What equipment does a pilot car need in ${state.name}?`, a: `Standard ${state.abbr} pilot car equipment includes OVERSIZE LOAD banner, amber rotating lights, two-way radio, safety flags, and a laminated permit copy.` },
                        { q: `Does ${state.name} require pilot car certification?`, a: `${state.name} requires all pilot car operators to complete ${state.abbr} DOT approved training. Check with the ${state.abbr} Department of Public Safety for current certification requirements.` },
                    ],
                    breadcrumbs: [
                        { name: 'Haul Command', url: 'https://www.haulcommand.com' },
                        { name: 'Escort Requirements', url: 'https://www.haulcommand.com/escort-requirements' },
                        { name: state.name, url: `https://www.haulcommand.com/escort-requirements/${state.slug}` },
                    ],
                }}
            />

            <main className="min-h-screen" style={{ background: "#050505" }}>
                {/* Breadcrumb */}
                <div className="border-b border-white/5 px-6 py-3">
                    <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-[11px] text-white/30">
                        <Link aria-label="Navigation Link" href="/" className="hover:text-white/60 transition-colors">Haul Command</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link aria-label="Navigation Link" href="/escort-requirements" className="hover:text-white/60 transition-colors">Escort Requirements</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/60">{state.name}</span>
                    </div>
                </div>

                {/* Hero */}
                <div className="px-6 py-12 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.03) 0%, transparent 60%)" }}>
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                {state.abbr} DOT Escort Regulations
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                            {state.name} Escort Vehicle<br />
                            <span style={{ color: "#F1A91B" }}>Requirements Guide</span>
                        </h1>
                        <p className="text-sm text-white/50 max-w-xl leading-relaxed">
                            {getRequirementsIntro(state)} This guide covers all {state.abbr} DOT escort requirements,
                            equipment checklists, and pilot car certification rules for oversize load transport.
                        </p>
                    </div>
                </div>

                {/* Dimension quick reference */}
                <div className="border-b border-white/5 px-6 py-5" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "No Escort Width", value: `≤${state.maxWidthFt}ft`, color: "text-emerald-400" },
                            { label: "No Escort Height", value: `≤${state.maxHeightFt}ft`, color: "text-emerald-400" },
                            { label: "Escort Required", value: `>${state.maxWidthFt}ft`, color: "text-amber-400" },
                            { label: "Police Required", value: state.policeWidthFt ? `>${state.policeWidthFt}ft` : "Case-by-case", color: "text-red-400" },
                        ].map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className={`text-2xl font-black tabular-nums ${stat.color}`}>{stat.value}</div>
                                <div className="text-[10px] text-white/35 mt-1 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main content */}
                <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
                    {/* Requirements table */}
                    <section>
                        <h2 className="text-base font-black text-white mb-4">
                            Escort Requirements — {state.name} ({state.abbr})
                        </h2>
                        <RequirementsTable state={state} />

                        {/* Claim CTA — after requirements table, at peak attention */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                            <Link href={`/find/pilot-car-operator/${state.slug}`} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', color: '#D4A844', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                                Find {state.abbr} Pilot Car Operators →
                            </Link>
                            <Link href="/claim" style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                                ✓ Claim Free Listing
                            </Link>
                            <Link href="/tools/escort-calculator" style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#D1D5DB', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                                🧮 Escort Calculator
                            </Link>
                        </div>
                    </section>

                    {/* Equipment checklist */}
                    <EquipmentChecklist state={state} />

                    {/* Native Ad */}
                    <NativeAdCard
                        surface="escort_req_state_mid"
                        placementId="escort-req-state-below-checklist"
                        variant="inline"
                    />

                    {/* Statewide FAQ */}
                    <section>
                        <h2 className="text-base font-black text-white mb-4">
                            {state.name} Escort Rules — Common Questions
                        </h2>
                        <div className="space-y-3">
                            {[
                                {
                                    q: `What are the oversize load escort requirements in ${state.name}?`,
                                    a: getRequirementsIntro(state),
                                },
                                {
                                    q: `Does ${state.name} require pilot car certification?`,
                                    a: `${state.name} requires all pilot car operators to carry a valid driver's license and complete the ${state.abbr} DOT approved safety course. Some counties require additional local certification. Check with the ${state.abbr} Department of Public Safety for current certification requirements.`,
                                },
                                {
                                    q: `What radio channel do pilot cars use in ${state.name}?`,
                                    a: `In ${state.name}, pilot car operators and truck drivers typically communicate on CB Channel 19, the standard nationwide pilot car channel. Some jurisdictions require dedicated frequencies for law enforcement coordination \u2014 check your route permit for specifics.`,
                                },
                                {
                                    q: `Can a pilot car operate at night in ${state.name}?`,
                                    a: `Night moves in ${state.name} require additional lighting on all escort vehicles. The "OVERSIZE LOAD" sign must be illuminated, and amber rotating lights are mandatory. Some load types that exceed certain dimensions may be prohibited from night movement on certain road classifications.`,
                                },
                                {
                                    q: `How do I get an oversize load permit in ${state.name}?`,
                                    a: `Oversize permits in ${state.name} are issued by the ${state.abbr} Department of Transportation. Permits can be applied for online at the ${state.abbr} DOT OneStop portal. You will need load dimensions, total weight, origin, destination, and proposed route. Processing time is typically 1\u20133 business days.`,
                                },
                            ].map((faq, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl border px-4 py-4"
                                    style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                                >
                                    <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
                                    <p className="text-[12px] text-white/50 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Cross-state comparison */}
                    <NationwideComparison currentState={state} />

                    {/* Internal link mesh */}
                    <section className="border-t border-white/5 pt-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/25 mb-3">
                            Related Pages
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {[
                                { label: `Find Pilot Cars in ${state.name}`, href: `/find/pilot-car-operator/${state.slug}` },
                                ...state.topCities.slice(0, 3).map(c => ({
                                    label: `Pilot Car ${c.name}`,
                                    href: `/find/pilot-car-operator/${state.slug}/${c.slug}`,
                                })),
                                ...state.corridors.slice(0, 2).map(c => ({
                                    label: c.replace(/-/g, " ").toUpperCase(),
                                    href: `/corridors/${c}`,
                                })),
                                { label: "All States Requirements", href: "/escort-requirements" },
                                { label: "Pilot Car Glossary", href: "/glossary/pilot-car" },
                                { label: "Escort Calculator", href: "/tools/escort-calculator" },
                            ].map((link) => (
                                <Link aria-label="Navigation Link"
                                    key={link.href}
                                    href={link.href}
                                    className="text-[11px] text-white/35 border border-white/8 rounded-lg px-3 py-2 hover:text-amber-300 hover:border-amber-500/25 transition-all text-center"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* ── AI Search Answer Block ── */}
                    <StaticAnswerBlock
                      question={`What are the pilot car requirements in ${state.name}?`}
                      answer={`${getRequirementsIntro(state)} Loads exceeding ${state.maxWidthFt}ft wide require at least one escort vehicle. ${state.policeWidthFt ? `Law enforcement escort is mandatory above ${state.policeWidthFt}ft width.` : 'Police escort requirements are handled case-by-case.'} Height clearance limit is ${state.maxHeightFt}ft.`}
                      confidence="verified_but_review_due"
                      source={`${state.abbr} DOT`}
                      ctaLabel={`Find ${state.abbr} Escort Operators`}
                      ctaUrl={`/directory?state=${state.abbr}`}
                    />

                    {/* ── Snippet Injector — featured snippet blocks ── */}
                    <SnippetInjector
                      blocks={['definition', 'faq', 'quick_table', 'steps']}
                      term="pilot car"
                      geo={state.name}
                      country="US"
                    />

                    {/* No-Dead-End Block */}
                    <NoDeadEndBlock
                        heading={`What Would You Like to Do in ${state.name}?`}
                        moves={[
                            { href: `/find/pilot-car-operator/${state.slug}`, icon: '🔍', title: `Find ${state.abbr} Operators`, desc: 'Verified, available now', primary: true, color: '#D4A844' },
                            { href: '/claim', icon: '✓', title: 'Claim Free Listing', desc: `For ${state.abbr} operators`, primary: true, color: '#22C55E' },
                            { href: `/market/${state.abbr.toLowerCase()}`, icon: '📊', title: `${state.abbr} Market Intelligence`, desc: 'Active loads & supply data' },
                            { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'Do I need an escort?' },
                            { href: '/escort-requirements', icon: '⚖️', title: 'All State Rules', desc: 'Compare across states' },
                            { href: '/glossary/oversize-load', icon: '📖', title: 'What Is an Oversize Load?', desc: 'Definitions & thresholds' },
                        ]}
                    />

                    {/* ProofStrip before ad */}
                    <ProofStrip variant="compact" />

                    {/* ── AdGrid — State Requirements Bottom ── */}
                    <AdGridSlot zone="requirements_state_bottom" />
                </div>
            </main>
        </>
    );
}
