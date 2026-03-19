'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type HCRole, type RoleConfig, ROLE_CONFIGS, ROLE_STORAGE_KEY, isValidRole } from './role-config';

// ─── Context Shape ───────────────────────────────────────────

interface RoleContextValue {
  /** Current selected role, or null if no role chosen yet */
  role: HCRole | null;
  /** Resolved config for the current role (null if no role) */
  config: RoleConfig | null;
  /** Whether a role has been selected */
  hasRole: boolean;
  /** Set/change the user's role */
  setRole: (role: HCRole) => void;
  /** Clear role selection (returns to selector) */
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  config: null,
  hasRole: false,
  setRole: () => {},
  clearRole: () => {},
});

// ─── Provider ────────────────────────────────────────────────

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<HCRole | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY);
      if (stored && isValidRole(stored)) {
        setRoleState(stored);
      }
    } catch {
      // localStorage unavailable (SSR, incognito with restrictions, etc.)
    }
    setHydrated(true);
  }, []);

  const setRole = useCallback((newRole: HCRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch {
      // Silent fail — role still works for session
    }
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    try {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // Silent fail
    }
  }, []);

  const config = role ? ROLE_CONFIGS[role] : null;

  // Prevent flash of wrong content during hydration
  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <RoleContext.Provider value={{ role, config, hasRole: role !== null, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useRole() {
  const ctx = useContext(RoleContext);
  if (ctx === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return ctx;
}
