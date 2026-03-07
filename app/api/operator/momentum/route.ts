/**
 * GET /api/operator/momentum?userId=...
 * Returns computed momentum score with band, trend, and component breakdown.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HabitEngine } from '@/core/engagement/habit_engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const engine = new HabitEngine(
        createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    );

    const momentum = await engine.getMomentumScore(userId);
    return NextResponse.json(momentum);
}
