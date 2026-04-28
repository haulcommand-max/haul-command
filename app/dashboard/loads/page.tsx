'use client';

/**
 * LEAD PARSER v3 — Role Inference + Global
 * 
 * Upgrades the old /dashboard/loads parser with:
 * - Broker vs Operator role inference
 * - 120-country support
 * - Direct Supabase push with dedup
 * - Revenue opportunity detection
 * - Position + role filtering
 * - CSV export, phone copy
 */

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// -- Types -----------------------------------------------------
interface Lead {
  company: string;
  phone: string;
  origin: string;
  destination: string;
  rate: string;
  jobType: string;
  distance: string;
  quickPay: boolean;
  posterRole: 'broker' | 'operator';
  notes: string;
}

interface PushResult {
  brokerStatus: 'new' | 'updated' | 'no_phone' | 'error';
  loadStatus: 'ok' | 'load_err' | 'error';
  brokerId: string | null;
  role: string;
}

// -- Constants -------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const COUNTRIES = [
  { code: 'US', flag: 'ðŸ‡ºðŸ‡¸', name: 'United States' },
  { code: 'CA', flag: 'ðŸ‡¨ðŸ‡¦', name: 'Canada' },
  { code: 'MX', flag: 'ðŸ‡²ðŸ‡½', name: 'Mexico' },
  { code: 'AU', flag: 'ðŸ‡¦ðŸ‡º', name: 'Australia' },
  { code: 'GB', flag: 'ðŸ‡¬ðŸ‡§', name: 'United Kingdom' },
  { code: 'DE', flag: 'ðŸ‡©ðŸ‡ª', name: 'Germany' },
  { code: 'FR', flag: 'ðŸ‡«ðŸ‡·', name: 'France' },
  { code: 'NL', flag: 'ðŸ‡³ðŸ‡±', name: 'Netherlands' },
  { code: 'BE', flag: 'ðŸ‡§ðŸ‡ª', name: 'Belgium' },
  { code: 'ES', flag: 'ðŸ‡ªðŸ‡¸', name: 'Spain' },
  { code: 'IT', flag: 'ðŸ‡®ðŸ‡¹', name: 'Italy' },
  { code: 'PL', flag: 'ðŸ‡µðŸ‡±', name: 'Poland' },
  { code: 'SE', flag: 'ðŸ‡¸ðŸ‡ª', name: 'Sweden' },
  { code: 'NO', flag: 'ðŸ‡³ðŸ‡´', name: 'Norway' },
  { code: 'FI', flag: 'ðŸ‡«ðŸ‡®', name: 'Finland' },
  { code: 'DK', flag: 'ðŸ‡©ðŸ‡°', name: 'Denmark' },
  { code: 'CH', flag: 'ðŸ‡¨ðŸ‡­', name: 'Switzerland' },
  { code: 'AT', flag: 'ðŸ‡¦ðŸ‡¹', name: 'Austria' },
  { code: 'CZ', flag: 'ðŸ‡¨ðŸ‡¿', name: 'Czech Republic' },
  { code: 'BR', flag: 'ðŸ‡§ðŸ‡·', name: 'Brazil' },
  { code: 'AR', flag: 'ðŸ‡¦ðŸ‡·', name: 'Argentina' },
  { code: 'CL', flag: 'ðŸ‡¨ðŸ‡±', name: 'Chile' },
  { code: 'ZA', flag: 'ðŸ‡¿ðŸ‡¦', name: 'South Africa' },
  { code: 'AE', flag: 'ðŸ‡¦ðŸ‡ª', name: 'UAE' },
  { code: 'SA', flag: 'ðŸ‡¸ðŸ‡¦', name: 'Saudi Arabia' },
  { code: 'IN', flag: 'ðŸ‡®ðŸ‡³', name: 'India' },
  { code: 'JP', flag: 'ðŸ‡¯ðŸ‡µ', name: 'Japan' },
  { code: 'KR', flag: 'ðŸ‡°ðŸ‡·', name: 'South Korea' },
  { code: 'SG', flag: 'ðŸ‡¸ðŸ‡¬', name: 'Singapore' },
  { code: 'MY', flag: 'ðŸ‡²ðŸ‡¾', name: 'Malaysia' },
  { code: 'TH', flag: 'ðŸ‡¹ðŸ‡­', name: 'Thailand' },
  { code: 'ID', flag: 'ðŸ‡®ðŸ‡©', name: 'Indonesia' },
  { code: 'PH', flag: 'ðŸ‡µðŸ‡­', name: 'Philippines' },
  { code: 'NZ', flag: 'ðŸ‡³ðŸ‡¿', name: 'New Zealand' },
  { code: 'OTHER', flag: 'ðŸŒ', name: 'Other' },
];

const SAMPLE = `Load Alert!! Atlas 2532400305 Solon OH Ellicott City MD Chase
Load Alert!! Pilot Cars & Permits LLC (469) 804-7715 Toddville MD Chase
Load Alert!! Action Pilot Car 2258883917 Charleston MO Omaha NE Chase
Load Alert!! PAN LOGISTICS INC 2536663879 Texarkana TX Memphis TN Chase
Load Alert!! Hudson Transport 5712103512 Rosman NC Glenville NC Chase
Load Alert!! WAYPOINT PERMITS LLC 9092757111 Fair play SC Oxon hill MD Chase
Americars Transportation INC - Norfolk VA to Lansing MI 761 mi $1300.00 total Quick Pay (630) 716-3657 Chase
Angie's Pilot Car llc - Tulsa OK to Portal ND 1195 mi Contact for rate (918) 638-5878 Lead
FCI - Atlanta GA to Indianapolis IN 545 mi $1.80/mi (909) 252-7549 Chase
VDV ROYAL - Norfolk VA to Wichita KS 1365 mi $1.45/mi Quick Pay Chase
United fleet inc - Goldsboro NC to Kansas City KS 1134 mi Contact for rate Quick Pay (267) 566-6818 High Pole
Available Chase driver covering TX, OK, NM corridors - text only (214) 555-0192
High Pole certified operator - Southeast US - available now - (678) 617-2090
Steer certified - Midwest runs - (312) 555-7841 call or text`;

// -- Helpers ---------------------------------------------------
function normPhone(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 11 && d[0] === '1') return d.slice(1);
  return d.length >= 7 ? d : null;
}

function fmtPhone(raw: string): string {
  const d = normPhone(raw);
  if (!d || d.length !== 10) return raw || '—';
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function inferRole(lead: Lead): string {
  if (lead.posterRole === 'operator') return 'operator';
  if (lead.posterRole === 'broker') return 'broker';
  if (lead.origin && lead.destination) return 'broker';
  return 'broker';
}

const POS_CLASS: Record<string, string> = {
  Chase: 'rgba(59,130,246,0.15)', Lead: 'rgba(245,166,35,0.15)',
  'High Pole': 'rgba(168,85,247,0.15)', Steer: 'rgba(34,197,94,0.15)',
  'Route Survey': 'rgba(249,115,22,0.15)',
};
const POS_COLOR: Record<string, string> = {
  Chase: '#60a5fa', Lead: '#f5a623', 'High Pole': '#c084fc',
  Steer: '#4ade80', 'Route Survey': '#fb923c',
};

// -- Supabase push ---------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pushLead(supabase: any, lead: Lead, cc: string): Promise<PushResult> {
  const phone = normPhone(lead.phone);
  const role = inferRole(lead);

  if (!phone) return { brokerStatus: 'no_phone', loadStatus: 'ok', brokerId: null, role };

  try {
    const { data: existing } = await supabase
      .from('hc_brokers')
      .select('id,inferred_role,post_count_broker,post_count_operator')
      .eq('primary_phone_normalized', phone)
      .limit(1);

    let brokerId: string | null = null;
    let brokerStatus: PushResult['brokerStatus'] = 'new';

    if (existing && existing.length > 0) {
      brokerId = existing[0].id;
      brokerStatus = 'updated';
      const prev = existing[0].inferred_role;
      const newRole = (prev && prev !== 'unknown' && prev !== role) ? 'both' : role;

      await supabase.from('hc_brokers').update({
        inferred_role: newRole,
        market_side: newRole === 'operator' ? 'supply' : 'demand',
        post_count_broker: (existing[0].post_count_broker || 0) + (role === 'broker' ? 1 : 0),
        post_count_operator: (existing[0].post_count_operator || 0) + (role === 'operator' ? 1 : 0),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', brokerId);
    } else {
      const norm = (lead.company || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      const { data: ins } = await supabase.from('hc_brokers').insert({
        canonical_name: lead.company || 'Unknown',
        normalized_name: norm,
        primary_phone_normalized: phone,
        confidence_score: 0.7,
        inferred_role: role,
        primary_role: role,
        market_side: role === 'operator' ? 'supply' : 'demand',
        post_count_broker: role === 'broker' ? 1 : 0,
        post_count_operator: role === 'operator' ? 1 : 0,
        country_code: cc,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select('id');

      if (ins && ins[0]) {
        brokerId = ins[0].id;
        brokerStatus = 'new';
      }
    }

    // Log load posting for brokers
    let loadStatus: PushResult['loadStatus'] = 'ok';
    if (brokerId && role === 'broker') {
      const { error } = await supabase.from('hc_broker_loads').insert({
        broker_id: brokerId,
        origin_city: lead.origin?.split(',')[0]?.trim() || null,
        origin_state: lead.origin?.split(',')[1]?.trim() || null,
        origin_country: cc,
        dest_city: lead.destination?.split(',')[0]?.trim() || null,
        dest_state: lead.destination?.split(',')[1]?.trim() || null,
        dest_country: cc,
        distance_miles: parseFloat(lead.distance) || null,
        escort_position: lead.jobType || 'Unknown',
        rate_hint: lead.rate || null,
        payment_type: lead.quickPay ? 'quick_pay' : 'standard',
        poster_role: role,
        country_code: cc,
        notes: lead.notes || null,
        status: 'open',
        source: 'lead_parser_v3',
        observed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        meta: { raw_phone: lead.phone, quick_pay: lead.quickPay },
      });
      if (error) loadStatus = 'load_err';
    }

    return { brokerStatus, loadStatus, brokerId, role };
  } catch {
    return { brokerStatus: 'error', loadStatus: 'error', brokerId: null, role };
  }
}

// -- Component -------------------------------------------------
export default function LeadParserPage() {
  const [rawInput, setRawInput] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pushResults, setPushResults] = useState<(PushResult | null)[]>([]);
  const [status, setStatus] = useState<{ state: '' | 'on' | 'err'; text: string }>({ state: '', text: 'Ready' });
  const [loading, setLoading] = useState(false);
  const [posFilter, setPosFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

  const runPipeline = useCallback(async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    setStatus({ state: 'on', text: 'AI extracting leads...' });
    setLeads([]);
    setPushResults([]);

    try {
      // Step 1: AI parse via server-side API
      const res = await fetch('/api/leads/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parse failed');

      const parsed: Lead[] = data.leads;
      setLeads(parsed);
      const results = new Array(parsed.length).fill(null);
      setPushResults([...results]);

      // Step 2: Push to Supabase
      if (supabase) {
        setStatus({ state: 'on', text: `Saving ${parsed.length} leads...` });
        for (let i = 0; i < parsed.length; i++) {
          setStatus({ state: 'on', text: `Saving ${i + 1}/${parsed.length}...` });
          const result = await pushLead(supabase, parsed[i], countryCode);
          results[i] = result;
          setPushResults([...results]);
        }

        const newB = results.filter((r: PushResult) => r?.brokerStatus === 'new' && r?.role === 'broker').length;
        const newOps = results.filter((r: PushResult) => r?.brokerStatus === 'new' && r?.role === 'operator').length;
        const upd = results.filter((r: PushResult) => r?.brokerStatus === 'updated').length;
        setStatus({ state: '', text: `Done — ${newB} new brokers, ${newOps} new operators, ${upd} updated` });
      } else {
        setStatus({ state: '', text: `Parsed ${parsed.length} leads (Supabase not configured)` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus({ state: 'err', text: msg });
    }

    setLoading(false);
  }, [rawInput, countryCode, supabase]);

  // Filter logic
  const filtered = leads.filter(l => {
    if (posFilter !== 'all' && l.jobType !== posFilter) return false;
    if (roleFilter !== 'all' && inferRole(l) !== roleFilter) return false;
    if (search && !JSON.stringify(l).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const brokers = leads.filter(l => inferRole(l) === 'broker').length;
  const ops = leads.filter(l => inferRole(l) === 'operator').length;
  const phones = [...new Set(leads.map(l => normPhone(l.phone)).filter(Boolean))].length;
  const qp = leads.filter(l => l.quickPay).length;
  const types: Record<string, number> = {};
  leads.forEach(l => { types[l.jobType] = (types[l.jobType] || 0) + 1; });
  const topTypes = Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Push banner stats
  const newBrokers = pushResults.filter(r => r?.brokerStatus === 'new' && r?.role === 'broker').length;
  const newOps = pushResults.filter(r => r?.brokerStatus === 'new' && r?.role === 'operator').length;
  const updated = pushResults.filter(r => r?.brokerStatus === 'updated').length;
  const loadsPushed = pushResults.filter(r => r?.loadStatus === 'ok').length;
  const errs = pushResults.filter(r => r?.brokerStatus === 'error' || r?.loadStatus === 'error').length;
  const anyPushed = pushResults.some(r => r !== null);

  // Exports
  const exportCSV = () => {
    const h = 'Company,Phone,Role,Origin,Destination,Rate,Position,Miles,QuickPay,Country,Notes';
    const rows = leads.map(l =>
      [l.company, l.phone, inferRole(l), l.origin, l.destination, l.rate, l.jobType, l.distance, l.quickPay ? 'Yes' : 'No', countryCode, l.notes]
        .map(v => `"${(v || '').toString().replace(/"/g, '""')}"`)
        .join(',')
    );
    navigator.clipboard.writeText([h, ...rows].join('\n'));
    setStatus({ state: '', text: 'CSV copied!' });
    setTimeout(() => setStatus(s => ({ ...s, text: `${leads.length} leads` })), 2000);
  };

  const copyPhones = (role: string) => {
    const list = leads.filter(l => inferRole(l) === role).map(l => l.phone).filter(Boolean);
    const unique = [...new Set(list)];
    navigator.clipboard.writeText(unique.join('\n'));
    setStatus({ state: '', text: `${unique.length} ${role} phones copied` });
    setTimeout(() => setStatus(s => ({ ...s, text: `${leads.length} leads` })), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f12', color: '#e2e8f0', fontFamily: "'Barlow', sans-serif" }}>
      {/* Scanner effect */}
      <div style={{ position: 'fixed', inset: 0, background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)', pointerEvents: 'none', zIndex: 999 }} />

      {/* Header */}
      <header style={{ background: '#151820', borderBottom: '2px solid #f5a623', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, letterSpacing: 2, textTransform: 'uppercase', color: '#f5a623' }}>
          Haul<span style={{ color: '#e2e8f0' }}>Command</span>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, background: '#f5a623', color: '#000', padding: '3px 8px', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>
          Lead Parser v3 — Role Inference + Global
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            style={{ background: '#151820', border: '1px solid #252c3f', color: '#e2e8f0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
      </header>

      <main style={{ maxWidth: 1500, margin: '0 auto', padding: '24px 28px' }}>
        {/* Section label */}
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
          {'// Paste load board data — role (broker vs operator) auto-detected'}
        </div>

        {/* Input area */}
        <div style={{ background: '#151820', border: '1px solid #252c3f', borderLeft: '3px solid #f5a623', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #252c3f', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#64748b' }}>
            <span>Raw Load Board Text</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>Load alerts, structured listings, mixed formats — all 120 countries</span>
          </div>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder={`Paste load board data here...\n\nBROKER examples (posting a job — NEED someone):\n  Load Alert!! Atlas 2532400305 Solon OH Ellicott City MD Chase\n  Angie's Pilot Car LLC - Tulsa OK to Portal ND - (918) 638-5878 - Lead needed\n\nOPERATOR examples (advertising availability — CAN DO):\n  Available Chase driver - TX corridor - call (555) 123-4567\n  High Pole certified, covering Southeast US - (678) 555-9900`}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, lineHeight: 1.6, padding: '14px 16px', resize: 'vertical', minHeight: 160, outline: 'none' }}
          />
        </div>

        {/* Top bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <button aria-label="Interactive Button"
            onClick={runPipeline}
            disabled={loading || !rawInput.trim()}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase',
              border: 'none', padding: '11px 24px', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#252c3f' : '#f5a623', color: loading ? '#64748b' : '#000',
              transition: 'all .15s',
            }}
          >
            âš¡ Extract + Save to Supabase
          </button>
          <button aria-label="Interactive Button"
            onClick={() => setRawInput(SAMPLE)}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', color: '#64748b', border: '1px solid #252c3f', padding: '8px 14px', cursor: 'pointer' }}
          >
            Load Sample Data
          </button>
          <div style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
              background: status.state === 'on' ? '#22c55e' : status.state === 'err' ? '#ef4444' : '#64748b',
              boxShadow: status.state === 'on' ? '0 0 6px #22c55e' : 'none',
            }} />
            <span>{status.text}</span>
          </div>
        </div>

        {/* Results */}
        {leads.length > 0 && (
          <div style={{ background: '#151820', border: '1px solid #252c3f', overflow: 'hidden' }}>
            {/* Results header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #252c3f', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                Extracted Leads
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, background: '#f5a623', color: '#000', padding: '2px 7px', fontWeight: 500 }}>{leads.length}</span>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search company / city..."
                style={{ background: '#0d0f12', border: '1px solid #252c3f', color: '#e2e8f0', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: '5px 12px', width: 200, outline: 'none', marginLeft: 'auto' }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid #252c3f', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginRight: 4 }}>Position:</span>
              {['all', 'Chase', 'Lead', 'High Pole', 'Steer', 'Route Survey'].map(p => (
                <button aria-label="Interactive Button" key={p} onClick={() => setPosFilter(p)}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: '4px 9px', background: 'transparent',
                    border: `1px solid ${posFilter === p ? '#f5a623' : '#252c3f'}`,
                    color: posFilter === p ? '#f5a623' : '#64748b', cursor: 'pointer', textTransform: 'uppercase',
                  }}>
                  {p === 'all' ? 'All' : p}
                </button>
              ))}
              <span style={{ marginLeft: 8, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginRight: 4 }}>Role:</span>
              {[{ v: 'all', l: 'All Roles' }, { v: 'broker', l: 'ðŸ¢ Brokers' }, { v: 'operator', l: 'ðŸš— Operators' }].map(r => (
                <button aria-label="Interactive Button" key={r.v} onClick={() => setRoleFilter(r.v)}
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, padding: '4px 9px', background: 'transparent',
                    border: `1px solid ${roleFilter === r.v ? (r.v === 'broker' ? '#3b82f6' : r.v === 'operator' ? '#a855f7' : '#f5a623') : '#252c3f'}`,
                    color: roleFilter === r.v ? (r.v === 'broker' ? '#3b82f6' : r.v === 'operator' ? '#a855f7' : '#f5a623') : '#64748b', cursor: 'pointer', textTransform: 'uppercase',
                  }}>
                  {r.l}
                </button>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 1, background: '#252c3f' }}>
              {[
                { n: leads.length, l: 'Total', c: '#f5a623' },
                { n: brokers, l: 'ðŸ¢ Brokers', c: '#3b82f6' },
                { n: ops, l: 'ðŸš— Operators', c: '#a855f7' },
                { n: phones, l: 'Unique Phones', c: '#f5a623' },
                ...topTypes.map(([t, c]) => ({ n: c, l: t, c: POS_COLOR[t] || '#94a3b8' })),
                { n: qp, l: 'Quick Pay', c: '#f5a623' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#1c2030', padding: '10px 14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26, color: s.c, lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.8px', marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Push banner */}
            {anyPushed && (
              <div style={{ padding: '10px 16px', display: 'flex', gap: 20, alignItems: 'center', background: 'rgba(34,197,94,.05)', borderBottom: '1px solid rgba(34,197,94,.15)', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#22c55e' }}>✓ Supabase Updated</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}><strong style={{ color: '#3b82f6' }}>{newBrokers}</strong> new brokers</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}><strong style={{ color: '#22c55e' }}>{newOps}</strong> new operators</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}><strong style={{ color: '#f5a623' }}>{updated}</strong> known (no dupe)</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}><strong style={{ color: '#22c55e' }}>{loadsPushed}</strong> loads logged</span>
                {errs > 0 && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}><strong style={{ color: '#ef4444' }}>{errs}</strong> errors</span>}
              </div>
            )}

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ background: '#1c2030' }}>
                  <tr>
                    {['Company', 'Phone', 'Role', 'Origin', 'Destination', 'Rate', 'Position', 'Miles', 'Country', 'Supabase'].map(h => (
                      <th key={h} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', padding: '9px 12px', textAlign: 'left', borderBottom: '1px solid #252c3f', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => {
                    const role = inferRole(l);
                    const pr = pushResults[leads.indexOf(l)];
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #252c3f' }}>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ fontWeight: 600, fontSize: 12, maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={l.company}>{l.company || '—'}</div>
                          {l.notes && <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>{l.notes}</div>}
                        </td>
                        <td style={{ padding: '9px 12px' }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#3b82f6', whiteSpace: 'nowrap' }}>{fmtPhone(l.phone)}</span></td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap', borderRadius: 2,
                            background: role === 'operator' ? 'rgba(168,85,247,.12)' : role === 'both' ? 'rgba(245,166,35,.12)' : 'rgba(59,130,246,.12)',
                            color: role === 'operator' ? '#c084fc' : role === 'both' ? '#f5a623' : '#60a5fa',
                            border: `1px solid ${role === 'operator' ? 'rgba(168,85,247,.25)' : role === 'both' ? 'rgba(245,166,35,.25)' : 'rgba(59,130,246,.25)'}`,
                          }}>
                            {role === 'operator' ? 'ðŸš— Operator' : role === 'both' ? 'âš¡ Both' : 'ðŸ¢ Broker'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', fontSize: 11, whiteSpace: 'nowrap' }}>{l.origin || '—'}</td>
                        <td style={{ padding: '9px 12px', fontSize: 11, whiteSpace: 'nowrap' }}>{l.destination || '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: l.rate === 'Contact for rate' ? '#64748b' : '#22c55e', whiteSpace: 'nowrap' }}>
                            {l.rate || '—'}
                          </span>
                          {l.quickPay && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, padding: '2px 4px', background: 'rgba(34,197,94,.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,.2)', textTransform: 'uppercase', marginLeft: 4 }}>QP</span>}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{
                            display: 'inline-block', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '.3px', whiteSpace: 'nowrap',
                            background: POS_CLASS[l.jobType] || 'rgba(100,116,139,.15)',
                            color: POS_COLOR[l.jobType] || '#94a3b8',
                            border: `1px solid ${(POS_COLOR[l.jobType] || '#94a3b8')}40`,
                          }}>
                            {l.jobType || '?'}
                          </span>
                        </td>
                        <td style={{ padding: '9px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#64748b' }}>{l.distance ? `${l.distance} mi` : '—'}</td>
                        <td style={{ padding: '9px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#64748b' }}>{countryCode}</td>
                        <td style={{ padding: '9px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, whiteSpace: 'nowrap' }}>
                          {!pr ? <span style={{ color: '#252c3f' }}>pending</span>
                            : pr.brokerStatus === 'new' ? <span style={{ color: '#22c55e' }}>✓ new {pr.role}</span>
                            : pr.brokerStatus === 'updated' ? <span style={{ color: '#f5a623' }}>â†» known</span>
                            : pr.brokerStatus === 'no_phone' ? <span style={{ color: '#64748b' }}>no phone</span>
                            : <span style={{ color: '#ef4444' }}>error</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Export row */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #252c3f', display: 'flex', gap: 8, alignItems: 'center', background: '#1c2030', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', marginRight: 4 }}>Export:</span>
              <button aria-label="Interactive Button" onClick={exportCSV} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', color: '#64748b', border: '1px solid #252c3f', padding: '8px 14px', cursor: 'pointer' }}>ðŸ"‹ Copy CSV</button>
              <button aria-label="Interactive Button" onClick={() => copyPhones('broker')} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', color: '#64748b', border: '1px solid #252c3f', padding: '8px 14px', cursor: 'pointer' }}>ðŸ"ž Broker Phones</button>
              <button aria-label="Interactive Button" onClick={() => copyPhones('operator')} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', color: '#64748b', border: '1px solid #252c3f', padding: '8px 14px', cursor: 'pointer' }}>ðŸš— Operator Phones</button>
            </div>
          </div>
        )}

        {/* Money panel */}
        {leads.length > 0 && (
          <div style={{ background: '#151820', border: '1px solid #252c3f', borderLeft: '3px solid #22c55e', marginTop: 20, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #252c3f', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8 }}>
              ðŸ’° Revenue Opportunities Detected
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 1, background: '#252c3f' }}>
              {[
                { title: 'ðŸ"" Lead Unlock Revenue', desc: `${brokers} broker postings logged. Operators pay $2-5 to unlock contact info.`, value: `$${brokers * 3} est. / batch` },
                { title: 'âœ… Verified Broker Badges', desc: `${phones} unique phones. Offer "Verified" status for $29-49/mo.`, value: `$${phones * 39}/mo if all verify` },
                { title: 'ðŸ"Š Rate Intelligence Feed', desc: `Rate data captured for corridor pricing analytics.`, value: '$99-299/mo per subscriber' },
                { title: 'âš¡ Quick Pay Premium', desc: `${qp} loads flagged Quick Pay. Placement fee for priority.`, value: `${qp} QP loads this batch` },
                { title: 'ðŸš— Operator Matching', desc: `${ops} operators identified. Match to broker loads.`, value: `${ops} operators ready` },
                { title: 'ðŸŒ Global Expansion', desc: 'Same pipeline for 120 countries. Each market = new network.', value: '120 countries, same system' },
              ].map((c, i) => (
                <div key={i} style={{ background: '#1c2030', padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: '#e2e8f0' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{c.desc}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#22c55e' }}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && leads.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: '#151820', border: '1px solid #252c3f' }}>
            <div style={{ width: 28, height: 28, border: '2px solid #252c3f', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#64748b' }}>AI parsing and classifying roles...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
      </main>
    </div>
  );
}