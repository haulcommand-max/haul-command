import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: certifications } = await supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: moduleProgress } = await supabase
      .from('user_module_progress')
      .select('*, training_modules(slug, title, order_index, certification_tier)')
      .eq('user_id', user.id);

    const { data: allModules } = await supabase
      .from('training_modules')
      .select('id, slug, title, order_index, certification_tier, duration_minutes')
      .order('order_index', { ascending: true });

    // Merge progress with module data
    const progressMap = new Map((moduleProgress || []).map(p => [p.module_id, p]));
    const enrichedModules = (allModules || []).map(m => ({
      ...m,
      progress: progressMap.get(m.id) || null,
    }));

    return NextResponse.json({
      certifications: certifications || [],
      module_progress: enrichedModules,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
