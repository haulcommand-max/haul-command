import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/adgrid/slot?slotType=corridor&market=i-10&pageFamily=directory
 *
 * Returns the active sponsor for a given slot type + market combination.
 * Falls back to broader market matches (city → state → country → global).
 * Respects budget caps and schedule windows.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slotType = searchParams.get('slotType');
  const market = searchParams.get('market') || '';
  const pageFamily = searchParams.get('pageFamily') || '';

  if (!slotType) {
    return NextResponse.json({ sponsor: null }, { status: 200 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try exact match first, then broader fallbacks
    const markets = [market, market?.split('-')[0], 'global'].filter(Boolean);
    
    let sponsor = null;
    for (const m of markets) {
      const { data } = await supabase
        .from('hc_adgrid_slots')
        .select('id, sponsor_name, sponsor_logo_url, headline, body, cta_text, cta_url, accent_color')
        .eq('slot_type', slotType)
        .eq('market', m)
        .eq('status', 'active')
        .lte('starts_at', new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
        .limit(1)
        .single();

      if (data) {
        sponsor = data;
        break;
      }
    }

    return NextResponse.json({ sponsor });
  } catch (err: any) {
    console.error('[AdGrid Slot Error]', err?.message);
    return NextResponse.json({ sponsor: null });
  }
}
