'use client'
import { useState, useEffect } from 'react'

export default function ContentPipeline() {
  const [stats, setStats] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const fetchStats = async () => {
    const [jobsRes] = await Promise.all([fetch('/api/agents/jobs')])
    const jobsData = await jobsRes.json()
    setJobs(jobsData.jobs ?? [])
  }

  useEffect(() => { fetchStats() }, [])

  const runBlogGen = async () => {
    setLoading('blog')
    await fetch('/api/agents/blog/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 10, country: country || undefined }),
    })
    await fetchStats()
    setLoading(null)
  }

  const runSEOGen = async () => {
    setLoading('seo')
    await fetch('/api/agents/seo/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 25, country: country || undefined }),
    })
    await fetchStats()
    setLoading(null)
  }

  const running = jobs.filter(j => j.status === 'running')

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">Content Pipeline</h2>

      <div className="flex gap-3 items-center">
        <input
          value={country}
          onChange={e => setCountry(e.target.value)}
          placeholder="Filter by country (optional)"
          className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/20 w-64"
        />
        <button
          onClick={runBlogGen}
          disabled={!!loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading === 'blog' ? 'Generating...' : 'Generate 10 Articles'}
        </button>
        <button
          onClick={runSEOGen}
          disabled={!!loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading === 'seo' ? 'Generating...' : 'Generate 25 SEO Pages'}
        </button>
      </div>

      {running.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm font-medium">{running.length} job(s) running</p>
          {running.map(j => (
            <p key={j.id} className="text-yellow-300 text-xs mt-1">
              {j.job_type}: {j.completed}/{j.total} completed
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {jobs.slice(0, 20).map(j => (
          <div key={j.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
            <div>
              <span className="text-white text-sm font-medium">{j.job_type}</span>
              <span className="text-gray-400 text-xs ml-3">{new Date(j.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-emerald-400">{j.completed} done</span>
              {j.failed > 0 && <span className="text-red-400">{j.failed} failed</span>}
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                j.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                j.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>{j.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
