export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// Generates human-friendly ticker rows from real DB activity.
// Sources: hc_route_requests (loads posted) + hc_available_now (live operators)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 12), 30);

    const [loadsRes, presRes] = await Promise.all([
        getSupabaseAdmin()
            .from("hc_route_requests")
            .select("id,service_type,pickup_location,delivery_location,status,created_at")
            .in("status", ["pending", "viewed", "quoted"])
            .order("created_at", { ascending: false })
            .limit(Math.ceil(limit / 2)),
        getSupabaseAdmin()
            .from("hc_available_now")
            .select("id,display_name,city,region_code,vehicle_type,last_ping_at,trust_score")
            .eq("is_active", true)
            .gte("last_ping_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
            .order("last_ping_at", { ascending: false })
            .limit(Math.ceil(limit / 2)),
    ]);

    if (loadsRes.error) console.error("[activity] route_requests:", loadsRes.error.message);
    if (presRes.error) console.error("[activity] available_now:", presRes.error.message);

    const SERVICE_LABEL: Record<string, string> = {
        pilot_car: 'Pilot Car', escort_vehicle: 'Escort', high_pole: 'High Pole',
        steerman: 'Steerman', route_surveyor: 'Route Surveyor', heavy_towing: 'Heavy Towing',
        other: 'Escort',
    };

    const items: Array<{ id: string; ts: string; text: string; kind: string }> = [];

    for (const l of loadsRes.data ?? []) {
        const route = [l.pickup_location, l.delivery_location].filter(Boolean).join(" → ");
        const tag = l.status === 'quoted' ? "QUOTED" : l.status === 'viewed' ? "ACTIVE" : "NEW LOAD";
        const svc = SERVICE_LABEL[l.service_type] ?? l.service_type;
        items.push({
            id: `load_${l.id}`,
            ts: l.created_at,
            kind: "load",
            text: `${tag}: ${svc} needed — ${route}`,
        });
    }

    for (const p of presRes.data ?? []) {
        const loc = [p.city, p.region_code].filter(Boolean).join(", ");
        const svc = SERVICE_LABEL[p.vehicle_type] ?? 'Operator';
        const trust = p.trust_score ? ` · Trust ${p.trust_score}` : '';
        items.push({
            id: `presence_${p.id}`,
            ts: p.last_ping_at,
            kind: "presence",
            text: `LIVE: ${p.display_name ?? svc} available near ${loc}${trust}`,
        });
    }

    items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    return NextResponse.json(
        { items: items.slice(0, limit) },
        { headers: { "Cache-Control": "no-store" } }
    );
}
