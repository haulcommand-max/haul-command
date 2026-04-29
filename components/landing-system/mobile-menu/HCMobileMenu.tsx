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
        className="lg:hidden flex items-center justify-center w-10 h-10 -mr-1 rounded-xl text-amber-100/75 hover:text-white hover:bg-white/[0.05] transition-colors"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main Drawer — Haul Command dark brand theme */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-[min(320px,88vw)] z-[9999] overflow-x-hidden overflow-y-auto overscroll-contain transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: '#090706',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: open ? '8px 0 40px rgba(0,0,0,0.45)' : 'none',
        }}
        aria-label="Mobile navigation"
      >
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#090706]">
          <Link href="/" onClick={() => setOpen(false)} className="font-black text-[#F1A91B] tracking-tight text-sm uppercase">
            {BRAND_NAME_UPPER}
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-amber-100/50 hover:text-white hover:bg-white/[0.05] transition-colors"
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
              className="flex items-center justify-between w-full p-4 rounded-xl bg-[#F1A91B] hover:bg-[#D4951A] text-black font-black text-sm uppercase tracking-widest shadow-md transition-colors"
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
              className="flex items-center justify-between w-full p-4 rounded-xl bg-white/[0.04] border border-[#C6923A]/30 hover:border-[#C6923A]/50 text-[#F1A91B] font-bold text-sm uppercase tracking-widest transition-all shadow-sm"
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
            <div className="text-[10px] font-black text-amber-100/45 uppercase tracking-[0.2em] mb-3 px-1 border-l-2 border-[#F1A91B] pl-2">Discover</div>
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
                    className={`flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold transition-colors ${isActive ? 'text-[#F1A91B] bg-[#F1A91B]/10' : 'text-amber-100/75 hover:text-white hover:bg-white/[0.05]'}`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
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
            <div className="text-[10px] font-black text-amber-100/45 uppercase tracking-[0.2em] mb-3 px-1 border-l-2 border-[#F1A91B] pl-2">Intelligence</div>
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
                  className={`block py-3 px-3 rounded-xl text-sm font-semibold transition-colors ${pathname === item.href ? 'text-[#F1A91B] bg-[#F1A91B]/10' : 'text-amber-100/75 hover:text-white hover:bg-white/[0.05]'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 left-0 w-full border-t border-white/[0.06] bg-[#090706] p-3 safe-area-bottom">
          <div className="flex justify-between items-center gap-2">
            <Link
              href="/directory"
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center flex-1 py-2 text-amber-100/60 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
            >
              <MagnifyingGlassIcon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Find</span>
            </Link>
            
            <Link
              href="/loads/post"
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center flex-1 py-2 text-[#F1A91B] relative"
            >
              <div className="absolute -top-6 bg-[#F1A91B] rounded-full p-3 shadow-md text-black mb-1 hover:scale-105 transition-transform">
                 <PlusCircleIcon className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-5">Post</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex flex-col items-center justify-center flex-1 py-2 text-amber-100/60 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
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
