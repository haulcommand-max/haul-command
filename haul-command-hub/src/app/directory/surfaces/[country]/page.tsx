import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";

export const revalidate = 3600;

const COUNTRY_NAMES: Record<string, string> = {
    us: "United States", ca: "Canada", gb: "United Kingdom", au: "Australia",
    de: "Germany", fr: "France", br: "Brazil", mx: "Mexico", in: "India",
    jp: "Japan", it: "Italy", es: "Spain", kr: "South Korea", th: "Thailand",
    nl: "Netherlands", ch: "Switzerland", pl: "Poland", se: "Sweden",
    no: "Norway", dk: "Denmark", fi: "Finland", at: "Austria", be: "Belgium",
    ie: "Ireland", pt: "Portugal", gr: "Greece", cz: "Czech Republic",
    ro: "Romania", hu: "Hungary", bg: "Bulgaria", hr: "Croatia",
    sk: "Slovakia", si: "Slovenia", lt: "Lithuania", lv: "Latvia",
    ee: "Estonia", tr: "Turkey", sa: "Saudi Arabia", ae: "UAE",
    za: "South Africa", ng: "Nigeria", nz: "New Zealand", sg: "Singapore",
    my: "Malaysia", ph: "Philippines", id: "Indonesia", vn: "Vietnam",
    ar: "Argentina", cl: "Chile", co: "Colombia", pe: "Peru",
    cr: "Costa Rica", pa: "Panama", uy: "Uruguay", qa: "Qatar",
    kw: "Kuwait", om: "Oman", bh: "Bahrain",
};

const CLASS_LABELS: Record<string, { label: string; icon: string }> = {
    "truck-stops": { label: "Truck Stops & Fuel", icon: "⛽" },
    "truck-parking": { label: "Truck Parking", icon: "🅿️" },
    "hotels": { label: "Hotels & Motels", icon: "🏨" },
    "ports": { label: "Ports & Harbours", icon: "⚓" },
    "industrial": { label: "Industrial Zones", icon: "🏭" },
    "freight-terminals": { label: "Freight Terminals", icon: "📦" },
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string }>;
}) {
    const { country } = await params;
    const name = COUNTRY_NAMES[country] ?? country.toUpperCase();
    return {
        title: `${name} Logistics Surfaces — HAUL COMMAND`,
        description: `Browse truck stops, ports, industrial zones, and freight infrastructure in ${name}. Claim your listing on the world's largest heavy-haul directory.`,
    };
}

export default async function CountrySurfacesPage({
    params,
}: {
    params: Promise<{ country: string }>;
}) {
    const { country } = await params;
    const cc = country.toUpperCase();
    const countryName = COUNTRY_NAMES[country] ?? cc;
    const sb = supabaseServer();

    const { data: rollups } = await sb
        .from("hc_surface_rollups")
        .select("surface_class, total, claimable, avg_quality")
        .eq("country_code", cc)
        .order("total", { ascending: false });

    const totalSurfaces = (rollups ?? []).reduce((s, r) => s + r.total, 0);
    const totalClaimable = (rollups ?? []).reduce((s, r) => s + r.claimable, 0);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg,#0F172A,#1E293B)",
                color: "#F1F5F9",
                padding: "2rem",
            }}
        >
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
                <Link
                    href="/directory/surfaces"
                    style={{ color: "#94A3B8", textDecoration: "none", fontSize: "0.875rem" }}
                >
                    ← All Countries
                </Link>

                <h1
                    style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        marginTop: "1rem",
                        marginBottom: "0.5rem",
                    }}
                >
                    {countryName} — Logistics Surfaces
                </h1>
                <p style={{ color: "#94A3B8", marginBottom: "2rem" }}>
                    {totalSurfaces.toLocaleString()} surfaces •{" "}
                    {totalClaimable.toLocaleString()} claimable
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                    {(rollups ?? []).map((r) => {
                        const cls = CLASS_LABELS[r.surface_class] ?? {
                            label: r.surface_class.replace(/-/g, " "),
                            icon: "📍",
                        };
                        return (
                            <div
                                key={r.surface_class}
                                style={{
                                    padding: "1.25rem",
                                    borderRadius: "0.75rem",
                                    background: "rgba(30,41,59,0.8)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                    <span style={{ fontSize: "1.5rem" }}>{cls.icon}</span>
                                    <div style={{ fontWeight: 700, fontSize: "1rem", textTransform: "capitalize" }}>
                                        {cls.label}
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                                    <span>
                                        <span style={{ color: "#22D3EE", fontWeight: 700 }}>
                                            {r.total.toLocaleString()}
                                        </span>{" "}
                                        <span style={{ color: "#64748B" }}>locations</span>
                                    </span>
                                    <span>
                                        <span style={{ color: "#34D399", fontWeight: 700 }}>
                                            {r.claimable.toLocaleString()}
                                        </span>{" "}
                                        <span style={{ color: "#64748B" }}>claimable</span>
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: "0.5rem",
                                        height: 4,
                                        borderRadius: 2,
                                        background: "#1E293B",
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "100%",
                                            width: `${Math.min(100, (r.claimable / Math.max(r.total, 1)) * 100)}%`,
                                            background: "linear-gradient(90deg, #22D3EE, #34D399)",
                                            borderRadius: 2,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
