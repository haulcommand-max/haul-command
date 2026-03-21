/**
 * GET /api/availability/ical
 * Track 6: iCal export for operator availability
 * 
 * Generates an iCal (.ics) file for operator's Haul Command schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const operatorId = searchParams.get('user_id');

  if (!operatorId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const now = new Date();
  const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
  const endDate = new Date(now.getTime() + 90 * 86400000).toISOString().split('T')[0];

  const { data: dates } = await admin
    .from('operator_availability')
    .select('*')
    .eq('operator_id', operatorId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  // Build iCal
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Haul Command//Availability//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Haul Command Schedule',
    'X-WR-TIMEZONE:America/New_York',
  ];

  for (const entry of (dates || [])) {
    const dateStr = entry.date.replace(/-/g, '');
    const status = entry.status;
    const summary = status === 'booked' ? 'HC: BOOKED' : status === 'unavailable' ? 'HC: Unavailable' : 'HC: Available';

    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:Haul Command availability - ${status}`,
      `UID:hc-${operatorId}-${dateStr}@haulcommand.com`,
      `STATUS:${status === 'available' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="haulcommand-schedule.ics"',
    },
  });
}
