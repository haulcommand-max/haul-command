/**
 * POST /api/tools/rate-advisor — Pricing Intelligence Engine
 * 
 * Returns recommended rate range, corridor status, negotiation ceiling
 * 
 * Free: rate range only
 * Pro: full breakdown with negotiation strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAndLogUsage } from '@/lib/billing/usage-meter';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a pricing intelligence advisor for the heavy haul pilot car / escort vehicle industry.

Given a corridor, load type, distance, and date — provide rate recommendations.

Return ONLY valid JSON:
{
  "rateRange": {
    "low": number ($/day),
    "mid": number ($/day),
    "high": number ($/day),
    "perMile": { "low": number, "mid": number, "high": number }
  },
  "corridorStatus": "HOT" | "WARM" | "COOL" | "COLD",
  "corridorStatusReason": string (1 sentence),
  "negotiationCeiling": number (max $/day you could push for),
  "negotiationStrategy": [string, string, string] (3 bullet reasons to negotiate up),
  "demandSignals": {
    "currentDemand": "HIGH" | "MODERATE" | "LOW",
    "supplyLevel": "SHORTAGE" | "BALANCED" | "SURPLUS",
    "trendDirection": "RISING" | "STABLE" | "FALLING"
  },
  "seasonalFactors": string (1-2 sentences about seasonal impact),
  "competitorInsight": string (1 sentence about what others charge),
  "bottomLine": string (2-3 sentence summary recommendation)
}

Industry rate knowledge:
- National average pilot car: $380/day, $1.65/mi
- Chase car: $1.40-1.80/mi dependent on corridor  
- Lead car: $1.50-2.00/mi (premium for front position)
- High pole: add $0.20-0.50/mi premium
- Multi-state: higher rates due to permit complexity
- Night runs: 15-25% premium
- Weekend: 10-20% premium
- Shortage corridors (TX-OK-NM, Southeast): 20-40% above average
- Winter northern routes: premium for weather risk
- Summer southern routes: premium for heat restrictions

Return ONLY the JSON object.`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  try {
    const { corridor, loadType, distance, date, position } = await req.json();

    // Usage metering
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      const usage = await checkAndLogUsage(user.id, 'rate_advisor', { corridor });
      if (!usage.allowed) {
        return NextResponse.json({
          error: 'Daily query limit reached',
          remaining: 0, limit: usage.limit, tier: usage.tier,
          upgrade_url: '/pricing',
        }, { status: 429 });
      }
    }

    const prompt = `Provide rate intelligence for:\n- Corridor: ${corridor || 'General US'}\n- Load Type: ${loadType || 'Oversize'}\n- Distance: ${distance || 'Unknown'} miles\n- Date: ${date || 'This week'}\n- Position: ${position || 'Chase car'}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `AI error (${res.status})` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.content?.map((b: { text?: string }) => b.text || '').join('').trim();
    const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    let advice;
    try {
      advice = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, advice });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
