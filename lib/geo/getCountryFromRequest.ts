import { headers } from "next/headers";

/**
 * Country resolution order (server-side):
 * 1) user override cookie (hc_country)
 * 2) platform geo header (Vercel: x-vercel-ip-country, CF: cf-ipcountry, etc.)
 * 3) accept-language region hint (weak)
 * 4) fallback: "US"
 *
 * Works with Next.js `headers()` in Server Components / Route Handlers.
 */
export async function getCountryFromHeaders(): Promise<string> {
    const h = await headers();

    // 1. Cookie override
    const cookieHeader = h.get("cookie") ?? "";
    const cookieMatch = cookieHeader.match(/(?:^|;\s*)hc_country=([A-Za-z]{2})/);
    if (cookieMatch?.[1]) return cookieMatch[1].toUpperCase();

    // 2. Platform geo headers
    const headerCandidates = [
        h.get("x-vercel-ip-country"),
        h.get("cf-ipcountry"),
        h.get("x-country"),
        h.get("x-geo-country"),
    ].filter(Boolean) as string[];

    for (const c of headerCandidates) {
        const cc = c.toUpperCase();
        if (/^[A-Z]{2}$/.test(cc)) return cc;
    }

    // 3. Weak fallback: try Accept-Language region (e.g., es-NI)
    const al = h.get("accept-language") ?? "";
    const m = al.match(/(?:^|,)\s*[a-z]{2}-([A-Z]{2})\b/);
    if (m?.[1]) return m[1].toUpperCase();

    // 4. Default
    return "US";
}
