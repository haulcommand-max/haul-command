'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ThreatPoint = { id: string, lat: number, lng: number, is_bot: boolean };

/**
 * HAUL COMMAND - SCATTER-PLOT THREAT MAP SYNCHRONIZATION
 * Memory-safe realtime stream ingestion for the request_log, preventing WebGL frame drops.
 */
export function useThreatMapSync() {
  const pointsRef = useRef<ThreatPoint[]>([]);
  // We only expose a version ticker to trigger WebGL repaints, not the whole array, to avoid deep diffing.
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    // 1. Initial Load of recent attacks
    const loadInitial = async () => {
      const { data } = await supabase
        .from('request_log')
        .select('id, latitude, longitude, is_bot')
        .not('latitude', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (data) {
        pointsRef.current = data.map(d => ({ 
          id: d.id, 
          lat: d.latitude, 
          lng: d.longitude, 
          is_bot: d.is_bot 
        }));
        setTicker(t => t + 1);
      }
    };

    loadInitial();

    // 2. The Realtime Synchronizer
    const channel = supabase.channel('realtime_threat_map')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'request_log' },
        (payload) => {
          const newDoc = payload.new;
          if (newDoc.latitude != null && newDoc.longitude != null) {
            // Append incoming threat natively (no React state array spreading)
            pointsRef.current.push({
              id: newDoc.id,
              lat: newDoc.latitude,
              lng: newDoc.longitude,
              is_bot: newDoc.is_bot
            });

            // Keep buffer capped to prevent OOM errors on WebGL rendering
            if (pointsRef.current.length > 5000) {
              pointsRef.current.shift();
            }

            // Flag the map canvas to repaint periodically, not per-event, if under heavy attack
            requestAnimationFrame(() => setTicker(Date.now()));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { points: pointsRef.current, repaintTicker: ticker };
}
