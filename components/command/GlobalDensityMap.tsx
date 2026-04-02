'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * HAUL COMMAND: GLOBAL DENSITY VISUALIZER
 * Harnesses Mapbox GL WebGL capabilities to map all 120 countries, 
 * illustrating operator density, active RFQ locations, and intelligence gaps.
 */

export default function GlobalDensityMap({ 
  markers = [] 
}: { 
  markers?: { lng: number, lat: number, type: 'operator' | 'load' | 'gap' }[] 
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    // Fallback public key purely for architectural scaffolding
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_KEY || 'pk.eyJ1IjoibW9jay11c2VyIiwiYSI6Im1vY2stc2lnbmF0dXJlIn0.mock';
    
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [0, 20], // Centered globally
        zoom: 1.5,
        projection: 'globe' // 3D globe visualization
      });

      map.current.on('style.load', () => {
        // Build the Atmosphere (Stunning dark UI)
        map.current?.setFog({
          'color': 'rgb(7, 9, 15)', // Space background
          'high-color': 'rgb(255, 183, 77)', // Amber atmospheric glow
          'horizon-blend': 0.02,
          'space-color': 'rgb(0, 0, 0)',
          'star-intensity': 0.6
        });

        // Loop array and push 3D visual markers
        markers.forEach(m => {
          const color = m.type === 'operator' ? '#F59E0B' : m.type === 'load' ? '#10B981' : '#EF4444';
          new mapboxgl.Marker({ color })
            .setLngLat([m.lng, m.lat])
            .addTo(map.current!);
        });
      });
    }
  }, [markers]);

  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-amber-500/5">
      <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl text-white">
        <h3 className="font-bold text-sm tracking-widest uppercase mb-1">Live OS Uplink</h3>
        <p className="text-xs text-gray-400">Rendering active operator presence across 120 global archetypes.</p>
        <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider">
           <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Operators</div>
           <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Live Loads</div>
           <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Intel Gaps</div>
        </div>
      </div>
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
}
