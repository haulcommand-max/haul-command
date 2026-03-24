import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Vercel cron: 0 6 * * * (6am UTC daily)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const results: any[] = [];

  try {
    // Step 1: Pull next 3 unused topics and enqueue them
    const { data: topics } = await supabase
      .from('content_topics')
      .select('*')
      .eq('used', false)
      .order('priority', { ascending: true })
      .limit(3);

    if (!topics || topics.length === 0) {
      return NextResponse.json({ message: 'No unused topics remaining', generated: 0 });
    }

    for (const topic of topics) {
      // Insert into queue
      const { data: queueItem } = await supabase
        .from('content_queue')
        .insert({
          content_type: topic.content_type,
          topic: topic.topic,
          target_keyword: topic.keyword || null,
          target_audience: topic.target_audience,
          country_code: topic.country_code || null,
          status: 'queued',
        })
        .select('id')
        .single();

      if (!queueItem) continue;

      // Step 2: Generate content
      const genRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_id: queueItem.id,
          topic: topic.topic,
          content_type: topic.content_type,
          target_keyword: topic.keyword,
          target_audience: topic.target_audience,
          country_code: topic.country_code,
        }),
      });

      const genResult = await genRes.json();
      results.push({ topic: topic.topic, ...genResult });

      // Mark topic as used
      await supabase
        .from('content_topics')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', topic.id);
    }

    return NextResponse.json({
      job: 'content-engine',
      timestamp: new Date().toISOString(),
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Content engine cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
