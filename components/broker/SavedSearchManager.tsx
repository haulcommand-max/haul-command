'use client';

import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// SavedSearchManager — Broker-facing saved search management
//
// Features:
//   • Lists all saved search watches
//   • Create new watch (country/region/service type)
//   • Toggle push notification per watch
//   • Delete watch
//   • Inline create form
// ═══════════════════════════════════════════════════════════════

interface SavedSearch {
  id: string;
  label: string;
  country_code: string;
  region_code?: string;
  service_types?: string[];
  corridor_slugs?: string[];
  notify_push: boolean;
  notify_email: boolean;
  created_at: string;
}

const SERVICE_OPTIONS = [
  { value: 'pilot_car', label: 'Pilot Car' },
  { value: 'escort_truck', label: 'Escort Truck' },
  { value: 'height_pole', label: 'Height Pole' },
  { value: 'wide_load', label: 'Wide Load' },
  { value: 'chase_vehicle', label: 'Chase Vehicle' },
  { value: 'oversize', label: 'Oversize Escort' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export function SavedSearchManager() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [regionCode, setRegionCode] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => { loadSearches(); }, []);

  async function loadSearches() {
    setLoading(true);
    try {
      const res = await fetch('/api/saved-searches');
      const data = await res.json();
      setSearches(data.searches ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!countryCode) return;
    setSaving(true);
    try {
      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label || `${regionCode || countryCode} Watch`,
          country_code: countryCode,
          region_code: regionCode || null,
          service_types: selectedServices.length > 0 ? selectedServices : null,
          notify_push: true,
        }),
      });
      setLabel('');
      setRegionCode('');
      setSelectedServices([]);
      setShowForm(false);
      await loadSearches();
    } catch { /* silent */ }
    setSaving(false);
  }

  async function togglePush(id: string, current: boolean) {
    await fetch('/api/saved-searches', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notify_push: !current }),
    });
    setSearches(prev => prev.map(s => s.id === id ? { ...s, notify_push: !current } : s));
  }

  async function deleteSearch(id: string) {
    await fetch(`/api/saved-searches?id=${id}`, { method: 'DELETE' });
    setSearches(prev => prev.filter(s => s.id !== id));
  }

  function toggleService(val: string) {
    setSelectedServices(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <div className="animate-pulse text-slate-500 text-sm">Loading saved searches…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white">🔔 Market Watches</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Get push alerts when operators go live in your target markets.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-500 text-black text-xs font-black rounded-lg hover:bg-amber-400 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Watch'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Label</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Texas Pilot Cars"
                className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">Country</label>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
              >
                <option value="US">🇺🇸 United States</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="DE">🇩🇪 Germany</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">State/Province</label>
              {countryCode === 'US' ? (
                <select
                  value={regionCode}
                  onChange={e => setRegionCode(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                >
                  <option value="">Any</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={regionCode}
                  onChange={e => setRegionCode(e.target.value)}
                  placeholder="e.g. ON, NSW"
                  className="w-full px-3 py-2 bg-black border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 outline-none"
                />
              )}
            </div>
          </div>

          {/* Service type checkboxes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Service Types (optional)</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleService(opt.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                    selectedServices.includes(opt.value)
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {selectedServices.includes(opt.value) ? '✓ ' : ''}{opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !countryCode}
            className="px-6 py-2.5 bg-amber-500 text-black text-xs font-black rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Create Watch'}
          </button>
        </form>
      )}

      {/* List */}
      {searches.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-bold text-slate-300 mb-1">No market watches yet</p>
          <p className="text-sm text-slate-500 mb-4">
            Set up a watch to get instant push alerts when matching operators go live.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-amber-500 text-black text-xs font-black rounded-lg hover:bg-amber-400 transition-colors"
          >
            Create Your First Watch
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {searches.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{s.label || 'Unnamed Watch'}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {s.country_code}
                  </span>
                  {s.region_code && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {s.region_code}
                    </span>
                  )}
                  {s.service_types?.map(st => (
                    <span key={st} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      {SERVICE_OPTIONS.find(o => o.value === st)?.label ?? st}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Push toggle */}
                <button
                  onClick={() => togglePush(s.id, s.notify_push)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                    s.notify_push
                      ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                  title={s.notify_push ? 'Push alerts ON — click to disable' : 'Push alerts OFF — click to enable'}
                >
                  {s.notify_push ? '🔔 ON' : '🔕 OFF'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteSearch(s.id)}
                  className="text-xs text-red-500/60 hover:text-red-400 transition-colors p-1"
                  title="Remove watch"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
