import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function MainNav() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0d14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-lg font-black tracking-tight text-white">
            Haul<span className="text-amber-400">Command</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: '/corridors', label: 'Corridors' },
            { href: '/available-now', label: 'Available Now' },
            { href: '/directory', label: 'Directory' },
            { href: '/route-check', label: 'Route Check' },
            { href: '/glossary', label: 'Glossary' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/6 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
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
              <Link
                href="/login"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
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
  );
}

export default MainNav;
