'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================================
// SignalGrid Telematics™
// The centralized nervous system for Haul Command's real-time GPS
// Connects the Traccar backend, Mobile GPS, and MapLibre UIs into one organism.
// ============================================================

export interface SignalGridState {
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  heading: number | null;
  lastUpdated: string | null;
  toggleTracking: () => void;
}

const SignalGridContext = createContext<SignalGridState | null>(null);

export function SignalGridProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [telemetry, setTelemetry] = useState<{ speed: number | null; heading: number | null }>({ speed: null, heading: null });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let watchId: number;

    if (isActive && 'geolocation' in navigator) {
      // Begin native PWA / Mobile GPS hardware tracking (Fallback to Traccar hardware when connected)
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const speed = position.coords.speed;
          const heading = position.coords.heading;

          setCoords({ lat, lng });
          setTelemetry({ speed, heading });
          setLastUpdated(new Date().toISOString());

          // Pipe directly to Supabase Telematics Table (Traccar sync layer)
          // This keeps the "SignalGrid" connected globally to the loadboard & command maps
          try {
            await supabase.from('tc_positions').insert({
              latitude: lat,
              longitude: lng,
              speed: speed,
              heading: heading,
              device_time: new Date().toISOString()
            });
          } catch (e) {
            console.warn('SignalGrid Telematics: Failed to pipe telemetry to network', e);
          }
        },
        (error) => {
          console.error('SignalGrid Hardware Error:', error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isActive, supabase]);

  const toggleTracking = () => {
    setIsActive(prev => !prev);
  };

  return (
    <SignalGridContext.Provider value={{
      isActive,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      speed: telemetry.speed,
      heading: telemetry.heading,
      lastUpdated,
      toggleTracking
    }}>
      {children}
    </SignalGridContext.Provider>
  );
}

export function useSignalGrid() {
  const context = useContext(SignalGridContext);
  if (!context) {
    throw new Error('useSignalGrid must be used within a SignalGridProvider');
  }
  return context;
}
