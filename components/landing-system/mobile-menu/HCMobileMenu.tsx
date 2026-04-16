'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND_NAME_UPPER } from '@/lib/config/brand';
import { XMarkIcon, Bars3Icon, MagnifyingGlassIcon, PlusCircleIcon, UserIcon } from '@heroicons/react/24/outline';

const SafeArrowRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export function HCMobileMenu({ mode = 'public' }: { mode?: 'public' | 'app' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="lg:hidden flex items-center justify-center w-10 h-10 -mr-1 rounded-xl text-hc-gold-500 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/70 z-[9998] backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main Drawer */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-[min(320px,88vw)] z-[9999] overflow-x-hidden overflow-y-auto overscroll-contain transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'rgba(10, 11, 14, 0.98)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: open ? '8px 0 40px rgba(0,0,0,0.6)' : 'none',
        }}
        aria-label="Mobile Command Center"
      >
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0a0b0e]/95 backdrop-blur-md">
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

        <div className="px-4 py-5 flex flex-col gap-6 pb-28">

          {/* Primary Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/loads/post"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full p-4 rounded-xl bg-gradient-to-r from-hc-gold-500 to-hc-gold-400 text-black font-black text-sm uppercase tracking-widest shadow-lg"
            >
              <div className="flex items-center gap-3">
                <PlusCircleIcon className="w-5 h-5" />
                <span>Post a Load</span>
              </div>
              <SafeArrowRight />
            </Link>
            
            <Link
              href="/claim"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between w-full p-4 rounded-xl bg-hc-surface border border-hc-gold-500/30 hover:border-hc-gold-500/50 text-hc-gold-400 font-bold text-sm uppercase tracking-widest transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 opacity-80" />
                <span>Claim My Profile</span>
              </div>
              <SafeArrowRight />
            </Link>
          </div>

          {/* Discover Category */}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1 border-l-2 border-slate-700 pl-2">Discover</div>
            <div className="flex flex-col gap-1">
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
                    {item.badge && (
                      <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-hc-success/20 text-hc-success border border-hc-success/20">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Intelligence Category */}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1 border-l-2 border-slate-700 pl-2">Intelligence</div>
            <div className="flex flex-col gap-1">
              {[
                { label: 'All Tools', href: '/tools' },
                { label: 'Regulations', href: '/regulations' },
                { label: 'Permit Calculator', href: '/tools/permit-cost-calculator' },
                { label: 'Market Rates', href: '/rates' },
                { label: 'Corridors', href: '/corridors' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 px-3 rounded-xl text-sm font-semibold transition-colors ${pathname === item.href ? 'text-hc-gold-400' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar — Mobile Command Layer */}
        <div className="sticky bottom-0 left-0 w-full border-t border-white/[0.08] bg-[#0a0b0e]/95 backdrop-blur-xl p-3 safe-area-bottom">
          <div className="flex justify-between items-center gap-2">
            <Link
              href="/directory"
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center flex-1 py-2 text-slate-400 hover:text-hc-gold-400 transition-colors"
            >
              <MagnifyingGlassIcon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Find</span>
            </Link>
            
            <Link
              href="/loads/post"
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center flex-1 py-2 text-hc-gold-400 relative"
            >
              <div className="absolute -top-6 bg-hc-gold-500 rounded-full p-3 shadow-[0_0_15px_rgba(198,146,58,0.4)] text-black mb-1 hover:scale-105 transition-transform">
                 <PlusCircleIcon className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-5">Post</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center flex-1 py-2 text-slate-400 hover:text-white transition-colors"
            >
              <UserIcon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
            </Link>
          </div>
        </div>

      </nav>
    </>
  );
}
