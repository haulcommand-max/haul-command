import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(_req: Request, { params }: { params: Promise<{ module_slug: string }> }) {
  try {
    const { module_slug } = await params;
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

    // Fetch module
    const { data: module, error } = await supabase
      .from('training_modules')
      .select('*')
      .eq('module_slug', module_slug)
      .single();

    if (error || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Fetch lessons
    const { data: lessons } = await supabase
      .from('training_lessons')
      .select('*')
      .eq('module_id', module.id)
      .order('order_index', { ascending: true });

    // Fetch questions
    const { data: questions } = await supabase
      .from('training_questions')
      .select('*')
      .eq('module_id', module.id);

    // User progress
    let moduleProgress = null;
    let lessonProgress: Record<string, unknown> = {};

    if (user) {
      const { data: mp } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .single();
      moduleProgress = mp;

      if (lessons?.length) {
        const lessonIds = lessons.map(l => l.id);
        const { data: lp } = await supabase
          .from('user_lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);
        if (lp) {
          for (const p of lp) {
            lessonProgress[p.lesson_id] = p;
          }
        }
      }
    }

    // Map to frontend interface
    const mappedModule = {
      id: module.id,
      slug: module.module_slug,
      title: module.module_title,
      description: module.official_session_title || 'Haul Command Training Module',
      duration_minutes: module.hc_estimated_minutes || module.official_minutes || 60,
      order_index: module.sequence_order,
      certification_tier: 'hc_certified', // Fallback for specific Florida override logic etc.
      is_free: false,
      pass_score: 80,
    };

    return NextResponse.json({
      module: mappedModule,
      lessons: lessons || [],
      questions: questions || [],
      moduleProgress,
      lessonProgress,
      authenticated: !!user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
