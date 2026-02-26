export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new Response('Missing id', { status: 400 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const { data, error } = await supabase
        .from('v_driver_report_card')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

    if (error) return new Response(error.message, { status: 500 });
    if (!data) return Response.json(null);

    return Response.json(data);
}
