export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ─────────────────────────────────────────────────
// GET /api/admin/directory/seeds
// List all seed queue entries with optional filters
// ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const state = searchParams.get('state');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = supabase
        .from('directory_seed_queue')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

    if (status !== 'all') query = query.eq('status', status);
    if (state) query = query.eq('state_abbr', state);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ entries: data, total: count, page, limit });
}

// ─────────────────────────────────────────────────
// POST /api/admin/directory/seeds
// Bulk upsert seed entries (import from scrape)
// Body: { entries: [{ company_name, city, state_abbr, phone, source_url }] }
// ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const entries = body.entries as Array<{
        company_name: string;
        city?: string;
        state_abbr?: string;
        phone?: string;
        source_url?: string;
    }>;

    if (!Array.isArray(entries) || entries.length === 0) {
        return NextResponse.json({ error: 'entries array required' }, { status: 400 });
    }

    const rows = entries.map(e => ({
        company_name: e.company_name,
        city: e.city ?? null,
        state_abbr: e.state_abbr ?? null,
        phone: e.phone ? e.phone.replace(/\D/g, '').slice(-10) : null,
        source_url: e.source_url ?? null,
        status: 'pending',
    }));

    const { data, error } = await supabase
        .from('directory_seed_queue')
        .insert(rows)
        .select('id, company_name, status');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ inserted: data?.length ?? 0, entries: data });
}
