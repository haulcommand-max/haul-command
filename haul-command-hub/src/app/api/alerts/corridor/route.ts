/**
 * GET /api/alerts/corridor
 *
 * Returns active corridor alerts (weather, curfew, shutdown, construction).
 * Optional query param: ?corridor=I-10 to filter by corridor name.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Seeded Corridor Alert Data ───────────────────────────────
// In production, this pulls from corridor_alerts table + weather API
const SEED_ALERTS = [
  {
    id: '1',
    corridorName: 'I-10 Texas Triangle',
    alertType: 'weather' as const,
    severity: 'high' as const,
    title: 'High Wind Advisory',
    message: 'Sustained winds 35-45 mph expected through Thursday. Wind blade movements at risk. Consider delaying departure 24-48 hours.',
    startTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 48 * 3600000).toISOString(),
    source: 'weather_api',
  },
  {
    id: '2',
    corridorName: 'I-95 East Coast',
    alertType: 'curfew' as const,
    severity: 'medium' as const,
    title: 'Weekend Travel Ban — Virginia',
    message: 'Virginia DOT weekend travel ban in effect. No oversize movements Saturday 12:00 PM through Sunday 12:00 PM. Plan Friday departure or Monday hold.',
    startTime: new Date(Date.now() + 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 72 * 3600000).toISOString(),
    source: 'dot_feed',
  },
  {
    id: '3',
    corridorName: 'I-40 Cross Country',
    alertType: 'construction' as const,
    severity: 'medium' as const,
    title: 'Bridge Repair — Width Restriction',
    message: 'I-40 bridge repair near Amarillo, TX. Width restricted to 12ft max. Loads wider than 12ft must use alternate route via US-287. Adds ~45 miles and 1.5 hours.',
    startTime: new Date(Date.now() - 72 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 14 * 24 * 3600000).toISOString(),
    source: 'dot_feed',
  },
  {
    id: '4',
    corridorName: 'Oklahoma Wind Belt',
    alertType: 'weather' as const,
    severity: 'critical' as const,
    title: 'Severe Thunderstorm Watch',
    message: 'NWS Severe Thunderstorm Watch for central Oklahoma corridor. Large hail and damaging winds possible. All oversize movements should hold until all-clear.',
    startTime: new Date(Date.now() - 1 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 8 * 3600000).toISOString(),
    source: 'weather_api',
  },
  {
    id: '5',
    corridorName: 'I-5 West Coast',
    alertType: 'shutdown' as const,
    severity: 'high' as const,
    title: 'Grapevine Oversize Ban',
    message: 'Caltrans has temporarily banned oversize loads on the I-5 Grapevine (Tejon Pass) due to road conditions. Use I-15/I-40 alternate. Estimated 2-day delay.',
    startTime: new Date(Date.now() - 12 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 36 * 3600000).toISOString(),
    source: 'dot_feed',
  },
  {
    id: '6',
    corridorName: 'Gulf Coast Industrial',
    alertType: 'weather' as const,
    severity: 'medium' as const,
    title: 'Tropical Moisture — Heavy Rain',
    message: 'Heavy rain bands affecting I-10 coastal corridor from Houston to New Orleans. Standing water possible. Use caution with wide loads — reduced visibility for escort vehicles.',
    startTime: new Date(Date.now() + 6 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 30 * 3600000).toISOString(),
    source: 'weather_api',
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const corridorFilter = searchParams.get('corridor');

    let alerts = SEED_ALERTS;

    if (corridorFilter) {
      alerts = alerts.filter(a =>
        a.corridorName.toLowerCase().includes(corridorFilter.toLowerCase())
      );
    }

    // Sort by severity (critical first), then by start time (newest)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => {
      const sA = severityOrder[a.severity] ?? 4;
      const sB = severityOrder[b.severity] ?? 4;
      if (sA !== sB) return sA - sB;
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return NextResponse.json({
      alerts,
      count: alerts.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Corridor Alerts] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
