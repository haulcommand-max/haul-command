import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Typesense configuration (using raw fetch to avoid heavy SDKs if possible)
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'localhost';
const TYPESENSE_PORT = process.env.TYPESENSE_PORT || '8108';
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'http';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || 'dev_typesense_key_123';

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Check if the provider is typesense from Supabase settings
    const { data: settings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'search_provider')
      .single();

    const provider = settings?.value || 'typesense';

    if (provider === 'typesense') {
      try {
        const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/provider_directory/documents/search?q=${encodeURIComponent(q)}&query_by=display_name,city,state,service_tags&page=${page}&per_page=${limit}`;
        
        const res = await fetch(url, {
          headers: {
            'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const operators = data.hits.map((hit: any) => hit.document);
          return NextResponse.json({
            operators,
            total: data.found,
            censored: true, // Example logic
            page
          });
        } else {
          console.warn('[DirectorySearch] Typesense returned non-OK:', await res.text());
          // Fallback to Supabase
        }
      } catch (err) {
        console.error('[DirectorySearch] Typesense fetch failed, falling back to Supabase:', err);
      }
    }

    // Supabase search fallback — real operators only via hc_global_operators view
    // directory_listings is quarantined (654K synthetic rows), do NOT query it for search
    let queryBuilder = supabase
      .from('hc_global_operators')
      .select('id, slug, name, admin1_code, city, entity_type, phone, email, claim_status, trust_classification', { count: 'exact' });

    if (q) {
      queryBuilder = queryBuilder.or(`name.ilike.%${q}%,city.ilike.%${q}%,admin1_code.ilike.%${q}%`);
    }

    const { data: operators, count, error } = await queryBuilder
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      operators: operators || [],
      total: count || 0,
      censored: true, // Can determine by auth header later
      page
    });
  } catch (err: any) {
    console.error('[DirectorySearch] API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
