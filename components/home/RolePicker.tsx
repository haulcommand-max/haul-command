'use client';
// components/home/RolePicker.tsx
// Role picker with SVG icons, gold glow on selected state.
// Persists to localStorage + /api/role for Supabase hc_user_role_state.

import { useState, useCallback, type ReactNode } from 'react';

export type HcRole = 'pilot' | 'broker' | 'both' | 'support' | 'observer';

interface RolePickerProps {
  onRoleSelect?: (role: HcRole) => void;
  initialRole?: HcRole | null;
}

const ROLES: { id: HcRole; label: string; sub: string; icon: ReactNode }[] = [
  {
    id: 'pilot',
    label: 'Pilot Car Operator',
    sub: 'Escort vehicles, route surveys, high pole',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path d="M5 17H3v-4l2-5h10l4 5v4h-2" />
        <path d="M9 17h6" strokeLinecap="round" />
        <path d="M14 8V5" strokeLinecap="round" />
        <circle cx="14" cy="3.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'broker',
    label: 'Freight Broker',
    sub: 'Post loads, find escorts, manage dispatch',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
        <path d="M9 15h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'both',
    label: 'Both / Fleet',
    sub: 'Operate escorts and broker loads',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M3 12h18" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export function RolePicker({ onRoleSelect, initialRole }: RolePickerProps) {
  const [selected, setSelected] = useState<HcRole | null>(initialRole ?? null);
  const [saving, setSaving] = useState(false);

  const handleSelect = useCallback(async (role: HcRole) => {
    setSelected(role);
    setSaving(true);

    // Save to localStorage immediately
    try { localStorage.setItem('hc_role', role); } catch {}

    // Persist to Supabase via API
    try {
      await fetch('/api/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
    } catch {}

    setSaving(false);
    onRoleSelect?.(role);
  }, [onRoleSelect]);

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:max-w-2xl">
      {ROLES.map(role => {
        const isSelected = selected === role.id;
        return (
          <button
            key={role.id}
            onClick={() => handleSelect(role.id)}
            disabled={saving}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
              isSelected
                ? 'border-[#d4950e] shadow-[0_0_16px_rgba(212,149,14,0.15)] bg-[#12100a]'
                : 'border-[#1e3048] bg-[#0f1a24] hover:border-[#2a4060]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? 'text-[#d4950e] bg-[#2a1f08]' : 'text-[#566880] bg-[#141e28]'
              }`}
            >
              {role.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isSelected ? 'text-[#d4950e]' : 'text-[#d0dce8]'}`}>
                {role.label}
              </p>
              <p className="text-[10px] text-[#566880] mt-0.5">{role.sub}</p>
            </div>
            {isSelected && (
              <span className="text-[#d4950e] flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.6 6.4l-4 4a.8.8 0 01-1.1 0l-2-2a.8.8 0 011.1-1.1L7 8.7l3.4-3.4a.8.8 0 011.1 1.1z" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
