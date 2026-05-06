import { NextRequest, NextResponse } from 'next/server'
import { generateSEOPage, generateBatch } from '@/lib/ai/gemini'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { count = 25, country } = await req.json()

  let query = supabase
    .from('hc_seo_pages')
    .select('id, slug, title, keyword, country')
    .or('body.is.null,body.eq.')
    .limit(Math.min(count, 50))

  if (country) query = query.eq('country', country)

  const { data: pages, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!pages?.length) return NextResponse.json({ processed: 0, message: 'No empty SEO pages found' })

  const jobId = crypto.randomUUID()
  await supabase.from('hc_agent_jobs').insert({
    id: jobId,
    job_type: 'seo_generation',
    status: 'running',
    total: pages.length,
    completed: 0,
    failed: 0,
    created_at: new Date().toISOString(),
  })

  let completed = 0, failed = 0

  await generateBatch(pages, async (page) => {
    const generated = await generateSEOPage(
      page.slug,
      page.keyword ?? page.title,
      page.country ?? 'United States'
    )

    await supabase.from('hc_seo_pages').update({
      title: generated.title ?? page.title,
      meta_description: generated.meta_description,
      body: generated.body_html,
      schema_json: generated.schema_json,
      is_published: true,
      updated_at: new Date().toISOString(),
    }).eq('id', page.id)

    completed++
    await supabase.from('hc_agent_jobs').update({ completed }).eq('id', jobId)
  }, 8)

  failed = pages.length - completed
  await supabase.from('hc_agent_jobs').update({
    status: 'completed',
    completed,
    failed,
    completed_at: new Date().toISOString(),
  }).eq('id', jobId)

  return NextResponse.json({ processed: completed, failed, job_id: jobId })
}
