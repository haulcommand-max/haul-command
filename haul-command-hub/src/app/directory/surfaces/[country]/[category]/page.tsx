import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

const COUNTRY_NAMES: Record<string, string> = {
    us: "United States", ca: "Canada", gb: "United Kingdom", au: "Australia",
    de: "Germany", fr: "France", br: "Brazil", mx: "Mexico", in: "India",
    jp: "Japan", it: "Italy", es: "Spain", nl: "Netherlands", za: "South Africa",
    tr: "Turkey", sa: "Saudi Arabia", ae: "UAE", no: "Norway", se: "Sweden",
    kr: "South Korea", th: "Thailand", ph: "Philippines", id: "Indonesia",
    vn: "Vietnam", my: "Malaysia", sg: "Singapore", nz: "New Zealand",
    ar: "Argentina", cl: "Chile", co: "Colombia", pe: "Peru", uy: "Uruguay",
    at: "Austria", be: "Belgium", ch: "Switzerland", cz: "Czech Republic",
    dk: "Denmark", ee: "Estonia", fi: "Finland", gr: "Greece", hr: "Croatia",
    hu: "Hungary", ie: "Ireland", lt: "Lithuania", lv: "Latvia", pl: "Poland",
    pt: "Portugal", ro: "Romania", sk: "Slovakia", si: "Slovenia", bg: "Bulgaria",
    ng: "Nigeria", cr: "Costa Rica", pa: "Panama", bh: "Bahrain",
    kw: "Kuwait", om: "Oman", qa: "Qatar",
};

const CLASS_LABELS: Record<string, string> = {
    "truck-stops": "Truck Stops & Fuel",
    "truck-parking": "Truck Parking",
    "hotels": "Hotels & Motels",
    "ports": "Ports & Harbours",
    "industrial": "Industrial & Warehouse",
    "freight-terminals": "Freight Terminals",
    "port-marine": "Marine Ports & Cargo",
    "rail-freight": "Rail Freight Yards",
    "energy-infrastructure": "Energy Infrastructure",
    "mining-quarry": "Mining & Quarries",
    "border-crossing": "Border Crossings",
    "cargo-airport": "Cargo Airports",
    "shipyard-fabrication": "Shipyards & Fabrication",
    "construction-zone": "Construction Zones",
    "refinery-chemical": "Refineries & Chemical",
    "steel-manufacturing": "Steel & Heavy Manufacturing",
};

export async function generateMetadata({
    params,
}: {
    params: { country: string; category: string };
}) {
    const { country, category } = await params;
    const cc = country.toUpperCase();
    const countryName = COUNTRY_NAMES[country] || cc;
    const categoryName = CLASS_LABELS[category] || category.replace(/-/g, " ");

    return {
        title: `${categoryName} in ${countryName} — HAUL COMMAND Directory`,
        description: `Browse ${categoryName} locations in ${countryName}. Verified logistics infrastructure for oversize transport and heavy haul operations.`,
    };
}

export default async function CategoryCountryPage({
    params,
}: {
    params: { country: string; category: string };
}) {
    const { country, category } = await params;
    const cc = country.toUpperCase();
    const supabase = supabaseServer();

    const { data: surfaces, error } = await supabase
        .from("hc_surfaces")
        .select("surface_id, name, surface_type, surface_class, latitude, longitude, quality_score, is_claimable, surface_key, tags, brand")
        .eq("country_code", cc)
        .eq("surface_class", category)
        .not("name", "is", null)
        .order("quality_score", { ascending: false })
        .limit(200);

    if (error || !surfaces || surfaces.length === 0) {
        notFound();
    }

    const countryName = COUNTRY_NAMES[country] || cc;
    const categoryName = CLASS_LABELS[category] || category.replace(/-/g, " ");

    return (
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
            <nav style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "#9ca3af" }}>
                <Link href="/directory/surfaces" style={{ color: "#60a5fa" }}>Directory</Link>
                {" / "}
                <Link href={`/directory/surfaces/${country}`} style={{ color: "#60a5fa" }}>{countryName}</Link>
                {" / "}
                <span style={{ color: "#f1f5f9" }}>{categoryName}</span>
            </nav>

            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>
                {categoryName} in {countryName}
            </h1>
            <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>
                {surfaces.length} verified locations • Quality scored & claimable
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                {surfaces.map((s: any) => (
                    <div
                        key={s.id}
                        style={{
                            background: "linear-gradient(135deg, #1e293b, #0f172a)",
                            border: "1px solid #334155",
                            borderRadius: "12px",
                            padding: "1.25rem",
                            transition: "border-color 0.2s",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                                {s.name || "Unnamed Location"}
                            </h3>
                            <span style={{
                                fontSize: "0.75rem",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                background: s.quality_score >= 70 ? "#065f46" : s.quality_score >= 40 ? "#92400e" : "#7f1d1d",
                                color: "#fff",
                            }}>
                                {Math.round(s.quality_score)}
                            </span>
                        </div>

                        {s.brand && (
                            <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>{s.brand}</span>
                        )}

                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", fontSize: "0.8rem", color: "#9ca3af" }}>
                            <span>📍 {s.latitude?.toFixed(3)}, {s.longitude?.toFixed(3)}</span>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                            {s.is_claimable && (
                                <span style={{
                                    fontSize: "0.7rem", padding: "3px 8px", borderRadius: "6px",
                                    background: "#1e40af", color: "#93c5fd",
                                }}>
                                    🏷️ Claim This Listing
                                </span>
                            )}
                            <span style={{
                                fontSize: "0.7rem", padding: "3px 8px", borderRadius: "6px",
                                background: "#064e3b", color: "#6ee7b7",
                            }}>
                                {categoryName}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        name: `${categoryName} in ${countryName}`,
                        numberOfItems: surfaces.length,
                        itemListElement: surfaces.slice(0, 20).map((s: any, i: number) => ({
                            "@type": "ListItem",
                            position: i + 1,
                            item: {
                                "@type": "Place",
                                name: s.name,
                                geo: { "@type": "GeoCoordinates", latitude: s.latitude, longitude: s.longitude },
                            },
                        })),
                    }),
                }}
            />
        </main>
    );
}
