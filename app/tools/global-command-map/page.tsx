'use client';

import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Globe, Users, Activity, Crosshair, AlertTriangle, BadgeAlert } from 'lucide-react';

// Open-source GeoJSON map downloaded via GitHub topography repository
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// The 120 target countries of Haul Command
const TARGET_COUNTRIES = [
  "United States of America", "Canada", "Mexico", "Australia", "United Kingdom", "Germany", "France", "Brazil", 
  "India", "South Africa", "Japan", "Norway", "Sweden", "Finland", "Spain", "Italy", "Netherlands", "Poland", 
  "Argentina", "Chile", "Colombia", "United Arab Emirates", "Saudi Arabia", "Turkey", "Egypt", "Nigeria"
  // ... representing the major logistics hubs
];

// Mocking some live 120-country intelligence data
const markers = [
  { markerOffset: -15, name: "Houston Hub (TX)", coordinates: [-95.3698, 29.7604], status: "Critical Shortage", count: 42 },
  { markerOffset: -15, name: "Alberta Superload Corridor", coordinates: [-113.4909, 53.5444], status: "Active", count: 18 },
  { markerOffset: 25, name: "Hamburg Port (DE)", coordinates: [9.9937, 53.5511], status: "High Demand", count: 120 },
  { markerOffset: 25, name: "Melbourne Routes (AU)", coordinates: [144.9631, -37.8136], status: "Active", count: 85 },
  { markerOffset: -15, name: "Sao Paulo Freight (BR)", coordinates: [-46.6333, -23.5505], status: "Surplus", count: 215 },
  { markerOffset: -15, name: "Dubai Logistics City (UAE)", coordinates: [55.2708, 25.2048], status: "Active", count: 44 },
];

export default function GlobalCommandMap() {
  const [tooltipContent, setTooltipContent] = useState('');
  const [activeUsers, setActiveUsers] = useState(1450230);
  
  // Real-time jitter simulator for 1,000x live presence
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className=" bg-[#020617] text-white font-mono flex flex-col pt-[80px]">
      
      {/* HUD Header */}
      <div className="border-b border-white/5 /50 backdrop-blur-xl p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              GLOBAL LIVE C2 (COMMAND & CONTROL)
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-widest">
              Live Market Command Map
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 px-5 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Active 120-Country Fleet</div>
              <div className="text-2xl font-black text-amber-500 tabular-nums">
                {activeUsers.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 px-5 text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Live Hot Lanes</div>
              <div className="text-2xl font-black text-cyan-400 tabular-nums">2,491</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map UI */}
      <div className="flex-1 relative overflow-hidden bg-[#020617]">
        
        {/* Map Tooltip overlay */}
        {tooltipContent && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 border border-amber-500/50 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            {tooltipContent}
          </div>
        )}

        <ComposableMap width={900} height={500} projection="geoMercator" projectionConfig={{ scale: 130 }} style={{ width: "100%", height: "100%" }}>
          <ZoomableGroup center={[0, 20]} zoom={1} minZoom={1} maxZoom={8}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  // If it's one of the 120 countries we support, light it up
                  const isTarget = TARGET_COUNTRIES.includes(geo.properties.name);
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        if (isTarget) setTooltipContent(`Jurisdiction: ${geo.properties.name} - Network Active`);
                      }}
                      onMouseLeave={() => setTooltipContent('')}
                      style={{
                        default: {
                        },
                        hover: {
                          stroke: "#fcd34d",
                          strokeWidth: 1,
                          cursor: isTarget ? 'pointer' : 'default'
                        },
                        pressed: {
                          fill: "#b45309",
                          outline: "none"
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Rendering Real-Time Ping Markers */}
            {markers.map(({ name, coordinates, markerOffset, status, count }) => (
              <Marker key={name} coordinates={coordinates as [number, number]}>
                <circle r={4} fill={status === 'Critical Shortage' ? '#ef4444' : '#10b981'} className="animate-pulse" />
                <circle r={2} fill="#ffffff" />
                <text
                  textAnchor="middle"
                  y={markerOffset}
                  style={{ fontFamily: "monospace", fill: "#94a3b8", fontSize: "6px", fontWeight: "bold" }}
                >
                  {name} ({count} Online)
                </text>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        {/* HUD Elements Overlay */}
        <div className="absolute bottom-8 right-8 w-64 space-y-3 pointer-events-none">
          <div className="/80 border border-slate-700 p-4 rounded-xl backdrop-blur-md pointer-events-auto">
             <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-700 pb-2 flex items-center gap-2">
               <AlertTriangle className="w-3 h-3 text-red-500" />
               Critical Deficits (SLA Breach)
             </h3>
             <ul className="space-y-2 text-xs">
               <li className="flex justify-between text-slate-300">
                 <span>TX-NM Border</span> <span className="text-red-400">-42 escorts</span>
               </li>
               <li className="flex justify-between text-slate-300">
                 <span>AB High Load</span> <span className="text-red-400">-15 escorts</span>
               </li>
               <li className="flex justify-between text-slate-300">
                 <span>UK M6 Corridor</span> <span className="text-red-400">-8 escorts</span>
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}