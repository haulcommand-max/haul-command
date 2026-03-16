/**
 * GET /api/operator/profile-strength?userId=...
 * Returns profile strength breakdown for the ProfileStrengthMeter component.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { HabitEngine } from '@/core/engagement/habit_engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const engine = new HabitEngine(
        getSupabaseAdmin()
    );

    const strength = await engine.getProfileStrength(userId);
    return NextResponse.json(strength);
}
