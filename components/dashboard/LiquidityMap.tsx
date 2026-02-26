"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { supabaseBrowser } from '@/lib/supabase/browser';
import LiquidityHUD from './LiquidityHUD';
import { Truck, MapPin, Loader2 } from 'lucide-react';
import { RankBadge } from '@/components/badges/RankBadge';
import { TrustShield } from '@/components/badges/TrustShield';
import 'leaflet/dist/leaflet.css';

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then(mod => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then(mod => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then(mod => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then(mod => mod.Popup),
    { ssr: false }
);

// Leaflet Icon Fix (must be run on client)
import L from 'leaflet';
const fixLeafletIcons = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface MapData {
    drivers: any[];
    loads: any[];
    metrics: {
        driver_count: number;
        load_count: number;
        liquidity_ratio: number;
    };
}

export default function LiquidityMap() {
    const [data, setData] = useState<MapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fixLeafletIcons();
        fetchMapData();

        // Refresh every 60s
        const interval = setInterval(fetchMapData, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchMapData = async () => {
        try {
            const supabase = supabaseBrowser();
            const { data: res, error } = await supabase.functions.invoke('liquidity-map-data', {
                body: { viewport: { minLat: -90, maxLat: 90 } } // Placeholder viewport
            });

            if (error) throw error;
            setData(res);
        } catch (err) {
            console.error("Failed to fetch map data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return <div className="h-full w-full bg-slate-950 flex items-center justify-center text-slate-500">Initializing Map...</div>;

    return (
        <div className="relative h-full w-full bg-slate-950 overflow-hidden rounded-xl border border-slate-800">
            {/* HUD Overlay */}
            {data && <LiquidityHUD metrics={data.metrics} isLoading={loading} />}

            {loading && !data && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
            )}

            <MapContainer
                center={[27.6648, -81.5158]} // Center on Florida (Engine 1 Priority)
                zoom={7}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                {/* Render Drivers */}
                {data?.drivers.map((driver: any) => (
                    <Marker key={driver.id} position={[driver.lat, driver.lng]}>
                        <Popup className="custom-popup">
                            <div className="p-2 min-w-[200px]">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <Truck size={14} className="text-blue-600" />
                                            {driver.type === 'high_pole' ? 'High Pole' : 'Pilot Car'}
                                        </h3>
                                        <div className="mt-2">
                                            <RankBadge tier={driver.tier || 'ROOKIE'} size="sm" />
                                        </div>
                                    </div>
                                    <div className="ml-2">
                                        <TrustShield score={driver.trust || 0} size="sm" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-2">Status: <span className={driver.status === 'rolling' ? 'text-green-600' : 'text-slate-500'}>{driver.status}</span></p>
                                <button className="mt-3 w-full bg-slate-900 text-white text-xs font-bold py-1.5 px-2 rounded shadow hover:bg-slate-800 transition-colors">
                                    VIEW PROFILE
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Render Loads */}
                {data?.loads.map((load: any) => (
                    <Marker key={load.id} position={[load.lat, load.lng]}>
                        <Popup className="custom-popup">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                                <MapPin size={14} className="text-orange-600" />
                                <span>Load: {load.id.slice(0, 6)}...</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

            </MapContainer>

            {/* Gradient Overlay for cool effect */}
            <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-50"></div>
        </div>
    );
}
