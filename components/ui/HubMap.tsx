"use client";

import React, { useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from "react-simple-maps";
import { useRouter } from "next/navigation";

// Public TopoJSON from react-simple-maps CDN
const US_GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const CA_GEO_URL = "https://cdn.jsdelivr.net/npm/@highcharts/map-collection@2.0.1/countries/ca/ca-all.geo.json";

// FIPS code → state abbreviation mapping
const FIPS_TO_STATE: Record<string, string> = {
    "01": "al", "02": "ak", "04": "az", "05": "ar", "06": "ca", "08": "co",
    "09": "ct", "10": "de", "12": "fl", "13": "ga", "15": "hi", "16": "id",
    "17": "il", "18": "in", "19": "ia", "20": "ks", "21": "ky", "22": "la",
    "23": "me", "24": "md", "25": "ma", "26": "mi", "27": "mn", "28": "ms",
    "29": "mo", "30": "mt", "31": "ne", "32": "nv", "33": "nh", "34": "nj",
    "35": "nm", "36": "ny", "37": "nc", "38": "nd", "39": "oh", "40": "ok",
    "41": "or", "42": "pa", "44": "ri", "45": "sc", "46": "sd", "47": "tn",
    "48": "tx", "49": "ut", "50": "vt", "51": "va", "53": "wa", "54": "wv",
    "55": "wi", "56": "wy",
};

// Province key → abbreviation for Canada TopoJSON
const CA_PROPS_TO_CODE: Record<string, string> = {
    "Alberta": "ab", "British Columbia": "bc", "Manitoba": "mb",
    "New Brunswick": "nb", "Newfoundland and Labrador": "nl",
    "Nova Scotia": "ns", "Ontario": "on", "Prince Edward Island": "pe",
    "Quebec": "qc", "Saskatchewan": "sk",
};

interface HubMapProps {
    country?: "us" | "ca" | "both";
    className?: string;
}

export function HubMap({ country = "us", className = "" }: HubMapProps) {
    const router = useRouter();
    const [hovered, setHovered] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);

    function handleUSClick(geo: any) {
        const code = FIPS_TO_STATE[geo.id];
        if (code) router.push(`/directory/us/${code}`);
    }

    function handleCAClick(geo: any) {
        const name = geo.properties?.name || geo.properties?.NAME || "";
        const code = CA_PROPS_TO_CODE[name];
        if (code) router.push(`/directory/ca/${code}`);
    }

    function getUSLabel(geo: any) {
        return FIPS_TO_STATE[geo.id]?.toUpperCase() ?? geo.id;
    }

    function getCALabel(geo: any) {
        const name = geo.properties?.name || geo.properties?.NAME || "";
        return CA_PROPS_TO_CODE[name]?.toUpperCase() ?? name;
    }

    const fillDefault = "var(--hc-panel, #1e1e1e)";
    const fillHover = "rgba(217, 119, 6, 0.35)";
    const stroke = "var(--hc-border, #333)";
    const strokeHover = "#d97706";

    return (
        <div className={`hub-map ${className}`} style={{ position: "relative", userSelect: "none" }}>
            {tooltip && (
                <div style={{
                    position: "absolute",
                    left: tooltip.x + 12,
                    top: tooltip.y - 28,
                    background: "#111",
                    color: "#f5f5f5",
                    border: "1px solid #d97706",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    pointerEvents: "none",
                    zIndex: 10,
                }}>
                    {tooltip.label}
                </div>
            )}

            {(country === "us" || country === "both") && (
                <ComposableMap
                    projection="geoAlbersUsa"
                    style={{ width: "100%", height: "auto", maxHeight: 400 }}
                >
                    <ZoomableGroup>
                        <Geographies geography={US_GEO_URL}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const id = geo.id as string;
                                    const isHovered = hovered === `us-${id}`;
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            onClick={() => handleUSClick(geo)}
                                            onMouseEnter={(e) => {
                                                setHovered(`us-${id}`);
                                                setTooltip({ label: getUSLabel(geo), x: e.clientX, y: e.clientY });
                                            }}
                                            onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                                            style={{
                                                default: { fill: fillDefault, stroke, strokeWidth: 0.5, outline: "none", cursor: "pointer" },
                                                hover: { fill: fillHover, stroke: strokeHover, strokeWidth: 1, outline: "none", cursor: "pointer" },
                                                pressed: { fill: "#d97706", stroke: strokeHover, strokeWidth: 1, outline: "none" },
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
            )}

            {(country === "ca" || country === "both") && (
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: 300, center: [-96, 62] }}
                    style={{ width: "100%", height: "auto", maxHeight: country === "ca" ? 400 : 200 }}
                >
                    <Geographies geography={CA_GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const name = geo.properties?.name || geo.properties?.NAME || "";
                                const key = `ca-${name}`;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => handleCAClick(geo)}
                                        onMouseEnter={(e) => {
                                            setHovered(key);
                                            setTooltip({ label: getCALabel(geo), x: e.clientX, y: e.clientY });
                                        }}
                                        onMouseLeave={() => { setHovered(null); setTooltip(null); }}
                                        style={{
                                            default: { fill: fillDefault, stroke, strokeWidth: 0.5, outline: "none", cursor: "pointer" },
                                            hover: { fill: fillHover, stroke: strokeHover, strokeWidth: 1, outline: "none", cursor: "pointer" },
                                            pressed: { fill: "#d97706", stroke: strokeHover, strokeWidth: 1, outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ComposableMap>
            )}

            <p style={{ textAlign: "center", fontSize: 11, color: "var(--hc-muted, #888)", marginTop: 4 }}>
                Click any state or province to view available pilot car operators
            </p>
        </div>
    );
}
