/**
 * HAUL COMMAND — Universal Safe UUID
 * 
 * Drop-in replacement for crypto.randomUUID() that works everywhere:
 * - Modern browsers
 * - Older Android WebViews (Capacitor)
 * - Node.js (server-side)
 * - Edge Functions (Deno)
 */

import { v4 as uuidv4 } from 'uuid';

/** Generate a random UUID v4 — safe in ALL environments */
export function safeUUID(): string {
    // Try native first (fastest)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
            return crypto.randomUUID();
        } catch {
            // fallback below
        }
    }
    // Polyfill via uuid package
    return uuidv4();
}
