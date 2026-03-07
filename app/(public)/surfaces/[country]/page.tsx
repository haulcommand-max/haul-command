import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import {
    Truck, Building2, Anchor, TrainFront, Wrench, Hotel, Container,
    Globe, ChevronRight, BarChart3
} from "lucide-react";

const CATEGORIES: Record<string, { label: string; plural: string; slug: string; icon: typeof Truck; color: string }> = {
    truck_stop: { label: "Truck Stop", plural: "Truck Stops", slug: "truck-stop", icon: Truck, color: "#F1A91B" },
    industrial_park: { label: "Industrial Park", plural: "Industrial Parks", slug: "industrial-park", icon: Building2, color: "#3B82F6" },
    port_terminal: { label: "Port Terminal", plural: "Port Terminals", slug: "port-terminal", icon: Anchor, color: "#06B6D4" },
    rail_terminal: { label: "Rail Terminal", plural: "Rail Terminals", slug: "rail-terminal", icon: TrainFront, color: "#8B5CF6" },
    equipment_dealer_yard: { label: "Equipment Yard", plural: "Equipment Yards", slug: "equipment-dealer-yard", icon: Wrench, color: "#EF4444" },
    logistics_hotel: { label: "Logistics Hotel", plural: "Logistics Hotels", slug: "logistics-hotel", icon: Hotel, color: "#10B981" },
    oversize_staging_yard: { label: "Staging Yard", plural: "Staging Yards", slug: "oversize-staging-yard", icon: Container, color: "#F97316" },
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

export async function generateMetadata({ params }: { params: { country: string } }): Promise<Metadata> {
    const cc = params.country.toUpperCase();
    const name = COUNTRY_NAMES[cc] || cc;
    return {
        title: `Logistics Surfaces in ${name} — HAUL COMMAND Directory`,
        description: `Browse all logistics infrastructure in ${name}: truck stops, ports, rail terminals, equipment yards, and more. Claim your listing on HAUL COMMAND.`,
    };
}

export default async function SurfaceCountryPage({ params }: { params: { country: string } }) {
    const cc = params.country.toUpperCase();
    const countryName = COUNTRY_NAMES[cc];
    if (!countryName) notFound();

    const sb = supabaseServer();

    // Get counts per category
    const { data: all } = await sb
        .from("surfaces")
        .select("category,claim_status")
        .eq("country_code", cc);

    const catCounts: Record<string, { total: number; claimed: number }> = {};
    for (const s of all || []) {
        if (!catCounts[s.category]) catCounts[s.category] = { total: 0, claimed: 0 };
        catCounts[s.category].total++;
        if (s.claim_status !== "unclaimed") catCounts[s.category].claimed++;
    }

    const totalSurfaces = Object.values(catCounts).reduce((a, b) => a + b.total, 0);
    const totalClaimed = Object.values(catCounts).reduce((a, b) => a + b.claimed, 0);

    return (
        <div className="min-h-screen bg-[#000] text-[#C0C0C0] font-[family-name:var(--font-space-grotesk)]">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(241,169,27,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(241,169,27,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs text-[#555] font-medium">
                    <Link href="/directory" className="hover:text-[#F1A91B] transition-colors">Directory</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#888]">{countryName}</span>
                </nav>

                {/* Hero */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                        <Globe className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-8 h-8 text-[#F1A91B]" />
                            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-[-0.02em]">{countryName}</h1>
                        </div>
                        <p className="text-sm text-[#666] mb-6">
                            Browse all logistics infrastructure surfaces in {countryName}. Claim your location to boost visibility and connect with the HAUL COMMAND network.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="bg-black border border-[#222] rounded-xl px-5 py-3 text-center">
                                <div className="text-2xl font-black text-white">{totalSurfaces.toLocaleString()}</div>
                                <div className="text-[9px] text-[#555] uppercase tracking-[0.2em] font-bold">Total Surfaces</div>
                            </div>
                            <div className="bg-black border border-[#222] rounded-xl px-5 py-3 text-center">
                                <div className="text-2xl font-black text-[#F1A91B]">{(totalSurfaces - totalClaimed).toLocaleString()}</div>
                                <div className="text-[9px] text-[#555] uppercase tracking-[0.2em] font-bold">Available</div>
                            </div>
                            <div className="bg-black border border-[#222] rounded-xl px-5 py-3 text-center">
                                <div className="text-2xl font-black text-emerald-400">{Object.keys(catCounts).length}</div>
                                <div className="text-[9px] text-[#555] uppercase tracking-[0.2em] font-bold">Categories</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(CATEGORIES).map(([key, cat]) => {
                        const counts = catCounts[key] || { total: 0, claimed: 0 };
                        if (counts.total === 0) return null;
                        const Icon = cat.icon;
                        return (
                            <Link key={key} href={`/surfaces/${params.country}/${cat.slug}`} className="group block bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#F1A91B]/30 rounded-2xl p-6 transition-all hover:shadow-[0_0_30px_rgba(241,169,27,0.05)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl border flex items-center justify-center" style={{ borderColor: cat.color, backgroundColor: `${cat.color}15` }}>
                                        <Icon className="w-5 h-5" style={{ color: cat.color }} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white group-hover:text-[#F1A91B] transition-colors">{cat.plural}</h3>
                                        <p className="text-[10px] text-[#555]">{countryName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="text-lg font-black text-white">{counts.total.toLocaleString()}</div>
                                            <div className="text-[9px] text-[#555] uppercase tracking-wider font-bold">Locations</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-[#F1A91B]">{(counts.total - counts.claimed).toLocaleString()}</div>
                                            <div className="text-[9px] text-[#555] uppercase tracking-wider font-bold">Claimable</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[#333] group-hover:text-[#F1A91B] transition-colors" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
