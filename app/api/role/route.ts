// app/api/role/route.ts
// Persist user role to hc_user_role_state
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const VALID_ROLES = ['pilot', 'broker', 'both', 'support', 'observer'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = body?.role;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not logged in — still OK, just don't persist to DB
      return NextResponse.json({ ok: true, persisted: false });
    }

    await supabase
      .from('hc_user_role_state')
      .upsert({
        user_id: user.id,
        role,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return NextResponse.json({ ok: true, persisted: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ role: null });

    const { data } = await supabase
      .from('hc_user_role_state')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({ role: data?.role ?? null });
  } catch {
    return NextResponse.json({ role: null });
  }
}
