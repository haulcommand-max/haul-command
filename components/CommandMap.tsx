"use client";

import { useEffect, useRef } from "react";

type Props = {
    state?: string;
    height?: number;
    className?: string;
};

export function CommandMap({ state, height = 520, className = "" }: Props) {
    const mapRef = useRef<any>(null);
    const elRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!elRef.current || mapRef.current) return;

        // Dynamically import maplibre-gl so it only runs on client
        import("maplibre-gl").then(({ default: maplibregl }) => {
            const map = new maplibregl.Map({
                container: elRef.current!,
                style: {
                    version: 8,
                    sources: {
                        "osm": {
                            type: "raster",
                            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                            tileSize: 256,
                            attribution: "© OpenStreetMap contributors",
                        },
                    },
                    layers: [
                        {
                            id: "osm-tiles",
                            type: "raster",
                            source: "osm",
                            paint: {
                                "raster-opacity": 0.15, // dark-mode feel
                                "raster-brightness-max": 0.1,
                                "raster-saturation": -1,
                            },
                        },
                    ],
                    background: { type: "background", paint: { "background-color": "#07070a" } },
                } as any,
                center: [-87.5, 30.5], // Southeast US (prime escort territory)
                zoom: 5,
                attributionControl: false,
            });

            map.addControl(new maplibregl.NavigationControl(), "top-right");
            mapRef.current = map;

            map.on("load", async () => {
                const [loadGeo, presenceGeo] = await Promise.all([
                    fetchLoads(state),
                    fetchPresence(),
                ]);

                // ── Loads Source ──────────────────────────────────
                map.addSource("loads", { type: "geojson", data: loadGeo });

                // ── Presence Source ───────────────────────────────
                map.addSource("presence", { type: "geojson", data: presenceGeo });

                // ── Layer 2: Demand Heat ──────────────────────────
                map.addLayer({
                    id: "loads-heat",
                    type: "heatmap",
                    source: "loads",
                    paint: {
                        "heatmap-weight": [
                            "interpolate", ["linear"], ["get", "urgency"],
                            0, 0.2, 50, 0.6, 100, 1,
                        ],
                        "heatmap-color": [
                            "interpolate", ["linear"], ["heatmap-density"],
                            0, "rgba(0,0,0,0)",
                            0.2, "rgba(241,169,27,0.15)",
                            0.5, "rgba(241,169,27,0.4)",
                            0.8, "rgba(255,60,60,0.55)",
                            1, "rgba(255,30,30,0.7)",
                        ],
                        "heatmap-intensity": 1.4,
                        "heatmap-radius": [
                            "interpolate", ["linear"], ["zoom"],
                            4, 18, 8, 35, 12, 55,
                        ],
                        "heatmap-opacity": 0.7,
                    },
                });

                // ── Layer 3: Driver Presence (ghosted dots) ───────
                map.addLayer({
                    id: "presence-dots",
                    type: "circle",
                    source: "presence",
                    paint: {
                        "circle-radius": 3,
                        "circle-color": "rgba(100,160,255,0.45)",
                        "circle-blur": 0.6,
                        "circle-stroke-width": 0,
                    },
                });

                // ── Layer 1: Load Activity Pins ───────────────────
                map.addLayer({
                    id: "loads-pins",
                    type: "circle",
                    source: "loads",
                    paint: {
                        "circle-radius": [
                            "interpolate", ["linear"], ["zoom"],
                            4, 4, 8, 7, 12, 10,
                        ],
                        "circle-color": "rgba(255,255,255,0.92)",
                        "circle-stroke-width": 2.5,
                        "circle-stroke-color": [
                            "case",
                            [">=", ["get", "urgency"], 80], "#ff3c3c",
                            [">=", ["get", "urgency"], 50], "#F1A91B",
                            "#22c55e",
                        ],
                    },
                });

                // ── Layer 5: Urgency Pulse ring ───────────────────
                map.addLayer({
                    id: "loads-pulse",
                    type: "circle",
                    source: "loads",
                    filter: [">=", ["get", "urgency"], 75],
                    paint: {
                        "circle-radius": [
                            "interpolate", ["linear"], ["zoom"],
                            4, 9, 8, 16,
                        ],
                        "circle-color": "rgba(255,60,60,0)",
                        "circle-stroke-width": 1.5,
                        "circle-stroke-color": "rgba(255,60,60,0.5)",
                        "circle-opacity": 0.5,
                    },
                });

                // ── Tooltip on pin click ──────────────────────────
                map.on("click", "loads-pins", (e: any) => {
                    const f = e.features?.[0];
                    if (!f) return;
                    const { title, city, state: st, urgency } = f.properties;
                    const urgencyColor = urgency >= 80 ? "#ff3c3c" : urgency >= 50 ? "#F1A91B" : "#22c55e";
                    new maplibregl.Popup({ className: "hc-map-popup" })
                        .setLngLat(f.geometry.coordinates)
                        .setHTML(`
                            <div style="font-family:sans-serif;background:#0a0a0a;border:1px solid #222;border-radius:10px;padding:12px;min-width:160px">
                                <div style="font-weight:800;font-size:13px;color:#fff;margin-bottom:4px">${escapeHtml(title)}</div>
                                <div style="color:#888;font-size:11px">${escapeHtml(city)}, ${escapeHtml(st)}</div>
                                <div style="margin-top:8px;font-size:11px;color:${urgencyColor};font-weight:700">
                                    Urgency: ${urgency}
                                </div>
                            </div>
                        `)
                        .addTo(map);
                });

                map.on("mouseenter", "loads-pins", () => {
                    map.getCanvas().style.cursor = "pointer";
                });
                map.on("mouseleave", "loads-pins", () => {
                    map.getCanvas().style.cursor = "";
                });

                // ── Activity ticker (bottom banner) ───────────────
                // Handled by parent component via activity-ticker prop

                // ── 15s refresh loop ──────────────────────────────
                const interval = window.setInterval(async () => {
                    try {
                        const [ld, pr] = await Promise.all([fetchLoads(state), fetchPresence()]);
                        (map.getSource("loads") as any)?.setData(ld);
                        (map.getSource("presence") as any)?.setData(pr);
                    } catch (_) { /* silently fail */ }
                }, 15_000);

                (map as any)._hcInterval = interval;
            });
        });

        return () => {
            if (mapRef.current) {
                clearInterval((mapRef.current as any)._hcInterval);
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [state]);

    return (
        <div
            className={className}
            style={{
                height,
                width: "100%",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                background: "#07070a",
            }}
        >
            <div ref={elRef} style={{ height: "100%", width: "100%" }} />

            {/* Legend overlay */}
            <div style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                display: "flex",
                gap: 12,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
            }}>
                {[
                    { color: "#22c55e", label: "Normal" },
                    { color: "#F1A91B", label: "Filling" },
                    { color: "#ff3c3c", label: "Urgent" },
                ].map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                        <span style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

async function fetchLoads(state?: string) {
    try {
        const url = new URL("/api/map/loads", window.location.origin);
        if (state) url.searchParams.set("state", state);
        url.searchParams.set("limit", "500");
        const res = await fetch(url.toString(), { cache: "no-store" });
        return res.json();
    } catch (_) {
        return { type: "FeatureCollection", features: [] };
    }
}

async function fetchPresence() {
    try {
        const url = new URL("/api/map/presence", window.location.origin);
        url.searchParams.set("minutes", "45");
        const res = await fetch(url.toString(), { cache: "no-store" });
        return res.json();
    } catch (_) {
        return { type: "FeatureCollection", features: [] };
    }
}

function escapeHtml(s: string) {
    if (!s) return "";
    return String(s).replace(/[&<>"']/g, (m) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!)
    );
}
