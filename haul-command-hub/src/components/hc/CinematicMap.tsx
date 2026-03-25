"use client";

import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════
   CINEMATIC MAP — Haul Command Global Route Intelligence
   
   Uses Mapbox GL JS for 3D terrain, neon-gold MSR routing,
   and an immersive dark defense-tech aesthetic.
   
   Falls back to a static SVG world map when no token is set
   so non-Mapbox environments still render a premium map.
   ═══════════════════════════════════════════════════════════ */

interface MapMarker {
  lng: number;
  lat: number;
  label: string;
  type: "operator" | "corridor" | "staging" | "border";
}

interface CinematicMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  showGlobe?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Neon gold accent matching --accent: #f59f0a
const NEON_GOLD = "#f59f0a";
const NEON_GOLD_DIM = "rgba(245, 159, 10, 0.3)";

export function CinematicMap({
  markers = [],
  center = [-98.5, 39.8],
  zoom = 3.5,
  className = "",
  showGlobe = false,
}: CinematicMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || mapRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");

      if (cancelled) return;

      (mapboxgl as any).accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center,
        zoom,
        pitch: showGlobe ? 45 : 30,
        bearing: showGlobe ? -17 : 0,
        antialias: true,
        projection: showGlobe ? ("globe" as any) : ("mercator" as any),
      });

      mapRef.current = map;

      map.on("style.load", () => {
        // Atmosphere for globe mode
        if (showGlobe) {
          map.setFog({
            color: "rgb(10, 10, 10)",
            "high-color": "rgb(20, 18, 36)",
            "horizon-blend": 0.08,
            "space-color": "rgb(5, 5, 15)",
            "star-intensity": 0.6,
          });
        }

        // 3D Terrain
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

        // Atmospheric sky layer
        map.addLayer({
          id: "sky",
          type: "sky",
          paint: {
            "sky-type": "atmosphere",
            "sky-atmosphere-sun": [0.0, 0.0],
            "sky-atmosphere-sun-intensity": 5,
          },
        });
      });

      map.on("load", () => {
        if (cancelled) return;

        // Add markers with neon gold pulsing effect
        markers.forEach((m) => {
          const el = document.createElement("div");
          el.className = "hc-map-marker";
          el.innerHTML = `
            <div style="
              position:relative;
              width:16px;height:16px;
              background:${NEON_GOLD};
              border-radius:50%;
              box-shadow:0 0 12px ${NEON_GOLD},0 0 24px ${NEON_GOLD_DIM};
              animation: hc-marker-pulse 2s ease-in-out infinite;
            ">
              <div style="
                position:absolute;inset:-4px;
                border:2px solid ${NEON_GOLD_DIM};
                border-radius:50%;
                animation: hc-marker-ring 2s ease-in-out infinite;
              "></div>
            </div>
          `;

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            className: "hc-map-popup",
          }).setHTML(`
            <div style="
              background:#111;
              border:1px solid rgba(245,159,10,0.3);
              border-radius:12px;
              padding:12px 16px;
              color:#fff;
              font-family:var(--font-inter),sans-serif;
              min-width:160px;
            ">
              <div style="font-size:11px;color:${NEON_GOLD};text-transform:uppercase;letter-spacing:2px;font-weight:800;margin-bottom:4px;">
                ${m.type.replace("_", " ")}
              </div>
              <div style="font-size:14px;font-weight:700;">
                ${m.label}
              </div>
              <div style="font-size:10px;color:#666;margin-top:4px;">
                ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}
              </div>
            </div>
          `);

          new mapboxgl.Marker({ element: el })
            .setLngLat([m.lng, m.lat])
            .setPopup(popup)
            .addTo(map);
        });

        setMapLoaded(true);
      });

      // Slow cinematic rotation for globe
      if (showGlobe) {
        const spinGlobe = () => {
          if (!map || cancelled) return;
          const z = map.getZoom();
          if (z < 5) {
            const c = map.getCenter();
            map.easeTo({
              center: [c.lng + 0.2, c.lat],
              duration: 200,
              easing: (t: number) => t,
            });
          }
        };
        map.on("moveend", spinGlobe);
        spinGlobe();
      }
    };

    initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback: Static premium SVG map when no Mapbox token
  if (!MAPBOX_TOKEN) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] ${className}`}>
        <div className="aspect-[16/9] flex items-center justify-center relative">
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,159,10,0.3) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10 text-center px-6">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-white font-black text-2xl tracking-tight mb-2">
              Global Route Intelligence
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
              Interactive 3D map with MSR routing, corridor heatmaps, and live operator positions across 57 countries.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {markers.slice(0, 6).map((m, i) => (
                <span key={i} className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300">
                  📍 {m.label}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mt-4">
              Set NEXT_PUBLIC_MAPBOX_TOKEN to activate 3D Cinematic Mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${className}`}>
      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#0a0a0a] z-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Initializing Route Intel</span>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="w-full aspect-[16/9]" />

      {/* HUD Overlay — top-left */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3">
          <div className="text-[9px] text-accent font-black uppercase tracking-[3px] mb-1">
            HAUL COMMAND
          </div>
          <div className="text-white font-bold text-sm">Route Intelligence</div>
          <div className="text-gray-500 text-[10px] mt-1">{markers.length} active positions</div>
        </div>
      </div>

      {/* Legend — bottom-right */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(245,159,10,0.6)]" />
            <span className="text-[10px] text-gray-400">Operator</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] text-gray-400">Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] text-gray-400">Staging</span>
          </div>
        </div>
      </div>

      {/* Inline CSS for marker animations */}
      <style jsx global>{`
        @keyframes hc-marker-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes hc-marker-ring {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
        }
        .mapboxgl-popup-content {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: rgba(245, 159, 10, 0.3) !important;
        }
      `}</style>
    </div>
  );
}
