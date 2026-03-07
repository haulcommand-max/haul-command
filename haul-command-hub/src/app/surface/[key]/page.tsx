import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 3600;

const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia",
    DE: "Germany", FR: "France", BR: "Brazil", MX: "Mexico", IN: "India",
    JP: "Japan", IT: "Italy", ES: "Spain", NL: "Netherlands", ZA: "South Africa",
    TR: "Turkey", SA: "Saudi Arabia", AE: "UAE", NO: "Norway", SE: "Sweden",
    KR: "South Korea", TH: "Thailand", PH: "Philippines", ID: "Indonesia",
};

export async function generateMetadata({ params }: { params: { key: string } }) {
    const { key } = await params;
    const supabase = supabaseServer();
    const { data } = await supabase
        .from("hc_surfaces")
        .select("name, surface_class, country_code")
        .eq("surface_key", key)
        .limit(1)
        .maybeSingle();

    const name = data?.name || key.replace(/-/g, " ");
    const country = COUNTRY_NAMES[data?.country_code || ""] || "";

    return {
        title: `${name} — ${country} | HAUL COMMAND`,
        description: `Details for ${name} in ${country}. Verified logistics location with quality scoring, lead capture, and claim options.`,
    };
}

export default async function SurfaceDetailPage({ params }: { params: { key: string } }) {
    const { key } = await params;
    const supabase = supabaseServer();

    const { data: surface } = await supabase
        .from("hc_surfaces")
        .select("*")
        .eq("surface_key", key)
        .limit(1)
        .maybeSingle();

    if (!surface) notFound();

    const countryName = COUNTRY_NAMES[surface.country_code] || surface.country_code;
    const className = (surface.surface_class || "").replace(/-/g, " ");

    // Check if claimed
    const { data: claim } = await supabase
        .from("hc_claims")
        .select("id, status, tier, business_name, business_phone, business_email, business_website, description, logo_url")
        .eq("surface_id", surface.id)
        .in("status", ["verified", "upgraded"])
        .limit(1)
        .maybeSingle();

    return (
        <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
            <nav style={{ marginBottom: "1.5rem", fontSize: "0.875rem", color: "#9ca3af" }}>
                <Link href="/directory/surfaces" style={{ color: "#60a5fa" }}>Directory</Link>
                {" / "}
                <Link href={`/directory/surfaces/${surface.country_code?.toLowerCase()}`} style={{ color: "#60a5fa" }}>
                    {countryName}
                </Link>
                {" / "}
                <span style={{ color: "#f1f5f9" }}>{surface.name}</span>
            </nav>

            {/* Hero Card */}
            <div style={{
                background: "linear-gradient(135deg, #1e293b, #0f172a)",
                border: "1px solid #334155",
                borderRadius: "16px",
                padding: "2rem",
                marginBottom: "1.5rem",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f1f5f9", margin: "0 0 0.5rem 0" }}>
                            {surface.name}
                        </h1>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.8rem", padding: "3px 10px", borderRadius: "8px", background: "#064e3b", color: "#6ee7b7" }}>
                                {className}
                            </span>
                            <span style={{ fontSize: "0.8rem", padding: "3px 10px", borderRadius: "8px", background: "#1e3a5f", color: "#93c5fd" }}>
                                📍 {countryName}
                            </span>
                            {surface.brand && (
                                <span style={{ fontSize: "0.8rem", padding: "3px 10px", borderRadius: "8px", background: "#4c1d95", color: "#c4b5fd" }}>
                                    {surface.brand}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{
                        width: "64px", height: "64px", borderRadius: "16px",
                        background: `linear-gradient(135deg, ${surface.quality_score >= 70 ? '#059669' : surface.quality_score >= 40 ? '#d97706' : '#dc2626'}, #1e293b)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.5rem", fontWeight: 800, color: "#fff",
                    }}>
                        {Math.round(surface.quality_score || 0)}
                    </div>
                </div>

                {/* Coordinates */}
                <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ background: "#0f172a", borderRadius: "10px", padding: "1rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Latitude</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f1f5f9" }}>{surface.latitude?.toFixed(5)}</div>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: "10px", padding: "1rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase" }}>Longitude</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f1f5f9" }}>{surface.longitude?.toFixed(5)}</div>
                    </div>
                </div>
            </div>

            {/* Claimed Business Info */}
            {claim ? (
                <div style={{
                    background: "linear-gradient(135deg, #064e3b, #0f172a)",
                    border: "1px solid #059669",
                    borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>✅</span>
                        <span style={{ fontWeight: 700, color: "#6ee7b7" }}>Verified Business</span>
                        <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px", background: "#059669", color: "#fff" }}>
                            {claim.tier?.toUpperCase()}
                        </span>
                    </div>
                    {claim.business_name && <h3 style={{ color: "#f1f5f9", margin: "0 0 0.5rem 0" }}>{claim.business_name}</h3>}
                    {claim.description && <p style={{ color: "#9ca3af", margin: "0 0 1rem 0" }}>{claim.description}</p>}
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {claim.business_phone && (
                            <a href={`tel:${claim.business_phone}`} style={{
                                padding: "0.5rem 1rem", borderRadius: "8px", background: "#1e40af",
                                color: "#93c5fd", textDecoration: "none", fontSize: "0.9rem",
                            }}>📞 Call</a>
                        )}
                        {claim.business_website && (
                            <a href={claim.business_website} target="_blank" rel="noopener" style={{
                                padding: "0.5rem 1rem", borderRadius: "8px", background: "#1e3a5f",
                                color: "#93c5fd", textDecoration: "none", fontSize: "0.9rem",
                            }}>🌐 Website</a>
                        )}
                    </div>
                </div>
            ) : (
                /* Claim CTA */
                <div style={{
                    background: "linear-gradient(135deg, #1e3a5f, #0f172a)",
                    border: "1px dashed #3b82f6",
                    borderRadius: "16px", padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center",
                }}>
                    <h3 style={{ color: "#f1f5f9", margin: "0 0 0.5rem 0" }}>Own this business?</h3>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: "0 0 1rem 0" }}>
                        Claim your listing to unlock verified badge, direct leads, AdGrid visibility, and corridor demand alerts.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <button style={{
                            padding: "0.6rem 1.5rem", borderRadius: "8px", border: "none",
                            background: "#3b82f6", color: "#fff", fontWeight: 700, cursor: "pointer",
                        }}>Claim Free</button>
                        <button style={{
                            padding: "0.6rem 1.5rem", borderRadius: "8px",
                            border: "1px solid #3b82f6", background: "transparent",
                            color: "#93c5fd", fontWeight: 700, cursor: "pointer",
                        }}>Verified — $19/mo</button>
                        <button style={{
                            padding: "0.6rem 1.5rem", borderRadius: "8px",
                            border: "1px solid #059669", background: "transparent",
                            color: "#6ee7b7", fontWeight: 700, cursor: "pointer",
                        }}>Pro — $49/mo</button>
                    </div>
                </div>
            )}

            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Place",
                        name: surface.name,
                        geo: {
                            "@type": "GeoCoordinates",
                            latitude: surface.latitude,
                            longitude: surface.longitude,
                        },
                        address: { "@type": "PostalAddress", addressCountry: surface.country_code },
                        ...(claim ? {
                            telephone: claim.business_phone,
                            url: claim.business_website,
                        } : {}),
                    }),
                }}
            />
        </main>
    );
}
