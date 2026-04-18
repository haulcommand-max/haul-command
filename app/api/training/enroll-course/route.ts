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

    const { module_id, course_id } = await req.json();
    if (!module_id) {
      return NextResponse.json({ error: 'module_id required' }, { status: 400 });
    }

    // 1. Ensure user_module_progress exists
    await supabase.from('user_module_progress').upsert({
      user_id: user.id,
      module_id,
      status: 'in_progress',
    }, { onConflict: 'user_id,module_id', ignoreDuplicates: true });

    // 2. Also record in hc_training_enrollments if we have a course_id
    if (course_id) {
       await supabase.from('hc_training_enrollments').upsert({
           user_id: user.id,
           course_id,
           status: 'enrolled',
           enrolled_at: new Date().toISOString()
       }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
