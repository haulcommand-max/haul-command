'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface GlobalOperator {
  id: number;
  source_id: number;
  name: string;
  name_normalized: string;
  city: string | null;
  admin1_code: string | null;
  country_code: string;
  phone_primary: string | null;
  email: string | null;
  website_url: string | null;
  hc_entity_type: string | null;
  claim_priority: string;
  is_claimed: boolean;
}

type ClaimStep = 'search' | 'verify' | 'submit' | 'success';

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export default function ClaimPage() {
  const [step, setStep] = useState<ClaimStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [results, setResults] = useState<GlobalOperator[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOp, setSelectedOp] = useState<GlobalOperator | null>(null);
  const [totalUnclaimed, setTotalUnclaimed] = useState<number | null>(null);

  // Claim form state
  const [claimName, setClaimName] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimRole, setClaimRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load unclaimed count on mount
  useEffect(() => {
    async function loadCount() {
      const { count } = await supabase
        .from('hc_global_operators')
        .select('id', { count: 'exact', head: true })
        .eq('is_claimed', false);
      setTotalUnclaimed(count ?? 0);
    }
    loadCount();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery && !stateFilter) return;
    setSearching(true);
    setResults([]);

    let query = supabase
      .from('hc_global_operators')
      .select('id, source_id, name, name_normalized, city, admin1_code, country_code, phone_primary, email, website_url, hc_entity_type, claim_priority, is_claimed')
      .order('claim_priority', { ascending: true })
      .limit(20);

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }
    if (stateFilter) {
      query = query.eq('admin1_code', stateFilter);
    }

    const { data, error } = await query;
    if (!error) setResults(data || []);
    setSearching(false);
  }, [searchQuery, stateFilter]);

  const handleSelectOperator = (op: GlobalOperator) => {
    setSelectedOp(op);
    setStep('verify');
  };

  const handleSubmitClaim = async () => {
    if (!selectedOp || !claimName || !claimEmail) return;
    setSubmitting(true);

    // Insert claim request
    const { error } = await supabase
      .from('hc_claim_requests')
      .insert({
        source_table: 'hc_global_operators',
        source_id: selectedOp.source_id,
        operator_name: selectedOp.name,
        claimant_name: claimName,
        claimant_email: claimEmail,
        claimant_phone: claimPhone,
        claimant_role: claimRole,
        status: 'pending',
        admin1_code: selectedOp.admin1_code,
        country_code: selectedOp.country_code,
      });

    if (!error) {
      setStep('success');
    } else {
      // If the claims table doesn't exist yet, still capture via waitlist
      await supabase.from('hc_sponsor_waitlist').insert({
        name: claimName,
        email: claimEmail,
        phone: claimPhone,
        market_name: `Claim: ${selectedOp.name}`,
        notes: `Role: ${claimRole}. Operator ID: ${selectedOp.source_id}. State: ${selectedOp.admin1_code}.`,
      });
      setStep('success');
    }
    setSubmitting(false);
  };

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="bg-accent/10 border border-accent/20 text-accent text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              ✅ Free to Claim
            </span>
            {totalUnclaimed !== null && totalUnclaimed > 0 && (
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {totalUnclaimed.toLocaleString()} operators available
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Claim Your <span className="text-accent">Operator Profile</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Search for your business in our directory. Claim it for free to verify your information,
            unlock premium visibility, and start receiving qualified leads from heavy haul shippers.
          </p>
        </header>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-6 mb-10">
          {(['search', 'verify', 'submit', 'success'] as ClaimStep[]).map((s, i) => {
            const labels = ['Search', 'Verify', 'Submit', 'Done'];
            const icons = ['🔍', '✓', '📝', '✅'];
            const isActive = step === s;
            const isPast = (['search', 'verify', 'submit', 'success'].indexOf(step)) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive ? 'bg-accent text-black' : isPast ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
                }`}>
                  {isPast ? '✓' : icons[i]}
                </div>
                <span className={`text-xs font-bold ${isActive ? 'text-accent' : isPast ? 'text-green-400' : 'text-gray-500'}`}>
                  {labels[i]}
                </span>
                {i < 3 && <div className={`w-12 h-px ${isPast ? 'bg-green-500/30' : 'bg-white/10'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step: Search */}
        {step === 'search' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Find Your Business</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Search by company name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
                >
                  <option value="" className="bg-gray-900">All States</option>
                  {Object.entries(US_STATES).map(([code, name]) => (
                    <option key={code} value={code} className="bg-gray-900">{name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || (!searchQuery && !stateFilter)}
                className="mt-4 w-full bg-accent text-black py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all disabled:opacity-50"
              >
                {searching ? '🔍 Searching...' : 'SEARCH DIRECTORY'}
              </button>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-3">
                <p className="text-gray-500 text-xs font-bold uppercase">
                  {results.length} Result{results.length !== 1 ? 's' : ''} Found
                </p>
                {results.map(op => (
                  <div
                    key={op.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <h3 className="text-white font-semibold group-hover:text-accent transition-colors">
                          {op.name_normalized || op.name}
                        </h3>
                        <p className="text-gray-500 text-xs mt-1">
                          {[op.city, op.admin1_code && US_STATES[op.admin1_code]].filter(Boolean).join(', ')}
                          {op.hc_entity_type && <span className="ml-2 text-gray-600">• {op.hc_entity_type}</span>}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {op.phone_primary && (
                            <span className="text-[10px] text-gray-500">📞 {op.phone_primary}</span>
                          )}
                          {op.email && (
                            <span className="text-[10px] text-green-400">📧 Has Email</span>
                          )}
                          {op.website_url && (
                            <span className="text-[10px] text-blue-400">🌐 Has Website</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectOperator(op)}
                        className="bg-accent text-black px-4 py-2 rounded-lg text-xs font-black hover:bg-yellow-500 transition-all whitespace-nowrap"
                      >
                        CLAIM THIS
                      </button>
                    </div>
                    {op.is_claimed && (
                      <span className="inline-block mt-2 bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded">
                        Already in public directory
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && searching === false && searchQuery && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-4">No results found for &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-gray-500 text-xs">
                  Can&apos;t find your business?{' '}
                  <Link href="/register" className="text-accent hover:underline">Register as a new operator</Link>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Verify */}
        {step === 'verify' && selectedOp && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Verify This Is Your Business</p>
              
              <div className="bg-white/[0.03] rounded-xl p-5 mb-6">
                <h3 className="text-white font-black text-xl">{selectedOp.name_normalized || selectedOp.name}</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {selectedOp.city && (
                    <p className="text-gray-400">📍 {selectedOp.city}, {US_STATES[selectedOp.admin1_code || ''] || selectedOp.admin1_code}</p>
                  )}
                  {selectedOp.phone_primary && (
                    <p className="text-gray-400">📞 {selectedOp.phone_primary}</p>
                  )}
                  {selectedOp.website_url && (
                    <p className="text-gray-400">🌐 {selectedOp.website_url}</p>
                  )}
                  {selectedOp.hc_entity_type && (
                    <p className="text-gray-400">🏷️ {selectedOp.hc_entity_type}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('submit')}
                  className="flex-grow bg-accent text-black py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all"
                >
                  YES, THIS IS MY BUSINESS
                </button>
                <button
                  onClick={() => { setSelectedOp(null); setStep('search'); }}
                  className="bg-white/5 border border-white/10 text-gray-400 px-6 py-3 rounded-xl text-sm font-bold hover:text-white transition-all"
                >
                  GO BACK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Submit */}
        {step === 'submit' && selectedOp && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Complete Your Claim</p>
              <p className="text-gray-400 text-sm mb-6">
                Claiming <strong className="text-white">{selectedOp.name_normalized || selectedOp.name}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Your Full Name *</label>
                  <input
                    type="text"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Business Email *</label>
                  <input
                    type="email"
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    placeholder="john@yourcompany.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-medium mb-1.5">Your Role</label>
                  <select
                    value={claimRole}
                    onChange={(e) => setClaimRole(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
                  >
                    <option value="" className="bg-gray-900">Select your role</option>
                    <option value="owner" className="bg-gray-900">Owner</option>
                    <option value="manager" className="bg-gray-900">Manager</option>
                    <option value="dispatcher" className="bg-gray-900">Dispatcher</option>
                    <option value="driver" className="bg-gray-900">Driver / Operator</option>
                    <option value="admin" className="bg-gray-900">Administrative Staff</option>
                    <option value="other" className="bg-gray-900">Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleSubmitClaim}
                  disabled={submitting || !claimName || !claimEmail}
                  className="flex-grow bg-accent text-black py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all disabled:opacity-50"
                >
                  {submitting ? '⏳ Submitting...' : 'SUBMIT CLAIM REQUEST'}
                </button>
                <button
                  onClick={() => setStep('verify')}
                  className="bg-white/5 border border-white/10 text-gray-400 px-6 py-3 rounded-xl text-sm font-bold hover:text-white transition-all"
                >
                  BACK
                </button>
              </div>

              <p className="text-gray-600 text-[10px] mt-4 text-center">
                Claims are reviewed within 24 hours. You&apos;ll receive a verification email
                with next steps to complete your profile setup.
              </p>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-10">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-white font-black text-3xl mb-3">Claim Submitted!</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                Your claim request for <strong className="text-white">{selectedOp?.name_normalized || selectedOp?.name}</strong> has been received.
                We&apos;ll review it and send you a verification email within 24 hours.
              </p>
              <div className="bg-white/[0.03] rounded-xl p-5 text-left max-w-sm mx-auto mb-8">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-3">What Happens Next</p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-accent">1.</span> We verify your information</li>
                  <li className="flex items-start gap-2"><span className="text-accent">2.</span> You get full profile edit access</li>
                  <li className="flex items-start gap-2"><span className="text-accent">3.</span> Your profile goes live + verified badge</li>
                  <li className="flex items-start gap-2"><span className="text-accent">4.</span> Start receiving qualified leads</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <Link href="/directory" className="bg-accent text-black px-8 py-3 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all">
                  BROWSE DIRECTORY
                </Link>
                <button
                  onClick={() => { setStep('search'); setSelectedOp(null); setSearchQuery(''); setResults([]); }}
                  className="bg-white/5 border border-white/10 text-gray-400 px-8 py-3 rounded-xl text-sm font-bold hover:text-white transition-all"
                >
                  CLAIM ANOTHER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Section */}
        {step === 'search' && (
          <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
              <span className="text-3xl">🏆</span>
              <h3 className="text-white font-bold mt-3 mb-2">Verified Badge</h3>
              <p className="text-gray-500 text-sm">Get a verified checkmark on your profile. Build trust with shippers and brokers instantly.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
              <span className="text-3xl">📈</span>
              <h3 className="text-white font-bold mt-3 mb-2">Priority Visibility</h3>
              <p className="text-gray-500 text-sm">Claimed profiles rank higher in search results and get featured in state-level directory pages.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
              <span className="text-3xl">📞</span>
              <h3 className="text-white font-bold mt-3 mb-2">Direct Leads</h3>
              <p className="text-gray-500 text-sm">Receive contact inquiries directly from shippers who need pilot car and escort services.</p>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
