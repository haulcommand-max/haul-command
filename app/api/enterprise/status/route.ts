export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

/**
 * GET /api/enterprise/status
 *
 * Public API status page data. No auth required.
 * Returns current uptime, latency, incident history, and SLA status.
 */
export async function GET() {
    const svc = admin();
    const now = new Date();

    // 1. Last 24h SLA windows
    const { data: slaWindows } = await svc
        .from('api_sla_windows')
        .select('*')
        .gte('window_start', new Date(now.getTime() - 86400_000).toISOString())
        .order('window_start', { ascending: false });

    // 2. Compute 24h uptime
    const totalWindows = slaWindows?.length ?? 0;
    const degradedWindows = slaWindows?.filter((w: any) => w.degraded).length ?? 0;
    const uptime24h = totalWindows > 0
        ? Math.round((1 - degradedWindows / totalWindows) * 10000) / 100
        : 100;

    // 3. Latency percentiles (last 1h)
    const recentWindows = (slaWindows ?? []).filter((w: any) =>
        new Date(w.window_start).getTime() > now.getTime() - 3600_000
    );
    const avgP50 = recentWindows.length
        ? Math.round(recentWindows.reduce((s: number, w: any) => s + (w.p50_latency_ms ?? 0), 0) / recentWindows.length)
        : 0;
    const avgP95 = recentWindows.length
        ? Math.round(recentWindows.reduce((s: number, w: any) => s + (w.p95_latency_ms ?? 0), 0) / recentWindows.length)
        : 0;

    // 4. Active incidents
    const { data: incidents } = await svc
        .from('enterprise_incidents')
        .select('id, incident_type, severity, title, description, status, started_at, resolved_at')
        .neq('status', 'resolved')
        .order('started_at', { ascending: false })
        .limit(10);

    // 5. Recent resolved incidents (7 days)
    const { data: recentIncidents } = await svc
        .from('enterprise_incidents')
        .select('id, incident_type, severity, title, status, started_at, resolved_at, duration_minutes')
        .eq('status', 'resolved')
        .gte('resolved_at', new Date(now.getTime() - 7 * 86400_000).toISOString())
        .order('resolved_at', { ascending: false })
        .limit(20);

    // 6. 30-day uptime
    const { data: monthWindows } = await svc
        .from('api_sla_windows')
        .select('degraded')
        .gte('window_start', new Date(now.getTime() - 30 * 86400_000).toISOString());

    const totalMonth = monthWindows?.length ?? 0;
    const degradedMonth = monthWindows?.filter((w: any) => w.degraded).length ?? 0;
    const uptime30d = totalMonth > 0
        ? Math.round((1 - degradedMonth / totalMonth) * 10000) / 100
        : 100;

    // 7. Endpoint-specific status
    const endpointFamilies = ['corridor_intelligence', 'predictive_analytics', 'pricing_intelligence', 'risk_intelligence'];
    const endpointStatus = endpointFamilies.map(family => {
        const familyWindows = recentWindows.filter((w: any) => w.endpoint_family === family);
        const isOk = familyWindows.every((w: any) => !w.degraded);
        return {
            family,
            status: isOk ? 'operational' : 'degraded',
            p95_ms: familyWindows.length
                ? Math.round(familyWindows.reduce((s: number, w: any) => s + (w.p95_latency_ms ?? 0), 0) / familyWindows.length)
                : null,
        };
    });

    const overallStatus = (incidents?.length ?? 0) > 0
        ? 'partial_outage'
        : uptime24h >= 99.9
            ? 'operational'
            : 'degraded';

    return NextResponse.json({
        status: overallStatus,
        uptime: {
            last_24h: uptime24h,
            last_30d: uptime30d,
            sla_target: 99.9,
        },
        latency: {
            p50_ms: avgP50,
            p95_ms: avgP95,
            sla_target_p95_ms: 450,
        },
        endpoints: endpointStatus,
        active_incidents: incidents ?? [],
        recent_incidents: recentIncidents ?? [],
        generated_at: now.toISOString(),
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
    });
}
