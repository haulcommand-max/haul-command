// app/api/v1/admin/reviews/route.ts
// GET  — list review requests
// POST — admin actions on reviews (expire, flag, etc.)
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const jobId = url.searchParams.get('job_id');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let query = supabase
        .from('job_reviews')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (jobId) query = query.eq('job_id', jobId);

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Stats
    const { data: allReviews } = await supabase
        .from('job_reviews')
        .select('status, rating');

    const stats = {
        total: allReviews?.length || 0,
        pending: 0,
        sent: 0,
        submitted: 0,
        expired: 0,
        avg_rating: 0,
        total_rated: 0,
    };

    let ratingSum = 0;
    for (const r of (allReviews ?? []) as any[]) {
        stats[r.status as keyof typeof stats] = ((stats[r.status as keyof typeof stats] as number) || 0) + 1;
        if (r.rating) {
            ratingSum += r.rating;
            stats.total_rated++;
        }
    }
    stats.avg_rating = stats.total_rated > 0 ? Math.round((ratingSum / stats.total_rated) * 10) / 10 : 0;

    return NextResponse.json({
        reviews: data,
        stats,
        pagination: { limit, offset, total: count },
    });
}

// POST /api/v1/admin/reviews — submit a review or admin action
export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { review_id, action, rating, comment } = body;

    if (!review_id || !action) {
        return NextResponse.json({ error: 'review_id and action required' }, { status: 400 });
    }

    if (action === 'submit') {
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
        }

        const { error } = await supabase
            .from('job_reviews')
            .update({
                rating,
                comment: comment || null,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
            })
            .eq('review_id', review_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, review_id, status: 'submitted' });
    }

    if (action === 'expire') {
        const { error } = await supabase
            .from('job_reviews')
            .update({ status: 'expired' })
            .eq('review_id', review_id)
            .in('status', ['pending', 'sent']);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, review_id, status: 'expired' });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
