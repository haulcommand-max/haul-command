import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { operator_id, template_id, title, status, form_data, signature_data } = body;

    if (operator_id !== session.user.id) {
      return NextResponse.json({ error: 'Identity verification mismatch' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('hc_operator_documents')
      .insert({
        operator_id,
        template_id,
        title,
        status,
        form_data,
        signature_data
      })
      .select()
      .single();

    if (error) {
      console.error('[Forms] Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[Forms] Route Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
