import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/community/threads — Create thread
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const { thread_type, title, category, country_code, language_code, tags } = body;

        if (!title) {
            return NextResponse.json({ error: 'title required' }, { status: 400 });
        }

        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 80);

        const { data, error } = await db
            .from('soc_threads')
            .insert({
                thread_type: thread_type || 'discussion',
                title,
                slug: `${slug}-${Date.now().toString(36)}`,
                category: category || null,
                country_code: country_code || null,
                language_code: language_code || 'en',
                tags: tags || [],
                status: 'active',
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({ thread_id: data.id }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
