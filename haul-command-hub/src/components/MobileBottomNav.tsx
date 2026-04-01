'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/lib/role-context';

/* ══════════════════════════════════════════════════════
   MOBILE BOTTOM NAV — Premium dark, role-aware
   
   Fixes applied:
   - Consistent naming: operators see "Go Live", brokers see "Post Load"
   - Proper active states with accent indicator bar
   - Safe-area spacing for notched devices
   - Minimum 44px tap targets (WCAG)
   - Earnings tab added for claimed operators
   - Unread badge properly positioned
   ══════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/glossary', label: 'Glossary', icon: '📖' },
  // Center action inserted dynamically
  { href: '/directory', label: 'Directory', icon: '🔍' },
  { href: '/dashboard/earnings', label: 'Earnings', icon: '💰' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useRole();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/messaging/unread-count', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const channel = supabase
      .channel('mobile-nav-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUnread]);

  // Hide on auth routes
  if (pathname?.startsWith('/login') || pathname?.startsWith('/auth')) return null;

  // Role-aware center button
  const isOperator = role === 'escort_operator' || role === 'both';
  const centerAction = isOperator
    ? { href: '/map', label: 'Go Live', icon: '📡' }
    : { href: '/inbox?post=true', label: 'Post Load', icon: '➕' };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060a14]/98 backdrop-blur-xl border-t border-white/[0.08]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-16">
        {/* Left items: Home, Glossary */}
        {NAV_ITEMS.slice(0, 2).map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors ${
                active ? 'text-accent' : 'text-gray-500 active:text-gray-300'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
              )}
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Center: Go Live / Post Load — elevated button */}
        <Link
          href={centerAction.href}
          className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px]"
        >
          <span className="w-11 h-11 bg-accent rounded-2xl flex items-center justify-center text-black text-lg -mt-5 shadow-lg shadow-accent/30 active:scale-95 transition-transform">
            {centerAction.icon}
          </span>
          <span className="text-[9px] font-bold text-accent mt-0.5 leading-none">{centerAction.label}</span>
        </Link>

        {/* Right items: Directory, Earnings */}
        {NAV_ITEMS.slice(2).map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] transition-colors ${
                active ? 'text-accent' : 'text-gray-500 active:text-gray-300'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
              )}
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              {/* Unread badge on Earnings */}
              {item.href === '/dashboard/earnings' && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
