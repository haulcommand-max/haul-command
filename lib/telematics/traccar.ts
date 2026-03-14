// ============================================================
// Haul Command — Telematics Abstraction Layer
// Current provider: Traccar
// Previous: Navixy (can be swapped back via TelemProvider type)
//
// This layer abstracts GPS tracking, geofences, alerts, and
// evidence collection so the provider can be swapped without
// touching business logic.
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

// ── Provider Abstraction ──

export type TelemProvider = 'traccar' | 'navixy';

export interface TelemPosition {
  deviceId: string;
  lat: number;
  lng: number;
  speed: number;       // mph
  heading: number;      // degrees
  altitude: number;     // meters
  timestamp: string;    // ISO 8601
  attributes?: Record<string, unknown>;
}

export interface TelemDevice {
  id: string;
  name: string;
  uniqueId: string;     // IMEI or serial
  status: 'online' | 'offline' | 'unknown';
  lastUpdate?: string;
  position?: TelemPosition;
  attributes?: Record<string, unknown>;
}

export interface TelemGeofence {
  id: string;
  name: string;
  description?: string;
  area: string;         // WKT geometry
  attributes?: Record<string, unknown>;
}

export interface TelemAlert {
  id: string;
  deviceId: string;
  type: 'geofenceEnter' | 'geofenceExit' | 'speedLimit' | 'hardBrake' | 'hardAccel' | 'ignitionOn' | 'ignitionOff' | 'sos' | 'custom';
  timestamp: string;
  lat: number;
  lng: number;
  attributes?: Record<string, unknown>;
}

// ── Traccar Configuration ──

const TRACCAR_API_URL = () => process.env.TRACCAR_API_URL || 'http://localhost:8082/api';
const TRACCAR_API_TOKEN = () => process.env.TRACCAR_API_TOKEN || '';
const TRACCAR_USER = () => process.env.TRACCAR_USER || '';
const TRACCAR_PASS = () => process.env.TRACCAR_PASS || '';

function traccarHeaders(): Record<string, string> {
  const token = TRACCAR_API_TOKEN();
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }
  // Fallback to basic auth
  const encoded = Buffer.from(`${TRACCAR_USER()}:${TRACCAR_PASS()}`).toString('base64');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${encoded}`,
  };
}

async function traccarFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = `${TRACCAR_API_URL()}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...traccarHeaders(), ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Traccar] ${opts?.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Conversion Helpers ──

function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371 * 10) / 10;
}

function traccarPositionToTelem(p: any): TelemPosition {
  return {
    deviceId: String(p.deviceId),
    lat: p.latitude,
    lng: p.longitude,
    speed: kmhToMph(p.speed || 0),
    heading: p.course || 0,
    altitude: p.altitude || 0,
    timestamp: p.fixTime || p.deviceTime || new Date().toISOString(),
    attributes: p.attributes || {},
  };
}

function traccarDeviceToTelem(d: any, position?: any): TelemDevice {
  return {
    id: String(d.id),
    name: d.name || '',
    uniqueId: d.uniqueId || '',
    status: d.status === 'online' ? 'online' : d.status === 'offline' ? 'offline' : 'unknown',
    lastUpdate: d.lastUpdate || undefined,
    position: position ? traccarPositionToTelem(position) : undefined,
    attributes: d.attributes || {},
  };
}

// ── Public API ──

/**
 * List all tracked devices.
 */
export async function listDevices(): Promise<TelemDevice[]> {
  if (!isEnabled('TRACCAR')) return [];
  const devices = await traccarFetch<any[]>('/devices');
  return devices.map(d => traccarDeviceToTelem(d));
}

/**
 * Get a single device by ID.
 */
export async function getDevice(deviceId: string): Promise<TelemDevice | null> {
  if (!isEnabled('TRACCAR')) return null;
  try {
    const devices = await traccarFetch<any[]>(`/devices?id=${deviceId}`);
    return devices[0] ? traccarDeviceToTelem(devices[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Get latest positions for all devices.
 */
export async function getPositions(): Promise<TelemPosition[]> {
  if (!isEnabled('TRACCAR')) return [];
  const positions = await traccarFetch<any[]>('/positions');
  return positions.map(traccarPositionToTelem);
}

/**
 * Get position history for a device within a time window.
 */
export async function getPositionHistory(
  deviceId: string,
  from: Date,
  to: Date
): Promise<TelemPosition[]> {
  if (!isEnabled('TRACCAR')) return [];
  const params = new URLSearchParams({
    deviceId,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const positions = await traccarFetch<any[]>(`/positions?${params}`);
  return positions.map(traccarPositionToTelem);
}

/**
 * Create a geofence.
 */
export async function createGeofence(
  name: string,
  area: string,
  description?: string
): Promise<TelemGeofence | null> {
  if (!isEnabled('TRACCAR')) return null;
  const result = await traccarFetch<any>('/geofences', {
    method: 'POST',
    body: JSON.stringify({ name, area, description: description || '' }),
  });
  return {
    id: String(result.id),
    name: result.name,
    description: result.description,
    area: result.area,
    attributes: result.attributes,
  };
}

/**
 * List all geofences.
 */
export async function listGeofences(): Promise<TelemGeofence[]> {
  if (!isEnabled('TRACCAR')) return [];
  const fences = await traccarFetch<any[]>('/geofences');
  return fences.map(f => ({
    id: String(f.id),
    name: f.name,
    description: f.description,
    area: f.area,
    attributes: f.attributes,
  }));
}

/**
 * Register a new device.
 */
export async function registerDevice(
  name: string,
  uniqueId: string,
  attributes?: Record<string, unknown>
): Promise<TelemDevice | null> {
  if (!isEnabled('TRACCAR')) return null;
  const result = await traccarFetch<any>('/devices', {
    method: 'POST',
    body: JSON.stringify({ name, uniqueId, attributes: attributes || {} }),
  });
  return traccarDeviceToTelem(result);
}

/**
 * Get recent alerts/events for a device.
 */
export async function getAlerts(
  deviceId?: string,
  from?: Date,
  to?: Date
): Promise<TelemAlert[]> {
  if (!isEnabled('TRACCAR')) return [];
  const params = new URLSearchParams();
  if (deviceId) params.set('deviceId', deviceId);
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());
  
  const events = await traccarFetch<any[]>(`/events?${params}`);
  return events.map(e => ({
    id: String(e.id),
    deviceId: String(e.deviceId),
    type: mapTraccarEventType(e.type),
    timestamp: e.eventTime || e.serverTime,
    lat: e.positionLatitude || 0,
    lng: e.positionLongitude || 0,
    attributes: e.attributes || {},
  }));
}

function mapTraccarEventType(type: string): TelemAlert['type'] {
  const map: Record<string, TelemAlert['type']> = {
    geofenceEnter: 'geofenceEnter',
    geofenceExit: 'geofenceExit',
    deviceOverspeed: 'speedLimit',
    hardBraking: 'hardBrake',
    hardAcceleration: 'hardAccel',
    ignitionOn: 'ignitionOn',
    ignitionOff: 'ignitionOff',
    alarm: 'sos',
  };
  return map[type] || 'custom';
}

/**
 * Health check — verify Traccar API is reachable.
 */
export async function healthCheck(): Promise<boolean> {
  if (!isEnabled('TRACCAR')) return false;
  try {
    await traccarFetch('/server');
    return true;
  } catch {
    return false;
  }
}
