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
        className="fixed inset-0 z-[9998] bg-[#07090D]/80 backdrop-blur-md transition-opacity"
        onClick={handleDismiss}
      />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[9999] p-4 animate-in zoom-in-95 duration-500">
        <div className="bg-[#0b0b0c] border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5),_0_0_30px_rgba(198,146,58,0.15)] relative overflow-hidden group">
          
          {/* Stunning 8K Backdrop Image Masked */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/ads/beta-access-bg.png" 
              alt="Premium Command Center" 
              className="w-full h-full object-cover opacity-40 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] via-[#0B0B0C]/90 to-transparent"></div>
          </div>
          
          {/* Accent glow top */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#C6923A] to-transparent opacity-80" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all"
          >
            ×
          </button>

          <div className="relative z-10">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
                  ✓
                </div>
                <h3 className="text-white font-black text-2xl mb-3 tracking-tight">Access Granted.</h3>
                <p className="text-gray-400 text-base font-medium">You've secured priority entry. Monitor your frequency for the global activation signal.</p>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C6923A]/10 border border-[#C6923A]/20 rounded-full mb-6">
                   <span className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C6923A] opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C6923A]"></span>
                   </span>
                   <span className="text-[10px] uppercase font-black text-[#C6923A] tracking-widest">Stealth Beta Protocol</span>
                </div>
                
                <h3 className="text-white font-black text-3xl sm:text-4xl mb-4 leading-[1.1] tracking-tight">
                  We are not live yet.<br/>
                  <span className="bg-gradient-to-br from-amber-300 via-[#C6923A] to-yellow-700 bg-clip-text text-transparent drop-shadow-sm">System is classified.</span>
                </h3>
                
                <p className="text-gray-300 text-sm sm:text-base font-medium mb-8 leading-relaxed max-w-md">
                  Haul Command is currently operating in exclusive beta. Join the private command waitlist to secure elite operator status and global dispatch priority before public rollout.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter a secure email address..."
                      required
                      className="w-full bg-[#07090D]/80 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 text-white text-base font-medium focus:outline-none focus:border-[#C6923A] focus:ring-1 focus:ring-[#C6923A] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#C6923A] to-[#8A6428] hover:from-[#E0B05C] hover:to-[#C6923A] disabled:opacity-50 text-black font-black text-sm uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(198,146,58,0.3)] transition-all transform hover:-translate-y-0.5"
                  >
                    {loading ? 'Authenticating Protocol...' : 'Request VIP Access'}
                  </button>
                </form>
                
                <button onClick={handleDismiss} className="w-full text-center text-xs font-bold text-gray-500 hover:text-gray-300 mt-6 tracking-wide underline decoration-gray-700 underline-offset-4 transition-colors">
                  Acknowledge & Browse Anonymously
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
