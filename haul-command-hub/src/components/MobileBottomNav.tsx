'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/loads', label: 'Loads', icon: '📦' },
  { href: '/directory', label: 'Directory', icon: '🔍' },
  { href: '/map', label: 'Map', icon: '🗺️' },
  { href: '/login', label: 'Account', icon: '👤' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on auth routes
  if (pathname?.startsWith('/login') || pathname?.startsWith('/auth')) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060a14]/95 backdrop-blur-xl border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-1 transition-colors ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
