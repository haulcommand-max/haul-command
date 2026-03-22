/**
 * /api/cron/country-readiness
 *
 * Weekly cron — auto-evaluates country readiness and flips status.
 * For each country in global_countries where status = 'planned' or 'next':
 *   - Has regulation data? (+25)
 *   - Has 10+ operators? (+25)
 *   - Has corridors? (+25)
 *   - Has compliance data? (+25)
 * Score 100 → auto-flip to 'live'
 * Score >= 75 → auto-flip to 'next'
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { captureError } from '@/lib/monitoring/error';

const CRON_SECRET = process.env.CRON_SECRET;

interface CountryScore {
  country_code: string;
  name: string;
  regulations: number;
  operators: number;
  corridors: number;
  compliance: number;
  total: number;
  previousStatus: string;
  newStatus: string | null;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = supabaseServer();
    const scores: CountryScore[] = [];
    const flipped: string[] = [];

    // Get countries that aren't live yet
    const { data: countries } = await sb
      .from('global_countries')
      .select('country_code, name, status')
      .in('status', ['planned', 'next'])
      .order('name');

    if (!countries?.length) {
      return NextResponse.json({ message: 'No planned/next countries to evaluate', scores: [] });
    }

    for (const country of countries) {
      const cc = country.country_code;
      const score: CountryScore = {
        country_code: cc,
        name: country.name,
        regulations: 0,
        operators: 0,
        corridors: 0,
        compliance: 0,
        total: 0,
        previousStatus: country.status,
        newStatus: null,
      };

      // Check 1: Has regulation data?
      const { count: regCount } = await sb
        .from('state_regulations')
        .select('id', { count: 'exact', head: true })
        .eq('country_code', cc);
      if ((regCount ?? 0) > 0) score.regulations = 25;

      // Check 2: Has 10+ operators?
      const { count: opCount } = await sb
        .from('hc_places')
        .select('id', { count: 'exact', head: true })
        .eq('country_code', cc)
        .eq('status', 'published');
      if ((opCount ?? 0) >= 10) score.operators = 25;

      // Check 3: Has corridors defined?
      const { count: corrCount } = await sb
        .from('corridors')
        .select('id', { count: 'exact', head: true })
        .ilike('country_code', cc);
      if ((corrCount ?? 0) > 0) score.corridors = 25;

      // Check 4: Has compliance data?
      const { count: compCount } = await sb
        .from('copilot_cache')
        .select('id', { count: 'exact', head: true })
        .ilike('jurisdiction', `%${cc}%`);
      if ((compCount ?? 0) > 0) score.compliance = 25;

      score.total = score.regulations + score.operators + score.corridors + score.compliance;

      // Auto-flip logic
      if (score.total === 100 && country.status !== 'live') {
        score.newStatus = 'live';
        await sb
          .from('global_countries')
          .update({ status: 'live', went_live_at: new Date().toISOString() })
          .eq('country_code', cc);
        flipped.push(`${country.name} → LIVE`);

        // Send admin notification via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Haul Command System <system@haulcommand.com>',
              to: ['admin@haulcommand.com'],
              subject: `🌍 Country LIVE: ${country.name} (${cc}) scored 100/100`,
              html: `<h2>Country Auto-Flipped to LIVE</h2>
                <p><strong>${country.name}</strong> (${cc}) scored 100/100 on readiness.</p>
                <ul>
                  <li>Regulations: ${score.regulations}/25</li>
                  <li>Operators: ${score.operators}/25</li>
                  <li>Corridors: ${score.corridors}/25</li>
                  <li>Compliance: ${score.compliance}/25</li>
                </ul>`,
            }),
          }).catch(() => {});
        }
      } else if (score.total >= 75 && country.status === 'planned') {
        score.newStatus = 'next';
        await sb
          .from('global_countries')
          .update({ status: 'next' })
          .eq('country_code', cc);
        flipped.push(`${country.name} → NEXT`);
      }

      scores.push(score);
    }

    // Sort by total score descending
    scores.sort((a, b) => b.total - a.total);

    return NextResponse.json({
      message: `Evaluated ${countries.length} countries, flipped ${flipped.length}`,
      flipped,
      scores,
    });
  } catch (err) {
    await captureError(err, { route: '/api/cron/country-readiness' });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'haul-command-country-readiness',
    description: 'Weekly cron — auto-evaluates country readiness scores and flips status when thresholds met',
    schedule: 'Every Monday at 6 AM UTC',
  });
}
