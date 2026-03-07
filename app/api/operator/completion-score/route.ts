/**
 * GET /api/operator/completion-score?userId=...
 * Returns full profile completion breakdown with gates, milestones, next step.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ProfileCompletionEngine } from '@/core/engagement/profile_completion_engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const engine = new ProfileCompletionEngine(admin);
    const score = await engine.computeCompletionScore(userId);

    return NextResponse.json(score);
}
