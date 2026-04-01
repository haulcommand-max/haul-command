'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CartAbandonmentRetargeter() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. If user is currently ON the claim funnel, auto-save their presence as an incomplete claim
    // This allows the retargeter to know they started but didn't finish.
    if (pathname && (pathname.includes('/claim') && !pathname.includes('success'))) {
      localStorage.setItem('hc_claim_progress', JSON.stringify({
        startedAt: Date.now(),
        lastUpdated: Date.now(),
        completed: false
      }));
      return; // Dont show banner while actively on the claim page
    }

    // 2. If user completes the funnel, wipe the abandonment flag
    if (pathname && pathname.includes('/claim/success')) {
      localStorage.removeItem('hc_claim_progress');
      return;
    }

    // 3. For all other pages, check if they abandoned the cart
    const savedProgress = localStorage.getItem('hc_claim_progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        if (parsed && !parsed.completed && parsed.lastUpdated) {
          // Trigger if abandoned more than 5 minutes ago (300,000 ms)
          const timeSinceAbandoned = Date.now() - new Date(parsed.lastUpdated).getTime();
          if (timeSinceAbandoned > 5 * 60 * 1000) {
            setShow(true);
          }
        }
      } catch (e) {
        console.error('Failed to parse claim progress');
      }
    }
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 border border-yellow-500/30 rounded-xl p-5 shadow-2xl z-50 shadow-yellow-900/20" style={{ animation: 'slideUp 0.3s ease-out forwards' }}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-white font-bold text-sm">Finish Your Free Profile</h4>
        <button onClick={() => setShow(false)} className="text-gray-500 hover:text-white" aria-label="Dismiss">✕</button>
      </div>
      <p className="text-sm text-gray-400 mb-5">You started claiming your business but didn't finish. Complete your setup to start receiving load offers.</p>
      <Link href="/claim" className="block w-full text-center py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg text-sm transition-colors uppercase tracking-wide">
        Resume Setup →
      </Link>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </div>
  );
}
