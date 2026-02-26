/**
 * Free GPS Navigation — Phase 1
 * Deep-links to native Google Maps / Apple Maps for turn-by-turn directions.
 * Zero API cost. Works on all platforms.
 */

export type NavigationProvider = 'google' | 'apple' | 'auto';

interface NavigationOptions {
    origin?: string;       // lat,lng or address
    destination: string;   // lat,lng or address
    travelMode?: 'driving' | 'walking' | 'transit';
    provider?: NavigationProvider;
}

/**
 * Build a Google Maps directions URL.
 * Works on web, Android (opens app), iOS (opens Google Maps if installed).
 * No API key required for URL scheme.
 */
export function googleMapsDirectionsUrl(
    destination: string,
    origin?: string
): string {
    const d = encodeURIComponent(destination);
    let url = `https://www.google.com/maps/dir/?api=1&destination=${d}&travelmode=driving`;
    if (origin) {
        url += `&origin=${encodeURIComponent(origin)}`;
    }
    return url;
}

/**
 * Build an Apple Maps directions URL.
 * Works on iOS (opens Apple Maps), web (opens maps.apple.com).
 */
export function appleMapsDirectionsUrl(
    destination: string,
    origin?: string
): string {
    const d = encodeURIComponent(destination);
    let url = `https://maps.apple.com/?daddr=${d}&dirflg=d`;
    if (origin) {
        url += `&saddr=${encodeURIComponent(origin)}`;
    }
    return url;
}

/**
 * Build a lat,lng string from coordinates.
 */
export function coordsToString(lat: number, lng: number): string {
    return `${lat},${lng}`;
}

/**
 * Detect platform and return the best navigation URL.
 * - iOS → Apple Maps (unless user prefers Google)
 * - Android/Web → Google Maps
 */
export function getNavigationUrl(options: NavigationOptions): string {
    const { destination, origin, provider = 'auto' } = options;

    if (provider === 'apple') {
        return appleMapsDirectionsUrl(destination, origin);
    }
    if (provider === 'google') {
        return googleMapsDirectionsUrl(destination, origin);
    }

    // Auto-detect: iOS → Apple Maps, everything else → Google Maps
    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent || '';
        const isIOS = /iPhone|iPad|iPod/i.test(ua);
        if (isIOS) {
            return appleMapsDirectionsUrl(destination, origin);
        }
    }
    return googleMapsDirectionsUrl(destination, origin);
}

/**
 * Open navigation in a new tab/app.
 */
export function openNavigation(options: NavigationOptions): void {
    const url = getNavigationUrl(options);
    if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

/**
 * Get both provider URLs for a "Choose your navigator" UI.
 */
export function getNavigationChoices(destination: string, origin?: string) {
    return {
        google: {
            label: 'Open in Google Maps',
            url: googleMapsDirectionsUrl(destination, origin),
            icon: '🗺️',
        },
        apple: {
            label: 'Open in Apple Maps',
            url: appleMapsDirectionsUrl(destination, origin),
            icon: '🍎',
        },
    };
}
