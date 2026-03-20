/**
 * POST /api/cron/recalculate-rankings
 * 
 * Ranking recalculation worker — runs every 5-10 min via Vercel cron.
 * Powers the entire competitive economy:
 * - Recalculates scores from performance, reviews, activity
 * - Assigns ranks per country/category
 * - Generates nicknames from score tiers
 * - Triggers Firebase push for rank changes
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateNickname, getTierFromScore } from '@/lib/nickname';

export const runtime = 'nodejs';
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Score formula weights
const WEIGHTS = {
  performance: 0.30,
  reviews: 0.25,
  activity: 0.15,
  responseSpeed: 0.10,
  wins: 0.10,
  streak: 0.05,
  adBoost: 0.05,
};

function calculateScore(entry: any): number {
  const performance = entry.performance_score || 50;
  const reviews = entry.review_avg || 3.0;
  const activity = Math.min((entry.post_count || 0) * 2, 100);
  const responseSpeed = entry.response_speed_score || 50;
  const wins = Math.min((entry.wins || 0) * 10, 100);
  const streak = Math.min((entry.streak || 0) * 15, 100);
  const adBoost = entry.ad_boost || 0;

  return (
    performance * WEIGHTS.performance +
    (reviews / 5 * 100) * WEIGHTS.reviews +
    activity * WEIGHTS.activity +
    responseSpeed * WEIGHTS.responseSpeed +
    wins * WEIGHTS.wins +
    streak * WEIGHTS.streak +
    adBoost * WEIGHTS.adBoost
  );
}

export async function GET() {
  try {
    // 1. Pull all leaderboard entries
    const { data: entries, error } = await supabase
      .from('leaderboard_entries')
      .select('*');

    if (error) throw error;
    if (!entries || entries.length === 0) {
      return NextResponse.json({ ok: true, message: 'No entries to rank', count: 0 });
    }

    // 2. Group by country + category for per-group ranking
    const groups: Record<string, any[]> = {};
    for (const entry of entries) {
      const key = `${entry.country || 'GLOBAL'}::${entry.category || 'driver'}`;
      if (!groups[key]) groups[key] = [];

      // Calculate new score
      const score = calculateScore(entry);
      groups[key].push({ ...entry, score });
    }

    // 3. Sort each group and assign ranks
    let totalUpdated = 0;
    for (const [, group] of Object.entries(groups)) {
      group.sort((a: any, b: any) => b.score - a.score);

      for (let i = 0; i < group.length; i++) {
        const entry = group[i];
        const rank = i + 1;
        const tier = getTierFromScore(entry.score);
        const nickname = generateNickname({
          score: entry.score,
          region: entry.region,
          corridor: entry.corridor,
        });

        await supabase
          .from('leaderboard_entries')
          .update({
            score: Math.round(entry.score * 10) / 10,
            rank,
            tier,
            nickname,
          })
          .eq('id', entry.id);

        totalUpdated++;
      }
    }

    return NextResponse.json({
      ok: true,
      updated: totalUpdated,
      groups: Object.keys(groups).length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ranking-worker]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
