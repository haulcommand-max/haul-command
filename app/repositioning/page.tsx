'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MapPin, Clock, Zap, ArrowRight, Truck, Radio } from 'lucide-react'

/**
 * /repositioning â€” Operator backhaul / reposition broadcast page
 *
 * Competitive kill surface vs. Facebook groups / WhatsApp chains.
 * Operators returning empty can broadcast their position and get matched.
 * Brokers see inbound repositioning capacity without making calls.
 */

interface RepoOp {
  id: string
  operator_name: string
  service_types: string[]
  city: string | null
  current_location: string
  heading_toward: string | null
  country_code: string
  region_code: string | null
  available_from: string
  available_until: string | null
  rate_per_hour: number | null
  broadcast_message: string | null
  updated_at: string
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

const SERVICE_LABEL: Record<string, string> = {
  pilot_car: 'ðŸš• Pilot Car',
  escort_truck: 'ðŸšš Escort Truck',
  height_pole: 'âš ï¸ Height Pole',
  wide_load: 'â†”ï¸ Wide Load',
  oversize: 'ðŸ“ Oversize',
}

export default function RepositioningPage() {
  const [ops, setOps] = useState<RepoOp[]>([])
  const [loading, setLoading] = useState(true)
  const [myBroadcast, setMyBroadcast] = useState<RepoOp | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState('')

  // Broadcast form state
  const [form, setForm] = useState({
    current_location: '',
    heading_toward: '',
    service_type: 'pilot_car',
    rate_per_hour: '',
    broadcast_message: '',
    hours_available: '8',
  })

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await load()
    }

    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('hc_available_now')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(40)
      setOps((data ?? []) as any)
      setLoading(false)
    }

    init()

    // Real-time updates
    const ch = supabase
      .channel('repositioning_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hc_available_now' }, load)
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  async function broadcast() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/sign-in?next=/repositioning'; return }

    const availUntil = new Date(Date.now() + parseInt(form.hours_available) * 3600000).toISOString()

    const { error } = await supabase
      .from('hc_available_now')
      .upsert({
        operator_id: user.id,
        operator_name: user.email?.split('@')[0] ?? 'Operator',
        service_types: [form.service_type],
        city: form.current_location,
        broadcast_message: form.broadcast_message || `Heading toward ${form.heading_toward || 'anywhere'}`,
        rate_per_hour: form.rate_per_hour ? parseFloat(form.rate_per_hour) : null,
        is_active: true,
        available_until: availUntil,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'operator_id' })

    if (!error) {
      setShowForm(false)
      // Refresh
      const { data } = await supabase
        .from('hc_available_now')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(40)
      setOps((data ?? []) as any)
    }
  }

  async function goOffline() {
    const supabase = createClient()
    await supabase
      .from('hc_available_now')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('operator_id', user?.id)
    setMyBroadcast(null)
    setOps(prev => prev.filter(o => o.operator_name !== user?.email?.split('@')[0]))
  }

  const filtered = ops.filter(o => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return o.current_location?.toLowerCase().includes(q)
      || o.heading_toward?.toLowerCase().includes(q)
      || o.operator_name?.toLowerCase().includes(q)
      || o.service_types?.some(s => s.toLowerCase().includes(q))
  })

  return (
    <div className=" bg-[#07090d] text-[#f0f2f5]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Repositioning & Backhaul Board | Haul Command',
        description: 'Find and broadcast repositioning / backhaul capacity for heavy haul escorts. Real-time operator reposition feed across 120 countries.',
        url: 'https://www.haulcommand.com/repositioning',
      })}} />

      {/* Hero */}
      <section className="border-b border-[#131c28] bg-gradient-to-b from-[#0f1420] to-[#07090d] px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Live Reposition Feed</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            Repositioning <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">& Backhaul</span>
          </h1>
          <p className="text-[#8a9ab0] text-lg max-w-2xl mb-6">
            Operators returning empty broadcast their position. Brokers find real capacity without making calls. 
            <span className="text-white/70"> Kill the group-chat chaos.</span>
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all"
            >
              <Radio className="w-4 h-4" />
              Broadcast My Position
            </button>
            {myBroadcast && (
              <button onClick={goOffline} className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-colors">
                Go Offline
              </button>
            )}
            <Link href="/available-now" className="px-4 py-2.5 rounded-xl border border-[#1e3048] text-[#8a9ab0] text-sm font-semibold hover:text-white transition-colors">
              Full Available Feed â†’
            </Link>
          </div>
        </div>
      </section>

      {/* Broadcast form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-black mb-4">Broadcast Your Position</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#566880] font-bold uppercase tracking-wider">Current Location</label>
                <input
                  value={form.current_location}
                  onChange={e => setForm(f => ({ ...f, current_location: e.target.value }))}
                  placeholder="e.g. Houston, TX"
                  className="w-full mt-1 bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#566880] font-bold uppercase tracking-wider">Heading Toward (optional)</label>
                <input
                  value={form.heading_toward}
                  onChange={e => setForm(f => ({ ...f, heading_toward: e.target.value }))}
                  placeholder="e.g. Dallas, TX or open"
                  className="w-full mt-1 bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#566880] font-bold uppercase tracking-wider">Service Type</label>
                  <select
                    value={form.service_type}
                    onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
                    className="w-full mt-1 bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="pilot_car">Pilot Car</option>
                    <option value="escort_truck">Escort Truck</option>
                    <option value="height_pole">Height Pole</option>
                    <option value="wide_load">Wide Load</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#566880] font-bold uppercase tracking-wider">Available For (hrs)</label>
                  <select
                    value={form.hours_available}
                    onChange={e => setForm(f => ({ ...f, hours_available: e.target.value }))}
                    className="w-full mt-1 bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  >
                    {['2', '4', '8', '12', '24', '48'].map(h => (
                      <option key={h} value={h}>{h} hours</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#566880] font-bold uppercase tracking-wider">Rate ($/hr, optional)</label>
                <input
                  value={form.rate_per_hour}
                  onChange={e => setForm(f => ({ ...f, rate_per_hour: e.target.value }))}
                  placeholder="e.g. 65"
                  type="number"
                  className="w-full mt-1 bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#566880] font-bold uppercase tracking-wider">Message (optional)</label>
                <input
                  value={form.broadcast_message}
                  onChange={e => setForm(f => ({ ...f, broadcast_message: e.target.value }))}
                  placeholder="e.g. Empty run, will consider any corridor"
                  className="w-full mt-1 bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm focus:border-amber-500/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={broadcast}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-black"
              >
                Go Live
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-3 rounded-xl border border-[#1e3048] text-[#8a9ab0] text-sm font-semibold hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by location, service, operatorâ€¦"
            className="flex-1 bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-2.5 text-sm focus:border-amber-500/50 focus:outline-none"
          />
          <div className="text-xs text-[#566880] shrink-0">{filtered.length} broadcasting</div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-[#1e3048] bg-[#0f1a24]">
            <div className="text-4xl mb-3">ðŸ“¡</div>
            <p className="font-bold text-white mb-1">No repositioning broadcasts right now</p>
            <p className="text-sm text-[#566880] mb-4">Be the first â€” broadcast your position and get found by brokers looking for capacity.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 text-amber-400 text-sm font-bold border border-amber-500/25 hover:bg-amber-500/25 transition-colors"
            >
              <Radio className="w-4 h-4" /> Broadcast Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(op => (
              <div key={op.id} className="group bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 hover:border-[#2a4060] transition-all">
                <div className="flex items-start gap-4">
                  {/* Ping dot */}
                  <div className="relative shrink-0 mt-1">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-50" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-white text-sm">{op.operator_name}</p>
                      {op.service_types?.map(s => (
                        <span key={s} className="text-[10px] bg-[#1e3048] text-[#8a9ab0] px-2 py-0.5 rounded-full font-semibold">
                          {SERVICE_LABEL[s] ?? s}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#566880]">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        {op.city ?? op.region_code ?? op.country_code ?? 'Location TBD'}
                      </span>
                      {op.broadcast_message && (
                        <span className="text-[#8a9ab0] italic">"{op.broadcast_message}"</span>
                      )}
                      {op.rate_per_hour && (
                        <span className="text-emerald-400 font-bold">${op.rate_per_hour}/hr</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(op.updated_at)}
                        {op.available_until && ` Â· avail until ${new Date(op.available_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/load-board/post"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                  >
                    <Zap className="w-3 h-3" /> Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEO / kill links */}
        <div className="mt-10 pt-6 border-t border-[#131c28]">
          <p className="text-xs text-[#3a5068] mb-3">Related resources</p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/available-now', label: 'ðŸŸ¢ Available Now' },
              { href: '/load-board', label: 'ðŸ“‹ Load Board' },
              { href: '/directory', label: 'ðŸ” Operator Directory' },
              { href: '/tools/route-planner', label: 'ðŸ—ºï¸ Route Planner' },
              { href: '/corridors', label: 'ðŸ›£ï¸ Corridor Intelligence' },
            ].map(l => (
              <Link key={l.href} href={l.href} className="text-xs px-3 py-1.5 rounded-lg border border-[#1e3048] text-[#566880] hover:text-amber-400 hover:border-amber-500/25 transition-all">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}