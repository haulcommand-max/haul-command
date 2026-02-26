import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store/useStore';
import L from 'leaflet';
import { Truck, MapPin, AlertTriangle } from 'lucide-react';

// Fix for default Leaflet marker icons in React
import iconMarker2x from 'leaflet/dist/images/marker-icon-2x.png';
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconMarker2x,
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
});

const MapWidget: React.FC = () => {
    const { signals } = useStore();

    // Filter signals for map entities
    const mapSignals = signals.filter(s => ['ING-S', 'NAV-S', 'CUR-S'].includes(s.type));

    // Generate random lat/lng for demo if payload doesn't have it
    // In real app, payload would have { lat, lng }
    const getPosition = (sig: any) => {
        if (sig.payload?.lat && sig.payload?.lng) return [sig.payload.lat, sig.payload.lng] as [number, number];
        // Deterministic pseudo-random based on ID hash for demo stability
        const hashVal = sig.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const lat = 30 + (hashVal % 20); // US Latitude range approx
        const lng = -120 + (hashVal % 50); // US Longitude range approx
        return [lat, lng] as [number, number];
    };

    return (
        <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border border-slate-700 relative">
            <div className="absolute top-4 right-4 z-[1000] bg-slate-900/90 p-2 rounded text-xs text-white border border-slate-600">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> ING-S (Fleet)</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> NAV-S (Permits)</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> CUR-S (Restrictions)</div>
            </div>

            <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {mapSignals.map(sig => {
                    const pos = getPosition(sig);
                    return (
                        <Marker key={sig.id} position={pos}>
                            <Popup>
                                <div className="text-slate-900">
                                    <div className="font-bold flex items-center gap-2">
                                        {sig.type === 'ING-S' && <Truck size={14} />}
                                        {sig.type === 'NAV-S' && <MapPin size={14} />}
                                        {sig.type === 'CUR-S' && <AlertTriangle size={14} />}
                                        {sig.type}
                                    </div>
                                    <div className="text-xs">{sig.source}</div>
                                    <div className="text-xs font-mono mt-1">{JSON.stringify(sig.payload).slice(0, 50)}...</div>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    );
};

export default MapWidget;
