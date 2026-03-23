'use client';

/**
 * GPSStatusBar — Shows live GPS tracking status for operators.
 *
 * Displays:
 *  - Current position accuracy
 *  - Reporting status (online/offline)
 *  - Buffered breadcrumb count
 *  - Speed & heading
 */

import React from 'react';
import { useGeolocation } from '@/lib/gps/use-geolocation';
import { usePositionReporter } from '@/lib/gps/use-position-reporter';

interface GPSStatusBarProps {
  operatorId: string | null;
  isRunning?: boolean;
}

function headingToCompass(heading: number | null): string {
  if (heading == null) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(heading / 45) % 8];
}

export default function GPSStatusBar({ operatorId, isRunning = true }: GPSStatusBarProps) {
  const { position, error: gpsError, loading } = useGeolocation({ watch: true });
  const { reporting, bufferedCount, lastReportAt } = usePositionReporter({
    operatorId,
    position,
    isRunning,
  });

  if (!operatorId) return null;

  const lastReportStr = lastReportAt
    ? `${Math.round((Date.now() - lastReportAt) / 1000)}s ago`
    : 'never';

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 text-xs">
      {/* Status dot + label */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            gpsError
              ? 'bg-red-500'
              : loading
              ? 'bg-yellow-500 animate-pulse'
              : reporting
              ? 'bg-green-500 animate-pulse'
              : 'bg-yellow-500'
          }`}
        />
        <span className="text-gray-400 font-medium">
          {gpsError
            ? 'GPS Error'
            : loading
            ? 'Acquiring…'
            : reporting
            ? 'Transmitting'
            : 'GPS Ready'}
        </span>
      </div>

      {/* Position details */}
      {position && (
        <div className="flex items-center gap-3 text-gray-500">
          {position.speedMph != null && (
            <span className="text-white font-bold tabular-nums">
              {Math.round(position.speedMph)} mph {headingToCompass(position.heading)}
            </span>
          )}
          <span className="tabular-nums">±{Math.round(position.accuracy)}m</span>
          <span>{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
        </div>
      )}

      {/* Reporting status */}
      <div className="flex items-center gap-3 text-gray-500">
        {bufferedCount > 0 && (
          <span className="text-yellow-400 font-medium">
            {bufferedCount} buffered
          </span>
        )}
        <span>Last: {lastReportStr}</span>
      </div>

      {/* Error display */}
      {gpsError && (
        <span className="text-red-400 text-[10px]">{gpsError}</span>
      )}
    </div>
  );
}
