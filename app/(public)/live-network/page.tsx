import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Haul Command: Live Availability Broadcast (Broker Dopamine Feed)
// Route: /live-network
// Purpose: Brokers check this 20x a day to see who just dropped a load and is empty.

const getLiveOperators = async () => {
   // Simulated edge-fetch representing real-time PostGIS data
   return [
     { id: "1", name: "Apex Heavy Haul", role: "Pilot Car", location: "Houston, TX", status: "EMPTY_NOW", lastActive: "2 mins ago", rating: 4.9, vehicle: "F-250 High Pole" },
     { id: "2", name: "Titan Escorts", role: "Route Surveyor", location: "Denver, CO", status: "AVAILABLE_TOMORROW", lastActive: "14 mins ago", rating: 4.7, vehicle: "Dodge Ram 3500" },
     { id: "3", name: "Alpha Corridor", role: "Bucket Truck", location: "Alberta, CA", status: "EMPTY_NOW", lastActive: "1 hr ago", rating: 5.0, vehicle: "Altec 55ft" },
   ];
};

export default async function LiveNetworkFeed() {
  const operators = await getLiveOperators();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header section with live dopamine indicators */}
        <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span className="text-red-500 font-mono text-sm tracking-widest uppercase font-bold">Network Live</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Live Availability Broadcast</h1>
            <p className="text-gray-400 mt-2">Real-time capacity tracking. Zero latency. Secure your escorts before competitors do.</p>
          </div>

          <div className="text-right">
             <div className="bg-gray-900 border border-gray-700 px-4 py-2 rounded font-mono text-sm">
                <span className="text-yellow-500 font-bold">142</span> Empty Now
             </div>
          </div>
        </div>

        {/* The Broadcast Feed */}
        <div className="space-y-4">
          {operators.map((op) => (
             <div key={op.id} className="group bg-gray-900 hover:bg-gray-800 border-l-4 border-l-yellow-500 border border-gray-800 rounded p-6 shadow-2xl transition-all flex justify-between items-center cursor-pointer">
                
                <div className="flex space-x-6 items-center">
                   <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-green-500 flex items-center justify-center text-xl font-bold">
                      {op.name.charAt(0)}
                   </div>
                   
                   <div>
                     <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold tracking-tight">{op.name}</h2>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${op.status === "EMPTY_NOW" ? "bg-red-900/40 text-red-400 border border-red-500/30" : "bg-blue-900/40 text-blue-400 border border-blue-500/30"}`}>
                           {op.status.replace("_", " ")}
                        </span>
                     </div>
                     <div className="text-sm text-gray-400 mt-1 flex space-x-4">
                        <span>📍 {op.location}</span>
                        <span>⭐ {op.rating}</span>
                        <span>⏱️ Active {op.lastActive}</span>
                     </div>
                     <div className="text-xs text-yellow-600 mt-1 font-mono">{op.role} // {op.vehicle}</div>
                   </div>
                </div>

                <div className="text-right flex flex-col space-y-2">
                   <button className="bg-yellow-500 text-black font-black uppercase text-sm px-8 py-3 rounded shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:opacity-80 transition">
                     Dispatch / Lock Rate
                   </button>
                   <span className="text-xs text-gray-500">Requires Broker Pro</span>
                </div>

             </div>
          ))}
        </div>

        {/* The AdGrid SEO Sponsor Block */}
        <div className="mt-12 bg-gray-800/50 border border-dashed border-gray-600 p-8 rounded text-center">
            <h3 className="text-yellow-500 font-black uppercase text-xl mb-2">Backhauls & Empty Lanes</h3>
            <p className="text-gray-400">Can't find availability in your corridor? Put a bounty on the lane and operators will come to you.</p>
            <button className="mt-4 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-black uppercase text-xs px-6 py-2 transition">
               Post Immediate Need
            </button>
        </div>

      </div>
    </div>
  );
}
