"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const US_GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
// Fallback geojson for Canada provs
const CA_GEO_URL = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson";

// FIPS to State Abbreviation
const fipsToState: Record<string, string> = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
    "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
    "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
    "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
    "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
    "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
    "55": "WI", "56": "WY"
};

// CA name to Abbreviation
const caNameToProv: Record<string, string> = {
    "Alberta": "AB", "British Columbia": "BC", "Manitoba": "MB", "New Brunswick": "NB",
    "Newfoundland and Labrador": "NL", "Nova Scotia": "NS", "Northwest Territories": "NT",
    "Nunavut": "NU", "Ontario": "ON", "Prince Edward Island": "PE", "Quebec": "QC",
    "Saskatchewan": "SK", "Yukon": "YT"
};

interface JurisdictionMapProps {
    onSelectJurisdiction: (code: string, name: string) => void;
    selectedCode?: string | null;
}

export function JurisdictionMap({ onSelectJurisdiction, selectedCode }: JurisdictionMapProps) {
    const [showHint, setShowHint] = useState(true);

    useEffect(() => {
        // Hide micro-hint after 2 seconds
        const timer = setTimeout(() => setShowHint(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleGeographyClick = (geo: any, isCanada: boolean) => {
        let code = "";
        let name = "";

        if (isCanada) {
            name = geo.properties.name;
            code = `CA-${caNameToProv[name] || name.substring(0, 2).toUpperCase()}`;
        } else {
            name = geo.properties.name;
            const fips = geo.id;
            code = `US-${fipsToState[fips] || "XX"}`;
        }

        // Some regions like HI / PR we ignore or just pass. We map strict codes.
        if (code.includes("XX")) return;

        onSelectJurisdiction(code, name);
        setShowHint(false);
    };

    return (
        <div className="relative w-full h-[60vh] md:h-[80vh] bg-slate-50 border-b border-slate-200 overflow-hidden">
            {/* Micro-hint */}
            <div
                className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-opacity duration-500 pointer-events-none ${showHint ? 'opacity-100' : 'opacity-0'}`}
            >
                pinch to zoom • tap a state
            </div>

            <ComposableMap
                projection="geoAlbers"
                projectionConfig={{ scale: 800, center: [0, 50] }}
                className="w-full h-full"
            >
                <ZoomableGroup center={[-95, 45]} zoom={1} minZoom={1} maxZoom={8}>

                    {/* US STATES */}
                    <Geographies geography={US_GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const isSelected = selectedCode === `US-${fipsToState[geo.id]}`;
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => handleGeographyClick(geo, false)}
                                        tabIndex={0}
                                        aria-label={`${geo.properties.name} (US-${fipsToState[geo.id]})`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                handleGeographyClick(geo, false);
                                            }
                                        }}
                                        style={{
                                            default: {
                                                fill: isSelected ? "#3b82f6" : "#e2e8f0",
                                                stroke: "#ffffff",
                                                strokeWidth: 0.75,
                                                outline: "none"
                                            },
                                            hover: {
                                                fill: isSelected ? "#2563eb" : "#cbd5e1",
                                                stroke: "#ffffff",
                                                strokeWidth: 0.75,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: {
                                                fill: "#1d4ed8",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* CANADA PROVINCES */}
                    <Geographies geography={CA_GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const name = geo.properties.name;
                                const provCode = caNameToProv[name];
                                const isSelected = selectedCode === `CA-${provCode}`;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => handleGeographyClick(geo, true)}
                                        tabIndex={0}
                                        aria-label={`${name} (CA-${provCode})`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                handleGeographyClick(geo, true);
                                            }
                                        }}
                                        style={{
                                            default: {
                                                fill: isSelected ? "#3b82f6" : "#e2e8f0",
                                                stroke: "#ffffff",
                                                strokeWidth: 0.75,
                                                outline: "none"
                                            },
                                            hover: {
                                                fill: isSelected ? "#2563eb" : "#cbd5e1",
                                                stroke: "#ffffff",
                                                strokeWidth: 0.75,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: {
                                                fill: "#1d4ed8",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                </ZoomableGroup>
            </ComposableMap>
        </div>
    );
}
