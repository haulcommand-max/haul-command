import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Catch Postgres pg_notify trigger payloads configured in 20260402_global_os_master_upgrades.sql
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized system hook' }, { status: 401 });
  }

  const payload = await req.json();
  const { action, record } = payload;
  
  if (!record || !record.id) {
    return NextResponse.json({ error: 'Missing record details' }, { status: 400 });
  }

  const typesenseHost = process.env.NEXT_PUBLIC_TYPESENSE_HOST;
  const typesenseKey = process.env.TYPESENSE_ADMIN_API_KEY;

  if (!typesenseHost || !typesenseKey) {
     console.error("Typesense keys missing");
     return NextResponse.json({ error: 'Missing Typesense Keys' }, { status: 500 });
  }

  const collectionName = 'operators';

  try {
    const tsUrl = `https://${typesenseHost}/collections/${collectionName}/documents`;
    
    if (action === 'INSERT' || action === 'UPDATE') {
      // Map postgres record to Typesense strict schema (e.g. lat lng explicit array cast)
      const tsDocument = {
        id: record.id.toString(),
        name: record.name,
        city: record.city,
        state_code: record.state_code,
        country: record.country_code || 'US',
        trust_score: record.trust_score || 0.5,
        rating: record.google_rating || 0.0,
        slug: record.slug,
        is_verified: record.is_verified || false,
        // The Typesense Geo-Index Patch field mapping
        location: record.lat && record.lng ? [Number(record.lat), Number(record.lng)] : undefined
      };

      await fetch(tsUrl, {
        method: 'POST', // or 'UPSERT' via ?action=upsert in Typesense REST
        headers: {
          'Content-Type': 'application/json',
          'X-TYPESENSE-API-KEY': typesenseKey
        },
        body: JSON.stringify(tsDocument)
      });
      console.log(`Syncing Typesense node: ${tsDocument.id}`);
    } else if (action === 'DELETE') {
      await fetch(`${tsUrl}/${record.id}`, {
        method: 'DELETE',
        headers: {
           'X-TYPESENSE-API-KEY': typesenseKey
        }
      });
    }

    return NextResponse.json({ success: true, synced: record.id });
  } catch (e: any) {
    return NextResponse.json({ error: `Sync Failed: ${e.message}` }, { status: 500 });
  }
}
