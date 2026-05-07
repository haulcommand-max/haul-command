'use client'
import { useState, useEffect } from 'react'

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']

export default function ResearchDashboard() {
  const [changes, setChanges] = useState<any[]>([])
  const [gaps, setGaps] = useState<any[]>([])
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState('Texas')
  const [keyword, setKeyword] = useState('')

  const runPermitScan = async () => {
    setLoading('permit')
    const res = await fetch('/api/research/permit-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: selectedState }),
    })
    const data = await res.json()
    if (data.changes?.length) setChanges(prev => [...data.changes, ...prev])
    setLoading(null)
  }

  const runCompetitorScan = async () => {
    setLoading('competitor')
    await fetch('/api/research/competitor-scan', { method: 'POST' })
    setLoading(null)
    alert('Competitor scan complete — check Supabase hc_firecrawl_extractions')
  }

  const runSEOGap = async () => {
    if (!keyword) return
    setLoading('seo')
    const res = await fetch('/api/research/seo-gaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    })
    const data = await res.json()
    if (data.gaps?.length) setGaps(prev => [...data.gaps, ...prev])
    setLoading(null)
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">Research Intelligence</h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Permit Scan */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">Permit Scanner</h3>
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/20"
          >
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={runPermitScan}
            disabled={loading === 'permit'}
            className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {loading === 'permit' ? 'Scanning...' : 'Run Permit Scan'}
          </button>
        </div>

        {/* Competitor Scan */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">Competitor Intel</h3>
          <p className="text-gray-400 text-xs">WideLoadShipping, ODS, Oversize.io, HeavyHaulers</p>
          <button
            onClick={runCompetitorScan}
            disabled={loading === 'competitor'}
            className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {loading === 'competitor' ? 'Scanning...' : 'Scan Competitors'}
          </button>
        </div>

        {/* SEO Gap */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">SEO Gap Finder</h3>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="e.g. oversize permit Texas"
            className="w-full px-3 py-2 bg-white/10 text-white rounded-lg text-sm border border-white/20"
          />
          <button
            onClick={runSEOGap}
            disabled={loading === 'seo' || !keyword}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'seo' ? 'Searching...' : 'Find SEO Gaps'}
          </button>
        </div>
      </div>

      {changes.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Detected Permit Changes</h3>
          <div className="space-y-2">
            {changes.map((c, i) => (
              <div key={i} className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3">
                <a href={c.url} target="_blank" className="text-orange-300 text-sm hover:underline">{c.title}</a>
                <span className="text-gray-400 text-xs ml-3">score: {c.score?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">SEO Gaps Found ({gaps.length})</h3>
          <div className="space-y-2">
            {gaps.map((g, i) => (
              <div key={i} className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
                <a href={g.url} target="_blank" className="text-blue-300 text-sm hover:underline">{g.keyword}</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
