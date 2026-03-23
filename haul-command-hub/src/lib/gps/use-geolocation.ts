'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null; // m/s from browser API
  speedMph: number | null;
  timestamp: number;
}

export interface UseGeolocationOptions {
  /** Enable high accuracy (GPS vs cell tower) */
  highAccuracy?: boolean;
  /** Max age of cached position in ms (default: 10s) */
  maxAge?: number;
  /** Timeout for position request in ms (default: 15s) */
  timeout?: number;
  /** Watch continuously vs one-shot */
  watch?: boolean;
}

export interface UseGeolocationReturn {
  position: GPSPosition | null;
  error: string | null;
  loading: boolean;
  /** Whether the browser supports geolocation */
  supported: boolean;
  /** Request a fresh position */
  refresh: () => void;
  /** Stop watching (if in watch mode) */
  stop: () => void;
}

// ═══════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    highAccuracy = true,
    maxAge = 10_000,
    timeout = 15_000,
    watch = false,
  } = options;

  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    const speedMs = pos.coords.speed;
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: speedMs,
      speedMph: speedMs != null ? speedMs * 2.237 : null,
      timestamp: pos.timestamp,
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Location access denied — enable GPS in your settings',
      2: 'Position unavailable — check your connection',
      3: 'Location request timed out — try again',
    };
    setError(messages[err.code] || 'Location unavailable');
    setLoading(false);
  }, []);

  const geoOptions: PositionOptions = {
    enableHighAccuracy: highAccuracy,
    maximumAge: maxAge,
    timeout,
  };

  const refresh = useCallback(() => {
    if (!supported) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!supported) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions,
      );
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
    }

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, watch]);

  return { position, error, loading, supported, refresh, stop };
}
