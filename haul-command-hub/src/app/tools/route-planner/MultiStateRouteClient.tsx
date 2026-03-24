'use client';

import { useState } from 'react';
import ToolResultCTA from '@/components/hc/ToolResultCTA';

// Rough state adjacency graph for rudimentary pathfinding in Continental US
// (Highly simplified for demo tool; production uses full GIS or Google Maps Directions API)
const ADJACENCY: Record<string, string[]> = {
  TX: ['NM', 'OK', 'AR', 'LA'],
  NM: ['AZ', 'UT', 'CO', 'OK', 'TX'],
  OK: ['TX', 'NM', 'CO', 'KS', 'MO', 'AR'],
  AR: ['TX', 'OK', 'MO', 'TN', 'MS', 'LA'],
  LA: ['TX', 'AR', 'MS'],
  MS: ['LA', 'AR', 'TN', 'AL'],
  TN: ['AR', 'MO', 'KY', 'VA', 'NC', 'GA', 'AL', 'MS'],
  AL: ['MS', 'TN', 'GA', 'FL'],
  GA: ['AL', 'TN', 'NC', 'SC', 'FL'],
  FL: ['AL', 'GA'],
  SC: ['GA', 'NC'],
  NC: ['SC', 'GA', 'TN', 'VA'],
  VA: ['NC', 'TN', 'KY', 'WV', 'MD'],
  // A few more for testing
  AZ: ['CA', 'NV', 'UT', 'NM'],
  CA: ['OR', 'NV', 'AZ'],
  NV: ['OR', 'ID', 'UT', 'AZ', 'CA'],
  UT: ['ID', 'WY', 'CO', 'NM', 'AZ', 'NV'],
  CO: ['WY', 'NE', 'KS', 'OK', 'NM', 'UT'],
};

// Simplified BFS to find a path
function findRoute(start: string, end: string): string[] | null {
  if (start === end) return [start];
  
  const queue: string[][] = [[start]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];

    if (!ADJACENCY[node]) continue;

    for (const neighbor of ADJACENCY[node]) {
      if (neighbor === end) return [...path, neighbor];

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null; // No path found in our simplified graph
}

// Dummy per-state data
function getStateData(state: string, isSuperload: boolean) {
  const baseCost = 65;
  const escorts = isSuperload ? 2 : 1;
  const days = isSuperload ? 3 : 1;
  return { cost: isSuperload ? baseCost * 3 : baseCost, escorts, leadTimeDays: days };
}

export default function MultiStateRouteClient() {
  const [origin, setOrigin] = useState('TX');
  const [dest, setDest] = useState('FL');
  const [isSuperload, setIsSuperload] = useState(false);
  const [route, setRoute] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');
    const path = findRoute(origin, dest);
    if (!path) {
      setError(`Cannot find contiguous route between ${origin} and ${dest} in this demo graph.`);
      setRoute(null);
    } else {
      setRoute(path);
    }
  };

  const availableStates = Object.keys(ADJACENCY).sort();

  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Origin State</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
          >
            {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Destination State</label>
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
          >
            {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <input 
          type="checkbox" 
          id="isSuper" 
          checked={isSuperload}
          onChange={(e) => setIsSuperload(e.target.checked)}
          className="w-5 h-5 accent-accent"
        />
        <label htmlFor="isSuper" className="text-white text-sm font-bold cursor-pointer">
          Classify as Superload {isSuperload && <span className="text-accent">(+300% fees & review times)</span>}
        </label>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full bg-accent text-black font-black text-lg py-4 rounded-xl hover:bg-yellow-500 transition-colors shadow-[0_0_20px_rgba(250,204,21,0.3)] mb-8"
      >
        Calculate Full Route
      </button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center text-sm font-bold mb-6">
          {error}
        </div>
      )}

      {route && (
        <div className="space-y-6">
          <div className="bg-black/50 border border-white/10 p-6 rounded-xl">
            <h3 className="text-white font-bold mb-4">Route Path ({route.length} States)</h3>
            <div className="flex flex-wrap items-center gap-2">
              {route.map((st, idx) => (
                <div key={st} className="flex items-center gap-2">
                  <div className="bg-accent/20 text-accent font-black px-3 py-1 rounded border border-accent/30">{st}</div>
                  {idx < route.length - 1 && <span className="text-gray-600">→</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Permit Fees</p>
              <p className="text-3xl font-black text-white">
                ${route.reduce((sum, st) => sum + getStateData(st, isSuperload).cost, 0)}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">Max Lead Time</p>
              <p className="text-3xl font-black text-white">
                {Math.max(...route.map(st => getStateData(st, isSuperload).leadTimeDays))} Days
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Escorts Req.</p>
              <p className="text-3xl font-black text-white">
                {route.reduce((max, st) => Math.max(max, getStateData(st, isSuperload).escorts), 0)} Max
              </p>
            </div>
          </div>

          <ToolResultCTA
            context="Need pilot cars across multiple states?"
            primary={{ label: "Find Escorts", href: "/directory", icon: "🔍" }}
            secondary={{ label: "View State Rules", href: "/requirements", icon: "📋" }}
          />
        </div>
      )}
    </div>
  );
}
