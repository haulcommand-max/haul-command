import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════
// /api/saved-searches — Broker saved search CRUD
//
// GET    → list all saved searches for the authenticated user
// POST   → create a new saved search
// DELETE → remove a saved search by id (query param ?id=xxx)
// PATCH  → toggle notify_push or update fields
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { data, error } = await supabase
    .from('hc_saved_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ searches: data ?? [], total: data?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const body = await req.json();
  const {
    label,
    country_code,
    region_code,
    service_types,
    corridor_slugs,
    notify_push = true,
    notify_email = false,
  } = body;

  if (!country_code) {
    return NextResponse.json({ error: 'country_code required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hc_saved_searches')
    .upsert({
      user_id: user.id,
      label: label ?? `${region_code ?? country_code} Watch`,
      country_code,
      region_code: region_code ?? null,
      service_types: service_types ?? [],
      corridor_slugs: corridor_slugs ?? [],
      notify_push,
      notify_email,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,country_code,region_code',
    })
    .select('id, label, country_code, region_code, service_types, notify_push')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, search: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Only allow safe fields
  const allowed: Record<string, unknown> = {};
  for (const key of ['label', 'notify_push', 'notify_email', 'service_types', 'corridor_slugs']) {
    if (key in updates) allowed[key] = updates[key];
  }
  allowed.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('hc_saved_searches')
    .update(allowed)
    .eq('id', id)
    .eq('user_id', user.id) // RLS double-check
    .select('id, label, notify_push')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, search: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param required' }, { status: 400 });

  const { error } = await supabase
    .from('hc_saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
