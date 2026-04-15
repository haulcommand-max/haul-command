'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SHELL_IA_CONFIG } from '../config/shell-ia.config';
import { BRAND_NAME_UPPER } from '@/lib/config/brand';
import { XMarkIcon, Bars3Icon, ArrowRightIcon } from '@heroicons/react/24/outline';

/* ══════════════════════════════════════════════════════════════
   HCMobileMenu — Premium left-slide drawer
   Groups: Top Actions (gold CTA) → Discover → Intelligence → Markets
   Closes on route change. Locks body scroll when open.
   ══════════════════════════════════════════════════════════════ */

export function HCMobileMenu({ mode = 'public' }: { mode?: 'public' | 'app' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="lg:hidden flex items-center justify-center w-10 h-10 -mr-1 rounded-xl text-hc-gold-500 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/70 z-[998] backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-[min(320px,88vw)] z-[999] overflow-y-auto overscroll-contain transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'rgba(10, 11, 14, 0.97)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: open ? '8px 0 40px rgba(0,0,0,0.6)' : 'none',
        }}
        aria-label="Mobile navigation"
      >
        {/* ── Header row ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <Link href="/" onClick={() => setOpen(false)} className="font-black text-hc-gold-500 tracking-tight text-sm uppercase">
            {BRAND_NAME_UPPER}
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-5 flex flex-col gap-6">

          {/* ── TIER 1: Primary Actions — Gold CTA Block ── */}
          <div className="flex flex-col gap-2">
            <Link
              href="/loads/post"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-hc-gold-500 to-hc-gold-400 text-black font-black text-sm uppercase tracking-widest"
            >
              <span>Post a Load</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/claim"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl bg-hc-gold-500/10 border border-hc-gold-500/30 text-hc-gold-400 font-bold text-sm uppercase tracking-widest hover:bg-hc-gold-500/20 transition-colors"
            >
              <span>Claim My Profile</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* ── TIER 2: Discover ── */}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Discover</div>
            <div className="flex flex-col">
              {[
                { label: 'Pilot Car Directory', href: '/directory', badge: null },
                { label: 'Load Board', href: '/loads', badge: 'LIVE' },
                { label: 'Available Now', href: '/available-now', badge: null },
                { label: 'Map View', href: '/map/live', badge: null },
              ].map(item => {
                const isActive = pathname?.startsWith(item.href) && item.href !== '/';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'text-hc-gold-400 bg-hc-gold-500/8' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}
                  >
                    <span>{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-hc-success/20 text-hc-success border border-hc-success/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── TIER 3: Intelligence ── */}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Intelligence</div>
            <div className="flex flex-col">
              {[
                { label: 'All Tools', href: '/tools' },
                { label: 'Regulations', href: '/regulations' },
                { label: 'Permit Calculator', href: '/tools/permit-cost-calculator' },
                { label: 'Glossary', href: '/glossary' },
              ].map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block py-3 px-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'text-hc-gold-400' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── TIER 4: Markets ── */}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2 px-1">Markets</div>
            <div className="flex flex-col">
              {[
                { label: 'Training Hub', href: '/training' },
                { label: 'Featured Corridors', href: '/corridors' },
                { label: 'Pilot Car Rates', href: '/rates' },
                { label: 'Leaderboard', href: '/leaderboards' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 px-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* ── Drawer Footer ── */}
        <div className="border-t border-white/[0.06] px-5 py-4 flex items-center justify-between gap-3 mt-2">
          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            className="flex-1 flex items-center justify-center py-3 rounded-xl border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-white/20 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/onboarding/start"
            onClick={() => setOpen(false)}
            className="flex-1 flex items-center justify-center py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </>
  );
}
