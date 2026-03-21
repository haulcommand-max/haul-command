import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [profile, jobs, offers] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('jobs').select('*').or(`operator_id.eq.${user.id},poster_id.eq.${user.id}`),
      supabase.from('offers').select('*').eq('user_id', user.id),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      profile: profile.data,
      jobs: jobs.data || [],
      offers: offers.data || [],
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Disposition': `attachment; filename="haul-command-data-export-${Date.now()}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
