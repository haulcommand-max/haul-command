'use client';

/**
 * hooks/useNextMoves.ts
 * ══════════════════════════════════════════════════════════════
 * Client-side React hook that assembles UserSignals from:
 *   1. localStorage (role, visitCount, lastActiveAt, bouncedLast)
 *   2. sessionStorage (hasVisitedDirectory, etc.)
 *   3. Props passed down from server (loadsNearby, demandscore, etc.)
 *   4. Browser geolocation (if permitted — graceful fallback)
 *
 * Then calls resolveNextMoves() and returns the result.
 * Re-resolves on role change.
 *
 * PostHog events fire on click, not on render.
 * ══════════════════════════════════════════════════════════════
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  resolveNextMoves,
  getTopMoves,
  type NextMove,
  type UserSignals,
  DEFAULT_SIGNALS,
} from '@/lib/next-moves-engine';
import { ROLE_STORAGE_KEY, type HCRole } from '@/lib/role-config';

export interface UseNextMovesOptions {
  /** Max moves to return. Default 3. */
  count?: number;
  /** Server-fetched signals to merge (loadsNearby, demandscore, etc.) */
  serverSignals?: Partial<UserSignals>;
  /** Authenticated user data if available */
  authUser?: {
    id: string;
    role?: HCRole;
    hasClaim?: boolean;
    profileCompletionPct?: number;
    hasPostedLoad?: boolean;
    activeLoadCount?: number;
    hasCertifications?: boolean;
    savedCorridors?: string[];
  } | null;
}

export interface UseNextMovesResult {
  moves: NextMove[];
  primaryMove: NextMove | null;
  isLoading: boolean;
  role: HCRole | null;
  setRole: (role: HCRole) => void;
  /** Call this when user clicks a move — fires PostHog event */
  trackMoveClick: (move: NextMove) => void;
}

// Visit tracking constants
const VISIT_COUNT_KEY = 'hc_visit_count';
const LAST_VISIT_KEY = 'hc_last_visit';
const BOUNCED_KEY = 'hc_bounced';
const VISITED_DIR_KEY = 'hc_visited_dir';
const VISITED_LOADS_KEY = 'hc_visited_loads';
const VISITED_TOOLS_KEY = 'hc_visited_tools';

function readLocalInt(key: string, fallback = 0): number {
  if (typeof window === 'undefined') return fallback;
  try {
    return parseInt(localStorage.getItem(key) || String(fallback), 10);
  } catch {
    return fallback;
  }
}

function readLocalBool(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function daysSince(isoString: string | null): number {
  if (!isoString) return 0;
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function useNextMoves({
  count = 3,
  serverSignals,
  authUser,
}: UseNextMovesOptions = {}): UseNextMovesResult {
  const [role, setRoleState] = useState<HCRole | null>(null);
  const [moves, setMoves] = useState<NextMove[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedRef = useRef(false);

  // Increment visit count on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const prev = readLocalInt(VISIT_COUNT_KEY, 0);
      localStorage.setItem(VISIT_COUNT_KEY, String(prev + 1));
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      // Mark as not bounced (they loaded this page)
      localStorage.setItem(BOUNCED_KEY, '0');
    } catch {}
  }, []);

  // Read role from localStorage on mount (or from authUser)
  useEffect(() => {
    if (authUser?.role) {
      setRoleState(authUser.role);
      return;
    }
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY) as HCRole | null;
      if (stored) setRoleState(stored);
    } catch {}
  }, [authUser?.role]);

  // Resolve moves whenever inputs change
  useEffect(() => {
    const localSignals: Partial<UserSignals> = {
      role: authUser?.role ?? role,
      isAuthenticated: !!authUser,
      hasProfile: authUser?.hasClaim ?? false,
      profileComplete: (authUser?.profileCompletionPct ?? 0) >= 90,
      profileCompletionPct: authUser?.profileCompletionPct ?? 0,
      hasClaim: authUser?.hasClaim ?? false,
      hasCertifications: authUser?.hasCertifications ?? false,
      hasPostedLoad: authUser?.hasPostedLoad ?? false,
      activeLoadCount: authUser?.activeLoadCount ?? 0,
      savedCorridors: authUser?.savedCorridors ?? [],
      visitCount: readLocalInt(VISIT_COUNT_KEY, 1),
      daysSinceLastVisit: daysSince(
        typeof window !== 'undefined' ? localStorage.getItem(LAST_VISIT_KEY) : null
      ),
      bouncedLast: readLocalBool(BOUNCED_KEY),
      hasVisitedDirectory: readLocalBool(VISITED_DIR_KEY),
      hasVisitedLoads: readLocalBool(VISITED_LOADS_KEY),
      hasVisitedTools: readLocalBool(VISITED_TOOLS_KEY),
    };

    const merged: Partial<UserSignals> = {
      ...serverSignals,
      ...localSignals,
      // localSignals wins on behavior; serverSignals wins on market data
      loadsNearby: serverSignals?.loadsNearby ?? 0,
      demandscore: serverSignals?.demandscore ?? 0,
      operatorsBelowSupply: serverSignals?.operatorsBelowSupply ?? false,
      unclaimedRegion: serverSignals?.unclaimedRegion ?? false,
      detectedState: serverSignals?.detectedState ?? localSignals.detectedState ?? null,
      detectedRegion: serverSignals?.detectedRegion ?? localSignals.detectedRegion ?? null,
    };

    const resolved = getTopMoves(merged, count);
    setMoves(resolved);
    setIsLoading(false);
    resolvedRef.current = true;
  }, [role, authUser, serverSignals, count]);

  const setRole = useCallback((newRole: HCRole) => {
    setRoleState(newRole);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ROLE_STORAGE_KEY, newRole);
      }
    } catch {}
  }, []);

  // PostHog click tracking — lazy import to keep bundle lean
  const trackMoveClick = useCallback(async (move: NextMove) => {
    if (!move.analyticsEvent || typeof window === 'undefined') return;
    try {
      const { posthog } = await import('@/lib/posthog');
      posthog.capture(move.analyticsEvent, {
        move_id: move.id,
        move_category: move.category,
        move_urgency: move.urgency,
        move_trigger: move.trigger,
        role: role ?? 'anonymous',
        href: move.href,
      });
    } catch {}
  }, [role]);

  return {
    moves,
    primaryMove: moves[0] ?? null,
    isLoading,
    role,
    setRole,
    trackMoveClick,
  };
}
