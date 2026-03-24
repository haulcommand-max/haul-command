import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from('load_type_categories')
      .select(`
        *,
        load_subtypes (
          id, code, name, description, escort_complexity,
          requires_police_common, requires_route_survey,
          typical_width_ft, typical_height_ft, typical_length_ft, typical_weight_lb,
          countries_primary, sort_order
        )
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('[load-types] DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: categories ?? [] });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
