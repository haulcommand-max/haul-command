/**
 * Visual Edit Mode — dev-only utility
 *
 * Guards:
 *  - Only active when NEXT_PUBLIC_EDIT_MODE === 'true'
 *  - Only on localhost (blocks on production hostnames)
 *  - Writes disabled unless NEXT_PUBLIC_EDIT_MODE_WRITES === 'true'
 */

export function isEditModeEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    if (process.env.NEXT_PUBLIC_EDIT_MODE !== 'true') return false;

    // Block on production
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (!isLocal) return false;

    return true;
}

export function areWritesEnabled(): boolean {
    return isEditModeEnabled() && process.env.NEXT_PUBLIC_EDIT_MODE_WRITES === 'true';
}

export function isProduction(): boolean {
    if (typeof window === 'undefined') return true;
    const hostname = window.location.hostname;
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0';
}
