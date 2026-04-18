'use client';

import React, { useState } from 'react';
// import { createClient } from '@/lib/supabase/client'; // Supabase logic is normally here

export default function BackhaulBroadcastPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('idle');

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('broadcasting');
    
    // Simulate Supabase insert to 'availability_broadcasts' table with backhaul flag
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-[#0a0a09] min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white uppercase tracking-widest">Backhaul Broadcast</h1>
        <p className="text-gray-400 font-semibold text-sm mt-2">
          Turn your empty miles into profit. Broadcast your return route to the broker network and get matched with loads heading your way.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
        <form onSubmit={handleBroadcast} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Location (Origin)</label>
              <input 
                type="text"
                required
                placeholder="e.g. Houston, TX"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Heading To (Destination)</label>
              <input 
                type="text"
                required
                placeholder="e.g. Phoenix, AZ"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available Date</label>
            <input 
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full md:w-1/2 bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex items-start gap-4">
            <div className="text-emerald-400 text-xl">📡</div>
            <div>
              <h4 className="text-sm font-bold text-emerald-400">Network Alert</h4>
              <p className="text-xs text-emerald-500/80 mt-1">
                Submitting this form immediately alerts brokers looking for coverage on this corridor via Push Notification and SMS.
              </p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={status === 'broadcasting' || status === 'success'}
            className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
              status === 'success' ? 'bg-green-500 text-black shadow-green-500/20' 
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
            }`}
          >
            {status === 'broadcasting' && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>}
            {status === 'success' ? '✓ Broadcast Live' : 'Broadcast Backhaul Route'}
          </button>
        </form>
      </div>
    </div>
  );
}
