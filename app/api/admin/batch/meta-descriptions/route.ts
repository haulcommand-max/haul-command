import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { batchGenerateMetaDescriptions, enrichOperatorProfile } from '@/lib/ai/brain';
import { tracked } from '@/lib/ai/tracker';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/batch/meta-descriptions
 * 
 * One-time batch job: generate SEO meta descriptions for all directory listings
 * that are missing one. Uses Gemini 2.0 Flash Lite.
 * 
 * Cost estimate: ~$0.0001 per listing × 7,745 listings = $0.77 total
 * Speed: 10 concurrent, ~$0.77 total, runs in ~5-8 minutes
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const body = await req.json().catch(() => ({}));
  const limit = body.limit ?? 100; // Default: process 100 at a time
  const type = body.type ?? 'meta'; // 'meta' | 'enrich'

  if (type === 'meta') {
    // Fetch listings missing meta descriptions
    const { data: listings } = await supabase
      .from('listings')
      .select('id, state, city, full_name, services, equipment, rating, review_count')
      .or('meta_description.is.null,meta_description.eq.')
      .limit(limit);

    if (!listings || listings.length === 0) {
      return NextResponse.json({ message: 'All listings have meta descriptions', processed: 0 });
    }

    const pages = listings.map((l: any) => ({
      id: l.id,
      type: 'pilot car escort operator',
      location: `${l.city ? l.city + ', ' : ''}${l.state || ''}`.trim() || 'US',
      stats: `Rating: ${l.rating ?? 'N/A'}, Reviews: ${l.review_count ?? 0}, Services: ${(l.services ?? []).join(', ') || 'escort services'}`,
    }));

    const results = await batchGenerateMetaDescriptions(pages);

    // Write back to DB
    let updated = 0;
    for (const { id, meta } of results) {
      const { error } = await supabase
        .from('listings')
        .update({ meta_description: meta })
        .eq('id', id);
      if (!error) updated++;
    }

    return NextResponse.json({
      type: 'meta',
      processed: listings.length,
      updated,
      estimated_cost_cents: listings.length * 0.01, // ~$0.0001 per listing
    });
  }

  if (type === 'enrich') {
    // Fetch listings missing bio/profile data
    const { data: listings } = await supabase
      .from('listings')
      .select('id, full_name, state, city, services, equipment, certifications, years_experience')
      .or('bio.is.null,bio.eq.')
      .limit(limit);

    if (!listings || listings.length === 0) {
      return NextResponse.json({ message: 'All listings have bios', processed: 0 });
    }

    let updated = 0;
    const BATCH = 5;
    for (let i = 0; i < listings.length; i += BATCH) {
      const batch = listings.slice(i, i + BATCH);
      const settled = await Promise.allSettled(batch.map(async (l: any) => {
        const rawData = JSON.stringify({
          name: l.full_name,
          location: `${l.city ?? ''} ${l.state ?? ''}`.trim(),
          services: l.services,
          equipment: l.equipment,
          certifications: l.certifications,
          experience: l.years_experience,
        });

        const res = await tracked('batch_enrich_listing', () => enrichOperatorProfile(rawData));
        try {
          const parsed = JSON.parse(res.text);
          await supabase.from('listings').update({
            bio: parsed.bio ?? null,
            services: parsed.services ?? l.services,
            equipment: parsed.equipment ?? l.equipment,
          }).eq('id', l.id);
          updated++;
        } catch { /* skip malformed */ }
      }));
    }

    return NextResponse.json({
      type: 'enrich',
      processed: listings.length,
      updated,
      estimated_cost_cents: listings.length * 0.03,
    });
  }

  return NextResponse.json({ error: 'Invalid type. Use meta or enrich.' }, { status: 400 });
}
