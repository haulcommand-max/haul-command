export const dynamic = 'force-dynamic';
/**
 * GET /api/directory/popular-searches
 * Returns trending search queries from directory_popular_searches materialized view.
 * Used by: directory home, search bar suggestions, personalization engine.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const revalidate = 7200; // 2h — matches cron refresh cadence

export async function GET() {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data } = await svc
        .from('directory_popular_searches')
        .select('city, state, service, search_count, ctr_pct, last_searched_at')
        .order('search_count', { ascending: false })
        .limit(20);

    return NextResponse.json({ trending: data ?? [], refreshed_at: new Date().toISOString() });
}
