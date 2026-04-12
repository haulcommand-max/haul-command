import React from 'react';

/**
 * Route IQ Mapbox/Map Visualization Component Mock
 * Designed to render localized route lines dynamically
 */
export function RouteIQVisualizer({ origin, destination, mapboxToken }: { origin: string, destination: string, mapboxToken?: string }) {
    return (
        <div className="relative w-full h-64 bg-gray-900 border border-gray-800 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('/assets/map_placeholder.png')] bg-cover opacity-20"></div>
            <div className="z-10 text-center">
                <span className="bg-blue-600 px-3 py-1 font-mono text-xs uppercase tracking-widest text-white shadow-xl">
                    ROUTE IQ ACTIVE
                </span>
                <p className="mt-4 font-mono text-xs text-blue-300">Plotting vector: {origin} - {destination}</p>
                <div className="w-full h-1 bg-gray-800 mt-4 overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/2 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}