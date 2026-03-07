import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import {
    Truck, Building2, Anchor, TrainFront, Wrench, Hotel, Container,
    MapPin, ChevronRight, Search, Globe, BarChart3, ShieldCheck, AlertTriangle, Tag
} from "lucide-react";

/* ─── Category Metadata ─── */
const CATEGORIES: Record<string, { label: string; plural: string; icon: typeof Truck; color: string; desc: string }> = {
    "truck-stop": { label: "Truck Stop", plural: "Truck Stops", icon: Truck, color: "#F1A91B", desc: "Fuel stations, parking facilities, and escort staging areas" },
    "industrial-park": { label: "Industrial Park", plural: "Industrial Parks", icon: Building2, color: "#3B82F6", desc: "Warehouses, pickup points, and delivery zones" },
    "port-terminal": { label: "Port Terminal", plural: "Port Terminals", icon: Anchor, color: "#06B6D4", desc: "Seaports, cargo terminals, and oversize loading docks" },
    "rail-terminal": { label: "Rail Terminal", plural: "Rail Terminals", icon: TrainFront, color: "#8B5CF6", desc: "Intermodal facilities, rail cargo, and staging areas" },
    "equipment-dealer-yard": { label: "Equipment Yard", plural: "Equipment Yards", icon: Wrench, color: "#EF4444", desc: "Heavy equipment dealers, machinery yards, and transport-ready lots" },
    "logistics-hotel": { label: "Logistics Hotel", plural: "Logistics Hotels", icon: Hotel, color: "#10B981", desc: "Driver accommodations, overnight staging, and escort rest stops" },
    "oversize-staging-yard": { label: "Staging Yard", plural: "Staging Yards", icon: Container, color: "#F97316", desc: "Oversize load staging, heavy-haul marshalling, and permit holding areas" },
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

function slugToDbCategory(slug: string): string {
    return slug.replace(/-/g, "_");
}

/* ─── SEO Metadata ─── */
export async function generateMetadata({ params }: { params: { country: string; category: string } }): Promise<Metadata> {
    const cat = CATEGORIES[params.category];
    const cc = params.country.toUpperCase();
    const countryName = COUNTRY_NAMES[cc] || cc;

    if (!cat) return { title: "Not Found | HAUL COMMAND" };

    return {
        title: `${cat.plural} in ${countryName} — HAUL COMMAND Directory`,
        description: `Browse ${cat.plural.toLowerCase()} across ${countryName}. ${cat.desc}. Find, claim, and connect with logistics infrastructure on HAUL COMMAND.`,
        openGraph: {
            title: `${cat.plural} in ${countryName} | HAUL COMMAND`,
            description: `${cat.desc} across ${countryName}`,
        },
    };
}

/* ─── Page ─── */
export default async function SurfaceCategoryPage({
    params,
    searchParams,
}: {
    params: { country: string; category: string };
    searchParams: { page?: string };
}) {
    const cat = CATEGORIES[params.category];
    if (!cat) notFound();

    const cc = params.country.toUpperCase();
    const countryName = COUNTRY_NAMES[cc] || cc;
    const dbCategory = slugToDbCategory(params.category);
    const page = Math.max(1, parseInt(searchParams.page || "1"));
    const perPage = 48;
    const offset = (page - 1) * perPage;

    const sb = supabaseServer();

    // Fetch surfaces for this country + category
    const { data: surfaces, count } = await sb
        .from("surfaces")
        .select("surface_id,name,slug,category,status,claim_status,anchor_type,city_geo_key,corridor_geo_key,tags", { count: "exact" })
        .eq("country_code", cc)
        .eq("category", dbCategory)
        .order("name")
        .range(offset, offset + perPage - 1);

    // Stats
    const totalSurfaces = count || 0;
    const totalPages = Math.ceil(totalSurfaces / perPage);
    const claimed = surfaces?.filter(s => s.claim_status !== "unclaimed").length ?? 0;

    // Other categories in this country (for nav)
    const { data: otherCats } = await sb
        .from("surfaces")
        .select("category")
        .eq("country_code", cc)
        .neq("category", dbCategory)
        .limit(50);

    const availableCategories = [...new Set(otherCats?.map(s => s.category) || [])];

    const Icon = cat.icon;

    return (
        <div className="min-h-screen bg-[#000] text-[#C0C0C0] font-[family-name:var(--font-space-grotesk)]">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(241,169,27,0.015)_1px,transparent_1px),linear_gradient(90deg,rgba(241,169,27,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs text-[#555] font-medium">
                    <Link href="/directory" className="hover:text-[#F1A91B] transition-colors">Directory</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/surfaces/${params.country}`} className="hover:text-[#F1A91B] transition-colors">{countryName}</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#888]">{cat.plural}</span>
                </nav>

                {/* Hero */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#0a0a0a] to-black border border-[#1a1a1a] rounded-[2rem] p-8 md:p-10">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                        <Icon className="w-48 h-48 -rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: cat.color, backgroundColor: `${cat.color}20` }}>
                                <Icon className="w-5 h-5" style={{ color: cat.color }} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-[-0.02em]">{cat.plural}</h1>
                                <div className="flex items-center gap-2 text-xs text-[#888]">
                                    <Globe className="w-3 h-3" /> {countryName}
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-[#666] max-w-2xl">{cat.desc} across {countryName}.</p>

                        {/* Stats strip */}
                        <div className="flex flex-wrap gap-4 mt-6">
                            <div className="bg-black/60 border border-[#222] rounded-xl px-5 py-3 text-center">
                                <div className="text-xl font-black text-white">{totalSurfaces.toLocaleString()}</div>
                                <div className="text-[9px] text-[#555] uppercase tracking-[0.2em] font-bold">{cat.plural}</div>
                            </div>
                            <div className="bg-black/60 border border-[#222] rounded-xl px-5 py-3 text-center">
                                <div className="text-xl font-black text-emerald-400">{claimed}</div>
                                <div className="text-[9px] text-[#555] uppercase tracking-[0.2em] font-bold">Claimed</div>
                            </div>
                            <div className="bg-black/60 border border-[#222] rounded-xl px-5 py-3 text-center">
                                <div className="text-xl font-black text-[#F1A91B]">{totalSurfaces - claimed}</div>
                                <div className="text-[9px] text-[#555] uppercase tracking-[0.2em] font-bold">Available</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Switcher */}
                {availableCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {availableCategories.map(catKey => {
                            const slugKey = catKey.replace(/_/g, "-");
                            const meta = CATEGORIES[slugKey];
                            if (!meta) return null;
                            const CatIcon = meta.icon;
                            return (
                                <Link key={catKey} href={`/surfaces/${params.country}/${slugKey}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-[10px] font-bold text-[#888] uppercase tracking-wider hover:border-[#F1A91B]/30 hover:text-white transition-all">
                                    <CatIcon className="w-3 h-3" style={{ color: meta.color }} />
                                    {meta.plural}
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Surface Grid */}
                {surfaces && surfaces.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {surfaces.map((s: any) => (
                            <Link key={s.surface_id} href={`/surfaces/${s.slug}`} className="group block bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#F1A91B]/30 rounded-xl p-5 transition-all hover:shadow-[0_0_30px_rgba(241,169,27,0.05)]">
                                <div className="flex items-start gap-3 mb-3">
                                    <Icon className="w-5 h-5 flex-shrink-0" style={{ color: cat.color }} />
                                    <h3 className="text-sm font-bold text-white group-hover:text-[#F1A91B] transition-colors line-clamp-2 leading-snug">{s.name}</h3>
                                </div>

                                <div className="flex items-center gap-2 mb-3 text-[10px] text-[#555]">
                                    <MapPin className="w-3 h-3" />
                                    <span className="capitalize">{s.anchor_type}: {s.city_geo_key || s.corridor_geo_key || cc}</span>
                                </div>

                                {s.tags?.slice(0, 3).map((tag: string) => (
                                    <span key={tag} className="inline-block mr-1.5 mb-1 px-2 py-0.5 bg-white/5 rounded text-[9px] text-[#666] font-medium">{tag}</span>
                                ))}

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#111]">
                                    {s.claim_status === "unclaimed" ? (
                                        <span className="text-[9px] font-bold text-[#F1A91B] bg-[#F1A91B]/10 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Available to Claim
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Claimed
                                        </span>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#F1A91B] transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Search className="w-12 h-12 text-[#222] mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-white mb-2">No {cat.plural} Found</h2>
                        <p className="text-xs text-[#555]">No {cat.plural.toLowerCase()} have been registered in {countryName} yet.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6">
                        {page > 1 && (
                            <Link href={`/surfaces/${params.country}/${params.category}?page=${page - 1}`} className="px-4 py-2 text-xs font-bold text-[#888] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#F1A91B]/30 transition-colors">
                                ← Previous
                            </Link>
                        )}
                        <span className="text-xs text-[#555] px-4">Page {page} of {totalPages}</span>
                        {page < totalPages && (
                            <Link href={`/surfaces/${params.country}/${params.category}?page=${page + 1}`} className="px-4 py-2 text-xs font-bold text-[#888] bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#F1A91B]/30 transition-colors">
                                Next →
                            </Link>
                        )}
                    </div>
                )}

                {/* JSON-LD */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "CollectionPage",
                            name: `${cat.plural} in ${countryName}`,
                            description: `Browse ${cat.plural.toLowerCase()} across ${countryName}`,
                            numberOfItems: totalSurfaces,
                            isPartOf: { "@type": "WebSite", name: "HAUL COMMAND", url: "https://haulcommand.com" },
                        }),
                    }}
                />
            </div>
        </div>
    );
}
