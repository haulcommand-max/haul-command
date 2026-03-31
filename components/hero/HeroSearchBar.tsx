"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";

// ── Types ──
export interface HeroSearchValues {
    origin: string;
    destination: string;
    equipment: string;
    date?: string;
}

interface Props {
    className?: string;
    onSubmit?: (values: HeroSearchValues) => void;
    defaultValues?: Partial<HeroSearchValues>;
    equipmentOptions?: Array<{ value: string; label: string }>;
    autoFocus?: boolean;
}

const DEFAULT_EQUIPMENT: Array<{ value: string; label: string }> = [
    { value: "all", label: "All Load Types" },
    { value: "general_oversize", label: "General Oversize" },
    { value: "mobile_home", label: "Mobile Home" },
    { value: "wind_blade", label: "Wind Blade" },
    { value: "transformer", label: "Transformer" },
    { value: "bridge_beam", label: "Bridge Beam" },
    { value: "crane", label: "Crane" },
    { value: "steel_precast", label: "Steel / Precast" },
    { value: "heavy_equipment", label: "Heavy Equipment" },
    { value: "superload", label: "Superload" },
    { value: "high_pole", label: "High Pole" },
    { value: "route_survey", label: "Route Survey" },
];

export default function HeroSearchBar({
    className,
    onSubmit,
    defaultValues,
    equipmentOptions = DEFAULT_EQUIPMENT,
    autoFocus = false,
}: Props) {
    const router = useRouter();
    const originRef = useRef<HTMLInputElement | null>(null);

    const [origin, setOrigin] = useState(defaultValues?.origin ?? "");
    const [destination, setDestination] = useState(defaultValues?.destination ?? "");
    const [equipment, setEquipment] = useState(defaultValues?.equipment ?? "all");
    const [date, setDate] = useState(defaultValues?.date ?? "");

    useEffect(() => {
        if (autoFocus) {
            window.setTimeout(() => originRef.current?.focus(), 100);
        }
    }, [autoFocus]);

    const canSubmit = origin.trim().length >= 2 && destination.trim().length >= 2;

    function submit() {
        const values: HeroSearchValues = {
            origin: origin.trim(),
            destination: destination.trim(),
            equipment: equipment || "all",
            date: date || undefined,
        };

        if (onSubmit) {
            onSubmit(values);
            return;
        }

        const sp = new URLSearchParams();
        if (values.origin) sp.set("origin", values.origin);
        if (values.destination) sp.set("destination", values.destination);
        if (values.equipment && values.equipment !== "all") sp.set("equipment", values.equipment);
        if (values.date) sp.set("date", values.date);

        router.push(`/loads?${sp.toString()}`);
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (canSubmit) submit();
        }
    }

    // ── Shared input style ──
    const inputBase: React.CSSProperties = {
        width: "100%",
        minHeight: 52,
        padding: "12px 14px 12px 36px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "#fff",
        fontSize: 14,
        fontWeight: 500,
        outline: "none",
        transition: "border-color 0.2s, background 0.2s",
        boxSizing: "border-box" as const,
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: 9,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.15em",
        color: "rgba(255,255,255,0.35)",
        marginBottom: 4,
        paddingLeft: 2,
    };

    const selectBase: React.CSSProperties = {
        ...inputBase,
        paddingLeft: 14,
        appearance: "none" as const,
        WebkitAppearance: "none" as const,
        cursor: "pointer",
    };

    const dateBase: React.CSSProperties = {
        ...inputBase,
        paddingLeft: 14,
        colorScheme: "dark",
    };

    return (
        <div className={className} onKeyDown={onKeyDown} role="search" aria-label="Find escorts">
            {/* Glass container */}
            <div style={{
                borderRadius: 20,
                border: "1px solid rgba(198,146,58,0.15)",
                background: "rgba(10,15,22,0.75)",
                backdropFilter: "blur(24px) saturate(1.4)",
                WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                padding: "16px 18px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(198,146,58,0.06)",
            }}>
                {/* Label */}
                <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#C6923A",
                    marginBottom: 12,
                    paddingLeft: 2,
                }}>
                    Find Escort Coverage
                </div>

                {/* Fields grid */}
                <div className="hero-search-grid">
                    <style>{`
                        .hero-search-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 12px;
                        }
                        @media (min-width: 768px) {
                            .hero-search-grid { grid-template-columns: 1fr 1fr 1fr auto !important; }
                        }
                        .hero-search-input { min-width: 0; }
                        .hero-search-input:focus { border-color: rgba(198,146,58,0.45) !important; background: rgba(255,255,255,0.09) !important; }
                        .hero-search-input::placeholder { color: rgba(255,255,255,0.35); text-overflow: ellipsis; }
                    `}</style>

                    {/* Origin */}
                    <div>
                        <label style={labelStyle}>Origin</label>
                        <div style={{ position: "relative" }}>
                            <MapPin style={{
                                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                                width: 14, height: 14, color: "#C6923A", opacity: 0.7,
                            }} />
                            <input
                                ref={originRef}
                                className="hero-search-input"
                                value={origin}
                                onChange={e => setOrigin(e.target.value)}
                                placeholder="City or ZIP"
                                style={inputBase}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Destination */}
                    <div>
                        <label style={labelStyle}>Destination</label>
                        <div style={{ position: "relative" }}>
                            <MapPin style={{
                                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                                width: 14, height: 14, color: "#3b82f6", opacity: 0.7,
                            }} />
                            <input
                                className="hero-search-input"
                                value={destination}
                                onChange={e => setDestination(e.target.value)}
                                placeholder="City or ZIP"
                                style={inputBase}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Equipment */}
                    <div>
                        <label style={labelStyle}>Load Type</label>
                        <div style={{ position: "relative" }}>
                            <select
                                className="hero-search-input"
                                value={equipment}
                                onChange={e => setEquipment(e.target.value)}
                                style={selectBase}
                            >
                                {equipmentOptions.map(o => (
                                    <option key={o.value} value={o.value} style={{ color: "#000", background: "#1a2030" }}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown style={{
                                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                width: 14, height: 14, color: "rgba(255,255,255,0.4)", pointerEvents: "none",
                            }} />
                        </div>
                    </div>

                    {/* Submit — gold, matched height to inputs */}
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                        <div className="hidden md:block" style={{ height: 17 }} /> {/* spacer to align with labeled inputs, hidden on mobile for better centering */}
                        <button aria-label="Interactive Button"
                            type="button"
                            onClick={submit}
                            disabled={!canSubmit}
                            className="hero-search-submit"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                minHeight: 52,
                                padding: "12px 14px", /* slightly reduced padding for mobile */
                                borderRadius: 14,
                                border: "none",
                                fontWeight: 800,
                                fontSize: 13,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                cursor: canSubmit ? "pointer" : "not-allowed",
                                transition: "all 0.2s",
                                color: canSubmit ? "#0a0f16" : "rgba(255,255,255,0.3)",
                                background: canSubmit
                                    ? "linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)"
                                    : "rgba(255,255,255,0.06)",
                                boxShadow: canSubmit
                                    ? "0 4px 20px rgba(198,146,58,0.3), 0 0 0 1px rgba(198,146,58,0.2)"
                                    : "none",
                            }}
                        >
                            <Search style={{ width: 16, height: 16 }} />
                            Find Coverage
                        </button>
                    </div>
                    <style>{`
                        .hero-search-submit { grid-column: 1 / -1; width: 100%; }
                        @media (min-width: 768px) {
                            .hero-search-submit { grid-column: auto; width: auto; }
                        }
                    `}</style>
                </div>
            </div>
        </div>
    );
}
