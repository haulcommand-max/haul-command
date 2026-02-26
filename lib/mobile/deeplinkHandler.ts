// Deep link handler for haulcommand://offers/:offerId
// Register on app start in your root layout or _app.tsx
// Capacitor is imported dynamically — only runs in native context

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SCHEME = "haulcommand://";

function parseOfferDeepLink(url: string): string | null {
    try {
        if (!url.startsWith(SCHEME)) return null;
        const path = url.slice(SCHEME.length);
        const match = path.match(/^offers\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
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
                    const offerId = parseOfferDeepLink(launchUrl.url);
                    if (offerId) router.push(`/offers/${offerId}`);
                }

                // Warm start — app already open, link tapped
                const listener = await App.addListener("appUrlOpen", ({ url }) => {
                    const offerId = parseOfferDeepLink(url);
                    if (offerId) router.push(`/offers/${offerId}`);
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
