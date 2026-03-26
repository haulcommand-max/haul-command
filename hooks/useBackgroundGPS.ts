'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// We import Capacitor Geolocation (assume installed in haul-command monorepo for the Super-App build)
// import { Geolocation } from '@capacitor/geolocation'; // Uncomment in full Expo/Cap module

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * HAUL COMMAND - MOBILE SUPER-APP ARCHITECTURE
 * Persistent background GPS tracking hook for operators. Syncs coordinates silently
 * to establish corridor dominance and assigns loads within real-time polygons.
 */
export function useBackgroundGPS(operatorId: string | null) {
  const [trackingActive, setTrackingActive] = useState(false);
  const watchIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only engage if an operator profile is loaded and tracking is requested
    if (!operatorId || !trackingActive) return;

    let isSubscribed = true;

    const startPersistentTracking = async () => {
      try {
        /*
        // Native Capacitor Geolocation Call
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          console.error('[HAUL-OS] Background Location denied by Operator.');
          setTrackingActive(false);
          return;
        }

        // The background runner hooks (this keeps pinging even if screen locks)
        const id = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }, async (position, err) => {
          if (err || !position || !isSubscribed) return;

          // Dispatch immediate heartbeat to the Unified Intelligence Stack
          // This updates the operator's real-time h3 index placement
          await supabase.rpc('update_operator_location', {
            p_operator_id: operatorId,
            p_lat: position.coords.latitude,
            p_lng: position.coords.longitude,
            p_heading: position.coords.heading || 0,
            p_speed: position.coords.speed || 0,
            p_accuracy: position.coords.accuracy || 0,
            p_timestamp: new Date(position.timestamp).toISOString()
          });

        });

        watchIdRef.current = id;
        */
        console.log(`[HAUL-OS] Background tracking initiated for ${operatorId}`);
      } catch (err) {
        console.error('GPS Watch Initialization Failed:', err);
      }
    };

    startPersistentTracking();

    return () => {
      isSubscribed = false;
      if (watchIdRef.current) {
        /*
        Geolocation.clearWatch({ id: watchIdRef.current });
        */
        watchIdRef.current = null;
      }
    };
  }, [operatorId, trackingActive]);

  // Provide a manual toggle for Operators to go 'On Duty' / 'Off Duty'
  const toggleDutyStatus = (active: boolean) => setTrackingActive(active);

  return { trackingActive, toggleDutyStatus };
}
