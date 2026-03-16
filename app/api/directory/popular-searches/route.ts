export const dynamic = 'force-dynamic';
/**
 * GET /api/directory/popular-searches
 * Returns trending search queries from directory_popular_searches materialized view.
 * Used by: directory home, search bar suggestions, personalization engine.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const revalidate = 7200; // 2h — matches cron refresh cadence

export async function GET() {
    const svc = getSupabaseAdmin();

    const { data } = await svc
        .from('directory_popular_searches')
        .select('city, state, service, search_count, ctr_pct, last_searched_at')
        .order('search_count', { ascending: false })
        .limit(20);

    return NextResponse.json({ trending: data ?? [], refreshed_at: new Date().toISOString() });
}
