/**
 * OAuth redirect utilities.
 * Works for: localhost, production (Vercel), and Capacitor (Android/iOS).
 */

export function getBaseUrlFromRequestHeaders(headers: Headers): string {
    const proto = headers.get("x-forwarded-proto") ?? "http";
    const host =
        headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
    return `${proto}://${host}`;
}

export function getOAuthCallbackUrl(baseUrl: string): string {
    return `${baseUrl}/auth/callback`;
}

export function getReturnToParam(url: string | null | undefined): string {
    if (!url) return "/";
    // Safety: only allow relative paths.
    try {
        const u = new URL(url, "http://local");
        return u.pathname + u.search + u.hash;
    } catch {
        return "/";
    }
}
