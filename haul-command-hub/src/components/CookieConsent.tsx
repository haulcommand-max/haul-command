'use client';

import { useEffect, useState } from 'react';

/**
 * CookieConsent — GDPR/UK GDPR cookie consent banner.
 * Shows for EU/UK visitors. Stores preference in localStorage.
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('hc_cookie_consent');
    if (!consent) {
      // Check if user is likely EU/UK based on timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const euCheck = tz.startsWith('Europe/') || tz.includes('London') || tz.includes('Dublin') || tz.includes('Paris');
      if (euCheck) {
        setShow(true);
      }
    }
  }, []);

  const accept = (level: 'all' | 'essential') => {
    localStorage.setItem('hc_cookie_consent', JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
    }));
    setShow(false);

    // If analytics accepted, initialize GA4
    if (level === 'all' && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
      });
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0d1117] border-t border-white/10 px-4 py-4 md:px-8 md:py-5 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-bold mb-1">🍪 Cookie Preferences</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            We use essential cookies for authentication and optional analytics cookies (Google Analytics 4) to improve our service.{' '}
            <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => accept('essential')}
            className="px-4 py-2 text-xs font-bold text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={() => accept('all')}
            className="px-4 py-2 text-xs font-bold text-black bg-accent rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
