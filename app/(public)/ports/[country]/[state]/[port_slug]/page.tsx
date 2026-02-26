export const dynamic = 'force-dynamic';
export const revalidate = 3600;
/**
 * GET /ports/[country]/[state]/[port_slug]
 *
 * Port gate page — TWIC-filtered escort directory + scarcity signals.
 * Generates long-tail SEO pages for every seeded port in port_infrastructure.
 *
 * URL pattern: /ports/us/tx/port-of-houston-tx
 */

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import React from "react";
import type { Metadata } from "next";
import { ShieldCheck, Anchor, Clock, MapPin, ChevronRight, AlertTriangle, Zap } from "lucide-react";
import { OperatorGradeBadge } from "@/components/directory/OperatorGradeBadge";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Port {
    id: string;
    port_slug: string;
    port_name: string;
    country_code: string;
    state_region: string | null;
    city: string | null;
    port_tier: number;
    heavy_lift_capable: boolean;
    breakbulk_capable: boolean;
    roro_capable: boolean;
    twic_required: boolean;
}

interface NearbyOperator {
    user_id: string;
    company_name: string | null;
    home_base_city: string | null;
    home_base_state: string | null;
    trust_score: number | null;
    verified: boolean | null;
    twic_verified: boolean | null;
    has_high_pole: boolean | null;
    avg_response_seconds: number | null;
    availability_status: string | null;
}

interface Terminal {
    id: string;
    terminal_slug: string;
    terminal_name: string;
    terminal_type: string | null;
    twic_required: boolean;
    heavy_lift_capable: boolean;
    typical_gate_delay_minutes: number;
    appointment_required: boolean;
}

// ── Static params (ISR for all seeded ports) ───────────────────────────────────



// generateStaticParams removed — force-dynamic handles rendering at request time

// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata(
    { params }: { params: { country: string; state: string; port_slug: string } }
): Promise<Metadata> {
    const port = await getPort(params.port_slug);
    if (!port) return { title: "Port Not Found | Haul Command" };
    return {
        title: `${port.port_name} — TWIC Escort Directory | Haul Command`,
        description: `Find TWIC-verified pilot car and escort operators near ${port.port_name}. Live availability, trust scores, and gate-ready matching.`,
        alternates: { canonical: `https://haulcommand.com/ports/${params.country}/${params.state}/${params.port_slug}` },
    };
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getPort(slug: string): Promise<Port | null> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
    const { data } = await supabase
        .from("port_infrastructure")
        .select("id, port_slug, port_name, country_code, state_region, city, port_tier, heavy_lift_capable, breakbulk_capable, roro_capable, twic_required")
        .eq("port_slug", slug)
        .single();
    return data as Port | null;
}

async function getPortBundle(port: Port) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
    const stateRegion = port.state_region?.toUpperCase() ?? "";

    const [operatorsRes, terminalsRes] = await Promise.all([
        // TWIC-verified operators in this state, ordered by trust
        supabase
            .from("escort_profiles")
            .select("user_id, company_name, home_base_city, home_base_state, trust_score, verified, twic_verified, has_high_pole, avg_response_seconds, availability_status")
            .eq("country_code", port.country_code)
            .eq("region_code", stateRegion)
            .eq("is_published", true)
            .eq("twic_verified", true)
            .order("trust_score", { ascending: false })
            .limit(30),

        // Terminals at this port
        supabase
            .from("terminal_registry")
            .select("id, terminal_slug, terminal_name, terminal_type, twic_required, heavy_lift_capable, typical_gate_delay_minutes, appointment_required")
            .eq("port_id", port.id)
            .order("terminal_name"),
    ]);

    return {
        operators: (operatorsRes.data ?? []) as NearbyOperator[],
        terminals: (terminalsRes.data ?? []) as Terminal[],
    };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function PortGatePage(
    { params }: { params: { country: string; state: string; port_slug: string } }
) {
    const port = await getPort(params.port_slug);
    if (!port) notFound();

    const { operators, terminals } = await getPortBundle(port);
    const twicCount = operators.filter(o => o.twic_verified).length;
    const availableNow = operators.filter(o =>
        ["available", "online", "active"].includes(o.availability_status ?? "")
    ).length;

    const capabilityTags = [
        port.heavy_lift_capable && "Heavy Lift",
        port.breakbulk_capable && "Breakbulk",
        port.roro_capable && "Ro-Ro",
        port.twic_required && "TWIC Required",
    ].filter(Boolean) as string[];

    // Structured data
    const schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `${port.port_name} TWIC Escort Services | Haul Command`,
        "description": `Verified TWIC pilot car escorts near ${port.port_name}. ${twicCount} TWIC-cleared operators available.`,
        "url": `https://haulcommand.com/ports/${params.country}/${params.state}/${params.port_slug}`,
        "areaServed": { "@type": "Place", "name": port.port_name },
        "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://haulcommand.com" },
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

            {/* Breadcrumb */}
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center gap-2 text-[11px] text-white/30 font-mono uppercase tracking-widest">
                    <Link href="/directory" className="hover:text-white/60 transition-colors">Directory</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/directory/${params.country}/${params.state}`} className="hover:text-white/60 transition-colors">
                        {port.state_region}
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href="/ports" className="hover:text-white/60 transition-colors">Ports</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-white/50">{port.port_name}</span>
                </div>
            </div>

            {/* Hero */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(241,169,27,0.12)", border: "1px solid rgba(241,169,27,0.25)" }}>
                            <Anchor className="w-5 h-5 text-[#F1A91B]" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                                Port Gate · {port.country_code} · Tier {port.port_tier}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                                {port.port_name}
                            </h1>
                        </div>
                    </div>

                    <p className="text-white/50 text-sm max-w-2xl">
                        Find TWIC-verified pilot car escorts ready to work at {port.port_name}
                        {port.city ? ` in ${port.city}` : ""}.
                        All operators listed have active TWIC credentials and have been verified on Haul Command.
                    </p>

                    {/* Capability tags */}
                    <div className="flex flex-wrap gap-2">
                        {capabilityTags.map(tag => (
                            <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{ background: "rgba(241,169,27,0.08)", border: "1px solid rgba(241,169,27,0.20)", color: "#F1A91B" }}>
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-6 mt-2">
                        <div>
                            <div className="text-xl font-black text-white">{twicCount}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">TWIC Escorts</div>
                        </div>
                        <div>
                            <div className="text-xl font-black text-emerald-400">{availableNow}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">Available Now</div>
                        </div>
                        <div>
                            <div className="text-xl font-black text-white">{terminals.length}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">Terminals</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main: operator list */}
                <div className="lg:col-span-2 space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4">
                        TWIC-Ready Escorts · {port.port_name}
                    </h2>

                    {operators.length === 0 ? (
                        <div className="rounded-2xl p-8 text-center"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                            <p className="text-white/50 text-sm">No TWIC-verified escorts currently listed in this region.</p>
                            <p className="text-white/30 text-xs mt-1">Check back soon or browse all {port.state_region} operators.</p>
                            <Link href={`/directory/${params.country}/${params.state}`}
                                className="inline-block mt-4 px-4 py-2 rounded-xl text-xs font-bold text-[#F1A91B]"
                                style={{ background: "rgba(241,169,27,0.10)", border: "1px solid rgba(241,169,27,0.20)" }}>
                                Browse all {port.state_region} operators →
                            </Link>
                        </div>
                    ) : (
                        operators.map(op => {
                            const statusColor = op.availability_status === "available" ? "#34d399"
                                : op.availability_status === "busy" ? "#f97316" : "#6b7280";
                            return (
                                <Link key={op.user_id}
                                    href={`/directory/${params.country}/${params.state}/${(op.home_base_city ?? "unknown").toLowerCase()}`}
                                    className="group rounded-2xl p-4 flex items-center gap-4 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                                >
                                    <OperatorGradeBadge score={op.trust_score ?? 55} size="md" showLabel />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white/80 group-hover:text-white text-sm uppercase tracking-tight truncate transition-colors">
                                                {op.company_name ?? "Verified Operator"}
                                            </h3>
                                            {op.twic_verified && (
                                                <span className="text-[9px] font-black text-emerald-400 border border-emerald-400/30 rounded px-1">TWIC</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-white/30 mt-0.5">
                                            {op.home_base_city}, {op.home_base_state}
                                            {op.avg_response_seconds && (
                                                <span className="ml-3 inline-flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {Math.ceil(op.avg_response_seconds / 60)}m resp
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                                        {op.has_high_pole && <Zap className="w-3 h-3 text-[#F1A91B]" aria-label="Height pole" />}
                                        {op.verified && <ShieldCheck className="w-3 h-3 text-emerald-400" aria-label="Verified" />}
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* Sidebar: terminals + port info */}
                <div className="space-y-4">
                    {/* Terminals */}
                    {terminals.length > 0 && (
                        <div className="rounded-2xl p-4 space-y-3"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Terminals</h3>
                            {terminals.map(t => (
                                <div key={t.id} className="pb-3 border-b border-white/[0.04] last:border-0 last:pb-0">
                                    <Link
                                        href={`/ports/${params.country}/${params.state}/${params.port_slug}/${t.terminal_slug}`}
                                        className="font-bold text-white/70 text-sm hover:text-[#F1A91B] transition-colors"
                                    >
                                        {t.terminal_name} →
                                    </Link>
                                    <div className="text-[10px] text-white/30 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                                        <span className="capitalize">{t.terminal_type ?? "multi"}</span>
                                        {t.twic_required && <span className="text-emerald-400">TWIC req.</span>}
                                        {t.appointment_required && <span className="text-orange-400">Appt. needed</span>}
                                        {t.typical_gate_delay_minutes > 0 && (
                                            <span>{t.typical_gate_delay_minutes}min gate delay</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Port facts */}
                    <div className="rounded-2xl p-4 space-y-3"
                        style={{ background: "rgba(241,169,27,0.03)", border: "1px solid rgba(241,169,27,0.10)" }}>
                        <h3 className="text-[10px] font-black text-[#F1A91B]/60 uppercase tracking-[0.2em]">Port Facts</h3>
                        <div className="space-y-2 text-xs text-white/50">
                            {port.twic_required && (
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                    TWIC card required for terminal access
                                </div>
                            )}
                            {port.heavy_lift_capable && (
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-[#F1A91B] flex-shrink-0" />
                                    Heavy lift cargo handled at this port
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-white/20 flex-shrink-0" />
                                {port.city}, {port.state_region} · {port.country_code}
                            </div>
                        </div>
                    </div>

                    {/* Back link */}
                    <Link href={`/directory/${params.country}/${params.state}`}
                        className="block text-center rounded-xl px-4 py-3 text-xs font-bold text-white/40 hover:text-white/70 transition-colors"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        View all {port.state_region} operators →
                    </Link>
                </div>
            </div>
        </div>
    );
}
