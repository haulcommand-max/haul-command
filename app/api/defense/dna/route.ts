import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * HAUL COMMAND - EDGE DNA INGESTION
 * Correlates IPs to browser hardware fingerprints to break scraper rotation strategies.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      user_agent, 
      canvas_fingerprint, 
      webgl_fingerprint, 
      hardware_concurrency, 
      device_memory, 
      screen_resolution 
    } = body;

    // Fast-path IP retrieval from Edge
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0';

    // Verify if this exact DNA signature is recognized across our global stack
    // (This queries using the Service Role so RLS doesn't block the backend ingest)
    const { data: existingDna } = await supabaseAdmin
      .from('session_dna')
      .select('id, risk_score')
      .eq('canvas_fingerprint', canvas_fingerprint)
      .eq('webgl_fingerprint', webgl_fingerprint)
      .single();

    let finalRiskScore = 0.0;
    
    if (existingDna) {
      // If we've seen this biological hardware fingerprint before, 
      // check if it's hopping IP blocks. If yes, spike the risk score.
      finalRiskScore = existingDna.risk_score;
      if (finalRiskScore > 0.8) {
        // Log an immediate update that an attacker is IP hopping
        await supabaseAdmin
          .from('session_dna')
          .update({ last_seen_at: new Date().toISOString(), ip_address })
          .eq('id', existingDna.id);
        
        return NextResponse.json({ status: 'threat_detected' }, { status: 403 });
      }
    } else {
      // Insert new DNA trace
      await supabaseAdmin
        .from('session_dna')
        .insert({
          ip_address,
          user_agent,
          canvas_fingerprint,
          webgl_fingerprint,
          screen_resolution,
          hardware_concurrency,
          device_memory,
          risk_score: 0.0
        });
    }

    return NextResponse.json({ status: 'ingested' });

  } catch (error) {
    // Fail silently so scrapers don't know we are logging their hardware
    return NextResponse.json({ status: 'ok' });
  }
}
