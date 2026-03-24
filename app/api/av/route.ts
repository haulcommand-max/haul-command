import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: companies, error } = await supabase
      .from('av_companies')
      .select('*')
      .eq('operational_status', 'active')
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: regulations } = await supabase
      .from('av_regulations')
      .select('*')
      .order('country_code');

    const { data: corridors } = await supabase
      .from('oilfield_corridors')
      .select('*')
      .eq('is_active', true)
      .order('name');

    return NextResponse.json({
      av_companies: companies ?? [],
      regulations: regulations ?? [],
      corridors: corridors ?? [],
    });
  } catch (err) {
    console.error('[av-data] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
