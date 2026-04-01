'use client';

import { useState, useCallback } from 'react';
import { Radio, CheckCircle, Clock, Moon, Wifi } from 'lucide-react';
import { track } from '@/lib/telemetry';
import type { AvailabilityStatus, EscortSpecialization } from '@/lib/capture';

// ══════════════════════════════════════════════════════════════
// AVAILABILITY QUICK-SET — One-tap availability update
// Shows in capture router, operator dashboard, and profile pages
// ══════════════════════════════════════════════════════════════

interface AvailabilityQuickSetProps {
  operatorId: string;
  currentStatus?: AvailabilityStatus;
  onStatusChange?: (status: AvailabilityStatus) => void;
  compact?: boolean;
}

const STATUS_CONFIG: Record<AvailabilityStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  available_now: {
    label: 'Available Now',
    icon: <Radio className="w-4 h-4" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Ready for immediate dispatch',
  },
  available_today: {
    label: 'Available Today',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/10',
    borderColor: 'border-lime-500/30',
    description: 'Available within a few hours',
  },
  available_this_week: {
    label: 'This Week',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Available for future booking',
  },
  booked: {
    label: 'Booked',
    icon: <Wifi className="w-4 h-4" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: 'Currently on a job',
  },
  offline: {
    label: 'Offline',
    icon: <Moon className="w-4 h-4" />,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    description: 'Not accepting jobs',
  },
  unknown: {
    label: 'Not Set',
    icon: <Radio className="w-4 h-4" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-800/50',
    borderColor: 'border-slate-700/30',
    description: 'Set your availability to appear in search',
  },
};

export default function AvailabilityQuickSet({
  operatorId,
  currentStatus = 'unknown',
  onStatusChange,
  compact = false,
}: AvailabilityQuickSetProps) {
  const [status, setStatus] = useState<AvailabilityStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSetStatus = useCallback(async (newStatus: AvailabilityStatus) => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/capture/set-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId, status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
        setSaved(true);
        onStatusChange?.(newStatus);
        track('availability_set' as any, {
          entity_type: 'operator',
          entity_id: operatorId,
          metadata: { status: newStatus },
        });
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to set availability:', err);
    } finally {
      setSaving(false);
    }
  }, [operatorId, onStatusChange]);

  const activeStatuses: AvailabilityStatus[] = [
    'available_now', 'available_today', 'available_this_week', 'booked', 'offline'
  ];

  if (compact) {
    return (
      <div className="flex gap-1.5">
        {activeStatuses.slice(0, 3).map((s) => {
          const config = STATUS_CONFIG[s];
          const isActive = status === s;
          return (
            <button
              key={s}
              onClick={() => handleSetStatus(s)}
              disabled={saving}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${isActive
                  ? `${config.bgColor} ${config.color} ${config.borderColor} border shadow-sm`
                  : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300 border border-transparent'
                }
                ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
              `}
              aria-label={`Set availability: ${config.label}`}
            >
              {config.icon}
              {config.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Set Availability</h3>
        {saved && (
          <span className="text-xs text-emerald-400 font-medium animate-in fade-in duration-200">
            ✓ Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2">
        {activeStatuses.map((s) => {
          const config = STATUS_CONFIG[s];
          const isActive = status === s;
          return (
            <button
              key={s}
              onClick={() => handleSetStatus(s)}
              disabled={saving}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                ${isActive
                  ? `${config.bgColor} ${config.borderColor} border-2 shadow-md`
                  : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10'
                }
                ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
              `}
              aria-label={`Set availability: ${config.label}`}
            >
              <div className={`${config.color}`}>{config.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isActive ? config.color : 'text-slate-300'}`}>
                  {config.label}
                </p>
                <p className="text-xs text-slate-500">{config.description}</p>
              </div>
              {isActive && (
                <CheckCircle className={`w-4 h-4 ${config.color} shrink-0`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
