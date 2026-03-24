import { NextRequest, NextResponse } from 'next/server';
import { see } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/youtube-intel
 * Body: { channel_url?: string, topic?: string, competitor?: string }
 *
 * Uses Gemini's multimodal understanding + Google Search grounding
 * to analyze competitor YouTube content and generate counter-content strategy.
 *
 * Output:
 *   - Top performing topics from competitor channels
 *   - Keyword gaps Haul Command should own
 *   - 10 video ideas with titles optimized for YT search
 *   - Script outline for the #1 priority video
 *
 * Cost: ~$0.005 per analysis (Gemini 2.5 Flash with grounding)
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { topic = 'heavy haul escort trucking', competitor } = body;

  const prompt = `You are a YouTube content strategist for Haul Command (haulcommand.com) — the global platform for oversize load escorts and heavy haul transport.\n\nAnalyze the competitive YouTube landscape for: "${topic}"${competitor ? `\nSpecific competitor to analyze: ${competitor}` : ''}\n\nUsing Google Search and YouTube data:\n\n1. TOP COMPETITOR VIDEOS\n   - What are the 5 highest-performing videos on this topic?
   - What titles, thumbnails, and hooks work best?
   - View counts (approximate)
\n2. KEYWORD GAPS (what Haul Command should OWN)\n   - Search terms with high intent but low competition\n   - Specific questions the industry is Googling but YouTube doesn't answer well\n\n3. HAUL COMMAND VIDEO IDEAS (10 titles)\n   - Optimized for YouTube search\n   - Each title should include a specific number or result\n   - Ranked by estimated search volume potential\n\n4. PRIORITY SCRIPT OUTLINE\n   - Full outline for the #1 video from your list\n   - Hook (0-15s): specific stat or scenario\n   - 3-4 main sections with key points\n   - CTA: haulcommand.com/directory or /route-check\n\n5. THUMBNAIL FORMULA\n   - What makes thumbnails in this niche perform well?\n   - Specific recommendation for Haul Command's style\n\nBe specific. Use real data from search results. This informs real content production.`;

  try {
    const res = await tracked('youtube_intel', () =>
      see(prompt, {
        tier: 'fast',
        grounding: true,
        system: 'YouTube content strategist for industrial B2B brands. Specific, data-driven, actionable.',
        maxTokens: 3000,
      })
    );

    return NextResponse.json({
      analysis: res.text,
      model: res.model,
      latency_ms: res.latency_ms,
      cost_cents: res.cost_cents,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
