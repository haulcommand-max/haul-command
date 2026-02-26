"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createClient } from "@supabase/supabase-js";

interface LiquidityCell {
    corridor_id: string | null;
    liquidity_score: number;
    plm: number;
}

interface CommandMapProps {
    style?: string;
    className?: string;
}

const MAP_STYLE =
    process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ??
    "https://demotiles.maplibre.org/style.json";

// ─── Dev warning: remind devs to set env var ─────────────────────────────
if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_MAPLIBRE_STYLE) {
    console.warn(
        "[CommandMap] NEXT_PUBLIC_MAPLIBRE_STYLE is not set.\n" +
        "Map is using demo tiles (slow, ugly). Add to .env.local:\n" +
        "NEXT_PUBLIC_MAPLIBRE_STYLE=https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=YOUR_KEY"
    );
}

const ESCORT_REFRESH_MS = 30_000;
const LIQUIDITY_REFRESH_MS = 30_000;

export function CommandMap({ style, className = "" }: CommandMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const realtimeRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
    const escortTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const liqTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── Data fetchers ──────────────────────────────────────────────────────────
    const fetchAndSetLoads = useCallback(async (map: maplibregl.Map) => {
        try {
            const res = await fetch("/api/map/loads?limit=300");
            if (!res.ok) return;
            const fc = await res.json();
            const src = map.getSource("loads") as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(fc);
        } catch { }
    }, []);

    const fetchAndSetEscorts = useCallback(async (map: maplibregl.Map) => {
        try {
            const res = await fetch("/api/map/escorts");
            if (!res.ok) return;
            const fc = await res.json();
            const src = map.getSource("escorts") as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(fc);
        } catch { }
    }, []);

    const fetchAndSetCorridors = useCallback(async (map: maplibregl.Map) => {
        try {
            const [corrRes, liqRes] = await Promise.all([
                fetch("/api/map/corridors"),
                fetch("/api/map/liquidity"),
            ]);
            if (!corrRes.ok) return;
            const corridorFC = await corrRes.json();

            // Merge liquidity scores into corridor features
            let liqMap: Record<string, LiquidityCell> = {};
            if (liqRes.ok) {
                const liqData = await liqRes.json();
                for (const cell of liqData.cells ?? []) {
                    if (cell.corridor_id) liqMap[cell.corridor_id] = cell;
                }
            }

            // Annotate corridor features with PLM-boosted heat
            const enriched = {
                ...corridorFC,
                features: (corridorFC.features ?? []).map((f: any) => ({
                    ...f,
                    properties: {
                        ...f.properties,
                        effective_heat: Math.min(
                            1,
                            (f.properties.heat ?? 0.3) *
                            (liqMap[f.properties.corridor_id]?.plm ?? 1.0)
                        ),
                    },
                })),
            };

            const src = map.getSource("corridors") as maplibregl.GeoJSONSource | undefined;
            if (src) src.setData(enriched);
        } catch { }
    }, []);

    // ─── Map init ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: style ?? MAP_STYLE,
            center: [-82.5, 28.5], // Florida default — center of US heavy haul
            zoom: 5.5,
            pitch: 0,
            bearing: 0,
            attributionControl: false,
        });

        mapRef.current = map;

        map.on("load", () => {
            // ── Sources ──
            map.addSource("loads", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
                cluster: true,
                clusterMaxZoom: 10,
                clusterRadius: 50,
            });

            map.addSource("escorts", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });

            map.addSource("corridors", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });

            // ── LAYER 1: Corridor glow ──
            map.addLayer({
                id: "corridor-glow",
                type: "line",
                source: "corridors",
                paint: {
                    "line-color": "#f97316",
                    "line-width": [
                        "interpolate", ["linear"],
                        ["get", "effective_heat"],
                        0, 2, 1, 8
                    ],
                    "line-opacity": [
                        "interpolate", ["linear"],
                        ["get", "effective_heat"],
                        0, 0.15, 1, 0.7
                    ],
                    "line-blur": 4,
                },
            });

            // Outer glow halo
            map.addLayer({
                id: "corridor-glow-halo",
                type: "line",
                source: "corridors",
                paint: {
                    "line-color": "#f97316",
                    "line-width": [
                        "interpolate", ["linear"],
                        ["get", "effective_heat"],
                        0, 6, 1, 20
                    ],
                    "line-opacity": [
                        "interpolate", ["linear"],
                        ["get", "effective_heat"],
                        0, 0.04, 1, 0.18
                    ],
                    "line-blur": 12,
                },
            });

            // ── LAYER 2: Load heatmap ──
            map.addLayer({
                id: "load-heat",
                type: "heatmap",
                source: "loads",
                maxzoom: 9,
                paint: {
                    "heatmap-weight": [
                        "interpolate", ["linear"], ["get", "urgency"],
                        0, 0.1, 100, 1.5
                    ],
                    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
                    "heatmap-color": [
                        "interpolate", ["linear"], ["heatmap-density"],
                        0, "rgba(0,0,0,0)",
                        0.2, "rgba(249,115,22,0.3)",
                        0.5, "rgba(249,115,22,0.6)",
                        0.8, "rgba(251,191,36,0.8)",
                        1.0, "rgba(255,255,255,0.9)",
                    ],
                    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 20, 9, 50],
                    "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0],
                },
            });

            // ── LAYER 3: Load cluster circles ──
            map.addLayer({
                id: "load-clusters",
                type: "circle",
                source: "loads",
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": "#f97316",
                    "circle-radius": [
                        "step", ["get", "point_count"],
                        18, 5, 24, 20, 30
                    ],
                    "circle-opacity": 0.9,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#fff",
                },
            });

            map.addLayer({
                id: "load-cluster-count",
                type: "symbol",
                source: "loads",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-font": ["Open Sans Bold"],
                    "text-size": 12,
                },
                paint: { "text-color": "#fff" },
            });

            // Single load pins
            map.addLayer({
                id: "load-pins",
                type: "circle",
                source: "loads",
                filter: ["!", ["has", "point_count"]],
                paint: {
                    "circle-color": [
                        "interpolate", ["linear"], ["get", "urgency"],
                        0, "#f97316", 80, "#ef4444"
                    ],
                    "circle-radius": 7,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#fff",
                    "circle-opacity": 0.95,
                },
            });

            // ── LAYER 4: Escort presence dots ──
            map.addLayer({
                id: "escort-dots",
                type: "circle",
                source: "escorts",
                paint: {
                    "circle-color": "#3b82f6",
                    "circle-radius": 5,
                    "circle-stroke-width": 1.5,
                    "circle-stroke-color": "#fff",
                    "circle-opacity": ["get", "opacity"],
                },
            });

            // ── Tooltips ──
            const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

            map.on("mouseenter", "load-pins", (e) => {
                map.getCanvas().style.cursor = "pointer";
                const f = e.features?.[0];
                if (!f) return;
                const { title, city, state, urgency } = f.properties ?? {};
                const urgencyLabel = Number(urgency) >= 80 ? "🔴 URGENT" : Number(urgency) >= 50 ? "🟡 FILLING FAST" : "🟢 OPEN";
                popup
                    .setLngLat((f.geometry as any).coordinates)
                    .setHTML(
                        `<div class="p-2 text-sm font-medium">${urgencyLabel}<br><span class="text-gray-600">${title ?? "Load"}</span><br><span class="text-xs text-gray-500">${[city, state].filter(Boolean).join(", ")}</span></div>`
                    )
                    .addTo(map);
            });
            map.on("mouseleave", "load-pins", () => {
                map.getCanvas().style.cursor = "";
                popup.remove();
            });

            map.on("mouseenter", "escort-dots", (e) => {
                map.getCanvas().style.cursor = "pointer";
                const f = e.features?.[0];
                if (!f) return;
                const { state, status, age_sec } = f.properties ?? {};
                const age = age_sec < 60 ? "Just now" : `${Math.round(age_sec / 60)}m ago`;
                popup
                    .setLngLat((f.geometry as any).coordinates)
                    .setHTML(`<div class="p-2 text-sm"><strong>Escort</strong><br>${state ? `📍 ${state}` : ""}<br><span class="text-xs text-gray-500">${status ?? "active"} · ${age}</span></div>`)
                    .addTo(map);
            });
            map.on("mouseleave", "escort-dots", () => {
                map.getCanvas().style.cursor = "";
                popup.remove();
            });

            map.addControl(new maplibregl.NavigationControl(), "bottom-right");
            map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

            // Initial data load
            fetchAndSetLoads(map);
            fetchAndSetEscorts(map);
            fetchAndSetCorridors(map);

            // ── Supabase Realtime: live load updates (replaces 30s polling) ────
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const channel = supabase
                .channel("haul-map-loads")
                .on(
                    "postgres_changes",
                    { event: "*", schema: "public", table: "loads" },
                    () => { fetchAndSetLoads(map); }  // re-fetch on any change
                )
                .subscribe((status) => {
                    if (status === "CHANNEL_ERROR") {
                        // Realtime failed — fall back to 30s polling
                        console.warn("[CommandMap] Realtime unavailable — falling back to polling");
                        escortTimerRef.current = setInterval(
                            () => fetchAndSetLoads(map), 30_000
                        );
                    }
                });

            realtimeRef.current = channel as any;

            // Escorts + corridors: keep 30s interval (no write-heavy realtime needed)
            escortTimerRef.current = setInterval(() => fetchAndSetEscorts(map), ESCORT_REFRESH_MS);
            liqTimerRef.current = setInterval(() => fetchAndSetCorridors(map), LIQUIDITY_REFRESH_MS);
        });

        return () => {
            // Cleanup: unsubscribe realtime, clear intervals, remove map
            if (realtimeRef.current) {
                (realtimeRef.current as any).unsubscribe();
                realtimeRef.current = null;
            }
            if (escortTimerRef.current) clearInterval(escortTimerRef.current);
            if (liqTimerRef.current) clearInterval(liqTimerRef.current);
            map.remove();
            mapRef.current = null;
        };
    }, [style, fetchAndSetLoads, fetchAndSetEscorts, fetchAndSetCorridors]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full ${className}`}
            aria-label="Haul Command live operations map"
        />
    );
}
