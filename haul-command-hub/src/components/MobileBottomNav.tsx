'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, Fragment } from 'react';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/lib/role-context';

const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/schedules/operator', label: 'Find Runs', icon: '📦' },
  { href: '/directory', label: 'Directory', icon: '🔍' },
  { href: '/map', label: 'Map', icon: '🗺️' },
  { href: '/inbox', label: 'Messages', icon: '💬' },
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
    // Subscribe to new messages for live badge updates
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060a14]/95 backdrop-blur-xl border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {BOTTOM_NAV_ITEMS.map((item, i) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname?.startsWith(item.href + '/');

          // Insert center action between items 2 and 3
          if (i === 2) {
            return (
              <Fragment key="center-group">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 transition-colors ${
                    isActive ? 'text-accent' : 'text-gray-500'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[9px] font-medium">{item.label}</span>
                </Link>
                <Link
                  href={centerAction.href}
                  className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2"
                >
                  <span className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-black text-lg -mt-4 shadow-lg shadow-accent/30">
                    {centerAction.icon}
                  </span>
                  <span className="text-[9px] font-medium text-accent">{centerAction.label}</span>
                </Link>
              </Fragment>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 transition-colors ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
              {/* Unread badge on Inbox */}
              {item.href === '/inbox' && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
