'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SHELL_IA_CONFIG } from '../config/shell-ia.config';
import { BRAND_NAME_UPPER } from '@/lib/config/brand';
import { ChevronRightIcon, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

export function HCMobileMenu({ mode = 'public' }: { mode?: 'public' | 'app' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open mobile menu"
        className="lg:hidden p-2 -mr-2 rounded-md transition-colors text-hc-gold-500 hover:text-white"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 z-[998] backdrop-blur-sm"
        />
      )}

      <nav
        className={`fixed top-0 left-0 bottom-0 w-[min(320px,85vw)] bg-slate-950 border-r border-slate-800 z-[999] overflow-y-auto transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <Link href="/" className="font-bold text-hc-gold-500 tracking-tight">
            {BRAND_NAME_UPPER}
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-slate-400 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <Link
            href="/claim"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-hc-gold-500 text-slate-950 font-bold rounded-lg mb-6"
          >
            ✓ Claim Your Listing — Free
          </Link>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Actions</div>
              {SHELL_IA_CONFIG.mobileMenuSections.quickActions.map(action => (
                <Link key={action.href} href={action.href} className="flex items-center justify-between py-2 text-slate-300 hover:text-white">
                  <span className="font-medium text-sm">{action.label}</span>
                  <ChevronRightIcon className="w-4 h-4 text-slate-600" />
                </Link>
              ))}
            </div>

            {Object.entries(SHELL_IA_CONFIG.desktopNavGroups).map(([key, group]) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="text-xs font-bold text-hc-gold-500/70 uppercase tracking-wider mb-2">{group.label}</div>
                {group.destinations.map(link => (
                  <Link key={link.href} href={link.href} className="block py-2 text-sm text-slate-400 hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800 flex gap-4 mt-8">
          <Link href="/pricing" className="text-xs font-semibold text-slate-500 hover:text-white">Pricing</Link>
          <Link href="/advertise" className="text-xs font-semibold text-slate-500 hover:text-white">Advertise</Link>
          <Link href="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-white">Sign In</Link>
        </div>
      </nav>
    </>
  );
}
