import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// iCal export for operator availability calendar
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: entries } = await supabase
      .from('operator_availability')
      .select('available_date, status, notes')
      .eq('operator_id', user.id)
      .gte('available_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
      .order('available_date');

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    let ical = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Haul Command//Availability//EN\r\nCALSCALE:GREGORIAN\r\n';

    for (const entry of (entries || [])) {
      const dateStr = entry.available_date.replace(/-/g, '');
      const statusLabel = entry.status === 'booked' ? '🟢 BOOKED' : entry.status === 'available' ? '🟢 Available' : '🔴 Unavailable';
      ical += `BEGIN:VEVENT\r\nDTSTART;VALUE=DATE:${dateStr}\r\nDTEND;VALUE=DATE:${dateStr}\r\nSUMMARY:HC: ${statusLabel}\r\nDESCRIPTION:${entry.notes || 'Haul Command availability'}\r\nUID:hc-${entry.available_date}-${user.id}@haulcommand.com\r\nDTSTAMP:${now}\r\nEND:VEVENT\r\n`;
    }

    ical += 'END:VCALENDAR\r\n';

    return new NextResponse(ical, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="haulcommand-availability.ics"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'iCal export failed' }, { status: 500 });
  }
}
