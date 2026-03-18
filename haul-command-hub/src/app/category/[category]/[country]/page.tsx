import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

const VALID_CATEGORIES = [
    "truck-stops", "truck-parking", "hotels", "ports", "industrial",
    "freight-terminals", "port-marine", "rail-freight", "energy-infrastructure",
    "mining-quarry", "border-crossing", "cargo-airport", "shipyard-fabrication",
    "construction-zone", "refinery-chemical", "steel-manufacturing",
];

const COUNTRY_NAMES: Record<string, string> = {
    usa: "United States", canada: "Canada", uk: "United Kingdom", australia: "Australia",
    germany: "Germany", france: "France", brazil: "Brazil", mexico: "Mexico",
    india: "India", japan: "Japan", italy: "Italy", spain: "Spain",
    netherlands: "Netherlands", "south-africa": "South Africa", turkey: "Turkey",
    "saudi-arabia": "Saudi Arabia", uae: "UAE", norway: "Norway", sweden: "Sweden",
    "south-korea": "South Korea", thailand: "Thailand",
};

const COUNTRY_SLUG_TO_CODE: Record<string, string> = {
    usa: "US", canada: "CA", uk: "GB", australia: "AU", germany: "DE",
    france: "FR", brazil: "BR", mexico: "MX", india: "IN", japan: "JP",
    italy: "IT", spain: "ES", netherlands: "NL", "south-africa": "ZA",
    turkey: "TR", "saudi-arabia": "SA", uae: "AE", norway: "NO", sweden: "SE",
    "south-korea": "KR", thailand: "TH", philippines: "PH", indonesia: "ID",
    vietnam: "VN", malaysia: "MY", singapore: "SG", "new-zealand": "NZ",
    argentina: "AR", chile: "CL", colombia: "CO", peru: "PE", uruguay: "UY",
};

const CLASS_LABELS: Record<string, string> = {
    "truck-stops": "Truck Stops",
    "ports": "Ports",
    "port-marine": "Marine Ports",
    "rail-freight": "Rail Freight Yards",
    "energy-infrastructure": "Energy Infrastructure",
    "mining-quarry": "Mining & Quarries",
    "cargo-airport": "Cargo Airports",
    "industrial": "Industrial Zones",
    "hotels": "Hotels & Motels",
    "border-crossing": "Border Crossings",
    "shipyard-fabrication": "Shipyards",
    "construction-zone": "Construction Zones",
    "refinery-chemical": "Refineries",
    "steel-manufacturing": "Steel Plants",
    "freight-terminals": "Freight Terminals",
    "truck-parking": "Truck Parking",
};

export async function generateMetadata({
    params,
}: {
    params: { category: string; country: string };
}) {
    const { category, country } = await params;
    if (!VALID_CATEGORIES.includes(category)) notFound();

    const countryName = COUNTRY_NAMES[country] || country.replace(/-/g, " ");
    const categoryName = CLASS_LABELS[category] || category.replace(/-/g, " ");

    return {
        title: `${categoryName} in ${countryName} — HAUL COMMAND`,
        description: `Find ${categoryName.toLowerCase()} in ${countryName}. Browse verified logistics infrastructure with quality scores.`,
    };
}

export default async function CategoryCountryPage({
    params,
}: {
    params: { category: string; country: string };
}) {
    const { category, country } = await params;
    if (!VALID_CATEGORIES.includes(category)) notFound();

    const cc = COUNTRY_SLUG_TO_CODE[country]?.toUpperCase();
    if (!cc) notFound();

    const supabase = supabaseServer();
    const { data: surfaces } = await supabase
        .from("hc_surfaces")
        .select("surface_id, name, surface_class, latitude, longitude, quality_score, is_claimable, surface_key, brand")
        .eq("country_code", cc)
        .eq("surface_class", category)
        .not("name", "is", null)
        .order("quality_score", { ascending: false })
        .limit(200);

    if (!surfaces || surfaces.length === 0) notFound();

    const countryName = COUNTRY_NAMES[country] || country.replace(/-/g, " ");
    const categoryName = CLASS_LABELS[category] || category.replace(/-/g, " ");

    return (
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
            <nav style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "#9ca3af" }}>
                <Link href="/directory/surfaces" style={{ color: "#60a5fa" }}>Directory</Link>
                {" / "}
                <span style={{ color: "#f1f5f9" }}>{categoryName} in {countryName}</span>
            </nav>

            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>
                {categoryName} in {countryName}
            </h1>
            <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>
                {surfaces.length}+ verified locations
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                {surfaces.map((s: any) => (
                    <Link
                        key={s.surface_id}
                        href={s.surface_key ? `/browse/surface/${s.surface_key}` : "#"}
                        style={{ textDecoration: "none" }}
                    >
                        <div style={{
                            background: "linear-gradient(135deg, #1e293b, #0f172a)",
                            border: "1px solid #334155",
                            borderRadius: "12px",
                            padding: "1.25rem",
                            transition: "border-color 0.2s, transform 0.15s",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", margin: 0, lineHeight: 1.3 }}>
                                    {s.name}
                                </h3>
                                <span style={{
                                    fontSize: "0.75rem", padding: "2px 8px", borderRadius: "9999px", flexShrink: 0,
                                    background: s.quality_score >= 70 ? "#065f46" : s.quality_score >= 40 ? "#92400e" : "#7f1d1d",
                                    color: "#fff",
                                }}>{Math.round(s.quality_score)}</span>
                            </div>
                            {s.brand && <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>{s.brand}</span>}
                            <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#64748b" }}>
                                📍 {s.latitude?.toFixed(3)}, {s.longitude?.toFixed(3)}
                            </div>
                            {s.is_claimable && (
                                <span style={{
                                    display: "inline-block", marginTop: "0.5rem",
                                    fontSize: "0.7rem", padding: "3px 8px", borderRadius: "6px",
                                    background: "#1e40af", color: "#93c5fd",
                                }}>🏷️ Claimable</span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        name: `${categoryName} in ${countryName}`,
                        numberOfItems: surfaces.length,
                        itemListElement: surfaces.slice(0, 20).map((s: any, i: number) => ({
                            "@type": "ListItem", position: i + 1,
                            item: {
                                "@type": "Place", name: s.name,
                                geo: { "@type": "GeoCoordinates", latitude: s.latitude, longitude: s.longitude }
                            },
                        })),
                    }),
                }}
            />
        </main>
    );
}
