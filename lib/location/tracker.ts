// lib/location/tracker.ts
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — App-Native GPS Location Tracker
// ═══════════════════════════════════════════════════════════════
// Uses phone GPS (Capacitor Geolocation) or Motive ELD GPS.
// When operator toggles "Available" → start broadcasting position.
// When operator toggles "Unavailable" → stop broadcasting.
// Falls back to browser navigator.geolocation on web.
// ═══════════════════════════════════════════════════════════════

type PositionUpdate = {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: string;
};

let watchId: string | number | null = null;
let broadcastInterval: ReturnType<typeof setInterval> | null = null;
let lastPosition: PositionUpdate | null = null;
let operatorId: string | null = null;

// ── Platform Detection ──
function isCapacitor(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
}

// ── Permission Request ──
export async function requestLocationPermission(): Promise<boolean> {
  if (isCapacitor()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted' || status.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }
  // Browser fallback
  if (!navigator.geolocation) return false;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ── Start Tracking ──
export async function startTracking(opId: string): Promise<boolean> {
  operatorId = opId;

  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('[LocationTracker] Permission denied');
    return false;
  }

  if (isCapacitor()) {
    return startCapacitorTracking();
  }
  return startBrowserTracking();
}

async function startCapacitorTracking(): Promise<boolean> {
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      (position, err) => {
        if (err || !position) return;
        lastPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toISOString(),
        };
      }
    );

    // Broadcast every 30 seconds
    broadcastInterval = setInterval(() => broadcastPosition(), 30000);
    // Immediate first broadcast
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    lastPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: new Date(pos.timestamp).toISOString(),
    };
    await broadcastPosition();

    console.log('[LocationTracker] Capacitor tracking started');
    return true;
  } catch (err) {
    console.error('[LocationTracker] Capacitor tracking failed:', err);
    return false;
  }
}

function startBrowserTracking(): boolean {
  if (!navigator.geolocation) return false;

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      lastPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: new Date(position.timestamp).toISOString(),
      };
    },
    (err) => console.warn('[LocationTracker] Browser GPS error:', err.message),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );

  broadcastInterval = setInterval(() => broadcastPosition(), 30000);
  console.log('[LocationTracker] Browser tracking started');
  return true;
}

// ── Stop Tracking ──
export async function stopTracking(): Promise<void> {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }

  if (watchId !== null) {
    if (isCapacitor()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        await Geolocation.clearWatch({ id: watchId as string });
      } catch { /* ignore */ }
    } else if (typeof watchId === 'number') {
      navigator.geolocation.clearWatch(watchId);
    }
    watchId = null;
  }

  // Send final "offline" signal
  if (operatorId) {
    try {
      await fetch('/api/location/update', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId }),
      });
    } catch { /* offline — will auto-expire via 5min TTL */ }
  }

  lastPosition = null;
  operatorId = null;
  console.log('[LocationTracker] Tracking stopped');
}

// ── Broadcast Position to Server ──
async function broadcastPosition(): Promise<void> {
  if (!lastPosition || !operatorId) return;

  try {
    const res = await fetch('/api/location/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator_id: operatorId,
        lat: lastPosition.lat,
        lng: lastPosition.lng,
        accuracy: lastPosition.accuracy,
        heading: lastPosition.heading,
        speed: lastPosition.speed,
        timestamp: lastPosition.timestamp,
      }),
    });

    if (!res.ok) {
      console.warn('[LocationTracker] Broadcast failed:', res.status);
      // Queue for offline sync if needed
      queueOfflineBreadcrumb(lastPosition);
    }
  } catch {
    // Offline — queue breadcrumb
    queueOfflineBreadcrumb(lastPosition);
  }
}

// ── Offline Queue (IndexedDB) ──
function queueOfflineBreadcrumb(pos: PositionUpdate): void {
  if (typeof indexedDB === 'undefined') return;
  try {
    const request = indexedDB.open('hc_offline', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('breadcrumbs')) {
        db.createObjectStore('breadcrumbs', { autoIncrement: true });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('breadcrumbs', 'readwrite');
      tx.objectStore('breadcrumbs').add({
        operator_id: operatorId,
        ...pos,
        queued_at: new Date().toISOString(),
      });
    };
  } catch { /* silently fail */ }
}

// ── Sync Offline Breadcrumbs ──
export async function syncOfflineBreadcrumbs(): Promise<number> {
  if (typeof indexedDB === 'undefined') return 0;
  return new Promise((resolve) => {
    const request = indexedDB.open('hc_offline', 1);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('breadcrumbs')) { resolve(0); return; }
      const tx = db.transaction('breadcrumbs', 'readwrite');
      const store = tx.objectStore('breadcrumbs');
      const getAll = store.getAll();
      getAll.onsuccess = async () => {
        const items = getAll.result;
        if (!items.length) { resolve(0); return; }
        try {
          await fetch('/api/location/sync-breadcrumbs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ breadcrumbs: items }),
          });
          store.clear();
          resolve(items.length);
        } catch {
          resolve(0);
        }
      };
    };
  });
}

// ── Public Getters ──
export function getLastPosition(): PositionUpdate | null {
  return lastPosition;
}

export function isTracking(): boolean {
  return watchId !== null;
}
