'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Availability toggle with integrated GPS tracking.
 * When operator toggles to Available:
 *  1. Requests location permission (native dialog)
 *  2. Starts GPS broadcasting every 30s
 * When toggled to Unavailable:
 *  - Stops all GPS tracking immediately
 */
export function AvailabilityToggle({ operatorId, initialStatus = 'unavailable' }: {
  operatorId: string;
  initialStatus?: 'available' | 'unavailable';
}) {
  const [status, setStatus] = useState(initialStatus);
  const [tracking, setTracking] = useState(false);
  const [permDenied, setPermDenied] = useState(false);

  const toggleAvailability = useCallback(async () => {
    const newStatus = status === 'available' ? 'unavailable' : 'available';

    if (newStatus === 'available') {
      // Start GPS tracking
      const { startTracking } = await import('@/lib/location/tracker');
      const started = await startTracking({
        operatorId,
        intervalMs: 30_000,
        onError: (err) => {
          if (err.message.includes('permission')) setPermDenied(true);
        },
      });
      if (!started) { setPermDenied(true); return; }
      setTracking(true);
    } else {
      // Stop GPS tracking
      const { stopTracking } = await import('@/lib/location/tracker');
      stopTracking();
      setTracking(false);

      // Clear server-side location
      fetch('/api/location/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId, lat: 0, lng: 0, clear: true }),
      }).catch(() => {});
    }

    // Update availability status
    await fetch('/api/profile/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator_id: operatorId, status: newStatus }),
    }).catch(() => {});

    setStatus(newStatus);
  }, [status, operatorId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tracking) {
        import('@/lib/location/tracker').then(m => m.stopTracking());
      }
    };
  }, [tracking]);

  const isAvailable = status === 'available';

  return (
    <div className="space-y-2">
      <button
        onClick={toggleAvailability}
        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-semibold text-sm transition-all
          ${isAvailable
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'}`}
      >
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          {isAvailable ? 'Available — GPS Broadcasting' : 'Unavailable'}
        </div>
        {tracking && (
          <span className="text-xs text-emerald-500/70">Live</span>
        )}
      </button>

      {permDenied && (
        <p className="text-red-400 text-xs px-2">Location permission denied. Enable in device settings to broadcast availability.</p>
      )}
    </div>
  );
}
