import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
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
      .eq('slug', slug)
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

    return NextResponse.json({
      module,
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
