'use client';

/**
 * Position Reporter — Push pilot GPS to the server in real time.
 *
 * Features:
 *  - Automatic interval-based reporting (every 30s when running)
 *  - Offline breadcrumb buffering with bulk sync on reconnect
 *  - Deduplication — skips reports if pilot hasn't moved
 *  - Battery-friendly — respects standby mode
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { GPSPosition } from './use-geolocation';

// ═══════════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════════

const REPORT_INTERVAL_MS = 30_000; // 30 seconds
const MIN_DISTANCE_METERS = 50;    // Don't report if moved < 50m
const BREADCRUMB_STORAGE_KEY = 'hc_gps_breadcrumbs';
const MAX_STORED_BREADCRUMBS = 500;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface Breadcrumb {
  operator_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  source: string;
  recorded_at: string;
}

interface UsePositionReporterOptions {
  operatorId: string | null;
  position: GPSPosition | null;
  /** Whether operator is actively running (not on standby) */
  isRunning?: boolean;
  /** Enable offline breadcrumb buffering */
  offlineBuffer?: boolean;
}

interface UsePositionReporterReturn {
  /** Whether we're currently online and reporting */
  reporting: boolean;
  /** Number of buffered breadcrumbs waiting to sync */
  bufferedCount: number;
  /** Last successful report timestamp */
  lastReportAt: number | null;
  /** Force an immediate position report */
  reportNow: () => Promise<void>;
  /** Flush all buffered breadcrumbs to the server */
  flushBreadcrumbs: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function haversineDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getStoredBreadcrumbs(): Breadcrumb[] {
  try {
    const raw = localStorage.getItem(BREADCRUMB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeBreadcrumbs(breadcrumbs: Breadcrumb[]) {
  try {
    // Keep only the most recent
    const trimmed = breadcrumbs.slice(-MAX_STORED_BREADCRUMBS);
    localStorage.setItem(BREADCRUMB_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — clear and start fresh
    localStorage.removeItem(BREADCRUMB_STORAGE_KEY);
  }
}

// ═══════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════

export function usePositionReporter(
  options: UsePositionReporterOptions,
): UsePositionReporterReturn {
  const { operatorId, position, isRunning = true, offlineBuffer = true } = options;

  const [reporting, setReporting] = useState(false);
  const [bufferedCount, setBufferedCount] = useState(0);
  const [lastReportAt, setLastReportAt] = useState<number | null>(null);

  const lastReportedRef = useRef<{ lat: number; lng: number } | null>(null);

  // ─── Report Position ─────────────────────────────────────────

  const reportPosition = useCallback(async (pos: GPSPosition) => {
    if (!operatorId) return;

    // Dedup — skip if we haven't moved significantly
    if (lastReportedRef.current) {
      const dist = haversineDistanceMeters(
        lastReportedRef.current.lat, lastReportedRef.current.lng,
        pos.lat, pos.lng,
      );
      if (dist < MIN_DISTANCE_METERS) return;
    }

    const payload = {
      operator_id: operatorId,
      lat: pos.lat,
      lng: pos.lng,
      accuracy: pos.accuracy,
      heading: pos.heading,
      speed: pos.speedMph,
      source: 'phone',
    };

    try {
      const res = await fetch('/api/operator/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        lastReportedRef.current = { lat: pos.lat, lng: pos.lng };
        setLastReportAt(Date.now());
        setReporting(true);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      // Offline — buffer as breadcrumb
      if (offlineBuffer) {
        const breadcrumb: Breadcrumb = {
          operator_id: operatorId,
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          heading: pos.heading ?? undefined,
          speed: pos.speedMph ?? undefined,
          source: 'phone',
          recorded_at: new Date(pos.timestamp).toISOString(),
        };
        const existing = getStoredBreadcrumbs();
        existing.push(breadcrumb);
        storeBreadcrumbs(existing);
        setBufferedCount(existing.length);
      }
      setReporting(false);
    }
  }, [operatorId, offlineBuffer]);

  // ─── Flush Buffered Breadcrumbs ──────────────────────────────

  const flushBreadcrumbs = useCallback(async () => {
    const breadcrumbs = getStoredBreadcrumbs();
    if (!breadcrumbs.length) return;

    try {
      const res = await fetch('/api/operator/breadcrumbs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breadcrumbs }),
      });

      if (res.ok) {
        localStorage.removeItem(BREADCRUMB_STORAGE_KEY);
        setBufferedCount(0);
      }
    } catch {
      // Still offline — keep buffered
    }
  }, []);

  // ─── Report Now ──────────────────────────────────────────────

  const reportNow = useCallback(async () => {
    if (position) {
      await reportPosition(position);
    }
  }, [position, reportPosition]);

  // ─── Interval Reporter ───────────────────────────────────────

  useEffect(() => {
    if (!operatorId || !isRunning || !position) return;

    // Report immediately on start
    reportPosition(position);

    // Flush any buffered breadcrumbs when we come online
    flushBreadcrumbs();

    const interval = setInterval(() => {
      if (position) {
        reportPosition(position);
      }
    }, REPORT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [operatorId, isRunning, position, reportPosition, flushBreadcrumbs]);

  // ─── Online/Offline Event Listeners ──────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      flushBreadcrumbs();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushBreadcrumbs]);

  // ─── Init breadcrumb count ───────────────────────────────────

  useEffect(() => {
    setBufferedCount(getStoredBreadcrumbs().length);
  }, []);

  return {
    reporting,
    bufferedCount,
    lastReportAt,
    reportNow,
    flushBreadcrumbs,
  };
}
