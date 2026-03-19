/**
 * GET /api/operator/weekly-report?userId=...
 * POST /api/operator/weekly-report (batch generate for all active operators)
 *
 * Weekly habit reinforcement report — delivered every Monday at 8am local.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { HabitEngine } from '@/core/engagement/habit_engine';

export const dynamic = 'force-dynamic';

// Single user report
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const admin = getSupabaseAdmin();

    const engine = new HabitEngine(admin);
    const report = await engine.generateWeeklyReport(userId);

    return NextResponse.json(report);
}

// Batch: generate and queue reports for all active operators
export async function POST(req: NextRequest) {
    // Auth: service key only
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // Find active operators (active in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: operators } = await admin
        .from('directory_listings')
        .select('user_id')
        .not('user_id', 'is', null)
        .gte('updated_at', thirtyDaysAgo);

    const engine = new HabitEngine(admin);
    const results: any[] = [];
    const errors: string[] = [];

    for (const op of (operators ?? [])) {
        try {
            const report = await engine.generateWeeklyReport(op.user_id);
            results.push(report);

            // Queue for email delivery
            await admin.from('notifications').insert({
                user_id: op.user_id,
                channel: 'email',
                title: '📊 Your Weekly Command Report',
                body: formatReportEmail(report),
                metadata: {
                    type: 'weekly_report',
                    momentum_score: report.momentum_score,
                    momentum_band: report.momentum_band,
                },
            });
        } catch (err) {
            errors.push(`${op.user_id}: ${String(err)}`);
        }
    }

    return NextResponse.json({
        ok: true,
        reports_generated: results.length,
        errors_count: errors.length,
    });
}

function formatReportEmail(report: any): string {
    const momentum = report.momentum_score;
    const band = report.momentum_band;
    const trend = report.momentum_trend === 'up' ? '📈 Trending up' : report.momentum_trend === 'down' ? '📉 Trending down' : '➡️ Holding steady';

    return [
        `Your momentum: ${momentum}/100 (${band})`,
        trend,
        `Profile views: ${report.profile_views}`,
        `Search appearances: ${report.search_appearances}`,
        `Loads matched: ${report.loads_matched}`,
        `Avg response: ${report.response_speed_avg_min} min`,
        report.next_best_step ? `\nNext step: ${report.next_best_step}` : '',
        report.demand_near_you.length > 0
            ? `\nDemand near you:\n${report.demand_near_you.map((d: any) => `  • ${d.corridor}: ${d.loads} loads`).join('\n')}`
            : '',
    ].filter(Boolean).join('\n');
}
