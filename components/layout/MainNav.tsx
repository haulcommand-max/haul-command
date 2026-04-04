import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const NAV_LINKS = [
  { href: '/find-capacity',  label: 'Find Capacity', badge: 'LIVE', badgeColor: '#22c55e' },
  { href: '/available-now',  label: 'Available Now' },
  { href: '/directory',      label: 'Directory' },
  { href: '/corridors',      label: 'Corridors' },
  { href: '/training',       label: 'Training' },
  { href: '/tools/permit-cost-calculator', label: 'Tools' },
  { href: '/glossary',       label: 'Glossary' },
]

const MOBILE_NAV = [
  { href: '/find-capacity', label: 'Capacity', icon: '📡' },
  { href: '/available-now', label: 'Live',     icon: '🟢' },
  { href: '/directory',     label: 'Directory',icon: '🔍' },
  { href: '/training',      label: 'Training', icon: '🎓' },
  { href: '/dashboard',     label: 'Account',  icon: '👤' },
]

export async function MainNav() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0d14]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-black tracking-tight text-white">
              Haul<span className="text-amber-400">Command</span>
            </span>
          </Link>

          {/* Desktop center nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/6 hover:text-white transition-colors flex items-center gap-1.5"
              >
                {link.label}
                {link.badge && (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{color:link.badgeColor, background:`${link.badgeColor}20`}}>
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/advertise"
              className="hidden sm:block text-[11px] font-bold text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Advertise
            </Link>
            {session ? (
              <>
                <NotificationBell />
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 hover:border-white/20 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm text-white/50 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-amber-500 px-4 py-1.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0d14]/98 border-t border-white/8 backdrop-blur-md">
        <div className="flex items-center justify-around py-2 px-2">
          {MOBILE_NAV.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-white/50 hover:text-white transition-colors min-w-[52px]"
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="text-[9px] font-semibold tracking-wide">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile bottom nav spacer */}
      <div className="lg:hidden h-14" />
    </>
  );
}

export default MainNav;
