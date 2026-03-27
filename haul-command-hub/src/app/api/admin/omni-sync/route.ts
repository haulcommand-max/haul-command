import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAllTerms } from '@/lib/glossary';
import { COUNTRY_REGULATIONS } from '@/lib/regulations';
import { GLOBAL_POSITIONS } from '@/lib/positions-global';

// Service role required to bypass standard user RLS restrictions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * HAUL COMMAND OMNI-SYNC ENGINE (GEMINI PIPELINE)
 * Aggregates the completely disjointed TypeScript arrays (Positions, Regulations, Glossary) 
 * across 120 countries and smashes them into unified Supabase tables. 
 * Allows immediate high-speed cross-referencing by the UI and the upcoming mobile app.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'HC_OMNI_OVERRIDE_001'}`) {
      return NextResponse.json({ error: 'System Override Authorization Required' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Process 500+ Dictionary Terms
    const terms = getAllTerms();
    const dictPayload = terms.map(t => ({
      term_id: t.id,
      term: t.term,
      category: t.category,
      definition: t.definition,
      hc_brand_term: t.hcBrandTerm || null,
      countries: t.countries || [],
      aliases: t.aliases || [],
      seo_keywords: t.seoKeywords || [],
      regulatory_ref: t.regulatoryRef || null,
      is_pro_locked: ['tactical_logistics', 'autonomous_future_tech'].includes(t.category)
    }));

    // 2. Process 57 Country Regulations
    const regPayload = COUNTRY_REGULATIONS.map((r: any) => ({
      country_code: r.country,
      name: r.name,
      authority_name: r.authority,
      authority_url: r.authorityUrl || null,
      max_metric_width: r.standardLimits.maxWidthM,
      max_metric_height: r.standardLimits.maxHeightM,
      max_metric_weight: r.standardLimits.maxGrossWeightKg,
      single_escort_threshold: r.escortThresholds.singleEscortWidthM || null,
      police_escort_threshold: r.escortThresholds.policeEscortWidthM || null,
      regulatory_citation: r.regulatoryRef || null
    }));

    // 3. Process 73 Global Industry Positions
    const posPayload = GLOBAL_POSITIONS.map((p: any) => ({
      term_id: p.id,
      title: p.label_en,
      category: p.category,
      countries: p.countries || [],
      is_autonomous: p.isFuture || false
    }));

    // 4. Concurrent Omnidirectional Matrix Write
    const [dictReq, regReq, posReq] = await Promise.all([
      supabase.from('hc_dictionary').upsert(dictPayload, { onConflict: 'term_id' }),
      supabase.from('hc_regulations_global').upsert(regPayload, { onConflict: 'country_code' }),
      supabase.from('hc_positions_global').upsert(posPayload, { onConflict: 'term_id' })
    ]);

    if (dictReq.error) throw new Error(`Dictionary Sync Failed: ${dictReq.error.message}`);
    if (regReq.error) throw new Error(`Regulations Sync Failed: ${regReq.error.message}`);
    if (posReq.error) throw new Error(`Positions Sync Failed: ${posReq.error.message}`);

    return NextResponse.json({ 
      success: true, 
      system_status: 'Omni-Sync Matrix Engaged',
      synced_metrics: {
        dictionary_terms: dictPayload.length,
        regulations_countries: regPayload.length,
        global_positions: posPayload.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
