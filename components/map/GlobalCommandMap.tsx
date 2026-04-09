'use client';

import React, { useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';
import Image from 'next/image';
import { Shield } from 'lucide-react';

interface OperatorNode {
  id: string;
  lat: number;
  lng: number;
  name: string;
  isAvailable: boolean;
  score: number;
  slug: string;
}

// Haul Command: Global Map Engine
// Real-time liquidity visualization
export function GlobalCommandMap() {
  const [viewState, setViewState] = useState({
    longitude: -98.5795, // Center of US
    latitude: 39.8283,
    zoom: 4,
    pitch: 45
  });

  const [simulatedOperators, setSimulatedOperators] = useState<OperatorNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OperatorNode | null>(null);

  // Generate synthetic nodes on load for immediate dramatic effect
  // In production, this hooks straight into the `hc_places` or `operator_live_status` RPC.
  useEffect(() => {
    // 1. Trigger hyperlocal zoom if allowed
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setViewState(prev => ({
          ...prev,
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
          zoom: 9
        }));
      }, () => {
        console.log("Geolocation denied or unavailable, using fallback.");
      }, { timeout: 5000 });
    }

    const nodes: OperatorNode[] = [];
    const centers = [
      { lat: 29.76, lng: -95.36, spread: 5, activeRate: 0.8 }, // Houston
      { lat: 39.73, lng: -104.99, spread: 3, activeRate: 0.4 }, // Denver
      { lat: 41.87, lng: -87.62, spread: 4, activeRate: 0.5 }, // Chicago
      { lat: 34.05, lng: -118.24, spread: 2, activeRate: 0.6 }, // LA
      { lat: 40.71, lng: -74.00, spread: 2, activeRate: 0.3 }, // NY
      { lat: 35.22, lng: -80.84, spread: 3, activeRate: 0.5 }, // Charlotte
      { lat: 47.60, lng: -122.33, spread: 2, activeRate: 0.4 }, // Seattle
      { lat: 33.44, lng: -112.07, spread: 3, activeRate: 0.6 }, // Phoenix
      { lat: 32.77, lng: -96.79, spread: 4, activeRate: 0.7 }, // Dallas
      { lat: 25.76, lng: -80.19, spread: 2, activeRate: 0.5 }, // Miami
    ];

    centers.forEach((center, idx) => {
      for (let i = 0; i < 15; i++) {
        const isLive = Math.random() < center.activeRate;
        nodes.push({
          id: `${idx}-${i}`,
          name: isLive ? 'Verified Escort Operator' : 'Standard Escort',
          lat: center.lat + (Math.random() - 0.5) * center.spread,
          lng: center.lng + (Math.random() - 0.5) * center.spread,
          isAvailable: isLive,
          score: Math.floor(Math.random() * 40) + 80,
          slug: '#',
        });
      }
    });

    // Add local node if geolocation was granted, simulating user density
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        nodes.push({
          id: 'local-node',
          name: 'Hyperlocal Escort',
          lat: pos.coords.latitude + 0.01,
          lng: pos.coords.longitude + 0.01,
          isAvailable: true,
          score: 99,
          slug: '#'
        });
      });
    }

    setSimulatedOperators(nodes);
  }, []);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  // Graceful fallback if no mapbox token is configured
  if (!mapboxToken) {
    return (
      <div className="relative w-full h-[500px] bg-[#0a0a0b] border border-white/5 shadow-2xl overflow-hidden rounded-xl flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-[#C6923A] text-xs font-bold uppercase tracking-widest mb-3">⟐ Command Map</div>
          <h3 className="text-white font-bold text-lg mb-2">Live Operator Radar</h3>
          <p className="text-neutral-500 text-sm mb-4">
            Real-time visualization of {simulatedOperators.filter(o => o.isAvailable).length} active operators across 10 metro hubs.
          </p>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {['Houston', 'Denver', 'Chicago', 'LA', 'Dallas'].map(city => (
              <div key={city} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-center">
                <div className="w-2 h-2 bg-[#22c55e] rounded-full mx-auto mb-1 shadow-[0_0_8px_#22c55e]" />
                <span className="text-[9px] text-neutral-400 font-medium">{city}</span>
              </div>
            ))}
          </div>
          <Link href="/directory" className="text-xs text-[#C6923A] hover:underline font-bold">
            Browse Full Directory →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] bg-[#07090D] border border-white/5 shadow-2xl overflow-hidden rounded-xl">
      <style>{`
        /* Remove Mapbox Logos completely */
        .mapboxgl-ctrl-bottom-left { display: none !important; }
        .mapboxgl-ctrl-logo { display: none !important; }
        
        /* Apply Haul Command brand colors (Dark/Gold Custom Filter) */
        .mapboxgl-canvas {
          filter: sepia(0.3) saturate(1.2) hue-rotate(345deg) contrast(1.1) brightness(0.8) !important;
        }
      `}</style>

      {/* OS Overlay - Scanner UI */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C6923A] to-transparent opacity-50 z-20" />

      {/* Faded HC Logo replacing Mapbox mark */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none opacity-40 mix-blend-plus-lighter">
        <Image 
           src="/brand/generated/pwa-icon-192.png" 
           alt="Haul Command Map" 
           width={32} 
           height={32} 
           className="grayscale saturate-0 brightness-150 drop-shadow-[0_0_2px_#fff]"
        />
      </div>

      {/* Mapbox Instance */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxToken}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />

        {simulatedOperators.map(node => (
          <Marker
            key={node.id}
            longitude={node.lng}
            latitude={node.lat}
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedNode(node);
            }}
          >
            {node.isAvailable ? (
              <div className="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
                <div className="absolute inset-0 bg-[#22c55e] rounded-full animate-ping opacity-30 group-hover:opacity-60 transition" />
                <div className="relative z-10 w-3 h-3 bg-[#22c55e] rounded-full shadow-[0_0_15px_#22c55e] border border-white/50" />
              </div>
            ) : (
              <div className="w-2 h-2 bg-neutral-600 rounded-full cursor-pointer hover:bg-neutral-400 transition" />
            )}
          </Marker>
        ))}

        {selectedNode && (
          <Popup
            anchor="bottom"
            longitude={selectedNode.lng}
            latitude={selectedNode.lat}
            onClose={() => setSelectedNode(null)}
            closeButton={false}
            className="hc-map-popup"
            maxWidth="300px"
          >
            <div className="bg-[#121212] border border-white/10 rounded-xl p-4 shadow-xl text-white w-full max-w-[240px]">
              <div className="flex items-center gap-2 mb-2">
                {selectedNode.isAvailable ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#22c55e]/20">
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" /> Live
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Offline
                  </span>
                )}
                <span className="text-[10px] text-[#C6923A] font-bold ml-auto">{selectedNode.score} TP</span>
              </div>
              <h3 className="text-sm font-bold truncate mb-1">{selectedNode.name}</h3>
              <p className="text-xs text-neutral-400 mb-3">Verified Escort Operator</p>
              
              <Link href={`/directory/profile/${selectedNode.slug}`} className="block w-full text-center bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg transition">
                View Intel &rarr;
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Floating HUD over the map */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-[#0b0b0c]/90 backdrop-blur border border-white/10 rounded-xl p-4 shadow-2xl w-64">
          <h2 className="text-[#C6923A] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Global Command Map
          </h2>
          <p className="text-xs text-neutral-400 mb-4">
            Live liquidity radar. Click pulsing green dots for available operators.
          </p>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer group">
              <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center bg-white/5 group-hover:border-[#C6923A] transition">
                 <div className="w-2 h-2 bg-[#C6923A] rounded-sm" />
              </div>
              High Pole Certified Only
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer group">
              <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center bg-white/5 group-hover:border-[#22c55e] transition">
                 <div className="w-2 h-2 bg-[#22c55e] rounded-sm" />
              </div>
              Available Right Now
            </label>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-[#0b0b0c]/90 backdrop-blur border border-white/10 rounded-full px-4 py-2">
         <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
           <div className="w-2 h-2 bg-[#22c55e] rounded-full shadow-[0_0_8px_#22c55e]" /> Active
         </div>
         <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
           <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" /> Pending
         </div>
      </div>
    </div>
  );
}
