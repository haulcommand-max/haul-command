import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
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

    const { lesson_id, completed, video_watch_percent } = await req.json();
    if (!lesson_id) {
      return NextResponse.json({ error: 'lesson_id required' }, { status: 400 });
    }

    // Upsert lesson progress
    await supabase.from('user_lesson_progress').upsert({
      user_id: user.id,
      lesson_id,
      completed: completed ?? false,
      video_watch_percent: video_watch_percent ?? 0,
      completed_at: completed ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,lesson_id' });

    // Get the lesson's module
    const { data: lesson } = await supabase
      .from('training_lessons')
      .select('module_id, content_type')
      .eq('id', lesson_id)
      .single();

    if (!lesson) {
      return NextResponse.json({ ok: true, assessment_unlocked: false });
    }

    const { module_id } = lesson;

    // Check if all non-quiz lessons in the module are complete
    const { data: allLessons } = await supabase
      .from('training_lessons')
      .select('id, content_type')
      .eq('module_id', module_id)
      .neq('content_type', 'quiz');

    const { data: completedLessons } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('completed', true)
      .in('lesson_id', (allLessons || []).map(l => l.id));

    const allComplete = (allLessons || []).length > 0 &&
      (completedLessons || []).length >= (allLessons || []).length;

    if (allComplete) {
      // Unlock assessment — update module progress to 'in_progress' if not already passed
      await supabase.from('user_module_progress').upsert({
        user_id: user.id,
        module_id,
        status: 'in_progress',
      }, { onConflict: 'user_id,module_id', ignoreDuplicates: false });
    }

    return NextResponse.json({ ok: true, assessment_unlocked: allComplete });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
