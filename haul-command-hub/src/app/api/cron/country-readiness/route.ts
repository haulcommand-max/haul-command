/**
 * /api/cron/country-readiness
 *
 * Weekly cron — auto-evaluates country readiness and flips status.
 * Uses the EXISTING stronger global_countries schema:
 *   iso2, activation_phase, is_active_market, launch_status, etc.
 *
 * For each country where activation_phase = 'planned' or 'monitor':
 *   - Has regulation data? (+25)
 *   - Has 10+ operators? (+25)
 *   - Has corridors? (+25)
 *   - Has compliance data? (+25)
 * Score 100 → auto-flip to activation_phase='active', is_active_market=true, launch_status='live'
 * Score >= 75 → auto-flip to activation_phase='expanding'
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { captureError } from '@/lib/monitoring/error';

const CRON_SECRET = process.env.CRON_SECRET;

interface CountryScore {
  iso2: string;
  name: string;
  regulations: number;
  operators: number;
  corridors: number;
  compliance: number;
  total: number;
  previousPhase: string;
  newPhase: string | null;
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

    // Get countries that aren't fully active yet
    const { data: countries } = await sb
      .from('global_countries')
      .select('iso2, name, activation_phase, is_active_market, launch_status')
      .in('activation_phase', ['planned', 'monitor', 'expanding'])
      .order('name');

    if (!countries?.length) {
      return NextResponse.json({ message: 'No planned/monitor countries to evaluate', scores: [] });
    }

    for (const country of countries) {
      const cc = country.iso2;
      const score: CountryScore = {
        iso2: cc,
        name: country.name,
        regulations: 0,
        operators: 0,
        corridors: 0,
        compliance: 0,
        total: 0,
        previousPhase: country.activation_phase,
        newPhase: null,
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

      // Auto-flip logic using the EXISTING stronger schema
      if (score.total === 100 && !country.is_active_market) {
        score.newPhase = 'active';
        await sb
          .from('global_countries')
          .update({
            activation_phase: 'active',
            is_active_market: true,
            launch_status: 'live',
            updated_at: new Date().toISOString(),
          })
          .eq('iso2', cc);
        flipped.push(`${country.name} → ACTIVE/LIVE`);

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
      } else if (score.total >= 75 && country.activation_phase === 'planned') {
        score.newPhase = 'expanding';
        await sb
          .from('global_countries')
          .update({
            activation_phase: 'expanding',
            updated_at: new Date().toISOString(),
          })
          .eq('iso2', cc);
        flipped.push(`${country.name} → EXPANDING`);
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
    description: 'Weekly cron — auto-evaluates country readiness scores and flips activation_phase when thresholds met',
    schedule: 'Every Monday at 6 AM UTC',
  });
}
