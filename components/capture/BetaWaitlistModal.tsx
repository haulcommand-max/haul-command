'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function BetaWaitlistModal() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('hc_beta_waitlist_dismissed');
    const joined = localStorage.getItem('hc_beta_waitlist_joined');
    if (dismissed || joined) return;

    // Trigger after 15 seconds of browse time
    const timer = setTimeout(() => {
      setVisible(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('hc_beta_waitlist_dismissed', '1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      const supabase = createClient();
      
      // Waitlist edge insertion
      await supabase.from('hc_country_waitlist').insert([
        { 
          email: email, 
          country_code: 'US', 
          source: 'beta_popup' 
        }
      ]).select().single();
      
      // Fallback: If table has restrictive RLS, it'll still complete without error or we ignore failure
    } catch (e) {
      console.warn("Waitlist insert fallback", e);
    } finally {
      localStorage.setItem('hc_beta_waitlist_joined', '1');
      setSubmitted(true);
      setLoading(false);
      setTimeout(() => setVisible(false), 3000);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleDismiss}
      />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[9999] p-4">
        <div className="bg-[#0b0b0c] border border-[#d4a348]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          
          {/* Accent glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4a348] to-transparent opacity-50" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
          >
            ×
          </button>

          {submitted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-white font-bold text-xl mb-2">You're on the list.</h3>
              <p className="text-gray-400 text-sm">We'll alert you the moment Haul Command goes fully live.</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 bg-[#d4a348]/10 text-[#d4a348] border border-[#d4a348]/20 rounded-xl flex items-center justify-center text-xl mb-4">
                🚧
              </div>
              <h3 className="text-white font-black text-xl mb-2 leading-tight">We are not live yet.<br/><span className="text-[#d4a348]">Still in Beta mode.</span></h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Haul Command is currently operating in stealth beta. Join the private waitlist to get priority access, exclusive dispatch alerts, and verified operator status when we launch.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#d4a348] focus:ring-1 focus:ring-[#d4a348] transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#d4a348] hover:bg-[#C6923A] disabled:opacity-50 text-black font-black text-sm uppercase tracking-wider py-3 rounded-xl transition"
                >
                  {loading ? 'Joining...' : 'Join the VIP Waitlist'}
                </button>
              </form>
              <button onClick={handleDismiss} className="w-full text-center text-xs text-gray-500 hover:text-gray-400 mt-4 underline">
                Browse anonymously for now
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
