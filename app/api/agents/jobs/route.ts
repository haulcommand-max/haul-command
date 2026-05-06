import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('hc_agent_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const running = data?.filter(j => j.status === 'running').length ?? 0
  const completed = data?.filter(j => j.status === 'completed').length ?? 0
  const failed = data?.filter(j => j.status === 'failed').length ?? 0

  return NextResponse.json({ jobs: data ?? [], summary: { running, completed, failed } })
}
