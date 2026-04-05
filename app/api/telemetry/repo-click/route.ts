import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action'); // 'call' or 'directory'
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Tracking telemetry for repository conversions.
  if (id) {
    try {
      const supabase = createClient();
      
      // Increment atomic click counter
      await supabase.rpc('hc_increment_repo_click', { p_id: id });

      // Log full event for conversion analytics
      await supabase.from('hc_telemetry_events').insert({
        action: `reposition_intent_${action}`,
        route: '/reposition',
        error_msg: `repo_post_id:${id}` // Temporary payload storage
      }).select().maybeSingle();

    } catch (err) {
      console.error('Telemetry logging failed:', err);
      // We do not block the redirect on tracking failure.
    }
  }

  return NextResponse.redirect(new URL(decodeURIComponent(targetUrl), request.url));
}
