import { collectionPageJsonLd, placeJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { getClaimCTACopy, getClaimVariant, CLAIM_TIERS } from "@/lib/claims/cta";
import { shouldRenderAd, trafficBandLabel, trafficBandColor } from "@/lib/adgrid/inventory";
import Link from "next/link";

function formatClassName(sc: string) {
    return sc.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", CA: "Canada", AU: "Australia", GB: "United Kingdom", NZ: "New Zealand", ZA: "South Africa",
    DE: "Germany", NL: "Netherlands", AE: "UAE", BR: "Brazil", IE: "Ireland", SE: "Sweden", NO: "Norway", DK: "Denmark",
    FI: "Finland", BE: "Belgium", AT: "Austria", CH: "Switzerland", ES: "Spain", FR: "France", IT: "Italy", PT: "Portugal",
    SA: "Saudi Arabia", QA: "Qatar", MX: "Mexico", IN: "India", ID: "Indonesia", TH: "Thailand", PL: "Poland", CZ: "Czechia",
    SK: "Slovakia", HU: "Hungary", SI: "Slovenia", EE: "Estonia", LV: "Latvia", LT: "Lithuania", HR: "Croatia", RO: "Romania",
    BG: "Bulgaria", GR: "Greece", TR: "Turkey", KW: "Kuwait", OM: "Oman", BH: "Bahrain", SG: "Singapore", MY: "Malaysia",
    JP: "Japan", KR: "South Korea", CL: "Chile", AR: "Argentina", CO: "Colombia", PE: "Peru", VN: "Vietnam", PH: "Philippines",
    UY: "Uruguay", PA: "Panama", CR: "Costa Rica", NG: "Nigeria",
};

type Props = {
    pageKey: any;
    surfaces?: any[];
    surface?: any;
    topCities?: any[];
    relatedLinks?: any[];
    inventory?: any;
};

export function PageShell({ pageKey, surfaces, surface, topCities, relatedLinks, inventory }: Props) {
    const pt = pageKey.page_type;
    const cn = formatClassName(pageKey.surface_class ?? "");
    const countryName = COUNTRY_NAMES[pageKey.country_code] ?? pageKey.country_code ?? "";
    const cityName = pageKey.city_slug?.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") ?? "";
    const claimCopy = getClaimCTACopy(getClaimVariant(pt));

    // Build breadcrumbs
    const crumbs: { label: string; href?: string }[] = [];
    if (pageKey.country_code) {
        crumbs.push({ label: countryName, href: `/directory/surfaces/${pageKey.country_slug ?? pageKey.country_code.toLowerCase()}` });
    }
    if (pt === "city_class") {
        crumbs.push({ label: cn, href: `/${pageKey.country_slug}/${pageKey.surface_class}` });
        crumbs.push({ label: cityName });
    } else if (pt === "corridor_class") {
        crumbs.push({ label: "Corridors", href: "/directory/corridors" });
        crumbs.push({ label: pageKey.corridor_slug?.replace(/-/g, " ") ?? "" });
    } else if (pt === "nearby_cluster") {
        crumbs.push({ label: formatClassName(pageKey.anchor_type ?? "") });
        crumbs.push({ label: pageKey.anchor_slug?.replace(/-/g, " ") ?? "" });
    } else if (pt === "surface_profile") {
        if (pageKey.surface_class) crumbs.push({ label: cn, href: `/${pageKey.country_slug}/${pageKey.surface_class}` });
        crumbs.push({ label: surface?.name ?? "Profile" });
    } else {
        crumbs.push({ label: cn });
    }

    // JSON-LD
    const jsonLd = pt === "surface_profile" ? placeJsonLd(surface, pageKey) : collectionPageJsonLd(pageKey);

    // FAQ items
    const faqItems = pt !== "surface_profile" ? [
        { question: `How many ${cn.toLowerCase()} are listed?`, answer: `HAUL COMMAND tracks ${pageKey.entity_count?.toLocaleString?.()} ${cn.toLowerCase()} across this region, each quality scored and claimable.` },
        { question: "Can I claim a listing?", answer: "Yes. Click any listing and claim in under 30 seconds. Verified operators get priority placement, lead routing, and corridor visibility." },
    ] : [];

    return (
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem", minHeight: "100vh" }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            {faqItems.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }} />}
            {!pageKey.indexable && <meta name="robots" content="noindex,follow" />}

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" style={{ fontSize: "0.8rem", color: "#666", marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link href="/directory" style={{ color: "#8090ff", textDecoration: "none" }}>Directory</Link>
                {crumbs.map((c, i) => (
                    <span key={i}>
                        <span style={{ margin: "0 4px", color: "#444" }}>/</span>
                        {c.href ? <Link href={c.href} style={{ color: "#8090ff", textDecoration: "none" }}>{c.label}</Link> : <span style={{ color: "#9ca3af" }}>{c.label}</span>}
                    </span>
                ))}
            </nav>

            {/* Header */}
            <header style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.4rem)", fontWeight: 800, color: "#e8eaf0", lineHeight: 1.2, marginBottom: "0.5rem" }}>
                    {pageKey.h1}
                </h1>
                {pt !== "surface_profile" && (
                    <p style={{ color: "#8892a8", fontSize: "1.05rem" }}>
                        {pageKey.entity_count?.toLocaleString?.()} verified locations. Quality scored and claimable.
                    </p>
                )}
            </header>

            {/* AdGrid Slot */}
            {shouldRenderAd(inventory) && (
                <div style={{
                    background: "linear-gradient(135deg, rgba(255,180,0,0.04), rgba(0,200,150,0.03))",
                    border: `1px solid ${trafficBandColor(inventory.traffic_band)}22`,
                    borderRadius: "10px", padding: "0.75rem 1.25rem", marginBottom: "1.5rem",
                    display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem",
                }}>
                    <span style={{ color: "#9ca3af" }}>📢 Sponsored placement available</span>
                    <span style={{ color: trafficBandColor(inventory.traffic_band), fontWeight: 600 }}>
                        {trafficBandLabel(inventory.traffic_band)} · from ${inventory.floor_price_usd}
                    </span>
                </div>
            )}

            {/* Top Cities (country_class only) */}
            {topCities && topCities.length > 0 && (
                <section style={{ marginBottom: "2rem" }}>
                    <h2 style={{ color: "#c8cdd8", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Top Cities</h2>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {topCities.slice(0, 15).map((c: any) => (
                            <Link key={c.city} href={`/${pageKey.country_slug}/${c.city?.toLowerCase().replace(/\s+/g, "-")}/${pageKey.surface_class}`}
                                style={{ background: "rgba(100,120,255,0.08)", border: "1px solid rgba(100,120,255,0.12)", borderRadius: "8px", padding: "6px 14px", color: "#8090ff", fontSize: "0.85rem", textDecoration: "none" }}>
                                {c.city} ({c.total})
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Surface Profile */}
            {pt === "surface_profile" && surface && (
                <section style={{ background: "linear-gradient(135deg, rgba(20,25,35,0.95), rgba(15,18,28,0.98))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "2rem", marginBottom: "2rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
                        {surface.surface_class && <div><span style={{ color: "#666" }}>Class</span><br /><span style={{ color: "#e8eaf0" }}>{formatClassName(surface.surface_class)}</span></div>}
                        {surface.city && <div><span style={{ color: "#666" }}>City</span><br /><span style={{ color: "#e8eaf0" }}>{surface.city}</span></div>}
                        {surface.state && <div><span style={{ color: "#666" }}>State</span><br /><span style={{ color: "#e8eaf0" }}>{surface.state}</span></div>}
                        {surface.country_code && <div><span style={{ color: "#666" }}>Country</span><br /><span style={{ color: "#e8eaf0" }}>{COUNTRY_NAMES[surface.country_code] ?? surface.country_code}</span></div>}
                        {surface.quality_score != null && <div><span style={{ color: "#666" }}>Quality Score</span><br /><span style={{ color: surface.quality_score >= 70 ? "#00c896" : "#ffb400", fontWeight: 700 }}>{surface.quality_score}</span></div>}
                        {surface.brand && <div><span style={{ color: "#666" }}>Brand</span><br /><span style={{ color: "#e8eaf0" }}>{surface.brand}</span></div>}
                        {surface.address && <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "#666" }}>Address</span><br /><span style={{ color: "#e8eaf0" }}>{surface.address}</span></div>}
                    </div>
                    {surface.is_claimable && <div style={{ marginTop: "1.5rem", padding: "10px 16px", background: "rgba(0,200,150,0.08)", borderRadius: "8px", color: "#00c896", fontSize: "0.85rem", fontWeight: 600 }}>● This listing is claimable</div>}
                </section>
            )}

            {/* Surface Grid (hub pages) */}
            {surfaces && surfaces.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                    {surfaces.map((s: any) => (
                        <Link key={s.surface_key} href={`/surface/${s.surface_key}`}
                            style={{ display: "block", background: "linear-gradient(135deg, rgba(20,25,35,0.95), rgba(15,18,28,0.98))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1.25rem", textDecoration: "none", transition: "all 0.25s", position: "relative" }}>
                            <div style={{ position: "absolute", top: 12, right: 12, background: s.quality_score >= 70 ? "rgba(0,200,150,0.15)" : "rgba(255,180,0,0.15)", color: s.quality_score >= 70 ? "#00c896" : "#ffb400", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>Q{s.quality_score}</div>
                            <h3 style={{ color: "#e8eaf0", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", paddingRight: "3rem", lineHeight: 1.3 }}>{s.name || "Unnamed"}</h3>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                {s.is_claimable && <span style={{ background: "rgba(0,200,150,0.1)", color: "#00c896", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600 }}>● Claimable</span>}
                            </div>
                            <p style={{ color: "#8892a8", fontSize: "0.8rem", margin: 0 }}>{[s.city, s.state, s.country_code].filter(Boolean).join(", ")}</p>
                        </Link>
                    ))}
                </div>
            )}

            {/* Claim CTA */}
            <div style={{ background: "linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,100,200,0.06))", border: "1px solid rgba(0,200,150,0.15)", borderRadius: "16px", padding: "2rem", margin: "2rem 0", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#e8eaf0", marginBottom: "0.5rem" }}>🏢 {claimCopy.headline}</div>
                <p style={{ color: "#9ca3af", fontSize: "0.95rem", marginBottom: "1rem", maxWidth: "500px", marginInline: "auto" }}>{claimCopy.body}</p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                    {CLAIM_TIERS.map(t => (
                        <span key={t.tier} style={{ background: `${t.color}18`, color: t.color, padding: "6px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>{t.badge} {t.price} {t.label}</span>
                    ))}
                </div>
            </div>

            {/* Related Links */}
            {relatedLinks && relatedLinks.length > 0 && (
                <section style={{ margin: "2rem 0" }}>
                    <h2 style={{ color: "#e8eaf0", fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>Related Pages</h2>
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {relatedLinks.map((l: any, i: number) => (
                            <Link key={i} href={l.target?.canonical_slug ?? "#"}
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 16px", color: "#9ca3af", fontSize: "0.85rem", textDecoration: "none", transition: "all 0.2s" }}>
                                {l.anchor_text}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* FAQ */}
            {faqItems.length > 0 && (
                <section style={{ margin: "3rem 0" }}>
                    <h2 style={{ color: "#c8cdd8", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Frequently Asked Questions</h2>
                    {faqItems.map((f, i) => (
                        <details key={i} style={{ color: "#9ca3af", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                            <summary style={{ cursor: "pointer", color: "#c8cdd8", fontWeight: 500 }}>{f.question}</summary>
                            <p style={{ paddingTop: "0.5rem", paddingLeft: "1rem" }}>{f.answer}</p>
                        </details>
                    ))}
                </section>
            )}
        </main>
    );
}
