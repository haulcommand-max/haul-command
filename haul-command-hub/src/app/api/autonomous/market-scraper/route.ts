import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// This is the autonomous ingestion receiver.
// Python scraper agents (Claude) will hit this endpoint with scraped Google Maps/Serp data
// and it will autonomously build Haul Command profiles, assign HC Trust Numbers, and rank them.

interface ScrapedOperator {
  name: string;
  phone: string;
  website: string | null;
  lat: number;
  lng: number;
  locality: string;
  admin1_code: string;
  country_code: string;
  category: string; // e.g. pilot_car, escort_vehicle
}

function generateHCNumber(countryCode: string, adminCode: string) {
  // Example: HC-US-TX-84920
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `HC-${countryCode.toUpperCase()}-${adminCode.toUpperCase()}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operators } = await req.json() as { operators: ScrapedOperator[] };
    if (!operators || !Array.isArray(operators)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const sb = supabaseServer();
    let ingested = 0;
    let duplicates = 0;

    for (const op of operators) {
      // Clean phone to E164 or basic digit string for dup-check
      const cleanPhone = op.phone.replace(/\D/g, '');
      
      // Check if exists
      const { data: existing } = await sb
        .from('hc_places')
        .select('id')
        .ilike('name', `%${op.name}%`)
        .eq('admin1_code', op.admin1_code)
        .maybeSingle();

      if (existing) {
        duplicates++;
        continue;
      }

      // Generate the Trust System HC Number
      const hcNumber = generateHCNumber(op.country_code, op.admin1_code);
      const slug = `${op.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${op.locality.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      // Insert autonomous profile
      const { error } = await sb.from('hc_places').insert({
        slug,
        name: op.name,
        phone: op.phone,
        website: op.website,
        lat: op.lat,
        lng: op.lng,
        locality: op.locality,
        admin1_code: op.admin1_code,
        country_code: op.country_code.toUpperCase(),
        surface_category_key: op.category,
        claim_status: 'unclaimed',
        status: 'published',
        hc_trust_number: hcNumber, // New field for authoritative trust
        source_system: 'autonomous_scraper',
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error(`Failed to insert ${op.name}:`, error);
      } else {
        ingested++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Autonomous Ingestion Complete. Ingested: ${ingested}, Duplicates skipped: ${duplicates}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
