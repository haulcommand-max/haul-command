import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════
   /api/regulations/countries
   Fetches all 57 country regulations from Supabase
   ══════════════════════════════════════════════════════ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('country_regulations')
      .select('*')
      .order('country_name', { ascending: true });

    if (error) {
      console.error('[regulations] Supabase error:', error.message);
      // Return fallback demo data so the UI still works without DB
      return NextResponse.json({ countries: FALLBACK_COUNTRIES, source: 'fallback' });
    }

    return NextResponse.json({ countries: data || FALLBACK_COUNTRIES, source: data?.length ? 'supabase' : 'fallback' });
  } catch (err) {
    console.error('[regulations] Unexpected error:', err);
    return NextResponse.json({ countries: FALLBACK_COUNTRIES, source: 'fallback' });
  }
}

// Fallback data so the frontend always renders even before migrations are applied
const FALLBACK_COUNTRIES = [
  { country_code: 'US', country_name: 'United States', max_routine_width_meters: 4.88, max_routine_height_meters: 4.72, max_routine_length_meters: 39.62, max_routine_weight_kg: 68039, escort_required_width_meters: 3.66, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: false, transport_authority_notes: 'State-by-state regulations vary. Superload above 120,000 lbs requires engineering analysis.' },
  { country_code: 'CA', country_name: 'Canada', max_routine_width_meters: 5.0, max_routine_height_meters: 4.87, max_routine_length_meters: 41.0, max_routine_weight_kg: 63500, escort_required_width_meters: 3.76, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: true, transport_authority_notes: 'Provincial permit systems. CTEA super-corridor on Trans-Canada.' },
  { country_code: 'AU', country_name: 'Australia', max_routine_width_meters: 5.5, max_routine_height_meters: 5.3, max_routine_length_meters: 53.5, max_routine_weight_kg: 166500, escort_required_width_meters: 3.5, standard_curfews_apply: true, night_moves_allowed: true, metric_standard: true, transport_authority_notes: 'NHVR national scheme. Road trains in outback up to 53.5 m.' },
  { country_code: 'DE', country_name: 'Germany', max_routine_width_meters: 3.0, max_routine_height_meters: 4.0, max_routine_length_meters: 25.0, max_routine_weight_kg: 41000, escort_required_width_meters: 3.0, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: true, transport_authority_notes: 'BASt oversees. Strict Autobahn curfews and Sunday bans.' },
  { country_code: 'GB', country_name: 'United Kingdom', max_routine_width_meters: 3.0, max_routine_height_meters: 4.95, max_routine_length_meters: 18.75, max_routine_weight_kg: 44000, escort_required_width_meters: 3.0, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: true, transport_authority_notes: 'DVSA & Highways England. Left-hand drive, narrow lanes.' },
  { country_code: 'BR', country_name: 'Brazil', max_routine_width_meters: 3.2, max_routine_height_meters: 4.4, max_routine_length_meters: 19.8, max_routine_weight_kg: 57000, escort_required_width_meters: 3.2, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: true, transport_authority_notes: 'DNIT oversees national highways. AET (Special Transport Authorization) required.' },
  { country_code: 'MX', country_name: 'Mexico', max_routine_width_meters: 3.5, max_routine_height_meters: 4.5, max_routine_length_meters: 31.0, max_routine_weight_kg: 66500, escort_required_width_meters: 3.5, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: true, transport_authority_notes: 'SCT federal permits. Toll road vs free road rules differ.' },
  { country_code: 'SA', country_name: 'Saudi Arabia', max_routine_width_meters: 3.75, max_routine_height_meters: 4.8, max_routine_weight_kg: 66000, max_routine_length_meters: 22.0, escort_required_width_meters: 3.75, standard_curfews_apply: true, night_moves_allowed: true, metric_standard: true, transport_authority_notes: 'TGA regulates. Desert corridor moves common at night.' },
  { country_code: 'AE', country_name: 'United Arab Emirates', max_routine_width_meters: 3.5, max_routine_height_meters: 4.5, max_routine_length_meters: 22.0, max_routine_weight_kg: 55000, escort_required_width_meters: 3.5, standard_curfews_apply: true, night_moves_allowed: true, metric_standard: true, transport_authority_notes: 'RTA/ITC permits for each Emirate separately.' },
  { country_code: 'IN', country_name: 'India', max_routine_width_meters: 3.0, max_routine_height_meters: 4.75, max_routine_length_meters: 18.0, max_routine_weight_kg: 49000, escort_required_width_meters: 3.0, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: true, transport_authority_notes: 'NHAI & state RTOs. Highly variable state-to-state.' },
  { country_code: 'JP', country_name: 'Japan', max_routine_width_meters: 2.5, max_routine_height_meters: 3.8, max_routine_length_meters: 12.0, max_routine_weight_kg: 25000, escort_required_width_meters: 2.5, standard_curfews_apply: true, night_moves_allowed: true, metric_standard: true, transport_authority_notes: 'MLIT permits. Night moves preferred due to extreme congestion.' },
  { country_code: 'FR', country_name: 'France', max_routine_width_meters: 3.0, max_routine_height_meters: 4.3, max_routine_length_meters: 25.0, max_routine_weight_kg: 44000, escort_required_width_meters: 3.0, standard_curfews_apply: true, night_moves_allowed: false, metric_standard: true, transport_authority_notes: 'DREAL issues permits. Sunday and holiday bans enforced.' },
];
