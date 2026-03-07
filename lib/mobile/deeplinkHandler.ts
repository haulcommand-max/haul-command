// Deep link handler for Haul Command
// Supports all entity types: profiles, loads, corridors, offers, invites, searches
// Register in root layout via useDeepLinkHandler()
// Capacitor is imported dynamically — only runs in native context

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SCHEME = "haulcommand://";

/** All supported deep link routes */
const ROUTE_MAP: Array<{ pattern: RegExp; resolve: (match: RegExpMatchArray) => string }> = [
    // Profile
    { pattern: /^profile\/([a-zA-Z0-9_-]+)/, resolve: (m) => `/directory/profile/${m[1]}` },

    // Load / Job
    { pattern: /^load\/([a-zA-Z0-9_-]+)/, resolve: (m) => `/loads/${m[1]}` },

    // Offer (existing)
    { pattern: /^offers?\/([a-zA-Z0-9_-]+)/, resolve: (m) => `/offers/${m[1]}` },

    // Corridor
    { pattern: /^corridor\/([a-zA-Z0-9_-]+)/, resolve: (m) => `/corridors/${m[1]}` },

    // Authority hub
    {
        pattern: /^authority\/([a-z]{2})\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?/,
        resolve: (m) => m[3] ? `/authority/${m[1]}/${m[2]}/${m[3]}` : `/authority/${m[1]}/${m[2]}`
    },

    // Leaderboard
    { pattern: /^leaderboard(?:s)?$/, resolve: () => '/leaderboards' },

    // Invite / Referral
    { pattern: /^invite\/([a-zA-Z0-9_-]+)/, resolve: (m) => `/claim/invite/${m[1]}` },
    { pattern: /^referral\/([a-zA-Z0-9_-]+)/, resolve: (m) => `/start?ref=${m[1]}` },

    // Search
    {
        pattern: /^search/, resolve: (m) => {
            // Pass through query params
            const full = m[0] || '';
            const qIdx = full.indexOf('?');
            return qIdx >= 0 ? `/directory${full.slice(qIdx)}` : '/directory';
        }
    },

    // Port
    { pattern: /^port\/([a-zA-Z0-9_-]+)/, resolve: (m) => `/ports/${m[1]}` },

    // Dashboard (auth gated in-app)
    { pattern: /^dashboard$/, resolve: () => '/dashboard' },
];

/**
 * Parse any Haul Command deep link URL into an app route.
 * Returns null if the URL doesn't match any known pattern.
 */
export function parseDeepLink(url: string): string | null {
    try {
        let path: string;

        if (url.startsWith(SCHEME)) {
            path = url.slice(SCHEME.length);
        } else if (url.includes('haulcommand.com/')) {
            // Universal link
            const idx = url.indexOf('haulcommand.com/');
            path = url.slice(idx + 'haulcommand.com/'.length);
        } else {
            return null;
        }

        // Strip leading slash
        path = path.replace(/^\//, '');

        for (const route of ROUTE_MAP) {
            const match = path.match(route.pattern);
            if (match) return route.resolve(match);
        }

        // Fallback: try to use the path directly
        return path ? `/${path}` : null;
    } catch {
        return null;
    }
}

/**
 * React hook — mount in your root layout.
 * Handles both warm-start deep links and cold-start via getLaunchUrl().
 */
export function useDeepLinkHandler() {
    const router = useRouter();

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        async function init() {
            try {
                // Dynamic import — only resolves in Capacitor native builds
                const { App } = await import("@capacitor/app");

                // Cold start — check if app launched via deep link
                const launchUrl = await App.getLaunchUrl();
                if (launchUrl?.url) {
                    const route = parseDeepLink(launchUrl.url);
                    if (route) router.push(route);
                }

                // Warm start — app already open, link tapped
                const listener = await App.addListener("appUrlOpen", ({ url }) => {
                    const route = parseDeepLink(url);
                    if (route) router.push(route);
                });

                cleanup = () => listener.remove();
            } catch {
                // Not in Capacitor — skip silently
            }
        }

        init();
        return () => cleanup?.();
    }, [router]);
}
