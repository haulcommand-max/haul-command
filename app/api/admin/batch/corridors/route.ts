import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/ai/cache';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/batch/corridors
 * Body: { limit?: 20, type: 'corridors' | 'regulations' | 'av_briefings' }
 *
 * Generates SEO corridor intel pages and regulation summaries using Gemini.
 * Run once per batch. Results written to corridor_intel + regulation_pages tables.
 *
 * Cost estimates:
 *   corridors:    ~$0.0005 × 219 = ~$0.11
 *   regulations:  ~$0.0003 × 57  = ~$0.017
 *   av_briefings: ~$0.0005 × 20  = ~$0.01
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const body = await req.json().catch(() => ({}));
  const limit = body.limit ?? 20;
  const type  = body.type ?? 'corridors';

  // ── TYPE: corridor intel pages ──────────────────────────────────
  if (type === 'corridors') {
    const { data: corridors } = await supabase
      .from('corridors')
      .select('id, name, origin_state, destination_state, origin_city, destination_city, load_count, operator_count')
      .is('intel_generated_at', null)
      .order('load_count', { ascending: false })
      .limit(limit);

    if (!corridors?.length) return NextResponse.json({ message: 'All corridors have intel', processed: 0 });

    const CONCURRENCY = 5;
    const results: any[] = [];
    for (let i = 0; i < corridors.length; i += CONCURRENCY) {
      const batch = corridors.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(batch.map(async (c: any) => {
        const cacheKey = `corridor:${c.id}`;
        const cached = await cacheGet('gemini', 'gemini-2.5-flash', cacheKey);
        let text = cached?.text ?? '';

        if (!text) {
          const res = await tracked('batch_corridor_intel', () =>
            see(
              `Write a comprehensive corridor intelligence briefing for heavy haul operators and brokers.\n\nCorridor: ${c.origin_city ?? ''} ${c.origin_state} → ${c.destination_city ?? ''} ${c.destination_state}\n\nPlatform data: ${c.load_count ?? 0} loads posted, ${c.operator_count ?? 0} active escorts.\n\nInclude:\n- Typical load types on this corridor (by percentage)\n- Permit requirements for oversize loads (state-by-state if multi-state)\n- Known hazards, low bridges, construction zones\n- Best travel times, curfews, blackout dates\n- Local escort operator density (High/Medium/Low)\n- Pro tips from experienced operators\n- Link to haulcommand.com/directory?state=${c.origin_state}\n\nFormat: 400-600 words, H2 sections, conversational and operational.`,
              {
                tier: 'fast',
                system: 'You are a veteran heavy haul corridor intelligence specialist. Write for operators who know the industry. Be specific, not generic.',
              }
            )
          );
          text = res.text;
          await cacheSet('gemini', 'gemini-2.5-flash', cacheKey, res, CACHE_TTL.corridor_intel);
        }

        await supabase.from('corridors').update({
          intel_content: text,
          intel_generated_at: new Date().toISOString(),
        }).eq('id', c.id);

        return { corridor: `${c.origin_state}→${c.destination_state}`, chars: text.length };
      }));
      results.push(...settled.filter(s => s.status === 'fulfilled').map((s: any) => s.value));
    }

    return NextResponse.json({ type, processed: results.length, results });
  }

  // ── TYPE: regulation summaries (57 countries) ──────────────────
  if (type === 'regulations') {
    const { data: jurisdictions } = await supabase
      .from('jurisdictions')
      .select('id, name, country_code, load_type')
      .is('regulation_summary', null)
      .limit(limit);

    // If no jurisdictions table yet, use a hardcoded country list
    const targets = jurisdictions ?? getDefaultJurisdictions().slice(0, limit);

    const CONCURRENCY = 8;
    const results: any[] = [];
    const list = targets as any[];

    for (let i = 0; i < list.length; i += CONCURRENCY) {
      const batch = list.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(batch.map(async (j: any) => {
        const jurisdiction = j.name ?? j;
        const cacheKey = `regulation:${jurisdiction}`;
        const cached = await cacheGet('gemini', 'gemini-2.5-flash', cacheKey);
        let text = cached?.text ?? '';

        if (!text) {
          const res = await tracked('batch_regulation_summary', () =>
            see(
              `Write a concise, accurate oversize/overweight transport regulation summary for: ${jurisdiction}\n\nInclude:\n- Max dimensions without permit (width, height, length, weight)\n- When escort vehicles are required\n- Permit process (how to apply, lead time, cost range)\n- Operating hours restrictions\n- Relevant permit authority name + website\n- One common "gotcha" operators miss\n\nFormat: Bullet points, 200-300 words. Be specific to this jurisdiction.`,
              {
                tier: 'nano',
                grounding: true,
                system: 'DOT oversize permit expert. Be specific, cite current regulations. Use bullet points.',
              }
            )
          );
          text = res.text;
          await cacheSet('gemini', 'gemini-2.5-flash', cacheKey, res, CACHE_TTL.regulation);
        }

        // Save to jurisdictions table if it exists, else log
        if (j.id) {
          await supabase.from('jurisdictions').update({ regulation_summary: text }).eq('id', j.id);
        } else {
          await supabase.from('regulation_pages').upsert({
            jurisdiction,
            content: text,
            generated_at: new Date().toISOString(),
          }, { onConflict: 'jurisdiction' }).then(() => {});
        }

        return { jurisdiction, chars: text.length };
      }));
      results.push(...settled.filter(s => s.status === 'fulfilled').map((s: any) => s.value));
    }

    return NextResponse.json({ type, processed: results.length, results });
  }

  // ── TYPE: AV corridor weekly briefings ─────────────────────────
  if (type === 'av_briefings') {
    const AV_CORRIDORS = [
      { name: 'Texas Triangle (AV)', route: 'Austin TX → Dallas TX → Houston TX', company: 'Aurora/Kodiak/Torc' },
      { name: 'I-10 Sunbelt AV Corridor', route: 'Los Angeles CA → Phoenix AZ → El Paso TX → San Antonio TX', company: 'Multiple AV OEMs' },
      { name: 'Pittsburgh → Columbus AV', route: 'Pittsburgh PA → Columbus OH', company: 'Uber ATG / Argo AI successor routes' },
      { name: 'Fremont → Las Vegas AV', route: 'Fremont CA → Las Vegas NV', company: 'Tesla Semi test corridor' },
      { name: 'Dallas → Laredo Border AV', route: 'Dallas TX → Laredo TX → Mexico border', company: 'Aurora commercial route' },
    ];

    const results: any[] = [];
    for (const corridor of AV_CORRIDORS) {
      const res = await tracked('av_corridor_briefing', () =>
        see(
          `Generate a weekly AV truck corridor briefing for heavy haul escort operators.\n\nCorridor: ${corridor.name}\nRoute: ${corridor.route}\nPrimary AV operator: ${corridor.company}\n\nInclude:\n- Current AV truck volumes on this corridor (estimate if unknown)\n- Escort requirements for AV trucks (state-specific)\n- Known regulatory changes this week (search for recent news)\n- What this means for human escort operators (opportunity/threat/neutral)\n- Recommended actions for escort companies\n\nTone: Direct briefing for escort company owners and dispatchers. 300 words.`,
          {
            tier: 'fast',
            grounding: true,
            system: 'AV industry analyst for escort vehicle companies.',
          }
        )
      );

      await supabase.from('av_briefings').upsert({
        corridor_name: corridor.name,
        route: corridor.route,
        content: res.text,
        generated_at: new Date().toISOString(),
        week_of: new Date().toISOString().split('T')[0],
      }, { onConflict: 'corridor_name,week_of' }).then(() => {});

      results.push({ corridor: corridor.name, chars: res.text.length });
    }

    return NextResponse.json({ type, processed: results.length, results });
  }

  return NextResponse.json({ error: 'Invalid type. Use: corridors | regulations | av_briefings' }, { status: 400 });
}

function getDefaultJurisdictions(): string[] {
  return [
    // Tier A
    'United States', 'Canada', 'Australia', 'United Kingdom', 'New Zealand',
    'South Africa', 'Germany', 'Netherlands', 'UAE', 'Brazil',
    // Tier B
    'Ireland', 'Sweden', 'Norway', 'Denmark', 'Finland',
    'Belgium', 'Austria', 'Switzerland', 'Spain', 'France',
    'Italy', 'Portugal', 'Saudi Arabia', 'Qatar', 'Mexico',
    // Tier C
    'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Slovenia',
    'Estonia', 'Latvia', 'Lithuania', 'Croatia', 'Romania',
    'Bulgaria', 'Greece', 'Turkey', 'Kuwait', 'Oman',
    'Bahrain', 'Singapore', 'Malaysia', 'Japan', 'South Korea',
    'Chile', 'Argentina', 'Colombia', 'Peru',
    // Tier D
    'Uruguay', 'Panama', 'Costa Rica',
  ];
}
