import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";

export const revalidate = 3600; // ISR: 1 hour

export const metadata = {
    title: "Global Logistics Surface Directory — HAUL COMMAND",
    description:
        "Browse 440,000+ logistics surfaces across 58 countries. Truck stops, ports, industrial zones, freight terminals, and more.",
};

type Rollup = {
    country_code: string;
    surface_class: string;
    total: number;
    claimable: number;
    avg_quality: number;
};

type CountryAgg = {
    country_code: string;
    total: number;
    claimable: number;
    classes: number;
    avg_quality: number;
};

// Country names map
const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia",
    DE: "Germany", FR: "France", BR: "Brazil", MX: "Mexico", IN: "India",
    JP: "Japan", IT: "Italy", ES: "Spain", KR: "South Korea", TH: "Thailand",
    NL: "Netherlands", CH: "Switzerland", PL: "Poland", SE: "Sweden",
    NO: "Norway", DK: "Denmark", FI: "Finland", AT: "Austria", BE: "Belgium",
    IE: "Ireland", PT: "Portugal", GR: "Greece", CZ: "Czech Republic",
    RO: "Romania", HU: "Hungary", BG: "Bulgaria", HR: "Croatia",
    SK: "Slovakia", SI: "Slovenia", LT: "Lithuania", LV: "Latvia",
    EE: "Estonia", TR: "Turkey", SA: "Saudi Arabia", AE: "UAE",
    ZA: "South Africa", NG: "Nigeria", NZ: "New Zealand", SG: "Singapore",
    MY: "Malaysia", PH: "Philippines", ID: "Indonesia", VN: "Vietnam",
    AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru",
    CR: "Costa Rica", PA: "Panama", UY: "Uruguay", QA: "Qatar",
    KW: "Kuwait", OM: "Oman", BH: "Bahrain",
};

const FLAG_EMOJI: Record<string, string> = {
    US: "🇺🇸", CA: "🇨🇦", GB: "🇬🇧", AU: "🇦🇺", DE: "🇩🇪", FR: "🇫🇷",
    BR: "🇧🇷", MX: "🇲🇽", IN: "🇮🇳", JP: "🇯🇵", IT: "🇮🇹", ES: "🇪🇸",
    KR: "🇰🇷", TH: "🇹🇭", NL: "🇳🇱", CH: "🇨🇭", PL: "🇵🇱", SE: "🇸🇪",
    NO: "🇳🇴", DK: "🇩🇰", FI: "🇫🇮", AT: "🇦🇹", BE: "🇧🇪", IE: "🇮🇪",
    PT: "🇵🇹", GR: "🇬🇷", CZ: "🇨🇿", RO: "🇷🇴", HU: "🇭🇺", BG: "🇧🇬",
    HR: "🇭🇷", SK: "🇸🇰", SI: "🇸🇮", LT: "🇱🇹", LV: "🇱🇻", EE: "🇪🇪",
    TR: "🇹🇷", SA: "🇸🇦", AE: "🇦🇪", ZA: "🇿🇦", NG: "🇳🇬", NZ: "🇳🇿",
    SG: "🇸🇬", MY: "🇲🇾", PH: "🇵🇭", ID: "🇮🇩", VN: "🇻🇳", AR: "🇦🇷",
    CL: "🇨🇱", CO: "🇨🇴", PE: "🇵🇪", CR: "🇨🇷", PA: "🇵🇦", UY: "🇺🇾",
    QA: "🇶🇦", KW: "🇰🇼", OM: "🇴🇲", BH: "🇧🇭",
};

export default async function SurfacesDirectoryPage() {
    const sb = supabaseServer();

    const { data: rollups } = await sb
        .from("hc_surface_rollups")
        .select("country_code, surface_class, total, claimable, avg_quality")
        .order("total", { ascending: false });

    // Aggregate by country
    const countryMap = new Map<string, CountryAgg>();
    for (const r of (rollups as Rollup[]) ?? []) {
        const existing = countryMap.get(r.country_code);
        if (existing) {
            existing.total += r.total;
            existing.claimable += r.claimable;
            existing.classes += 1;
            existing.avg_quality = (existing.avg_quality + r.avg_quality) / 2;
        } else {
            countryMap.set(r.country_code, {
                country_code: r.country_code,
                total: r.total,
                claimable: r.claimable,
                classes: 1,
                avg_quality: r.avg_quality,
            });
        }
    }

    const countries = Array.from(countryMap.values()).sort(
        (a, b) => b.total - a.total
    );

    const totalSurfaces = countries.reduce((s, c) => s + c.total, 0);
    const totalClaimable = countries.reduce((s, c) => s + c.claimable, 0);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg,#0F172A,#1E293B)",
                color: "#F1F5F9",
                padding: "2rem",
            }}
        >
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {/* Hero stats */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h1
                        style={{
                            fontSize: "2.5rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            marginBottom: "1rem",
                        }}
                    >
                        Global Logistics Surface Directory
                    </h1>
                    <p style={{ color: "#94A3B8", fontSize: "1.1rem", marginBottom: "2rem" }}>
                        The world&apos;s most comprehensive heavy-haul infrastructure map
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap" }}>
                        <div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#22D3EE" }}>
                                {totalSurfaces.toLocaleString()}
                            </div>
                            <div style={{ color: "#64748B", fontSize: "0.875rem" }}>Total Surfaces</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#34D399" }}>
                                {totalClaimable.toLocaleString()}
                            </div>
                            <div style={{ color: "#64748B", fontSize: "0.875rem" }}>Claimable</div>
                        </div>
                        <div>
                            <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#FBBF24" }}>
                                {countries.length}
                            </div>
                            <div style={{ color: "#64748B", fontSize: "0.875rem" }}>Countries</div>
                        </div>
                    </div>
                </div>

                {/* Country grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    {countries.map((c) => (
                        <Link
                            key={c.country_code}
                            href={`/directory/surfaces/${c.country_code.toLowerCase()}`}
                            style={{
                                display: "block",
                                padding: "1.25rem",
                                borderRadius: "0.75rem",
                                background: "rgba(30,41,59,0.8)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                textDecoration: "none",
                                color: "inherit",
                                transition: "all 0.2s",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                <span style={{ fontSize: "1.75rem" }}>
                                    {FLAG_EMOJI[c.country_code] ?? "🌐"}
                                </span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "1rem" }}>
                                        {COUNTRY_NAMES[c.country_code] ?? c.country_code}
                                    </div>
                                    <div style={{ color: "#64748B", fontSize: "0.8rem" }}>
                                        {c.classes} categories
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                <span>
                                    <span style={{ color: "#22D3EE", fontWeight: 700 }}>
                                        {c.total.toLocaleString()}
                                    </span>{" "}
                                    <span style={{ color: "#64748B" }}>surfaces</span>
                                </span>
                                <span>
                                    <span style={{ color: "#34D399", fontWeight: 700 }}>
                                        {c.claimable.toLocaleString()}
                                    </span>{" "}
                                    <span style={{ color: "#64748B" }}>claimable</span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
