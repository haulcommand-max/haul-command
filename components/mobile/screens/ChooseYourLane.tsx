'use client';

import React, { useState } from 'react';

/* ══════════════════════════════════════════════════════════════
   Choose Your Lane — Role Selector
   First meaningful branching point after auth.
   Persists to localStorage and Supabase user_metadata.
   
   Roles:
   - escort_operator (pilot car operator + pilot driver unified)
   - broker_dispatcher (load posters, dispatchers, coordinators)
   - both (dual-role users)
   - other (future: installers, yards, gear vendors, etc.)
   ══════════════════════════════════════════════════════════════ */

export type UserRole = 'escort_operator' | 'broker_dispatcher' | 'both' | 'support_partner' | 'observer_researcher';

interface RoleLane {
  id: UserRole;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

const LANES: RoleLane[] = [
  {
    id: 'escort_operator',
    icon: '🚗',
    title: 'Escort Operator',
    subtitle: 'Pilot car · Lead / Chase · Height pole',
    description: 'Find work, get verified, build your rank, and respond to jobs fast.',
    color: '#D4A844',
  },
  {
    id: 'broker_dispatcher',
    icon: '📋',
    title: 'Broker / Dispatcher',
    subtitle: 'Post loads · Find coverage · Fill fast',
    description: 'Post loads, find verified operators, and fill escort slots in any corridor.',
    color: '#3B82F6',
  },
  {
    id: 'both',
    icon: '⚡',
    title: 'Both',
    subtitle: 'Dual-role operator + broker',
    description: 'Operate and dispatch. Switch between roles seamlessly.',
    color: '#A78BFA',
  },
  {
    id: 'support_partner',
    icon: '🏗',
    title: 'Support Partner',
    subtitle: 'Yard · Gear vendor · Safety trainer · Outfitter',
    description: 'Supply the ecosystem. List services, connect with operators and brokers, and grow your reach in the heavy haul market.',
    color: '#14B8A6',
  },
  {
    id: 'observer_researcher',
    icon: '📊',
    title: 'Observer / Researcher',
    subtitle: 'Analyst · Regulator · Journalist · Academic',
    description: 'Track market trends, corridor data, and industry intelligence. Read-only access to public dashboards and reports.',
    color: '#8B5CF6',
  },
];

interface ChooseYourLaneProps {
  onSelect: (role: UserRole) => void;
}

export function getStoredRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  try {
    return (localStorage.getItem('hc_user_role') as UserRole) || null;
  } catch {
    return null;
  }
}

export function setStoredRole(role: UserRole) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('hc_user_role', role);
  } catch { /* private browsing */ }

  // Sync to Supabase user_metadata for authenticated users (fire-and-forget)
  syncRoleToSupabase(role);
}

/**
 * Restore lane from Supabase user_metadata if available.
 * Called once on mount — overwrites localStorage with server state.
 */
export async function restoreRoleFromSupabase(): Promise<UserRole | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const serverRole = (user.user_metadata as Record<string, unknown>)?.hc_lane as UserRole | undefined;
    if (serverRole) {
      // Server wins — update localStorage to match
      try { localStorage.setItem('hc_user_role', serverRole); } catch {}
      return serverRole;
    }

    // User is logged in but no server role — push current local to server
    const localRole = getStoredRole();
    if (localRole) syncRoleToSupabase(localRole);
    return localRole;
  } catch {
    return null;
  }
}

async function syncRoleToSupabase(role: UserRole) {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // anonymous — skip
    await supabase.auth.updateUser({ data: { hc_lane: role } });
  } catch { /* non-critical — localStorage is primary fallback */ }
}

export default function ChooseYourLane({ onSelect }: ChooseYourLaneProps) {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [animating, setAnimating] = useState(false);

  const handleSelect = (role: UserRole) => {
    setSelected(role);
    setAnimating(true);
    setStoredRole(role);

    // Brief delay for visual feedback before routing
    setTimeout(() => {
      onSelect(role);
    }, 300);
  };

  return (
    <div style={{background: 'var(--m-bg, #050508)',minHeight: '100dvh',display: 'flex',flexDirection: 'column',padding: 'var(--m-2xl) var(--m-screen-pad)'}}>
      {/* Header */}
      <div style={{marginBottom: 'var(--m-3xl)',textAlign: 'center' }}>
        <div style={{fontSize: 'var(--m-font-overline)',fontWeight: 800,color: 'var(--m-gold)',textTransform: 'uppercase',letterSpacing: '0.2em',marginBottom: 'var(--m-sm)'}}>
          Haul Command
        </div>
        <h1 style={{fontSize: 'var(--m-font-display)',fontWeight: 900,color: 'var(--m-text-primary)',lineHeight: '34px',margin: 0}}>
          Choose Your Lane
        </h1>
        <p style={{fontSize: 'var(--m-font-body-sm)',color: 'var(--m-text-secondary)',marginTop: 'var(--m-sm)',lineHeight: 1.5}}>
          We&apos;ll shape your command center around how you operate.
          <br />
          <span style={{color: 'var(--m-text-muted)',fontSize: 'var(--m-font-caption)' }}>
            You can switch roles anytime in Settings.
          </span>
        </p>
      </div>

      {/* Role Cards */}
      <div style={{display: 'flex',flexDirection: 'column',gap: 'var(--m-md)',flex: 1 }}>
        {LANES.map((lane, i) => {
          const isSelected = selected === lane.id;
          return (
            <button aria-label="Interactive Button"
              key={lane.id}
              onClick={() => handleSelect(lane.id)}
              disabled={animating && !isSelected}
              className="m-animate-slide-up"
              style={{animationDelay: `${i * 60}ms`,display: 'flex',alignItems: 'center',gap: 'var(--m-md)',padding: 'var(--m-lg)',borderRadius: 'var(--m-radius-lg)',border: `1.5px solid ${isSelected ? lane.color : 'var(--m-border-subtle)'}`,background: isSelected
                  ? `${lane.color}10`
                  : 'var(--m-surface)',cursor: animating && !isSelected ? 'default' : 'pointer',opacity: animating && !isSelected ? 0.4 : 1,transition: 'all 0.25s ease',textAlign: 'left',width: '100%',transform: isSelected ? 'scale(1.02)' : 'scale(1)'}}
            >
              {/* Icon */}
              <div style={{width: 48,height: 48,borderRadius: 'var(--m-radius-md)',background: `${lane.color}15`,border: `1px solid ${lane.color}30`,display: 'flex',alignItems: 'center',justifyContent: 'center',fontSize: 22,flexShrink: 0,transition: 'transform 0.2s',transform: isSelected ? 'scale(1.1)' : 'scale(1)'}}>
                {lane.icon}
              </div>

              {/* Text */}
              <div style={{flex: 1,minWidth: 0 }}>
                <div style={{fontSize: 'var(--m-font-body)',fontWeight: 800,color: isSelected ? lane.color : 'var(--m-text-primary)',lineHeight: 1.2,transition: 'color 0.2s'}}>
                  {lane.title}
                </div>
                <div style={{fontSize: 'var(--m-font-caption)',color: 'var(--m-text-muted)',marginTop: 2}}>
                  {lane.subtitle}
                </div>
                <div style={{fontSize: 'var(--m-font-caption)',color: 'var(--m-text-secondary)',marginTop: 'var(--m-xs)',lineHeight: 1.4}}>
                  {lane.description}
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div style={{width: 24,height: 24,borderRadius: 'var(--m-radius-full)',background: lane.color,display: 'flex',alignItems: 'center',justifyContent: 'center',fontSize: 12,fontWeight: 900,color: '#000',flexShrink: 0}}>
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
