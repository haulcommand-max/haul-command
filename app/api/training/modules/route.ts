import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all modules ordered
    const { data: modules, error } = await supabase
      .from('training_modules')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;

    // If user authenticated, attach progress
    let progress: Record<string, unknown> = {};
    if (user) {
      const { data: prog } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', user.id);
      if (prog) {
        for (const p of prog) {
          progress[p.module_id] = p;
        }
      }
    }

    const enriched = (modules || []).map(m => ({
      ...m,
      progress: progress[m.id] || null,
    }));

    return NextResponse.json({ modules: enriched, authenticated: !!user });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
