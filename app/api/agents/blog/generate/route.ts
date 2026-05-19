import { NextRequest, NextResponse } from 'next/server'
import { generateArticle, generateBatch } from '@/lib/ai/gemini'
import { createClient } from '@supabase/supabase-js'
import { isInternalRequest } from '@/lib/auth/internal-request'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  if (!isInternalRequest(req.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const { count = 10, country } = await req.json()

  let query = supabase
    .from('hc_blog_articles')
    .select('id, title, country_code')
    .or('content.is.null,content.eq.')
    .limit(Math.min(count, 25))

  if (country) query = query.eq('country_code', country)

  const { data: articles, error } = await query
  if (error) return NextResponse.json({ error: 'Blog article lookup failed' }, { status: 500 })
  if (!articles?.length) return NextResponse.json({ processed: 0, message: 'No empty articles found' })

  const jobId = crypto.randomUUID()
  await supabase.from('hc_agent_jobs').insert({
    id: jobId,
    job_type: 'blog_generation',
    status: 'running',
    total: articles.length,
    completed: 0,
    failed: 0,
    created_at: new Date().toISOString(),
  })

  let completed = 0, failed = 0

  const results = await generateBatch(articles, async (article) => {
    const generated = await generateArticle(
      article.title,
      article.country_code ?? 'United States',
      undefined
    )

    await supabase.from('hc_blog_articles').update({
      title: generated.title,
      meta_description: generated.meta_description,
      content: generated.body_html,
      faq_items: generated.faq_items,
      schema_json: generated.schema_json,
      published: true,
      updated_at: new Date().toISOString(),
    }).eq('id', article.id)

    completed++
    await supabase.from('hc_agent_jobs').update({ completed }).eq('id', jobId)
    return generated.title
  })

  failed = results.filter(r => r.error).length
  await supabase.from('hc_agent_jobs').update({
    status: 'completed',
    completed,
    failed,
    completed_at: new Date().toISOString(),
  }).eq('id', jobId)

  return NextResponse.json({ processed: completed, failed, job_id: jobId })
}
