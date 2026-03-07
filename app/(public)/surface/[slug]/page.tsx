import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Truck, Building2, Anchor, TrainFront, Wrench, Hotel, Container, ShieldCheck, AlertTriangle, Star, ExternalLink, Clock, Tag } from "lucide-react";

/* ─── Helpers ─── */
const CATEGORY_META: Record<string, { label: string; icon: typeof Truck; color: string; gradient: string }> = {
    truck_stop: { label: "Truck Stop", icon: Truck, color: "#F1A91B", gradient: "from-amber-500/20 to-amber-600/5" },
    industrial_park: { label: "Industrial Park", icon: Building2, color: "#3B82F6", gradient: "from-blue-500/20 to-blue-600/5" },
    port_terminal: { label: "Port Terminal", icon: Anchor, color: "#06B6D4", gradient: "from-cyan-500/20 to-cyan-600/5" },
    rail_terminal: { label: "Rail Terminal", icon: TrainFront, color: "#8B5CF6", gradient: "from-violet-500/20 to-violet-600/5" },
    equipment_dealer_yard: { label: "Equipment Yard", icon: Wrench, color: "#EF4444", gradient: "from-red-500/20 to-red-600/5" },
    logistics_hotel: { label: "Logistics Hotel", icon: Hotel, color: "#10B981", gradient: "from-emerald-500/20 to-emerald-600/5" },
    oversize_staging_yard: { label: "Staging Yard", icon: Container, color: "#F97316", gradient: "from-orange-500/20 to-orange-600/5" },
};

const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", CA: "Canada", AU: "Australia", GB: "United Kingdom",
    DE: "Germany", FR: "France", NZ: "New Zealand", ZA: "South Africa",
    NL: "Netherlands", AE: "United Arab Emirates", BR: "Brazil", MX: "Mexico",
    SA: "Saudi Arabia", IT: "Italy", ES: "Spain", NO: "Norway", SE: "Sweden",
    JP: "Japan", KR: "South Korea", CO: "Colombia", CL: "Chile", IN: "India",
    SG: "Singapore", MY: "Malaysia", IE: "Ireland", AT: "Austria", BE: "Belgium",
    CH: "Switzerland", PL: "Poland", CZ: "Czech Republic", TR: "Turkey",
    PT: "Portugal", GR: "Greece", FI: "Finland", DK: "Denmark", HU: "Hungary",
    RO: "Romania", BG: "Bulgaria", HR: "Croatia", EE: "Estonia", LV: "Latvia",
    LT: "Lithuania", SK: "Slovakia", SI: "Slovenia", AR: "Argentina", PE: "Peru",
    PA: "Panama", CR: "Costa Rica", UY: "Uruguay", OM: "Oman", QA: "Qatar",
    KW: "Kuwait", BH: "Bahrain", NG: "Nigeria",
};

/* ─── SEO ─── */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const sb = supabaseServer();
    const { data } = await sb.from("surfaces").select("name,category,country_code,city_geo_key").eq("slug", params.slug).single();
    if (!data) return { title: "Surface Not Found | HAUL COMMAND" };
    const cat = CATEGORY_META[data.category] || CATEGORY_META.truck_stop;
    const country = COUNTRY_NAMES[data.country_code] || data.country_code;
    return {
        title: `${data.name} — ${cat.label} | HAUL COMMAND`,
        description: `Find ${cat.label.toLowerCase()} services at ${data.name} in ${country}. Claim this listing, view nearby escort operators, and connect with the HAUL COMMAND logistics network.`,
        openGraph: { title: `${data.name} | HAUL COMMAND`, description: `${cat.label} in ${country}` },
    };
}

/* ─── Page ─── */
export default async function SurfaceDetailPage({ params }: { params: { slug: string } }) {
    const sb = supabaseServer();

    // Fetch surface
    const { data: surface } = await sb
        .from("surfaces")
        .select("*")
        .eq("slug", params.slug)
        .single();

    if (!surface) notFound();

    // Fetch nearby surfaces (same country + category, limit 6)
    const { data: nearby } = await sb
        .from("surfaces")
        .select("surface_id,name,slug,category,country_code,claim_status")
        .eq("country_code", surface.country_code)
        .eq("category", surface.category)
        .neq("surface_id", surface.surface_id)
        .limit(6);

    // Fetch nearby operators (same country, limit 8)
    const { data: operators } = await sb
        .from("operators")
        .select("id,display_name,company_name,home_base_city,home_base_state,trust_score,verification_status,is_claimed")
        .eq("country_code", surface.country_code)
        .order("trust_score", { ascending: false })
        .limit(8);

    // Fetch geo links
    const { data: links } = await sb
        .from("surface_geo_links")
        .select("to_geo_key,link_type,weight")
        .eq("surface_id", surface.surface_id);

    const cat = CATEGORY_META[surface.category] || CATEGORY_META.truck_stop;
    const Icon = cat.icon;
    const country = COUNTRY_NAMES[surface.country_code] || surface.country_code;
    const isUnclaimed = surface.claim_status === "unclaimed";

    return (
        <div className="min-h-screen bg-[#000] text-[#C0C0C0] font-[family-name:var(--font-space-grotesk)]">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(241,169,27,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(241,169,27,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs text-[#555] font-medium">
                    <Link href="/directory" className="hover:text-[#F1A91B] transition-colors">Directory</Link>
                    <span>/</span>
                    <Link href={`/surfaces/${surface.country_code.toLowerCase()}`} className="hover:text-[#F1A91B] transition-colors">{country}</Link>
                    <span>/</span>
                    <Link href={`/surfaces/${surface.country_code.toLowerCase()}/${surface.category.replace(/_/g, "-")}`} className="hover:text-[#F1A91B] transition-colors">{cat.label}s</Link>
                    <span>/</span>
                    <span className="text-[#888]">{surface.name}</span>
                </nav>

                {/* ═══ CLAIM BANNER (unclaimed) ═══ */}
                {isUnclaimed && (
                    <div className="bg-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
                        <AlertTriangle className="w-6 h-6 text-[#F1A91B] flex-shrink-0" />
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-sm font-bold text-white">This location hasn&apos;t been claimed yet.</p>
                            <p className="text-xs text-[#888] mt-0.5">Is this your business? Claim it to manage your listing, add photos, and get matched with loads.</p>
                        </div>
                        <Link href={`/claim?surface=${surface.surface_id}`} className="bg-[#F1A91B] text-black font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#f0b93a] transition-colors whitespace-nowrap">
                            Claim This Location →
                        </Link>
                    </div>
                )}

                {/* ═══ HERO CARD ═══ */}
                <div className={`bg-gradient-to-br ${cat.gradient} border border-[#1a1a1a] rounded-[2rem] p-8 md:p-10 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.04] pointer-events-none">
                        <Icon className="w-64 h-64 -rotate-12" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
                        {/* Icon badge */}
                        <div className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 shadow-lg" style={{ borderColor: cat.color, backgroundColor: `${cat.color}20` }}>
                            <Icon className="w-8 h-8" style={{ color: cat.color }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-[-0.03em] leading-none">
                                    {surface.name}
                                </h1>
                                {isUnclaimed ? (
                                    <span className="bg-white/5 text-[#888] text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-[0.15em]">Unclaimed</span>
                                ) : (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-[0.15em] flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#888] font-medium mb-4">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" style={{ color: cat.color }} />
                                    {country}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                    {cat.label}
                                </span>
                                {surface.anchor_type === "corridor" && surface.corridor_geo_key && (
                                    <span className="flex items-center gap-1.5">
                                        <ExternalLink className="w-3.5 h-3.5 text-[#F1A91B]" />
                                        Corridor: {surface.corridor_geo_key}
                                    </span>
                                )}
                            </div>

                            {/* Tags */}
                            {surface.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {surface.tags.map((tag: string) => (
                                        <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-[#999] uppercase tracking-wider">
                                            <Tag className="w-3 h-3" /> {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Coordinates */}
                            {surface.lat && surface.lng && (
                                <div className="text-xs text-[#555] font-mono">
                                    {surface.lat.toFixed(4)}°, {surface.lng.toFixed(4)}°
                                </div>
                            )}
                        </div>

                        {/* Status card */}
                        <div className="w-full lg:w-64 shrink-0 space-y-3">
                            <div className="bg-black/40 backdrop-blur border border-[#222] rounded-xl p-4 text-center">
                                <div className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-1">Status</div>
                                <div className="text-lg font-black text-white capitalize">{surface.status}</div>
                            </div>
                            <div className="bg-black/40 backdrop-blur border border-[#222] rounded-xl p-4 text-center">
                                <div className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-1">Source</div>
                                <div className="text-xs font-bold text-[#999] uppercase">{surface.source}</div>
                            </div>
                            <div className="bg-black/40 backdrop-blur border border-[#222] rounded-xl p-4 text-center">
                                <div className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-1">Anchor</div>
                                <div className="text-xs font-bold text-[#999] capitalize">{surface.anchor_type}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ MAIN GRID ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT (2/3): Nearby operators */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Nearby Operators */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1a1a1a]">
                                <Truck className="w-4 h-4 text-[#F1A91B]" />
                                <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Nearby Escort Operators</h2>
                                <span className="ml-auto text-[10px] text-[#555] font-bold">{operators?.length ?? 0} found</span>
                            </div>

                            {operators && operators.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {operators.map((op: any) => (
                                        <Link key={op.id} href={`/place/${op.id}`} className="group block bg-black border border-[#1a1a1a] hover:border-[#F1A91B]/30 rounded-xl p-4 transition-all hover:shadow-[0_0_20px_rgba(241,169,27,0.05)]">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-[#111] border border-[#222] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Truck className="w-4 h-4 text-[#F1A91B]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-white truncate group-hover:text-[#F1A91B] transition-colors">
                                                        {op.company_name || op.display_name || "Operator"}
                                                    </div>
                                                    <div className="text-[10px] text-[#666] mt-0.5 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {[op.home_base_city, op.home_base_state].filter(Boolean).join(", ") || country}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {op.verification_status === "verified" && (
                                                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-wider">Verified</span>
                                                        )}
                                                        {op.trust_score > 0 && (
                                                            <span className="text-[9px] font-bold text-[#F1A91B] flex items-center gap-0.5">
                                                                <Star className="w-3 h-3" /> {op.trust_score}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Truck className="w-10 h-10 text-[#222] mx-auto mb-3" />
                                    <p className="text-xs text-[#555]">No operators found in this area yet.</p>
                                    <Link href="/start" className="inline-block mt-3 text-xs text-[#F1A91B] font-bold hover:underline">Join as an operator →</Link>
                                </div>
                            )}
                        </div>

                        {/* Connected Geo Entities */}
                        {links && links.length > 0 && (
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1a1a1a]">
                                    <ExternalLink className="w-4 h-4 text-[#F1A91B]" />
                                    <h2 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Connected Graph</h2>
                                </div>
                                <div className="space-y-2">
                                    {links.map((link: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between py-2 px-3 bg-black/50 rounded-lg border border-[#111]">
                                            <span className="text-xs text-[#888] font-medium">{link.to_geo_key}</span>
                                            <span className="text-[10px] text-[#555] font-bold uppercase tracking-wider">{link.link_type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT (1/3): Sidebar */}
                    <div className="space-y-6">

                        {/* CTA: Claim or Contact */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 text-center">
                            {isUnclaimed ? (
                                <>
                                    <AlertTriangle className="w-8 h-8 text-[#F1A91B] mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-white mb-2">Own this location?</h3>
                                    <p className="text-[10px] text-[#666] mb-4 leading-relaxed">
                                        Claim this listing to manage your profile, respond to leads, and boost visibility.
                                    </p>
                                    <Link href={`/claim?surface=${surface.surface_id}`} className="block w-full bg-[#F1A91B] text-black font-bold text-xs px-5 py-3 rounded-xl hover:bg-[#f0b93a] transition-colors">
                                        Claim This Location
                                    </Link>
                                    <p className="text-[9px] text-[#444] mt-3">Free to claim • Verification required</p>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                                    <h3 className="text-sm font-bold text-white mb-2">Verified Location</h3>
                                    <p className="text-[10px] text-[#666] mb-4">This location has been claimed and verified.</p>
                                    <button className="w-full bg-[#F1A91B] text-black font-bold text-xs px-5 py-3 rounded-xl hover:bg-[#f0b93a] transition-colors">
                                        Contact Business
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Nearby Same-Category Surfaces */}
                        {nearby && nearby.length > 0 && (
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 pb-3 border-b border-[#1a1a1a]">
                                    More {cat.label}s
                                </h3>
                                <div className="space-y-2">
                                    {nearby.map((s: any) => (
                                        <Link key={s.surface_id} href={`/surfaces/${s.slug}`} className="flex items-center gap-3 py-2 px-3 bg-black/50 rounded-lg border border-[#111] hover:border-[#F1A91B]/20 transition-colors group">
                                            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cat.color }} />
                                            <span className="text-xs text-[#888] font-medium truncate group-hover:text-white transition-colors">{s.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#444] font-medium">
                                <Clock className="w-3 h-3" />
                                Updated {new Date(surface.updated_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ JSON-LD ═══ */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Place",
                            name: surface.name,
                            description: `${cat.label} — ${country}`,
                            address: { "@type": "PostalAddress", addressCountry: surface.country_code },
                            ...(surface.lat && surface.lng ? {
                                geo: { "@type": "GeoCoordinates", latitude: surface.lat, longitude: surface.lng },
                            } : {}),
                        }),
                    }}
                />
            </div>
        </div>
    );
}
