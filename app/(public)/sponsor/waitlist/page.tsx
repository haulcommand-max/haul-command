"use client";

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';

function WaitlistForm() {
  const searchParams = useSearchParams();
  const regionQuery = searchParams.get('regionName') || '';
  const typeQuery = searchParams.get('type') || '';
  const countryQuery = searchParams.get('country') || 'US';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const payload = {
      full_name: formData.get('full_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      country_code: formData.get('country_code'),
      market_or_region: formData.get('market_or_region'),
      sponsor_category: formData.get('sponsor_category'),
      budget_range: formData.get('budget_range'),
      notes: formData.get('notes'),
    };

    try {
      const res = await fetch('/api/sponsor-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to submit form');
      }
      import('@/lib/analytics/track').then(({ track }) => {
          track.event('sponsor_waitlist_submit', {
              region_name: payload.market_or_region,
              country_code: payload.country_code,
              entity_type: payload.sponsor_category,
              budget_range: payload.budget_range
          });
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-black border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto mt-20 text-center">
        <h2 className="text-2xl font-black text-amber-500 mb-4">You're on the list!</h2>
        <p className="text-gray-400 mb-8">Our partnership team will review your details and reach out when ad grid slots matching your criteria open up.</p>
        <Link href="/directory" className="inline-block bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold transition-colors">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="mb-8 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">Sponsorship Waitlist</h1>
        <p className="text-amber-500/80">Secure priority access to AdGrid placements before they go live publicly.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
             <input required name="full_name" type="text" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
             <input required name="email" type="email" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone</label>
             <input name="phone" type="tel" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white" />
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Company Name</label>
             <input name="company" type="text" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white" />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Country Code</label>
               <input required defaultValue={countryQuery} name="country_code" type="text" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white uppercase" placeholder="e.g. US, CA, AU" />
            </div>
            <div className="md:col-span-2">
               <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Market / Region</label>
               <input required defaultValue={regionQuery} name="market_or_region" type="text" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white" placeholder="e.g. Texas, Alberta, NS" />
            </div>
          </div>
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sponsoring Category</label>
             <select name="sponsor_category" defaultValue={typeQuery || "operator"} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white">
                <option value="operator">Escort / Pilot Car Operator</option>
                <option value="hotel">Hotel & Lodging</option>
                <option value="repair">Diesel / Heavy Repair</option>
                <option value="yard">Secure Parking & Drop Yard</option>
                <option value="broker">Brokerage / Carrier</option>
                <option value="other">Other Brand</option>
             </select>
          </div>
          <div className="md:col-span-2">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Monthly Budget Range</label>
             <select name="budget_range" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white">
                <option value="under_500">Under $500</option>
                <option value="500_to_1500">$500 - $1,500</option>
                <option value="1500_to_5000">$1,500 - $5,000</option>
                <option value="over_5000">Over $5,000</option>
             </select>
          </div>
          <div className="md:col-span-2">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Additional Notes / Ideal Placements</label>
             <textarea name="notes" rows={4} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 text-white resize-none" />
          </div>
        </div>
        
        <button disabled={loading} className="w-full py-4 bg-amber-500 hover:bg-amber-400 font-black text-white uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all">
          {loading ? 'Submitting...' : 'Join the VIP Waitlist'}
        </button>
      </form>
    </div>
  );
}

export default function SponsorWaitlistPage() {
  return (
    <div className="min-h-screen bg-[#060b12] text-white">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Waitlist...</div>}>
        <WaitlistForm />
      </Suspense>
    </div>
  );
}
