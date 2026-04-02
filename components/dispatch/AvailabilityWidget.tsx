'use client';

/**
 * AvailabilityWidget — Operator availability quick-set
 *
 * Purpose: This widget lets operators toggle their availability status
 * (available / busy / offline) and push their current GPS position.
 * This populates the `operator_availability` table that the match engine
 * queries during candidate generation (Stage 1).
 *
 * Without this widget, `operator_availability.availability_status` stays
 * 'offline' forever and the match engine finds zero candidates.
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type AvailabilityStatus = 'available' | 'busy' | 'offline';

interface AvailabilityState {
  status: AvailabilityStatus;
  lat: number | null;
  lng: number | null;
  lastUpdated: string | null;
  activeJobs: number;
}

const STATUS_CONFIG: Record<AvailabilityStatus, { color: string; bg: string; icon: string; label: string }> = {
  available: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: '🟢', label: 'Available' },
  busy: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🟡', label: 'On a Job' },
  offline: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '⚫', label: 'Offline' },
};

export default function AvailabilityWidget({ className = '' }: { className?: string }) {
  const [state, setState] = useState<AvailabilityState>({
    status: 'offline', lat: null, lng: null, lastUpdated: null, activeJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Load current state
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('operator_availability')
        .select('availability_status, last_known_lat, last_known_lon, active_job_count, updated_at')
        .eq('operator_id', user.id)
        .maybeSingle();

      if (data) {
        setState({
          status: (data as any).availability_status || 'offline',
          lat: (data as any).last_known_lat,
          lng: (data as any).last_known_lon,
          lastUpdated: (data as any).updated_at,
          activeJobs: (data as any).active_job_count || 0,
        });
      }
      setLoading(false);
    })();
  }, [supabase]);

  const updatePosition = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported');
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationError(null);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setLocationError(err.code === 1 ? 'Location access denied' : 'Location unavailable');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const setStatus = async (newStatus: AvailabilityStatus) => {
    if (!userId || updating) return;
    setUpdating(true);

    let position: { lat: number; lng: number } | null = null;
    if (newStatus === 'available') {
      position = await updatePosition();
    }

    const update: Record<string, any> = {
      operator_id: userId,
      availability_status: newStatus,
      updated_at: new Date().toISOString(),
      last_active_at: newStatus !== 'offline' ? new Date().toISOString() : undefined,
    };

    if (position) {
      update.last_known_lat = position.lat;
      update.last_known_lon = position.lng;
    }

    const { error } = await supabase
      .from('operator_availability')
      .upsert(update, { onConflict: 'operator_id' });

    if (!error) {
      setState(prev => ({
        ...prev,
        status: newStatus,
        lat: position?.lat ?? prev.lat,
        lng: position?.lng ?? prev.lng,
        lastUpdated: update.updated_at,
      }));
    }

    setUpdating(false);
  };

  // Auto-refresh position every 5 minutes when available
  useEffect(() => {
    if (state.status !== 'available' || !userId) return;

    const interval = setInterval(async () => {
      const position = await updatePosition();
      if (position) {
        await supabase
          .from('operator_availability')
          .update({
            last_known_lat: position.lat,
            last_known_lon: position.lng,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('operator_id', userId);

        setState(prev => ({ ...prev, lat: position.lat, lng: position.lng }));
      }
    }, 300_000); // 5 minutes

    return () => clearInterval(interval);
  }, [state.status, userId, supabase, updatePosition]);

  if (loading) {
    return (
      <div className={className} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Loading status...</div>
      </div>
    );
  }

  if (!userId) return null;

  const cfg = STATUS_CONFIG[state.status];

  return (
    <div className={className} style={{
      background: cfg.bg,
      border: `1px solid ${cfg.color}22`,
      borderRadius: 14,
      padding: '14px 16px',
      transition: 'all 0.3s',
    }}>
      {/* Current Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
            {state.lastUpdated && (
              <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginTop: 1 }}>
                Updated {new Date(state.lastUpdated).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        {state.activeJobs > 0 && (
          <div style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 10, fontWeight: 800 }}>
            {state.activeJobs} active job{state.activeJobs > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Status Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(Object.keys(STATUS_CONFIG) as AvailabilityStatus[]).map(s => {
          const sc = STATUS_CONFIG[s];
          const isActive = state.status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={updating || isActive}
              aria-label={`Set status to ${sc.label}`}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 8,
                background: isActive ? sc.color : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? sc.color : 'rgba(255,255,255,0.08)'}`,
                color: isActive ? '#fff' : '#94a3b8',
                fontSize: 11,
                fontWeight: 700,
                cursor: updating || isActive ? 'default' : 'pointer',
                opacity: updating ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {sc.icon} {sc.label}
            </button>
          );
        })}
      </div>

      {/* Location status */}
      {state.status === 'available' && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#64748b', fontWeight: 600 }}>
          {locationError ? (
            <span style={{ color: '#ef4444' }}>⚠ {locationError}</span>
          ) : state.lat ? (
            <span>📍 Position shared: {state.lat.toFixed(4)}, {state.lng?.toFixed(4)}</span>
          ) : (
            <span>📍 Getting position...</span>
          )}
        </div>
      )}
    </div>
  );
}
