
// lib/here/routeMiles.ts
// Server-only. Computes route distance in miles using HERE Routing v8.
// Safe behavior: if key missing, returns no_key (does not throw).

export type HereMilesResult =
    | { ok: true; miles: number; meters: number }
    | { ok: false; status: "no_key" | "error"; message?: string };

/**
 * Calculates the driving distance between two points using HERE Routing API v8.
 * @param params Origin and Destination latitude/longitude.
 * @returns Result object with miles or error status.
 */
export async function hereRouteMiles(params: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
}): Promise<HereMilesResult> {
    const key = process.env.HERE_API_KEY;
    if (!key) return { ok: false, status: "no_key", message: "HERE_API_KEY missing" };

    const baseUrl = process.env.HERE_BASE_URL ?? "https://router.hereapi.com/v8/routes";

    const url = new URL(baseUrl);
    url.searchParams.set("transportMode", "car");
    url.searchParams.set("origin", `${params.originLat},${params.originLng}`);
    url.searchParams.set("destination", `${params.destLat},${params.destLng}`);
    url.searchParams.set("return", "summary");
    url.searchParams.set("apikey", key);

    try {
        const res = await fetch(url.toString(), { method: "GET" });
        if (!res.ok) {
            return { ok: false, status: "error", message: `HERE error ${res.status}` };
        }
        const json = await res.json();
        const meters = json?.routes?.[0]?.sections?.[0]?.summary?.length;
        if (typeof meters !== "number" || !isFinite(meters) || meters <= 0) {
            return { ok: false, status: "error", message: "Invalid distance response" };
        }
        const miles = meters / 1609.344;
        return { ok: true, miles: Math.round(miles * 10) / 10, meters };
    } catch (e: any) {
        return { ok: false, status: "error", message: e?.message ?? "Fetch failed" };
    }
}
