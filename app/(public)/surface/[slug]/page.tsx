import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Truck, Building2, Anchor, TrainFront, Wrench, Hotel, Container, ShieldCheck, AlertTriangle, Star, Clock, BarChart3 } from "lucide-react";
import { normalizeSurface, HC_SURFACES_SELECT, type SurfaceViewModel } from "@/lib/resolvers/normalizeSurface";

/* ─── Helpers ─── */
const CATEGORY_META: Record<string, { label: string; icon: typeof Truck; color: string; gradient: string }> = {
    truck_stop: { label: "Truck Stop", icon: Truck, color: "#F1A91B", gradient: "from-amber-500/20 to-amber-600/5" },
    fuel_station: { label: "Fuel Station", icon: Truck, color: "#F59E0B", gradient: "from-yellow-500/20 to-yellow-600/5" },
    industrial_park: { label: "Industrial Park", icon: Building2, color: "#3B82F6", gradient: "from-blue-500/20 to-blue-600/5" },
    port_terminal: { label: "Port Terminal", icon: Anchor, color: "#06B6D4", gradient: "from-cyan-500/20 to-cyan-600/5" },
    rail_terminal: { label: "Rail Terminal", icon: TrainFront, color: "#8B5CF6", gradient: "from-violet-500/20 to-violet-600/5" },
    equipment_dealer_yard: { label: "Equipment Yard", icon: Wrench, color: "#EF4444", gradient: "from-red-500/20 to-red-600/5" },
    logistics_hotel: { label: "Logistics Hotel", icon: Hotel, color: "#10B981", gradient: "from-emerald-500/20 to-emerald-600/5" },
    oversize_staging_yard: { label: "Staging Yard", icon: Container, color: "#F97316", gradient: "from-orange-500/20 to-orange-600/5" },
    weigh_station: { label: "Weigh Station", icon: BarChart3, color: "#6366F1", gradient: "from-indigo-500/20 to-indigo-600/5" },
    rest_area: { label: "Rest Area", icon: Hotel, color: "#14B8A6", gradient: "from-teal-500/20 to-teal-600/5" },
    warehouse: { label: "Warehouse", icon: Building2, color: "#64748B", gradient: "from-slate-500/20 to-slate-600/5" },
    parking_lot: { label: "Parking Lot", icon: Container, color: "#78716C", gradient: "from-stone-500/20 to-stone-600/5" },
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
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const sb = supabaseServer();
    const { data } = await sb.from("hc_surfaces").select("name,surface_type,country_code,city").eq("slug", slug).single();
    if (!data) return { title: "Surface Not Found | HAUL COMMAND" };
    const cat = CATEGORY_META[data.surface_type] || CATEGORY_META.truck_stop;
    const country = COUNTRY_NAMES[data.country_code] || data.country_code;
    return {
        title: `${data.name} — ${cat.label} | HAUL COMMAND`,
        description: `Find ${cat.label.toLowerCase()} services at ${data.name} in ${country}. Claim this listing, view nearby escort operators, and connect with the HAUL COMMAND logistics network.`,
        openGraph: { title: `${data.name} | HAUL COMMAND`, description: `${cat.label} in ${country}` },
    };
}

/* ─── Page ─── */
export default async function SurfaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const sb = supabaseServer();

    // Fetch surface from hc_surfaces (canonical table, 810K+ rows)
    const { data: rawSurface } = await sb
        .from("hc_surfaces")
        .select(HC_SURFACES_SELECT)
        .eq("slug", slug)
        .single();

    if (!rawSurface) notFound();

    // Normalize to typed view model
    const surface: SurfaceViewModel = normalizeSurface(rawSurface);

    // Fetch nearby surfaces (same country + category, limit 6)
    const { data: nearby } = await sb
        .from("hc_surfaces")
        .select("surface_id,name,slug,surface_type,country_code")
        .eq("country_code", surface.country_code)
        .eq("surface_type", surface.category)
        .neq("surface_id", surface.surface_id)
        .limit(6);

    // Fetch nearby operators from hc_identities (real operators, 6,951 rows)
    const { data: operators } = await sb
        .from("hc_identities")
        .select("id,display_name,company_name,city,region_code,trust_score,verification_status,is_claimed")
        .eq("country_code", surface.country_code)
        .order("trust_score", { ascending: false })
        .limit(8);

    const cat = CATEGORY_META[surface.category] || CATEGORY_META.truck_stop;
    const Icon = cat.icon;
    const country = COUNTRY_NAMES[surface.country_code] || surface.country_code;

    // Confidence badge
    const confidenceBadge = surface.confidence_label === "high"
        ? { text: "High Confidence", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" }
        : surface.confidence_label === "medium"
            ? { text: "Medium Confidence", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" }
            : surface.confidence_label === "low"
                ? { text: "Low Confidence", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" }
                : null;

    return (
        <div className="min-h-screen bg-[#000] text-[#C0C0C0] font-[family-name:var(--font-space-grotesk)]">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(241,169,27,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(241,169,27,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs text-[#555] font-medium">
                    <Link aria-label="Navigation Link" href="/directory" className="hover:text-[#F1A91B] transition-colors">Directory</Link>
                    <span>/</span>
                    <Link aria-label="Navigation Link" href={`/surfaces/${surface.country_code.toLowerCase()}`} className="hover:text-[#F1A91B] transition-colors">{country}</Link>
                    <span>/</span>
                    <Link aria-label="Navigation Link" href={`/surfaces/${surface.country_code.toLowerCase()}/${surface.category.replace(/_/g, "-")}`} className="hover:text-[#F1A91B] transition-colors">{cat.label}s</Link>
                    <span>/</span>
                    <span className="text-[#888]">{surface.name}</span>
                </nav>

                {/* ═══ CLAIM BANNER ═══ */}
                <div className="bg-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
                    <AlertTriangle className="w-6 h-6 text-[#F1A91B] flex-shrink-0" />
                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-bold text-white">This location hasn&apos;t been claimed yet.</p>
                        <p className="text-xs text-[#888] mt-0.5">Is this your business? Claim it to manage your listing, add photos, and get matched with loads.</p>
                    </div>
                    <Link aria-label="Navigation Link" href={`/claim?surface=${surface.surface_id}`} className="bg-[#F1A91B] text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#f0b93a] transition-colors whitespace-nowrap">
                        Claim This Location →
                    </Link>
                </div>

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
                                {confidenceBadge && (
                                    <span className={`${confidenceBadge.bg} ${confidenceBadge.color} border ${confidenceBadge.border} text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-[0.15em] flex items-center gap-1`}>
                                        <ShieldCheck className="w-3 h-3" /> {confidenceBadge.text}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#888] font-medium mb-4">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" style={{ color: cat.color }} />
                                    {[surface.city, surface.region_code, country].filter(Boolean).join(", ")}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Icon className="w-4 h-4" style={{ color: cat.color }} />
                                    {cat.label}
                                </span>
                                {surface.brand && (
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-[#F1A91B]" />
                                        {surface.brand}
                                    </span>
                                )}
                            </div>

                            {/* Coordinates */}
                            {surface.has_coordinates && (
                                <div className="text-xs text-[#555] font-mono">
                                    {surface.lat!.toFixed(4)}°, {surface.lng!.toFixed(4)}°
                                </div>
                            )}
                        </div>

                        {/* Status cards */}
                        <div className="w-full lg:w-64 shrink-0 space-y-3">
                            <div className="bg-black/40 backdrop-blur border border-[#222] rounded-xl p-4 text-center">
                                <div className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-1">Data Source</div>
                                <div className="text-xs font-bold text-[#999] uppercase">{surface.osm_id ? "OpenStreetMap" : "HAUL COMMAND"}</div>
                            </div>
                            {surface.quality_score != null && (
                                <div className="bg-black/40 backdrop-blur border border-[#222] rounded-xl p-4 text-center">
                                    <div className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-1">Quality Score</div>
                                    <div className="text-lg font-black text-white">{surface.quality_score}<span className="text-[10px] text-[#555]">/10</span></div>
                                </div>
                            )}
                            {surface.address && (
                                <div className="bg-black/40 backdrop-blur border border-[#222] rounded-xl p-4 text-center">
                                    <div className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-1">Address</div>
                                    <div className="text-xs font-bold text-[#999]">{surface.address}</div>
                                </div>
                            )}
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
                                        <Link aria-label="Navigation Link" key={op.id} href={`/place/${op.id}`} className="group block bg-black border border-[#1a1a1a] hover:border-[#F1A91B]/30 rounded-xl p-4 transition-all hover:shadow-[0_0_20px_rgba(241,169,27,0.05)]">
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
                                                        {[op.city, op.region_code].filter(Boolean).join(", ") || country}
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
                                    <Link aria-label="Navigation Link" href="/start" className="inline-block mt-3 text-xs text-[#F1A91B] font-bold hover:underline">Join as an operator →</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT (1/3): Sidebar */}
                    <div className="space-y-6">

                        {/* CTA: Claim */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 text-center">
                            <AlertTriangle className="w-8 h-8 text-[#F1A91B] mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-white mb-2">Own this location?</h3>
                            <p className="text-[10px] text-[#666] mb-4 leading-relaxed">
                                Claim this listing to manage your profile, respond to leads, and boost visibility.
                            </p>
                            <Link aria-label="Navigation Link" href={`/claim?surface=${surface.surface_id}`} className="block w-full bg-[#F1A91B] text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-[#f0b93a] transition-colors">
                                Claim This Location
                            </Link>
                            <p className="text-[9px] text-[#444] mt-3">Free to claim • Verification required</p>
                        </div>

                        {/* Nearby Same-Category Surfaces */}
                        {nearby && nearby.length > 0 && (
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
                                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 pb-3 border-b border-[#1a1a1a]">
                                    More {cat.label}s
                                </h3>
                                <div className="space-y-2">
                                    {nearby.map((s: any) => (
                                        <Link aria-label="Navigation Link" key={s.surface_id} href={`/surface/${s.slug}`} className="flex items-center gap-3 py-2 px-3 bg-black/50 rounded-lg border border-[#111] hover:border-[#F1A91B]/20 transition-colors group">
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
                            ...(surface.has_coordinates ? {
                                geo: { "@type": "GeoCoordinates", latitude: surface.lat, longitude: surface.lng },
                            } : {}),
                        }),
                    }}
                />
            </div>
        </div>
    );
}
