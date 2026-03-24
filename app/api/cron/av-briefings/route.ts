import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/av-briefings
 * Vercel cron: 0 7 * * 1 (Monday 07:00 UTC)
 *
 * Weekly: Generate AV corridor briefings and email to registered AV partners.
 * Uses Gemini 2.5 Flash with Google Search grounding for live data.
 * Cost: ~$0.05/week total
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // Fetch AV partner contacts
  const { data: partners } = await supabase
    .from('partner_inquiries')
    .select('id, name, email, company, use_case')
    .eq('use_case', 'autonomous_vehicles')
    .eq('status', 'active');

  const AV_CORRIDORS = [
    { name: 'Texas Triangle', route: 'Austin TX → Dallas TX → Houston TX', company: 'Aurora/Kodiak' },
    { name: 'I-10 Sunbelt', route: 'Los Angeles CA → Phoenix AZ → San Antonio TX', company: 'Multiple AV OEMs' },
    { name: 'Dallas → Laredo', route: 'Dallas TX → Laredo TX', company: 'Aurora commercial' },
  ];

  const briefings: any[] = [];
  const weekOf = new Date().toISOString().split('T')[0];

  for (const corridor of AV_CORRIDORS) {
    const res = await tracked('av_corridor_briefing_cron', () =>
      see(
        `Generate a concise weekly AV truck corridor briefing (250 words) for escort vehicle operators.\n\nCorridor: ${corridor.name} (${corridor.route})\nPrimary operators: ${corridor.company}\nWeek of: ${weekOf}\n\nCover:\n1. AV truck volumes this week (estimate based on current news)\n2. Any regulatory changes affecting escort requirements\n3. Opportunity summary: demand forecast for escort operators\n4. One actionable tip\n\nEnd with: "Post your availability at haulcommand.com/directory"`,
        {
          tier: 'fast',
          grounding: true,
          system: 'Weekly briefing writer for escort vehicle operators. Precise, concise, opportunity-focused.',
        }
      )
    );

    // Save to DB
    await supabase.from('av_briefings').upsert({
      corridor_name: corridor.name,
      route: corridor.route,
      content: res.text,
      generated_at: new Date().toISOString(),
      week_of: weekOf,
    }, { onConflict: 'corridor_name,week_of' });

    briefings.push({ corridor: corridor.name, length: res.text.length });

    // Email to AV partners via Resend
    if (partners?.length && process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      for (const partner of partners.slice(0, 10)) { // max 10 partners/corridor
        await resend.emails.send({
          from: 'Haul Command Intel <intel@haulcommand.com>',
          to: partner.email,
          subject: `[AV Corridor Intel] ${corridor.name} — Week of ${weekOf}`,
          html: `<p>Hi ${partner.name?.split(' ')[0] ?? 'there'},</p>
<p>Here's your weekly AV corridor briefing for <strong>${corridor.name}</strong>:</p>
<hr/>
<pre style="font-family:sans-serif;white-space:pre-wrap">${res.text}</pre>
<hr/>
<p><a href="https://haulcommand.com/partners/autonomous-vehicles">View full AV partner resources →</a></p>
<p style="color:#888;font-size:12px">Haul Command — haulcommand.com | Unsubscribe</p>`,
        }).catch(() => {}); // non-fatal per partner
      }
    }
  }

  return NextResponse.json({
    job: 'av-briefings-v1',
    week_of: weekOf,
    corridors_processed: briefings.length,
    partners_emailed: partners?.length ?? 0,
    briefings,
  });
}
