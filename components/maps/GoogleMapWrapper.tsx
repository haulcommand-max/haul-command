'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapWrapperProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  children?: React.ReactNode;
}

/**
 * Replaces MapLibre with Google Maps Platform API.
 * This component unlocks Google's native Route Intelligence layer.
 */
export const GoogleMapWrapper = ({ center, zoom, children }: GoogleMapWrapperProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        version: 'weekly',
        libraries: ['places', 'routes'] // Unlocks heavy haul route intelligence
      });

      const { Map } = await loader.importLibrary('maps');

      if (mapRef.current && !map) {
        const newMap = new Map(mapRef.current, {
          center,
          zoom,
          mapId: 'HAUL_COMMAND_MAP_ID', // Replace with dynamic styling ID
          disableDefaultUI: true,
          backgroundColor: '#0F1318',
        });
        setMap(newMap);
      }
    };

    initMap();
  }, [center, zoom, map]);

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-white/5">
      <div ref={mapRef} className="absolute inset-0" />
      {/* Map Content Context can be mapped through children here later */}
    </div>
  );
};
