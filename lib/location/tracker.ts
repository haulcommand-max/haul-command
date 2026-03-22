/**
 * HAUL COMMAND — GPS Location Tracker
 *
 * Uses @capacitor/geolocation for native iOS/Android GPS.
 * Falls back to browser navigator.geolocation on web.
 * Broadcasts position every 30s while operator is available.
 * Prefers Motive GPS when connected.
 */

type Position = {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

type TrackerOptions = {
  operatorId: string;
  intervalMs?: number;
  onPosition?: (pos: Position) => void;
  onError?: (err: Error) => void;
};

let _watchId: number | null = null;
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _isTracking = false;
let _lastPosition: Position | null = null;

async function getCapacitorGeolocation() {
  try {
    const mod = await import('@capacitor/geolocation');
    return mod.Geolocation;
  } catch {
    return null;
  }
}

async function requestPermission(): Promise<boolean> {
  const Geo = await getCapacitorGeolocation();
  if (Geo) {
    try {
      const status = await Geo.requestPermissions();
      return status.location === 'granted' || status.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }
  // Browser fallback — permission is requested implicitly
  return true;
}

async function getCurrentPosition(): Promise<Position | null> {
  const Geo = await getCapacitorGeolocation();
  if (Geo) {
    try {
      const pos = await Geo.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        timestamp: pos.timestamp,
      };
    } catch {
      return null;
    }
  }
  // Browser fallback
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
  return null;
}

async function sendPosition(operatorId: string, pos: Position): Promise<boolean> {
  try {
    const res = await fetch('/api/location/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator_id: operatorId,
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        heading: pos.heading,
        speed: pos.speed,
        timestamp: new Date(pos.timestamp).toISOString(),
      }),
    });
    return res.ok;
  } catch {
    // Queue for offline sync
    try {
      const { offlineQueue } = await import('@/lib/offline/queue');
      await offlineQueue.enqueue({
        url: '/api/location/update',
        method: 'POST',
        body: {
          operator_id: operatorId,
          lat: pos.lat, lng: pos.lng,
          accuracy: pos.accuracy,
          heading: pos.heading, speed: pos.speed,
          timestamp: new Date(pos.timestamp).toISOString(),
        },
      });
    } catch { /* IndexedDB unavailable */ }
    return false;
  }
}

export async function startTracking(opts: TrackerOptions): Promise<boolean> {
  if (_isTracking) return true;
  const granted = await requestPermission();
  if (!granted) {
    opts.onError?.(new Error('Location permission denied'));
    return false;
  }

  _isTracking = true;
  const interval = opts.intervalMs ?? 30_000;

  const tick = async () => {
    const pos = await getCurrentPosition();
    if (pos) {
      _lastPosition = pos;
      opts.onPosition?.(pos);
      await sendPosition(opts.operatorId, pos);
    }
  };

  // Immediate first position
  await tick();
  _intervalId = setInterval(tick, interval);
  return true;
}

export function stopTracking(): void {
  _isTracking = false;
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  if (_watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(_watchId);
    _watchId = null;
  }
  _lastPosition = null;
}

export function isTracking(): boolean { return _isTracking; }
export function getLastPosition(): Position | null { return _lastPosition; }
