import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (body.confirmation !== 'DELETE_MY_DATA') {
      return NextResponse.json({ error: 'Must confirm with DELETE_MY_DATA' }, { status: 400 });
    }

    // Anonymize profile data
    await supabase.from('profiles').update({
      full_name: '[DELETED]',
      phone: null,
      avatar_url: null,
      bio: null,
      company_name: '[DELETED]',
      deleted_at: new Date().toISOString(),
    }).eq('id', user.id);

    // Log the deletion request
    await supabase.from('event_log').insert({
      event_type: 'gdpr_deletion',
      user_id: user.id,
      metadata: { requested_at: new Date().toISOString() },
    });

    return NextResponse.json({ status: 'deletion_scheduled', message: 'Your data will be fully removed within 30 days per our retention policy.' });
  } catch {
    return NextResponse.json({ error: 'Deletion request failed' }, { status: 500 });
  }
}
